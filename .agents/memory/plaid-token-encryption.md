---
name: Plaid token encryption
description: Plaid access tokens are encrypted at rest using AES-256-GCM; how to read/write them and the migration approach.
---

**Rule:** Plaid access tokens must never be stored as plaintext. Always encrypt on write, decrypt on read.

**How to apply:**
- Write path: call `encryptSensitiveData(accessToken)` before passing to `formatPlaidAccountData` or any `storage.createAccount`/`updateAccount` that sets `plaidAccessToken`.
- Read path: use the `getPlaidToken(account)` helper defined in `server/routes.ts` — it calls `decryptSensitiveData` and handles the plaintext fallback gracefully.
- `decryptSensitiveData` in `server/dataEncryption.ts` returns plaintext unchanged if the value doesn't match the `iv:authTag:ciphertext` format — this is intentional for migration safety.
- Key is derived with `scryptSync(ENCRYPTION_KEY, 'mindmymoney-plaid-salt-v1', 32)` — the salt is baked in; changing it would invalidate all stored tokens.

**Why:** Plaid access tokens grant full read access to a user's bank accounts. Storing them in plaintext means a DB breach exposes all linked accounts.

**Migration:** `scripts/encrypt-existing-plaid-tokens.ts` — idempotent, skips already-encrypted rows, spot-checks no plaintext remains. Ran once on Aug 2, 2026 (15 accounts encrypted).

**ENCRYPTION_KEY secret:** Must be set in Replit Secrets. If lost, all stored tokens become unreadable and users must re-link their banks.
