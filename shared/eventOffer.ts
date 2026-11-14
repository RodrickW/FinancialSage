// Approved vendor-event offer. Changing these terms requires a new Stripe coupon.
export const EVENT_OFFER = {
  code: 'EVENT50',
  couponId: 'mmm_event50_202611',
  expiresAt: Math.floor(Date.parse('2026-11-16T05:59:59Z') / 1000),
  maxRedemptions: 100,
  percentOff: 50,
} as const;
