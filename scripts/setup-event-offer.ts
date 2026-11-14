import Stripe from 'stripe';
import { EVENT_OFFER } from '../shared/eventOffer';

// Explicit one-time provisioning. Never logs credentials or creates a charge.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { timeout: 10000, maxNetworkRetries: 0 });
async function setup() {
  if (Date.now() / 1000 >= EVENT_OFFER.expiresAt) throw new Error('Offer has expired; do not provision it.');
  const products: string[] = [];
  for (const [tier, key, expected] of [
    ['Plus', 'STRIPE_PLUS_ANNUAL_PRICE_ID', 4900],
    ['Pro', 'STRIPE_PRO_ANNUAL_PRICE_ID', 8900],
  ] as const) {
    const price = await stripe.prices.retrieve(process.env[key]!);
    if (!price.active || price.unit_amount !== expected || price.currency !== 'usd' ||
        price.recurring?.interval !== 'year' || price.recurring.interval_count !== 1) {
      throw new Error(`${tier} annual price does not match the approved offer.`);
    }
    products.push(typeof price.product === 'string' ? price.product : price.product.id);
    console.log(`${tier}: ${price.unit_amount / 100} USD/year; first year ${price.unit_amount / 200} USD; live=${price.livemode}`);
  }
  // A public, unrestricted EVENT50 would conflict with customer-bound codes.
  const existingCodes = await stripe.promotionCodes.list({ code: EVENT_OFFER.code, active: true, limit: 100 });
  if (existingCodes.data.some(p => !p.customer || p.coupon.id !== EVENT_OFFER.couponId)) {
    throw new Error('An incompatible active EVENT50 code already exists; no changes made.');
  }
  let coupon: Stripe.Coupon;
  try {
    coupon = await stripe.coupons.retrieve(EVENT_OFFER.couponId, { expand: ['applies_to'] });
  } catch (error: any) {
    if (error.code !== 'resource_missing') throw error;
    coupon = await stripe.coupons.create({
      id: EVENT_OFFER.couponId,
      name: 'EVENT50: 50% off first annual payment',
      percent_off: 50, duration: 'once',
      max_redemptions: 100, redeem_by: EVENT_OFFER.expiresAt,
      applies_to: { products: [...new Set(products)] },
      expand: ['applies_to'],
      metadata: { campaign: 'vendor_event_nov_2026', annual_only: 'true' },
    }, { idempotencyKey: EVENT_OFFER.couponId });
  }
  if (coupon.percent_off !== 50 || coupon.duration !== 'once' || coupon.max_redemptions !== 100 ||
      coupon.redeem_by !== EVENT_OFFER.expiresAt || !products.every(p => coupon.applies_to?.products.includes(p))) {
    throw new Error('Existing coupon does not match approved terms; not modified.');
  }
  console.log(JSON.stringify({
    coupon: coupon.id, live: coupon.livemode, valid: coupon.valid,
    percentOff: coupon.percent_off, duration: coupon.duration,
    limit: coupon.max_redemptions, redeemed: coupon.times_redeemed,
    expires: new Date(coupon.redeem_by! * 1000).toISOString(),
    code: EVENT_OFFER.code, perCustomerLimit: 1,
    note: 'Customer-bound promotion codes are created when eligible annual checkout starts.',
  }));
}
setup().catch(error => {
  console.error('Event offer setup failed:', error.message);
  process.exitCode = 1;
});
