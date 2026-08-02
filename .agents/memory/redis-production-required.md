---
name: Redis mandatory in production
description: Redis is required in production for sessions and rate limits; the app refuses to start without it.
---

**Rule:** In production, Redis must be available. The server calls `process.exit(1)` if `REDIS_URL` is missing or Redis fails to connect.

**Why:** Sessions and Plaid refresh rate limits (12-hour cooldown) are Redis-backed. Without Redis in a multi-instance deployment, sessions evaporate on restart and rate limits are per-process — users can bypass them by hitting another instance.

**How to apply:**
- `REDIS_URL` is in `RequiredEnvVars` in `server/envValidation.ts` and is a production-critical variable (hard fail if missing).
- `connectRedis()` is called in the startup sequence in `server/index.ts` before routes are registered.
- Rate limiters use `rate-limit-redis` (`RedisStore`) when `redisClient.isReady`; fall back to in-memory only in dev.
- `PlaidRateLimiter` in `server/rateLimiter.ts` uses Redis `cache.get/set` with TTL instead of an in-memory Map — all methods are async.

**Important:** All `plaidRateLimiter` call sites must `await` the methods (`canUserRefresh`, `recordUserRefresh`, `getRemainingCooldown`, `clearUserLimit`) since they became async.
