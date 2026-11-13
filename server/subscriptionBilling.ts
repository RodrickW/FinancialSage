import type Stripe from "stripe";
import type { User } from "@shared/schema";

// Billing decisions must use Stripe's current state, never a stale premium flag.
export const BILLING_REQUEST_OPTIONS = { timeout: 8000, maxNetworkRetries: 0 };
const endedStatuses = new Set(["canceled", "incomplete_expired"]);

export function isExistingSubscription(subscription: Stripe.Subscription | null): boolean {
  return !!subscription && !endedStatuses.has(subscription.status);
}

export function needsPaymentRecovery(subscription: Stripe.Subscription | null): boolean {
  return !!subscription && (
    ["past_due", "unpaid", "incomplete", "paused"].includes(subscription.status) ||
    !!subscription.pause_collection
  );
}

export function canResumeBilling(subscription: Stripe.Subscription | null): boolean {
  return isExistingSubscription(subscription) && !!subscription && (
    subscription.cancel_at_period_end || subscription.status === "paused" || !!subscription.pause_collection
  );
}

export function hasAppleAccess(user: Pick<User, "revenuecatExpiresAt">): boolean {
  return !!user.revenuecatExpiresAt && new Date(user.revenuecatExpiresAt).getTime() > Date.now();
}

export function subscriptionCustomer(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
}

/**
 * Check all subscriptions for the authenticated customer. A stale/missing stored
 * subscription ID must not permit a second subscription for the same customer.
 * Any provider failure throws: callers must not interpret an outage as "free".
 */
export async function findBillingSubscription(
  client: Pick<Stripe, "subscriptions">,
  user: Pick<User, "stripeCustomerId" | "stripeSubscriptionId">,
): Promise<Stripe.Subscription | null> {
  if (!user.stripeCustomerId) {
    if (!user.stripeSubscriptionId) return null;
    try {
      return await client.subscriptions.retrieve(user.stripeSubscriptionId, {}, BILLING_REQUEST_OPTIONS);
    } catch (error: any) {
      if (error.code === "resource_missing") return null;
      throw error;
    }
  }

  let latestEnded: Stripe.Subscription | null = null;
  let existing: Stripe.Subscription | null = null;
  const rank = (sub: Stripe.Subscription) => ["active", "trialing"].includes(sub.status) ? 2 : 1;
  for await (const subscription of client.subscriptions.list(
    { customer: user.stripeCustomerId, status: "all", limit: 100 },
    BILLING_REQUEST_OPTIONS,
  )) {
    if (isExistingSubscription(subscription)) {
      if (!existing || rank(subscription) > rank(existing)) existing = subscription;
    } else if (!latestEnded || subscription.created > latestEnded.created) {
      latestEnded = subscription;
    }
  }
  return existing || latestEnded;
}

/** A restricted portal configuration works even if no default portal was set up. */
export async function createBillingPortal(
  client: Pick<Stripe, "billingPortal">,
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const configurations = await client.billingPortal.configurations.list(
    { active: true, limit: 100 }, BILLING_REQUEST_OPTIONS,
  );
  let configuration = configurations.data.find(
    config => config.metadata?.purpose === "mmm-billing-recovery-v1" &&
      config.features.payment_method_update.enabled && config.features.invoice_history.enabled,
  );
  if (!configuration) {
    configuration = await client.billingPortal.configurations.create({
      business_profile: { headline: "Manage your Mind My Money billing" },
      features: {
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
      },
      metadata: { purpose: "mmm-billing-recovery-v1" },
    }, BILLING_REQUEST_OPTIONS);
  }
  const session = await client.billingPortal.sessions.create({
    customer: customerId,
    configuration: configuration.id,
    return_url: returnUrl,
  }, BILLING_REQUEST_OPTIONS);
  return session.url;
}

/** No charges are retried automatically; the customer explicitly resumes here. */
export async function resumeBilling(
  client: Pick<Stripe, "subscriptions">,
  subscription: Stripe.Subscription,
): Promise<void> {
  if (!isExistingSubscription(subscription)) {
    throw new Error("This subscription has ended. Choose a plan to restart.");
  }
  if (subscription.status === "paused") {
    // Stripe may return an incomplete subscription if a new invoice needs payment.
    await client.subscriptions.resume(subscription.id, {
      billing_cycle_anchor: "now",
    }, BILLING_REQUEST_OPTIONS);
  } else if (subscription.pause_collection || subscription.cancel_at_period_end) {
    await client.subscriptions.update(subscription.id, {
      ...(subscription.pause_collection ? { pause_collection: "" as const } : {}),
      ...(subscription.cancel_at_period_end ? { cancel_at_period_end: false } : {}),
    }, BILLING_REQUEST_OPTIONS);
  } else {
    throw new Error("Update your payment method and pay any outstanding invoice in Manage billing.");
  }
}
