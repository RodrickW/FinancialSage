/**
 * Rate limiter for Plaid API calls to prevent excessive charges
 * Tracks last refresh time per user to enforce hourly limits
 */

interface UserRefreshRecord {
  userId: number;
  lastRefresh: Date;
}

class PlaidRateLimiter {
  private userRefreshTimes = new Map<number, Date>();
  private readonly REFRESH_COOLDOWN_MINUTES = 60; // 1 hour between refreshes per user

  /**
   * Check if user can refresh their accounts
   */
  canUserRefresh(userId: number): { allowed: boolean; remainingTime?: number } {
    const lastRefresh = this.userRefreshTimes.get(userId);
    
    if (!lastRefresh) {
      return { allowed: true };
    }

    const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
    const cooldownMs = this.REFRESH_COOLDOWN_MINUTES * 60 * 1000;
    
    if (timeSinceLastRefresh >= cooldownMs) {
      return { allowed: true };
    }

    const remainingMs = cooldownMs - timeSinceLastRefresh;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    
    return { 
      allowed: false, 
      remainingTime: remainingMinutes 
    };
  }

  /**
   * Record that user has refreshed their accounts
   */
  recordUserRefresh(userId: number): void {
    this.userRefreshTimes.set(userId, new Date());
    console.log(`⏰ Rate limiter: User ${userId} refresh recorded at ${new Date().toISOString()}`);
  }

  /**
   * Get remaining cooldown time for user
   */
  getRemainingCooldown(userId: number): number {
    const lastRefresh = this.userRefreshTimes.get(userId);
    if (!lastRefresh) return 0;

    const timeSinceLastRefresh = Date.now() - lastRefresh.getTime();
    const cooldownMs = this.REFRESH_COOLDOWN_MINUTES * 60 * 1000;
    const remaining = Math.max(0, cooldownMs - timeSinceLastRefresh);
    
    return Math.ceil(remaining / (60 * 1000)); // Return minutes
  }

  /**
   * Clear rate limit for a user (admin use)
   */
  clearUserLimit(userId: number): void {
    this.userRefreshTimes.delete(userId);
    console.log(`🔄 Rate limiter: Cleared limits for user ${userId}`);
  }

  /**
   * Get stats for monitoring
   */
  getStats(): { totalUsers: number; recentRefreshes: number } {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let recentRefreshes = 0;

    for (const [userId, lastRefresh] of this.userRefreshTimes) {
      if (lastRefresh.getTime() > oneHourAgo) {
        recentRefreshes++;
      }
    }

    return {
      totalUsers: this.userRefreshTimes.size,
      recentRefreshes
    };
  }
}

export const plaidRateLimiter = new PlaidRateLimiter();