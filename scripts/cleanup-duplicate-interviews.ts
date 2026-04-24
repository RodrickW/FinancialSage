/**
 * One-time migration: delete duplicate interview rows, keeping only the most
 * recent record per user (ordered by created_at DESC, id DESC).
 *
 * Run with:
 *   npx tsx scripts/cleanup-duplicate-interviews.ts
 *
 * Safe to re-run — if no duplicates exist it exits cleanly with a message.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function cleanupDuplicateInterviews() {
  const client = await pool.connect();
  try {
    const countResult = await client.query<{ user_id: number; count: string }>(`
      SELECT user_id, COUNT(*) as count
      FROM interviews
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);

    const usersWithDuplicates = countResult.rows;
    if (usersWithDuplicates.length === 0) {
      console.log('No duplicate interview records found. Database is already clean.');
      return;
    }

    console.log(`Found ${usersWithDuplicates.length} user(s) with duplicate interview records:`);
    for (const row of usersWithDuplicates) {
      console.log(`  user_id=${row.user_id}: ${row.count} records`);
    }

    const deleteResult = await client.query(`
      DELETE FROM interviews
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) AS rn
          FROM interviews
        ) ranked
        WHERE rn > 1
      )
    `);

    const deleted = deleteResult.rowCount ?? 0;
    console.log(`Deleted ${deleted} duplicate interview record(s).`);
    console.log('Each user now has at most one interview record (the most recent one).');
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDuplicateInterviews().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
