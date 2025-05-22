import type { Express, Request, Response } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { createSubscriptionSession, handleStripeWebhook } from "./stripe";
import Stripe from "stripe";

export function registerSubscriptionRoutes(app: Express, requireAuth: any) {
  // Subscription routes
  app.post('/api/get-or-create-subscription', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Create a checkout session for the subscription
      const session = await createSubscriptionSession(user.id);
      
      res.json({
        clientSecret: session.payment_intent?.client_secret,
        subscriptionId: session.subscription
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });
  
  // Subscription status check
  app.get('/api/subscription/status', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Check if the user is on a free trial
      let isOnFreeTrial = false;
      let trialDaysLeft = 0;
      
      if (user.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(user.trialEndsAt);
        
        if (now < trialEnd) {
          isOnFreeTrial = true;
          const timeDiff = trialEnd.getTime() - now.getTime();
          trialDaysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
      }
      
      res.json({
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        isOnFreeTrial,
        trialDaysLeft,
        trialEndsAt: user.trialEndsAt
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ message: 'Failed to check subscription status' });
    }
  });
  
  // Stripe webhook handler
  app.post('/api/webhook/stripe', async (req, res) => {
    let event;
    
    try {
      const sig = req.headers['stripe-signature'];
      
      // In a production environment, you'd verify the event
      // with Stripe's webhook secret
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2025-04-30.basil',
        });
        
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // For development, just parse the body
        event = req.body;
      }
      
      // Handle the event
      await handleStripeWebhook(event);
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: 'Webhook error' });
    }
  });

  // Create a 7-day free trial through Stripe checkout
  app.post('/api/start-free-trial', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const { planType = 'premium' } = req.body; // 'standard' or 'premium'
      
      // Skip if user is already premium
      if (user.isPremium) {
        return res.json({ 
          message: 'User is already on a premium plan',
          isPremium: true 
        });
      }
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe configuration missing' });
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-04-30.basil',
      });
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, {
          stripeCustomerId: customerId
        });
      }
      
      // Determine price based on plan type
      const priceAmount = planType === 'premium' ? 1499 : 999; // $14.99 or $9.99 in cents
      
      // Create Stripe Price for the subscription
      const price = await stripe.prices.create({
        unit_amount: priceAmount,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        product_data: {
          name: planType === 'premium' ? 'Mind My Money Premium' : 'Mind My Money Standard',
          description: planType === 'premium' 
            ? 'Advanced AI coaching with credit score monitoring'
            : 'Essential AI coaching and financial management'
        }
      });
      
      // Create checkout session with 7-day trial
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1,
        }],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            userId: user.id.toString(),
            planType: planType
          }
        },
        success_url: `${req.protocol}://${req.get('host')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/dashboard`,
        allow_promotion_codes: true,
      });
      
      res.json({
        checkoutUrl: session.url,
        sessionId: session.id
      });
      
    } catch (error) {
      console.error('Error creating free trial checkout:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });
}