---
name: Event annual discount policy
description: Approved event offer terms and Stripe coupon expansion requirement.
---

EVENT50 expired November 15, 2026 at 11:59 PM America/Chicago and was retired at the user's request. The web-only offer was 50% off the first annual payment for either Plus or Pro, normal annual renewals, 100 total redemptions, and one per billing customer. Preserve Stripe billing history and existing redemptions when retiring an event offer.

**Why:** The user approved these exact terms for event attendees. Do not extend the expiration or make the discount recurring without approval.

**How to apply:** Keep existing subscription recovery ahead of new sales. Use Stripe-enforced campaign and customer limits rather than local counters. Customer-specific instances of the same public-facing code allow returning customers without allowing repeat redemptions.

Stripe coupon product restrictions may be omitted from both creation and retrieval responses unless `applies_to` is explicitly expanded.

**Why:** A live coupon correctly stored the product restrictions but ordinary retrieval omitted them, causing strict eligibility verification to reject a valid configuration.

**How to apply:** Explicitly request expansion when verifying product restrictions; missing response fields are not evidence that restrictions were not saved.
