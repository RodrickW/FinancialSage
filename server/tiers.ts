import { User } from "@shared/schema";

export type SubscriptionTier = 'free' | 'plus' | 'pro';

export const TIER_LIMITS = {
  free: {
    aiMessagesPerMonth: 0,
    canAccessAICoach: false,
    canAccessAIInterview: false,
    canAccessAIBudget: false,
    canAccessAIGoals: false,
    canAccess30DayChallenge: false,
    canAccessAdvancedInsights: false,
    canAccessGoalOptimization: false,
  },
  plus: {
    aiMessagesPerMonth: 20,
    canAccessAICoach: true,
    canAccessAIInterview: true,
    canAccessAIBudget: true,
    canAccessAIGoals: true,
    canAccess30DayChallenge: true,
    canAccessAdvancedInsights: false,
    canAccessGoalOptimization: false,
  },
  pro: {
    aiMessagesPerMonth: -1, // Unlimited
    canAccessAICoach: true,
    canAccessAIInterview: true,
    canAccessAIBudget: true,
    canAccessAIGoals: true,
    canAccess30DayChallenge: true,
    canAccessAdvancedInsights: true,
    canAccessGoalOptimization: true,
  },
};

export const TIER_PRICING = {
  plus: {
    monthly: 5.99,
    annual: 49.00,
  },
  pro: {
    monthly: 9.99,
    annual: 89.00,
  },
};

export function getUserTier(user: User): SubscriptionTier {
  const tier = user.subscriptionTier as SubscriptionTier;
  
  if (tier === 'plus' || tier === 'pro') {
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
      return tier;
    }
    
    if (user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt) > new Date()) {
      return (user.revenuecatTier as SubscriptionTier) || tier;
    }
    
    return 'free';
  }
  
  return 'free';
}

export function canAccessFeature(user: User, feature: keyof typeof TIER_LIMITS.free): boolean {
  const tier = getUserTier(user);
  return TIER_LIMITS[tier][feature] as boolean;
}

export function getAIMessagesRemaining(user: User): number {
  const tier = getUserTier(user);
  const limit = TIER_LIMITS[tier].aiMessagesPerMonth;
  
  if (limit === -1) return -1; // Unlimited
  if (limit === 0) return 0;
  
  const used = user.aiMessagesUsedThisMonth || 0;
  const resetAt = user.aiMessagesResetAt ? new Date(user.aiMessagesResetAt) : null;
  const now = new Date();
  
  if (!resetAt || resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
    return limit;
  }
  
  return Math.max(0, limit - used);
}

export function shouldResetAIMessages(user: User): boolean {
  const resetAt = user.aiMessagesResetAt ? new Date(user.aiMessagesResetAt) : null;
  const now = new Date();
  
  if (!resetAt) return true;
  
  return resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear();
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free': return 'Basic';
    case 'plus': return 'Plus';
    case 'pro': return 'Pro';
    default: return 'Basic';
  }
}

export function getUpgradeMessage(tier: SubscriptionTier, feature: string): string {
  if (tier === 'free') {
    return `Upgrade to Plus to unlock ${feature}`;
  } else if (tier === 'plus') {
    return `Upgrade to Pro for unlimited ${feature}`;
  }
  return '';
}

export function mapStripePriceToTier(priceId: string): SubscriptionTier {
  const plusMonthly = process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;
  const plusAnnual = process.env.STRIPE_PLUS_ANNUAL_PRICE_ID;
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proAnnual = process.env.STRIPE_PRO_ANNUAL_PRICE_ID;
  
  const legacyMonthly = process.env.STRIPE_PREMIUM_PRICE_ID;
  const legacyAnnual = process.env.STRIPE_ANNUAL_PRICE_ID;
  
  if (priceId === plusMonthly || priceId === plusAnnual) {
    return 'plus';
  }
  
  if (priceId === proMonthly || priceId === proAnnual || priceId === legacyMonthly || priceId === legacyAnnual) {
    return 'pro';
  }
  
  return 'free';
}

export function mapRevenueCatProductToTier(productId: string): SubscriptionTier {
  if (productId.includes('plus')) {
    return 'plus';
  }
  if (productId.includes('pro') || productId.includes('premium')) {
    return 'pro';
  }
  return 'free';
}
