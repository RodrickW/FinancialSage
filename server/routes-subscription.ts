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

  // Create a 7-day free trial for the user
  app.post('/api/start-free-trial', requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      
      // Skip if user is already premium
      if (user.isPremium) {
        return res.json({ 
          message: 'User is already on a premium plan',
          isPremium: true 
        });
      }
      
      // Set trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      
      // Update user in database
      await storage.updateUser(user.id, {
        isPremium: true,
        subscriptionStatus: 'trialing',
        trialEndsAt
      });
      
      res.json({
        message: 'Free trial started successfully',
        isPremium: true,
        trialEndsAt,
        trialDaysLeft: 7
      });
    } catch (error) {
      console.error('Error starting free trial:', error);
      res.status(500).json({ message: 'Failed to start free trial' });
    }
  });
}