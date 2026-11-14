---
name: Redis mandatory in production
description: Redis is required in production for sessions and rate limits; the app refuses to start without it.
---

**Rule:** In production, Redis must be available. Missing or unavailable Redis must prevent startup, and session/rate-limit initialization must never silently fall back to memory. Memory fallback is development-only.

**Why:** Sessions and Plaid refresh rate limits (12-hour cooldown) are Redis-backed. Without Redis in a multi-instance deployment, sessions evaporate on restart and rate limits are per-process — users can bypass them by hitting another instance.

**How to apply:** Connect Redis before initializing sessions or request limits. Treat session-store initialization errors as fatal in production rather than catching them and selecting a memory store.

**Rule:** Isolate Redis keys by environment and give every independently configured rate limiter a distinct counter prefix.

**Why:** Workspace and production can receive the same shared secret. Without environment isolation, testing can affect live sessions and limits. Reusing a counter prefix between limiters also mixes unrelated quotas and expiration windows.

**How to apply:** Preserve environment-specific prefixes for sessions, caches and request limits. Give new rate limiters their own scope; never reuse another limiter's counters merely because the IP address is the same.
