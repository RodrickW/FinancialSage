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
      
      // Check if the user is on a free trial - only if they have started trial through Stripe
      let isOnFreeTrial = false;
      let trialDaysLeft = 0;
      
      if (user.hasStartedTrial && user.trialEndsAt) {
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
        trialEndsAt: user.trialEndsAt,
        hasStartedTrial: user.hasStartedTrial
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ message: 'Failed to check subscription status' });
    }
  });
  



}