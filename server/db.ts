import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon WebSocket constructor with better error handling
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with conservative settings for WebSocket stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  maxUses: 100,
  allowExitOnIdle: false,
});

export const db = drizzle(pool, { schema });

// Add comprehensive error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', () => {
  console.log('Database client connected');
});

// Test database connection with retry logic
export async function testDatabaseConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✓ Database connection successful');
      return true;
    } catch (error) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        return false;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}