---
name: Subscription payment recovery
description: Product rule for recovering web-origin subscriptions from mobile without selling a second subscription.
---

Recover subscriptions through their original billing provider, even when the customer is currently using another device. Existing web subscribers need card repair from inside the downloadable app; they should not be sent to buy an Apple subscription to regain access.

**Why:** The user reported that a credit-card problem interrupted their web-origin subscription, with no recovery option on either web or mobile. Replacing it with an in-app purchase could leave two billable subscriptions.

**How to apply:** Distinguish payment failure or pause from a fully ended subscription. Repair or resume the existing subscription first; only offer a new purchase once the original has ended. Billing-provider verification failures are not evidence that the customer has no subscription.
