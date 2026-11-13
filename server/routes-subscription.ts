import type { Express, Request, Response } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { stripe } from "./stripe";
import { getUserTier, getAIMessagesRemaining, TIER_LIMITS, mapStripePriceToTier, SubscriptionTier } from "./tiers";
import Stripe from "stripe";
import {
  BILLING_REQUEST_OPTIONS, canResumeBilling, createBillingPortal, findBillingSubscription,
  hasAppleAccess, isExistingSubscription, needsPaymentRecovery, resumeBilling, subscriptionCustomer,
} from "./subscriptionBilling";

export function registerSubscriptionRoutes(app: Express, requireAuth: any) {
  const billingReturnUrl = (req: Request) => {
    const origin = process.env.NODE_ENV === 'production'
      ? 'https://www.mindmymoneyapp.com'
      : `${req.protocol}://${req.get('host')}`;
    return `${origin}/cancel-trial?billing=returned`;
  };

  // Available with authentication only: expired users must be able to repair billing.
  app.post('/api/subscription/billing-portal', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      let customerId = user.stripeCustomerId;
      if (!customerId && user.stripeSubscriptionId) {
        const subscription = await findBillingSubscription(stripe, user);
        if (subscription) customerId = subscriptionCustomer(subscription);
      }
      if (!customerId) {
        return res.status(400).json({ message: 'No web billing account found. Choose a plan to subscribe.' });
      }
      const url = await createBillingPortal(stripe, customerId, billingReturnUrl(req));
      res.json({ url });
    } catch {
      console.error('Could not open Stripe billing portal');
      res.status(503).json({ message: 'Billing is temporarily unavailable. Please try again.' });
    }
  });

  app.post('/api/subscription/resume', requireAuth, async (req, res) => {
    try {
      const subscription = await findBillingSubscription(stripe, req.user as User);
      if (!subscription || !canResumeBilling(subscription)) {
        return res.status(409).json({ message: 'This subscription cannot be resumed here. Use Manage billing or choose a plan if it has ended.' });
      }
      await resumeBilling(stripe, subscription);
      // Do not grant premium here. Status/webhook verifies the actual payment state.
      res.json({ success: true, message: 'Resume requested. Refreshing your payment status.' });
    } catch {
      res.status(503).json({ message: 'Unable to resume. Update your card and settle outstanding invoices in Manage billing, then try again.' });
    }
  });
  
  // Create checkout session for tiered subscription
  app.post('/api/subscription/checkout', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;

      const existing = await findBillingSubscription(stripe, user);
      if (isExistingSubscription(existing)) {
        const billingUrl = await createBillingPortal(
          stripe, subscriptionCustomer(existing!), billingReturnUrl(req),
        );
        return res.json({ billingUrl, requiresBillingRecovery: true });
      }
      if (hasAppleAccess(user)) {
        return res.status(409).json({ message: 'You already have an Apple subscription. Manage it in Apple Subscriptions instead of buying another plan.' });
      }

      // Mobile app users must subscribe via Apple In-App Purchase, not Stripe
      const isMobile =
        req.headers['x-mobile-app'] === 'true' ||
        req.headers['x-platform'] === 'ios' ||
        req.headers['x-platform'] === 'android';
      if (isMobile) {
        return res.status(200).json({
          mobile: true,
          message: 'Use in-app purchase on mobile'
        });
      }

      const { tier, period } = req.body as { tier: 'plus' | 'pro', period: 'monthly' | 'annual' };
      
      if (!tier || !['plus', 'pro'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid tier. Must be "plus" or "pro"' });
      }
      
      if (!period || !['monthly', 'annual'].includes(period)) {
        return res.status(400).json({ message: 'Invalid period. Must be "monthly" or "annual"' });
      }
      
      // Get the right price ID based on tier and period
      let priceId: string | undefined;
      if (tier === 'plus') {
        priceId = period === 'monthly' 
          ? process.env.STRIPE_PLUS_PRICE_ID 
          : process.env.STRIPE_PLUS_ANNUAL_PRICE_ID;
      } else {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
          : process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
      }
      
      if (!priceId) {
        console.error(`Missing price ID for ${tier} ${period}`);
        return res.status(500).json({ message: 'Subscription plan not configured' });
      }
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId: user.id.toString() }
        }, { ...BILLING_REQUEST_OPTIONS, idempotencyKey: `mmm-customer-${user.id}` });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }
      
      // Create checkout session
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://www.mindmymoneyapp.com'
        : `${req.protocol}://${req.get('host')}`;
        
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          userId: user.id.toString(),
          tier,
          period
        }
      }, {
        ...BILLING_REQUEST_OPTIONS,
        // Retries and simultaneous clicks share one session (even across servers).
        idempotencyKey: `mmm-checkout-${user.id}-${Math.floor(Date.now() / 600000)}`,
      });
      
      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(503).json({ message: 'Unable to verify billing or start checkout. Please try again; do not purchase another subscription elsewhere.' });
    }
  });
  
  // Subscription status check with tier info
  app.get('/api/subscription/status', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get current tier
      const subscription = await findBillingSubscription(stripe, user);
      const hasStripeSubscription = isExistingSubscription(subscription);
      const hasAppleSubscription = hasAppleAccess(user);
      const stripeEntitled = !!subscription && ['active', 'trialing'].includes(subscription.status);
      const stripeStatus = subscription?.status || null;
      const priceId = subscription?.items.data[0]?.price?.id;
      const stripeTier = priceId ? mapStripePriceToTier(priceId) : 'free';
      const tier: SubscriptionTier = stripeEntitled ? stripeTier
        : hasAppleSubscription ? ((user.revenuecatTier || getUserTier(user)) as SubscriptionTier)
        : (subscription || user.stripeSubscriptionId || user.stripeCustomerId) ? 'free' : getUserTier(user);
      const effectiveUser = { ...user, subscriptionTier: tier };
      const aiMessagesRemaining = getAIMessagesRemaining({
        ...effectiveUser, subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
      });
      const tierLimits = TIER_LIMITS[tier] || TIER_LIMITS.free;
      const subscriptionSource = hasAppleSubscription && !stripeEntitled ? 'apple'
        : subscription || user.stripeCustomerId ? 'stripe' : 'none';
      const isCancelled = subscriptionSource === 'stripe' && (
        !!subscription?.cancel_at_period_end || (!!subscription && !hasStripeSubscription)
      );

      if (subscription && !hasAppleSubscription) {
        const period = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
        if (user.subscriptionTier !== tier || user.subscriptionStatus !== stripeStatus ||
            user.isPremium !== (tier !== 'free') || user.stripeSubscriptionId !== subscription.id ||
            user.stripePriceId !== priceId || user.subscriptionPeriod !== period) {
          await storage.updateUser(user.id, {
            subscriptionTier: tier, subscriptionStatus: stripeStatus,
            isPremium: tier !== 'free', stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscriptionCustomer(subscription),
            stripePriceId: priceId, subscriptionPeriod: period,
          });
        }
      }
      
      res.json({
        tier,
        tierDisplayName: tier === 'free' ? 'Basic' : tier.charAt(0).toUpperCase() + tier.slice(1),
        isPremium: tier !== 'free',
        subscriptionStatus: stripeStatus || user.subscriptionStatus,
        hasActiveSubscription: tier !== 'free',
        subscriptionSource,
        hasStripeSubscription,
        hasAppleSubscription,
        isCancelled,
        billingStatusVerified: true,
        stripeStatus,
        billingNeedsAttention: needsPaymentRecovery(subscription),
        isPaused: subscription?.status === 'paused' || !!subscription?.pause_collection,
        canManageBilling: !!(user.stripeCustomerId || subscription),
        canResumeSubscription: canResumeBilling(subscription),
        canRestartSubscription: !hasStripeSubscription && !hasAppleSubscription,
        aiMessagesRemaining,
        aiMessagesLimit: tierLimits.aiMessagesPerMonth,
        features: tierLimits,
        subscriptionPeriod: subscription
          ? (subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly')
          : user.subscriptionPeriod
      });
    } catch (error) {
      console.error('Error verifying subscription status');
      res.status(503).json({ billingStatusVerified: false, message: 'Unable to verify your subscription. Please retry before starting a new subscription.' });
    }
  });
  
  // Upgrade tier endpoint
  app.post('/api/subscription/upgrade', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { newTier, period } = req.body as { newTier: 'plus' | 'pro', period: 'monthly' | 'annual' };
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription to upgrade' });
      }
      
      // Get the new price ID
      let priceId: string | undefined;
      if (newTier === 'plus') {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PLUS_PRICE_ID
          : process.env.STRIPE_PLUS_ANNUAL_PRICE_ID;
      } else {
        priceId = period === 'monthly'
          ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
          : process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
      }
      
      if (!priceId) {
        return res.status(500).json({ message: 'Price not configured' });
      }
      
      // Update the subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId
        }],
        proration_behavior: 'create_prorations'
      });
      
      // Update user tier
      await storage.updateUser(user.id, {
        subscriptionTier: newTier,
        stripePriceId: priceId,
        subscriptionPeriod: period
      });
      
      res.json({ success: true, newTier });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      res.status(500).json({ message: 'Failed to upgrade subscription' });
    }
  });
  
  // Downgrade from Pro to Plus (keeps same billing period)
  app.post('/api/subscription/downgrade', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const currentTier = getUserTier(user);

      if (currentTier !== 'pro') {
        return res.status(400).json({ message: 'You must be on the Pro plan to downgrade' });
      }

      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active Stripe subscription found. Apple subscriptions cannot be downgraded here.' });
      }

      // Use same billing period as current subscription
      const period = user.subscriptionPeriod === 'annual' ? 'annual' : 'monthly';
      const priceId = period === 'annual'
        ? process.env.STRIPE_PLUS_ANNUAL_PRICE_ID
        : process.env.STRIPE_PLUS_PRICE_ID;

      if (!priceId) {
        return res.status(500).json({ message: 'Plus plan not configured. Please contact support.' });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [{ id: subscription.items.data[0].id, price: priceId }],
        proration_behavior: 'create_prorations',
      });

      await storage.updateUser(user.id, {
        subscriptionTier: 'plus',
        stripePriceId: priceId,
        subscriptionPeriod: period,
      });

      res.json({ success: true, newTier: 'plus', message: 'You\'ve been downgraded to Plus. Changes take effect immediately.' });
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      res.status(500).json({ message: 'Failed to downgrade subscription. Please try again or contact support.' });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription to cancel' });
      }
      
      // Cancel at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      await storage.updateUser(user.id, {
        subscriptionStatus: 'cancelled'
      });
      
      res.json({ success: true, message: 'Subscription will be cancelled at end of billing period' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });
  
  // Get available plans
  app.get('/api/subscription/plans', async (req, res) => {
    res.json({
      plans: [
        {
          tier: 'free',
          name: 'Basic',
          description: 'Get started with essential money tracking',
          price: { monthly: 0, annual: 0 },
          features: [
            'Bank account linking (Plaid)',
            'Spending snapshot (weekly/monthly)',
            'Basic daily check-ins',
            'Read-only financial dashboard'
          ]
        },
        {
          tier: 'plus',
          name: 'Plus',
          description: 'Transform your money habits',
          price: { monthly: 5.99, annual: 49.00 },
          features: [
            'Everything in Basic',
            'AI Financial Interview',
            'AI-Generated Budget',
            '30-Day Money Reset Challenge',
            'Weekly AI Insights',
            'AI-Assisted Goals',
            '20 AI coach messages/month'
          ],
          popular: true
        },
        {
          tier: 'pro',
          name: 'Pro',
          description: 'Complete financial transformation',
          price: { monthly: 9.99, annual: 89.00 },
          features: [
            'Everything in Plus',
            'Unlimited AI Money Coach',
            'Advanced AI Insights & Projections',
            'Goal Optimization & Rebalancing',
            'Priority support'
          ]
        }
      ]
    });
  });
}