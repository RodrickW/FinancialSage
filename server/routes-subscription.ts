import type { Express, Request, Response } from "express";
import { User } from "@shared/schema";
import { storage } from "./storage";
import { createSubscriptionSession, handleStripeWebhook, stripe } from "./stripe";
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
      
      if (user.hasStartedTrial && user.trialEndsAt) {
        const now = new Date();
        const trialEnd = new Date(user.trialEndsAt);
        
        if (now < trialEnd && user.subscriptionStatus === 'trialing') {
          isOnFreeTrial = true;
          const timeDiff = trialEnd.getTime() - now.getTime();
          trialDaysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
      }
      
      // Check Stripe subscription status directly if user has a subscription ID
      let stripeSubscriptionActive = false;
      let stripeStatus: string | null = null;
      
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          stripeStatus = subscription.status;
          stripeSubscriptionActive = ['active', 'trialing', 'past_due'].includes(subscription.status);
          
          // If Stripe says active but our DB says otherwise, update the DB
          if (stripeSubscriptionActive && !user.isPremium) {
            await storage.updateUser(user.id, {
              isPremium: true,
              subscriptionStatus: subscription.status
            });
          }
        } catch (stripeError: any) {
          console.error('Error checking Stripe subscription:', stripeError.message);
        }
      }
      
      // Determine if user has an active subscription (any type)
      const activeStatuses = ['active', 'trialing', 'past_due'];
      const hasActiveSubscription = 
        user.isPremium || 
        stripeSubscriptionActive ||
        activeStatuses.includes(user.subscriptionStatus || '') ||
        (user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date());
      
      // Determine subscription source
      let subscriptionSource: 'stripe' | 'apple' | 'none' = 'none';
      if (user.stripeSubscriptionId) {
        subscriptionSource = 'stripe';
      } else if (user.revenuecatUserId) {
        subscriptionSource = 'apple';
      }
      
      // Check if subscription is cancelled but still active
      const isCancelled = user.subscriptionStatus === 'cancelled' || user.subscriptionStatus === 'canceled';
      
      res.json({
        isPremium: user.isPremium || stripeSubscriptionActive,
        subscriptionStatus: stripeStatus || user.subscriptionStatus,
        isOnFreeTrial,
        trialDaysLeft,
        trialEndsAt: user.trialEndsAt,
        hasStartedTrial: user.hasStartedTrial,
        hasActiveSubscription,
        subscriptionSource,
        hasStripeSubscription: !!user.stripeSubscriptionId,
        hasAppleSubscription: !!user.revenuecatUserId,
        isCancelled
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ message: 'Failed to check subscription status' });
    }
  });
  



}