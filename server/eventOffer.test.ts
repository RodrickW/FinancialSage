import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventDiscount, validateEventCode } from './eventOffer';
import { EVENT_OFFER } from '../shared/eventOffer';

test('event code accepts only annual checkout before the exact deadline', () => {
  const before = EVENT_OFFER.expiresAt * 1000 - 1000;
  assert.equal(validateEventCode(undefined, 'monthly', before), false);
  assert.equal(validateEventCode(' event50 ', 'annual', before), true);
  for (const code of ['OTHER', ['EVENT50'], 50, {}]) {
    assert.throws(() => validateEventCode(code, 'annual', before), /not valid/);
  }
  assert.throws(() => validateEventCode('EVENT50', 'monthly', before), /annual plans only/);
  assert.throws(() => validateEventCode('EVENT50', 'annual', EVENT_OFFER.expiresAt * 1000), /expired/);
  assert.equal(new Date(EVENT_OFFER.expiresAt * 1000).toISOString(), '2026-11-16T05:59:59.000Z');
});

test('Stripe enforces the campaign cap and customer-specific one-use limit', async () => {
  let price: any = {
    active: true, currency: 'usd', recurring: { interval: 'year', interval_count: 1 },
    unit_amount: 4900, product: 'prod_fixture',
  };
  const coupon: any = {
    id: EVENT_OFFER.couponId, valid: true, percent_off: 50, duration: 'once',
    max_redemptions: 100, times_redeemed: 0, redeem_by: EVENT_OFFER.expiresAt,
    applies_to: { products: ['prod_fixture'] },
  };
  let promotions: any[] = [];
  let created = 0;
  const client: any = {
    prices: { retrieve: async () => price },
    coupons: { retrieve: async (_id: string, params: any) => {
      assert.deepEqual(params.expand, ['applies_to']);
      return coupon;
    } },
    promotionCodes: {
      list: async (params: any) => {
        assert.equal(params.customer, 'cus_fixture');
        return { data: promotions };
      },
      create: async (params: any, options: any) => {
        created++;
        assert.equal(params.customer, 'cus_fixture');
        assert.equal(params.code, 'EVENT50');
        assert.equal(params.max_redemptions, 1);
        assert.equal(params.expires_at, EVENT_OFFER.expiresAt);
        assert.equal(params.restrictions.minimum_amount, 4900);
        assert.equal(options.idempotencyKey, `${EVENT_OFFER.couponId}-cus_fixture`);
        return { id: 'promo_fixture' };
      },
    },
  };
  assert.equal(await eventDiscount(client, 'cus_fixture', 'price_fixture'), 'promo_fixture');
  assert.equal(created, 1);
  promotions = [{ id: 'promo_fixture', active: true, times_redeemed: 0, coupon }];
  assert.equal(await eventDiscount(client, 'cus_fixture', 'price_fixture'), 'promo_fixture');
  assert.equal(created, 1, 'retry must reuse the customer-specific code');
  promotions[0].times_redeemed = 1;
  await assert.rejects(eventDiscount(client, 'cus_fixture', 'price_fixture'), /already been used/);
  promotions = [];
  coupon.times_redeemed = 100;
  await assert.rejects(eventDiscount(client, 'cus_fixture', 'price_fixture'), /redemption limit/);
  coupon.times_redeemed = 0;
  coupon.duration = 'forever';
  await assert.rejects(eventDiscount(client, 'cus_fixture', 'price_fixture'), /unavailable/);
  coupon.duration = 'once';
  price = { ...price, recurring: { interval: 'month', interval_count: 1 }, unit_amount: 599 };
  await assert.rejects(eventDiscount(client, 'cus_fixture', 'price_fixture'), /not eligible/);
});
