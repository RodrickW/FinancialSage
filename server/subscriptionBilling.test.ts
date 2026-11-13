import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  canResumeBilling, createBillingPortal, findBillingSubscription, hasAppleAccess,
  isExistingSubscription, needsPaymentRecovery, resumeBilling,
} from "./subscriptionBilling";

const subscription = (status: string, extra = {}) => ({
  id: "sub_fixture", customer: "cus_fixture", status, created: 1,
  cancel_at_period_end: false, pause_collection: null, ...extra,
}) as Stripe.Subscription;

test("all nonterminal states prevent a second subscription", () => {
  for (const status of ["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]) {
    assert.equal(isExistingSubscription(subscription(status)), true, status);
  }
  for (const status of ["canceled", "incomplete_expired"]) {
    assert.equal(isExistingSubscription(subscription(status)), false, status);
  }
  assert.equal(isExistingSubscription(null), false);
});

test("failed payments and collection pauses require recovery, not a free-account upsell", () => {
  for (const status of ["past_due", "unpaid", "incomplete", "paused"]) {
    assert.equal(needsPaymentRecovery(subscription(status)), true);
  }
  assert.equal(needsPaymentRecovery(subscription("active", { pause_collection: { behavior: "void" } })), true);
  assert.equal(needsPaymentRecovery(subscription("active")), false);
  assert.equal(canResumeBilling(subscription("paused")), true);
  assert.equal(canResumeBilling(subscription("active", { cancel_at_period_end: true })), true);
  assert.equal(canResumeBilling(subscription("past_due")), false);
  assert.equal(canResumeBilling(subscription("canceled")), false);
});

test("lookup finds live subscriptions even when the database ID is missing or stale", async () => {
  let requestedCustomer = "";
  const client = {
    subscriptions: { list: (params: any) => {
      requestedCustomer = params.customer;
      return (async function* () {
        yield subscription("canceled", { id: "sub_old" });
        yield subscription("past_due", { id: "sub_delinquent" });
      })();
    } },
  } as any;
  const result = await findBillingSubscription(client, {
    stripeCustomerId: "cus_fixture", stripeSubscriptionId: "sub_old",
  });
  assert.equal(requestedCustomer, "cus_fixture");
  assert.equal(result?.id, "sub_delinquent");
});

test("a Stripe outage fails closed instead of allowing another checkout", async () => {
  const client = { subscriptions: { list: () => (async function* () { throw new Error("offline"); })() } } as any;
  await assert.rejects(findBillingSubscription(client, {
    stripeCustomerId: "cus_fixture", stripeSubscriptionId: null,
  }), /offline/);
});

test("missing stored subscription can be restarted, other lookup errors cannot", async () => {
  const user = { stripeCustomerId: null, stripeSubscriptionId: "sub_gone" };
  const client = { subscriptions: { retrieve: async () => { throw { code: "resource_missing" }; } } } as any;
  assert.equal(await findBillingSubscription(client, user), null);
  client.subscriptions.retrieve = async () => { throw new Error("offline"); };
  await assert.rejects(findBillingSubscription(client, user), /offline/);
});

test("Apple access expires at its actual entitlement date", () => {
  assert.equal(hasAppleAccess({ revenuecatExpiresAt: new Date(Date.now() + 60000) }), true);
  assert.equal(hasAppleAccess({ revenuecatExpiresAt: new Date(Date.now() - 60000) }), false);
  assert.equal(hasAppleAccess({ revenuecatExpiresAt: null }), false);
});

test("portal uses only the authenticated customer's ID and trusted return URL", async () => {
  let sessionParams: any;
  const client = { billingPortal: {
    configurations: {
      list: async () => ({ data: [] }),
      create: async (params: any) => {
        assert.equal(params.features.payment_method_update.enabled, true);
        assert.equal(params.features.invoice_history.enabled, true);
        return { id: "bpc_fixture" };
      },
    },
    sessions: { create: async (params: any) => {
      sessionParams = params;
      return { url: "https://billing.stripe.com/p/session/fixture" };
    } },
  } } as any;
  await createBillingPortal(client, "cus_fixture", "https://example.com/cancel-trial?billing=returned");
  assert.deepEqual(sessionParams, {
    customer: "cus_fixture", configuration: "bpc_fixture",
    return_url: "https://example.com/cancel-trial?billing=returned",
  });
});

test("resuming distinguishes Stripe-paused, collection-paused and scheduled cancellation", async () => {
  const calls: any[] = [];
  const client = { subscriptions: {
    resume: async (...args: any[]) => calls.push(["resume", ...args]),
    update: async (...args: any[]) => calls.push(["update", ...args]),
  } } as any;
  await resumeBilling(client, subscription("paused"));
  await resumeBilling(client, subscription("active", { pause_collection: { behavior: "void" } }));
  await resumeBilling(client, subscription("active", { cancel_at_period_end: true }));
  assert.equal(calls[0][0], "resume");
  assert.deepEqual(calls[1][2], { pause_collection: "" });
  assert.deepEqual(calls[2][2], { cancel_at_period_end: false });
  await assert.rejects(resumeBilling(client, subscription("canceled")), /ended/);
  await assert.rejects(resumeBilling(client, subscription("unpaid")), /payment method/);
  assert.equal(calls.length, 3, "invalid resumes must never mutate billing");
});
