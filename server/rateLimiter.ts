/**
 * Rate limiter for Plaid API calls.
 * Uses Redis-backed storage so limits are consistent across server restarts
 * and multiple instances.
 */

import { cache } from './redis';

const REFRESH_COOLDOWN_MINUTES = 720; // 12 hours
const COOLDOWN_SECONDS = REFRESH_COOLDOWN_MINUTES * 60;

function redisKey(userId: number): string {
  return `plaid-refresh:${userId}`;
}

class PlaidRateLimiter {
  /**
   * Check if user can refresh their accounts.
   * Returns { allowed: true } or { allowed: false, remainingTime: minutes }.
   */
  async canUserRefresh(userId: number): Promise<{ allowed: boolean; remainingTime?: number }> {
    const stored = await cache.get<{ ts: number }>(redisKey(userId));
    if (!stored) return { allowed: true };

    const elapsed = Date.now() - stored.ts;
    const cooldownMs = COOLDOWN_SECONDS * 1000;

    if (elapsed >= cooldownMs) return { allowed: true };

    const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 60_000);
    return { allowed: false, remainingTime: remainingMinutes };
  }

  /**
   * Record that user has refreshed. Atomically sets the timestamp with TTL
   * so the record auto-expires after the cooldown without manual cleanup.
   */
  async recordUserRefresh(userId: number): Promise<void> {
    await cache.set(redisKey(userId), { ts: Date.now() }, COOLDOWN_SECONDS);
    console.log(`⏰ Rate limiter: User ${userId} refresh recorded at ${new Date().toISOString()}`);
  }

  /**
   * Get remaining cooldown time in minutes (0 = no cooldown active).
   */
  async getRemainingCooldown(userId: number): Promise<number> {
    const check = await this.canUserRefresh(userId);
    return check.allowed ? 0 : (check.remainingTime ?? 0);
  }

  /**
   * Clear rate limit for a user (admin use).
   */
  async clearUserLimit(userId: number): Promise<void> {
    await cache.del(redisKey(userId));
    console.log(`🔄 Rate limiter: Cleared limits for user ${userId}`);
  }

  /**
   * Get basic stats for monitoring.
   */
  getStats(): { note: string } {
    return { note: 'Stats are Redis-backed; query Redis directly for counts.' };
  }
}

export const plaidRateLimiter = new PlaidRateLimiter();
