import session from 'express-session';
import MemoryStore from 'memorystore';
import { RedisStore as SessionRedisStore } from 'connect-redis';
import { RedisStore as RateLimitRedisStore } from 'rate-limit-redis';

interface RedisConnection {
  isReady: boolean;
  sendCommand(args: string[]): Promise<any>;
}

export function redisNamespace(environment = process.env.NODE_ENV): string {
  return `mindmymoney:${environment === 'production' ? 'production' : 'development'}:`;
}

export function createSessionStore(client: RedisConnection, environment = process.env.NODE_ENV) {
  if (client.isReady) {
    return new SessionRedisStore({
      client,
      prefix: `${redisNamespace(environment)}sess:`,
      ttl: 7 * 24 * 60 * 60,
    });
  }
  if (environment === 'production') {
    throw new Error('Redis must be ready before production sessions are initialized');
  }
  const DevelopmentStore = MemoryStore(session);
  return new DevelopmentStore({ checkPeriod: 86400000 });
}

export function createRateLimitStore(
  client: RedisConnection,
  scope: 'general' | 'auth' | 'plaid',
  environment = process.env.NODE_ENV,
) {
  if (client.isReady) {
    return new RateLimitRedisStore({
      prefix: `${redisNamespace(environment)}rate:${scope}:`,
      sendCommand: (...args: string[]) => client.sendCommand(args),
    });
  }
  if (environment === 'production') {
    throw new Error('Redis must be ready before production rate limits are initialized');
  }
  return undefined; // express-rate-limit's memory store, development only.
}
