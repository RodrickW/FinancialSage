import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

// Only attempt Redis if a real URL is configured — never try localhost in production
const redisClient = createClient({
  url: REDIS_URL || 'redis://localhost:6379',
  socket: {
    // Stop retrying after 3 attempts so we don't hammer a missing server forever
    reconnectStrategy: (retries) => {
      if (!REDIS_URL || retries >= 3) return false;
      return Math.min(retries * 200, 2000);
    },
  },
});

redisClient.on('error', () => {
  // Suppress repeated error logs — we already log once on connect failure
});

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client ready');
});

// Connect to Redis only if a real URL is provided
async function connectRedis() {
  if (!REDIS_URL) {
    console.log('No REDIS_URL configured — using in-memory session storage');
    return;
  }
  try {
    await redisClient.connect();
    console.log('✓ Redis connection established');
  } catch (error) {
    console.log('Redis unavailable — falling back to in-memory session storage');
  }
}

// Cache helper functions — all fail silently when Redis is unavailable
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!REDIS_URL || !redisClient.isReady) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      if (!REDIS_URL || !redisClient.isReady) return;
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch {
      // ignore
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!REDIS_URL || !redisClient.isReady) return;
      await redisClient.del(key);
    } catch {
      // ignore
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!REDIS_URL || !redisClient.isReady) return;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) await redisClient.del(keys);
    } catch {
      // ignore
    }
  }
};

connectRedis();

export { redisClient };
