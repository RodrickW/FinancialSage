import Stripe from 'stripe';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
});

/**
 * Create a Stripe checkout session for subscription
 * @param userId User ID
 * @param planId Plan ID (optional)
 * @returns Checkout session
 */
export async function createSubscriptionSession(userId: number, planType?: string) {
  // Get user from database
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }

  // Determine the price ID based on plan type
  let priceId: string;
  if (planType === 'annual') {
    priceId = process.env.STRIPE_ANNUAL_PRICE_ID || process.env.STRIPE_PREMIUM_PRICE_ID;
  } else {
    priceId = process.env.STRIPE_PREMIUM_PRICE_ID; // Default to monthly
  }
  
  if (!priceId) {
    throw new Error('Stripe price ID not configured');
  }
  
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
 * Create a Stripe customer for a user (if they don't have one)
 * @param userId User ID
 * @returns Customer ID
 */
export async function ensureStripeCustomer(userId: number): Promise<string> {
  // Get user from database
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error('User not found');
  }

  // If user already has a Stripe customer ID, return it
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: {
      userId: userId.toString(),
      username: user.username
    }
  });
  
  // Update user with Stripe customer ID
  await db.update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));
  
  console.log(`Created Stripe customer ${customer.id} for user ${user.username}`);
  
  return customer.id;
}

/**
 * Sync all users without Stripe customer IDs to Stripe
 * @returns Number of users synced
 */
export async function syncAllUsersToStripe(): Promise<number> {
  // Get all users without Stripe customer IDs (excluding demo user)
  const allUsers = await db.select()
    .from(users);
  
  const realUsers = allUsers.filter(user => user.username !== 'demo' && (!user.stripeCustomerId || user.stripeCustomerId === null));
  
  let syncedCount = 0;
  
  for (const user of realUsers) {
    try {
      await ensureStripeCustomer(user.id);
      syncedCount++;
      console.log(`Created Stripe customer for ${user.username}`);
    } catch (error) {
      console.error(`Failed to create Stripe customer for user ${user.username}:`, error);
    }
  }
  
  if (syncedCount > 0) {
    console.log(`Synced ${syncedCount} users to Stripe`);
  }
  return syncedCount;
}

import { mapStripePriceToTier } from './tiers';

/**
 * Handle Stripe webhook events
 * @param event Stripe webhook event
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  // Special case: sync all users to Stripe
  if (event.type === 'sync_users') {
    try {
      const syncedCount = await syncAllUsersToStripe();
      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} users to Stripe`);
      } else {
        console.log('All users are already synced to Stripe');
      }
    } catch (error) {
      console.error('Error during user sync:', error);
    }
    return;
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Get price ID and determine tier
      const priceId = subscription.items.data[0]?.price?.id || '';
      const tier = mapStripePriceToTier(priceId);
      const period = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
      
      // Update user with subscription ID
      if (session.customer && session.subscription) {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.stripeCustomerId, session.customer as string));
        
        if (user) {
          await db.update(users)
            .set({ 
              stripeSubscriptionId: session.subscription as string,
              subscriptionTier: tier,
              stripePriceId: priceId,
              subscriptionPeriod: period,
              isPremium: tier !== 'free',
              subscriptionStatus: 'active'
            })
            .where(eq(users.id, user.id));
            
          console.log(`User ${user.username} subscribed to ${tier} tier (${period})`);
        }
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Get price ID and determine tier
      const priceId = subscription.items.data[0]?.price?.id || '';
      const tier = mapStripePriceToTier(priceId);
      const period = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
      
      // Handle subscription status changes
      const [user] = await db.select()
        .from(users)
        .where(eq(users.stripeCustomerId, subscription.customer as string));
      
      if (user) {
        const isActive = subscription.status === 'active' || subscription.status === 'past_due';
        
        await db.update(users)
          .set({ 
            subscriptionStatus: subscription.status,
            subscriptionTier: isActive ? tier : 'free',
            stripePriceId: priceId,
            subscriptionPeriod: period,
            isPremium: isActive && tier !== 'free'
          })
          .where(eq(users.id, user.id));
          
        console.log(`User ${user.username} subscription updated: ${tier} tier, status: ${subscription.status}`);
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
        // Reset to free tier
        await db.update(users)
          .set({ 
            isPremium: false,
            subscriptionStatus: 'canceled',
            subscriptionTier: 'free',
            stripePriceId: null
          })
          .where(eq(users.id, user.id));
          
        console.log(`User ${user.username} subscription cancelled, reverted to free tier`);
      }
      break;
    }
  }
}