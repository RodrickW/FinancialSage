/**
 * One-time migration script: encrypts all existing plaintext Plaid access tokens.
 *
 * Run once after deploying the encryption fix:
 *   npx tsx scripts/encrypt-existing-plaid-tokens.ts
 *
 * The script is idempotent — already-encrypted tokens are detected and skipped.
 */

import { neon } from '@neondatabase/serverless';
import { encryptSensitiveData, decryptSensitiveData } from '../server/dataEncryption';

const DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL / NEON_DATABASE_URL is not set');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY is not set — cannot encrypt tokens');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('🔐 Plaid token encryption migration starting...\n');

  // Fetch all accounts that have an access token
  const rows = await sql`
    SELECT id, plaid_access_token
    FROM accounts
    WHERE plaid_access_token IS NOT NULL
      AND plaid_access_token != ''
  `;

  console.log(`Found ${rows.length} account(s) with Plaid tokens.\n`);

  let encrypted = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const token: string = row.plaid_access_token;
    const parts = token.split(':');

    // Already encrypted — IV is 32 hex chars and format is iv:authTag:data
    if (parts.length === 3 && parts[0].length === 32) {
      // Verify it round-trips correctly before skipping
      try {
        decryptSensitiveData(token);
        console.log(`  ⏭️  Account ${row.id}: already encrypted, skipping`);
        skipped++;
        continue;
      } catch {
        // Falls through to re-encrypt
      }
    }

    try {
      const encryptedToken = encryptSensitiveData(token);
      await sql`
        UPDATE accounts
        SET plaid_access_token = ${encryptedToken}
        WHERE id = ${row.id}
      `;
      console.log(`  ✅ Account ${row.id}: encrypted`);
      encrypted++;
    } catch (err) {
      console.error(`  ❌ Account ${row.id}: FAILED —`, (err as Error).message);
      failed++;
    }
  }

  console.log(`
╔══════════════════════════════════
║ Migration complete
╠══════════════════════════════════
║ ✅ Encrypted : ${encrypted}
║ ⏭️  Skipped   : ${skipped}
║ ❌ Failed    : ${failed}
╚══════════════════════════════════`);

  if (failed > 0) {
    console.error('\n⚠️  Some tokens failed to encrypt. Check the errors above.');
    process.exit(1);
  }

  // Spot-check: ensure no plaintext Plaid tokens remain
  const plaintext = await sql`
    SELECT COUNT(*) as cnt
    FROM accounts
    WHERE plaid_access_token IS NOT NULL
      AND plaid_access_token NOT LIKE '%:%:%'
  `;
  const remaining = Number(plaintext[0]?.cnt ?? 0);
  if (remaining > 0) {
    console.error(`\n⚠️  Spot-check failed: ${remaining} account(s) still have plaintext tokens.`);
    process.exit(1);
  }

  console.log('\n✓ Spot-check passed — no plaintext tokens remain.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
