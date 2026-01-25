import type { Express, Request, Response } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { stripe } from "./stripe";
import { getUserTier, getAIMessagesRemaining, TIER_LIMITS, mapStripePriceToTier, SubscriptionTier } from "./tiers";
import Stripe from "stripe";

export function registerSubscriptionRoutes(app: Express, requireAuth: any) {
  
  // Create checkout session for tiered subscription
  app.post('/api/subscription/checkout', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
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
          ? process.env.STRIPE_PLUS_MONTHLY_PRICE_ID 
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
        });
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
        success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          userId: user.id.toString(),
          tier,
          period
        }
      });
      
      res.json({ checkoutUrl: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });
  
  // Subscription status check with tier info
  app.get('/api/subscription/status', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Get current tier
      const tier = getUserTier(user);
      const aiMessagesRemaining = getAIMessagesRemaining(user);
      const tierLimits = TIER_LIMITS[tier];
      
      // Check Stripe subscription status directly if user has a subscription ID
      let stripeSubscriptionActive = false;
      let stripeStatus: string | null = null;
      let stripeTier: SubscriptionTier = 'free';
      
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          stripeStatus = subscription.status;
          stripeSubscriptionActive = ['active', 'past_due'].includes(subscription.status);
          
          // Get tier from price ID
          const priceId = subscription.items.data[0]?.price?.id;
          if (priceId) {
            stripeTier = mapStripePriceToTier(priceId);
          }
          
          // Sync tier to database if needed
          if (stripeSubscriptionActive && user.subscriptionTier !== stripeTier) {
            await storage.updateUser(user.id, {
              subscriptionTier: stripeTier,
              isPremium: stripeTier !== 'free',
              subscriptionStatus: subscription.status,
              stripePriceId: priceId
            });
          }
        } catch (stripeError: any) {
          console.error('Error checking Stripe subscription:', stripeError.message);
        }
      }
      
      // Check RevenueCat subscription
      let hasAppleSubscription = false;
      if (user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date()) {
        hasAppleSubscription = true;
      }
      
      // Determine subscription source
      let subscriptionSource: 'stripe' | 'apple' | 'none' = 'none';
      if (stripeSubscriptionActive) {
        subscriptionSource = 'stripe';
      } else if (hasAppleSubscription) {
        subscriptionSource = 'apple';
      }
      
      // Check if subscription is cancelled but still active
      const isCancelled = user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'canceled';
      
      res.json({
        tier,
        tierDisplayName: tier === 'free' ? 'Basic' : tier.charAt(0).toUpperCase() + tier.slice(1),
        isPremium: tier !== 'free',
        subscriptionStatus: stripeStatus || user.subscriptionStatus,
        hasActiveSubscription: tier !== 'free',
        subscriptionSource,
        hasStripeSubscription: stripeSubscriptionActive,
        hasAppleSubscription,
        isCancelled,
        aiMessagesRemaining,
        aiMessagesLimit: tierLimits.aiMessagesPerMonth,
        features: tierLimits,
        subscriptionPeriod: user.subscriptionPeriod
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ message: 'Failed to check subscription status' });
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
          ? process.env.STRIPE_PLUS_MONTHLY_PRICE_ID
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