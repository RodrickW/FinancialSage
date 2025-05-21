import Stripe from 'stripe';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe checkout session for subscription
 * @param userId User ID
 * @param planId Plan ID (optional)
 * @returns Checkout session
 */
export async function createSubscriptionSession(userId: number, planId?: string) {
  // Get user from database
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }

  const priceId = planId || process.env.STRIPE_PREMIUM_PRICE_ID;
  
  // If user has no Stripe customer ID, create one
  let customerId = user.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: userId.toString()
      }
    });
    
    customerId = customer.id;
    
    // Update user with Stripe customer ID
    await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }
  
  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/subscription/cancel`,
    subscription_data: {
      trial_period_days: 7, // 7-day free trial
    },
  });
  
  return session;
}

/**
 * Handle Stripe webhook events
 * @param event Stripe webhook event
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Update user with subscription ID
      if (session.customer && session.subscription) {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.stripeCustomerId, session.customer as string));
        
        if (user) {
          await db.update(users)
            .set({ 
              stripeSubscriptionId: session.subscription as string,
              isPremium: true,
              premiumTier: 'premium', // Default tier
              trialEndsAt: new Date(subscription.trial_end * 1000)
            })
            .where(eq(users.id, user.id));
        }
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Handle subscription status changes
      const [user] = await db.select()
        .from(users)
        .where(eq(users.stripeCustomerId, subscription.customer as string));
      
      if (user) {
        // Update subscription status
        await db.update(users)
          .set({ 
            subscriptionStatus: subscription.status,
            isPremium: subscription.status === 'active' || subscription.status === 'trialing'
          })
          .where(eq(users.id, user.id));
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Handle subscription cancellation
      const [user] = await db.select()
        .from(users)
        .where(eq(users.stripeCustomerId, subscription.customer as string));
      
      if (user) {
        // Update user as no longer premium
        await db.update(users)
          .set({ 
            isPremium: false,
            subscriptionStatus: 'canceled',
            premiumTier: null,
            trialEndsAt: null
          })
          .where(eq(users.id, user.id));
      }
      break;
    }
  }
}