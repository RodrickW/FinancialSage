import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

const redisClient = createClient({
  url: REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (!REDIS_URL || retries >= 3) return false;
      return Math.min(retries * 200, 2000);
    },
  },
});

redisClient.on('error', (err) => {
  // Only log the first error to avoid log spam
  console.error('Redis error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client ready');
});

/**
 * Connect to Redis. In production, failure is fatal — the server refuses to start
 * without Redis because sessions and rate limits require it to work consistently
 * across instances.
 */
export async function connectRedis(): Promise<void> {
  if (!REDIS_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: REDIS_URL is not set. Redis is required in production.');
      process.exit(1);
    }
    console.log('⚠️  No REDIS_URL — using in-memory session storage (dev only)');
    return;
  }

  try {
    await redisClient.connect();
    console.log('✓ Redis connection established');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: Redis failed to connect in production:', error);
      process.exit(1);
    }
    console.warn('⚠️  Redis unavailable — falling back to in-memory storage (dev only)');
  }
}

// Cache helper functions — fail silently when Redis is unavailable (dev only)
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isReady) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      if (!redisClient.isReady) return;
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!redisClient.isReady) return;
      await redisClient.del(key);
    } catch {
      // ignore
    }
  },

  /**
   * Delete all keys matching a pattern. Uses SCAN instead of KEYS
   * to avoid blocking Redis on large datasets.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!redisClient.isReady) return;
      let cursor = '0';
      do {
        const reply = await redisClient.scan(cursor as any, { MATCH: pattern, COUNT: 100 });
        cursor = String(reply.cursor);
        if (reply.keys.length > 0) {
          await redisClient.del(reply.keys);
        }
      } while (cursor !== '0');
    } catch {
      // ignore
    }
  },
};

export { redisClient };
