import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { registerSubscriptionRoutes } from "./routes-subscription";
import { stripe } from "./stripe";
import { storage } from "./storage";
import { EVENT_OFFER } from '../shared/eventOffer';

// These stubs run ONLY in this isolated test process. No provider requests, DB
// writes, real customer accounts, authentication bypasses or charges are made.
test("subscription recovery API", async t => {
  // Keep the approved event window deterministic after the real event ends.
  t.mock.method(Date, 'now', () => Date.parse('2026-11-14T18:00:00Z'));
  process.env.STRIPE_PLUS_PRICE_ID = "price_fixture_plus";
  process.env.STRIPE_PLUS_ANNUAL_PRICE_ID = "price_fixture_annual";
  let lastCheckout: any;
  stripe.prices.retrieve = (async () => ({
    active: true, currency: 'usd', recurring: { interval: 'year', interval_count: 1 },
    unit_amount: 4900, product: 'prod_fixture',
  })) as any;
  stripe.coupons.retrieve = (async () => ({
    id: EVENT_OFFER.couponId, valid: true, percent_off: 50, duration: 'once',
    max_redemptions: 100, times_redeemed: 0, redeem_by: EVENT_OFFER.expiresAt,
    applies_to: { products: ['prod_fixture'] },
  })) as any;
  stripe.promotionCodes.list = (async () => ({ data: [{
    id: 'promo_fixture', active: true, times_redeemed: 0, coupon: { id: EVENT_OFFER.couponId },
  }] })) as any;
  let current: any = null;
  let unavailable = false;
  let checkoutCalls = 0;
  let portalCalls = 0;
  let resumed = 0;
  const user: any = {
    id: 987654, username: "billing_fixture", email: "fixture@example.invalid",
    firstName: "Billing", lastName: "Fixture",
    stripeCustomerId: "cus_fixture", stripeSubscriptionId: "sub_fixture",
    subscriptionTier: "plus", subscriptionStatus: "active", isPremium: true,
    revenuecatExpiresAt: null, subscriptionPeriod: "monthly", stripePriceId: "price_fixture_plus",
  };
  const makeSubscription = (status: string, extra = {}) => ({
    id: "sub_fixture", customer: "cus_fixture", status, created: 1,
    cancel_at_period_end: false, pause_collection: null,
    items: { data: [{ id: "si_fixture", price: { id: "price_fixture_plus", recurring: { interval: "month" } } }] },
    ...extra,
  });
  stripe.subscriptions.list = (() => (async function* () {
    if (unavailable) throw new Error("simulated provider outage");
    if (current) yield current;
  })()) as any;
  stripe.subscriptions.resume = (async () => { resumed++; }) as any;
  stripe.customers.create = (async (_params: any, options: any) => {
    assert.equal(options.idempotencyKey, "mmm-customer-987654");
    return { id: "cus_fixture" };
  }) as any;
  stripe.billingPortal.configurations.list = (async () => ({ data: [{
    id: "bpc_fixture", metadata: { purpose: "mmm-billing-recovery-v1" },
    features: { payment_method_update: { enabled: true }, invoice_history: { enabled: true } },
  }] })) as any;
  stripe.billingPortal.sessions.create = (async (params: any) => {
    portalCalls++;
    assert.equal(params.customer, "cus_fixture");
    return { url: "https://billing.stripe.com/p/session/fixture" };
  }) as any;
  stripe.checkout.sessions.create = (async (_params: any, options: any) => {
    lastCheckout = _params;
    checkoutCalls++;
    assert.match(options.idempotencyKey, /^mmm-checkout-987654-/);
    return { url: "https://checkout.stripe.com/c/pay/fixture" };
  }) as any;
  storage.updateUser = (async (_id: number, patch: any) => Object.assign(user, patch)) as any;

  const app = express();
  app.use(express.json());
  registerSubscriptionRoutes(app, (req: any, res: any, next: any) => {
    if (req.headers["x-fixture-auth"] !== "yes") return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.on("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const call = async (path: string, body?: any, headers = {}) => {
    const response = await fetch(`${base}/api/subscription/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", "x-fixture-auth": "yes", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  try {
    await t.test("annual code cannot discount monthly or accept arbitrary coupons", async () => {
      assert.equal((await call('checkout', { tier: 'plus', period: 'monthly', promoCode: 'EVENT50' })).status, 400);
      assert.equal((await call('checkout', { tier: 'plus', period: 'annual', promoCode: 'OTHER' })).status, 400);
      assert.equal(checkoutCalls, 0);
    });
    await t.test("annual checkout applies one verified discount without a trial or stacking", async () => {
      const result = await call('checkout', {
        tier: 'plus', period: 'annual', promoCode: ' event50 ',
        discounts: [{ coupon: 'untrusted' }], customerId: 'cus_someone_else',
      });
      assert.equal(result.status, 200);
      assert.equal(lastCheckout.customer, 'cus_fixture');
      assert.equal(lastCheckout.line_items[0].price, 'price_fixture_annual');
      assert.deepEqual(lastCheckout.discounts, [{ promotion_code: 'promo_fixture' }]);
      assert.equal(lastCheckout.subscription_data, undefined);
      assert.equal(lastCheckout.allow_promotion_codes, undefined);
      assert.equal(lastCheckout.metadata.campaign, EVENT_OFFER.couponId);
      checkoutCalls = 0;
    });
    await t.test("all recovery endpoints require authentication", async () => {
      for (const path of ["billing-portal", "resume", "checkout"]) {
        const result = await call(path, {}, { "x-fixture-auth": "no" });
        assert.equal(result.status, 401);
      }
    });
    await t.test("past-due status retains Stripe source and exposes repair actions", async () => {
      current = makeSubscription("past_due");
      const result = await call("status");
      assert.equal(result.body.billingNeedsAttention, true);
      assert.equal(result.body.subscriptionSource, "stripe");
      assert.equal(result.body.canManageBilling, true);
      assert.equal(result.body.canRestartSubscription, false);
      assert.equal(result.body.tier, "free");
    });
    await t.test("delinquent mobile checkout redirects to existing Stripe billing, never IAP", async () => {
      const result = await call("checkout", { tier: "plus", period: "monthly" }, { "x-mobile-app": "true" });
      assert.equal(result.body.requiresBillingRecovery, true);
      assert.match(result.body.billingUrl, /^https:\/\/billing.stripe.com/);
      assert.equal(checkoutCalls, 0);
    });
    await t.test("portal ignores customer and redirect supplied by the caller", async () => {
      const result = await call("billing-portal", { customerId: "cus_someone_else", returnUrl: "https://evil.invalid" });
      assert.equal(result.status, 200);
      assert.ok(portalCalls > 0);
    });
    await t.test("paused subscriptions resume but do not grant unverified premium access", async () => {
      current = makeSubscription("paused");
      const state = await call("status");
      assert.equal(state.body.canResumeSubscription, true);
      const result = await call("resume", {});
      assert.equal(result.status, 200);
      assert.equal(resumed, 1);
      assert.equal(user.isPremium, false);
    });
    await t.test("ended users can restart, active users cannot create a duplicate", async () => {
      current = makeSubscription("canceled");
      const state = await call("status");
      assert.equal(state.body.canRestartSubscription, true);
      assert.equal(state.body.hasActiveSubscription, false);
      const result = await call("checkout", { tier: "plus", period: "monthly" });
      assert.ok(result.body.checkoutUrl);
      assert.equal(checkoutCalls, 1);
      current = makeSubscription("active", { cancel_at_period_end: true });
      const scheduled = await call("status");
      assert.equal(scheduled.body.isCancelled, true);
      assert.equal(scheduled.body.canResumeSubscription, true);
      assert.equal(scheduled.body.canRestartSubscription, false);
      const blocked = await call("checkout", { tier: "plus", period: "monthly" });
      assert.ok(blocked.body.billingUrl);
      assert.equal(checkoutCalls, 1);
    });
    await t.test("Apple subscribers do not start a Stripe subscription", async () => {
      current = makeSubscription("canceled");
      user.revenuecatExpiresAt = new Date(Date.now() + 60000);
      user.revenuecatTier = "pro";
      const result = await call("checkout", { tier: "plus", period: "monthly" });
      assert.equal(result.status, 409);
      assert.equal(checkoutCalls, 1);
      const state = await call("status");
      assert.equal(state.body.subscriptionSource, "apple");
      assert.equal(state.body.tier, "pro");
      assert.equal(state.body.isCancelled, false, "an ended Stripe plan must not mark an active Apple plan as canceled");
      user.revenuecatExpiresAt = null;
    });
    await t.test("provider outage cannot silently turn into new checkout", async () => {
      unavailable = true;
      const state = await call("status");
      assert.equal(state.status, 503);
      assert.equal(state.body.billingStatusVerified, false);
      const result = await call("checkout", { tier: "plus", period: "monthly" });
      assert.equal(result.status, 503);
      assert.equal(checkoutCalls, 1);
    });
    await t.test("new subscribers reach native purchase on mobile and Stripe checkout on web", async () => {
      unavailable = false;
      current = null;
      user.stripeSubscriptionId = null;
      user.stripeCustomerId = null;
      const mobile = await call("checkout", { tier: "plus", period: "monthly" }, { "x-platform": "ios" });
      assert.equal(mobile.status, 200);
      assert.equal(mobile.body.mobile, true);
      assert.equal(checkoutCalls, 1);
      const web = await call("checkout", { tier: "plus", period: "monthly" });
      assert.equal(web.status, 200);
      assert.ok(web.body.checkoutUrl);
      assert.equal(checkoutCalls, 2);
      assert.equal(user.stripeCustomerId, "cus_fixture");
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
