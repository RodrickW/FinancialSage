import type Stripe from 'stripe';
import { EVENT_OFFER } from '../shared/eventOffer';
import { BILLING_REQUEST_OPTIONS } from './subscriptionBilling';

export class OfferError extends Error {}

export function validateEventCode(code: unknown, period: string, now = Date.now()) {
  if (code === undefined || code === '') return false;
  if (typeof code !== 'string' || code.trim().toUpperCase() !== EVENT_OFFER.code) {
    throw new OfferError('That discount code is not valid.');
  }
  if (period !== 'annual') throw new OfferError('EVENT50 applies to annual plans only.');
  if (Math.floor(now / 1000) >= EVENT_OFFER.expiresAt) throw new OfferError('EVENT50 has expired.');
  return true;
}

export async function eventDiscount(client: Stripe, customer: string, priceId: string) {
  // Check the actual Stripe price, never a client-supplied amount or period.
  const price = await client.prices.retrieve(priceId, BILLING_REQUEST_OPTIONS);
  if (!price.active || price.currency !== 'usd' || price.recurring?.interval !== 'year' ||
      price.recurring.interval_count !== 1 || ![4900, 8900].includes(price.unit_amount ?? 0)) {
    throw new OfferError('This plan is not eligible for EVENT50.');
  }
  const coupon = await client.coupons.retrieve(
    EVENT_OFFER.couponId, { expand: ['applies_to'] }, BILLING_REQUEST_OPTIONS,
  );
  if (!coupon.valid || coupon.percent_off !== 50 || coupon.duration !== 'once' ||
      coupon.max_redemptions !== 100 || coupon.redeem_by !== EVENT_OFFER.expiresAt ||
      coupon.times_redeemed >= 100) {
    throw new OfferError('EVENT50 is unavailable or has reached its redemption limit.');
  }
  const product = typeof price.product === 'string' ? price.product : price.product.id;
  if (!coupon.applies_to?.products.includes(product)) {
    throw new OfferError('This plan is not eligible for EVENT50.');
  }

  // Customer-specific codes let Stripe atomically enforce one redemption per
  // billing customer across browsers/servers, without a race-prone local counter.
  const codes = await client.promotionCodes.list({
    code: EVENT_OFFER.code, customer, limit: 100,
  }, BILLING_REQUEST_OPTIONS);
  let promotion = codes.data.find(p => p.coupon.id === coupon.id);
  if (promotion && (!promotion.active || promotion.times_redeemed >= 1)) {
    throw new OfferError('EVENT50 has already been used by this billing customer.');
  }
  if (!promotion) {
    promotion = await client.promotionCodes.create({
      coupon: coupon.id,
      code: EVENT_OFFER.code,
      customer,
      max_redemptions: 1,
      expires_at: EVENT_OFFER.expiresAt,
      // Also blocks monthly redemption in an older hosted Checkout session.
      restrictions: { minimum_amount: 4900, minimum_amount_currency: 'usd' },
      metadata: { campaign: EVENT_OFFER.couponId },
    }, { ...BILLING_REQUEST_OPTIONS, idempotencyKey: `${EVENT_OFFER.couponId}-${customer}` });
  }
  return promotion.id;
}
