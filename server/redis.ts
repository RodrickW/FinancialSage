import { createClient } from 'redis';

// Create Redis client for session storage and caching
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
  },
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('✓ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client ready');
});

redisClient.on('end', () => {
  console.log('Redis client disconnected');
});

// Connect to Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('✓ Redis connection established');
  } catch (error) {
    console.error('✗ Redis connection failed:', error);
    console.log('Falling back to in-memory session storage');
  }
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Redis pattern invalidation error:', error);
    }
  }
};

// Initialize Redis connection
connectRedis();

export { redisClient };