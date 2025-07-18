import { cache } from './redis';

// Cache helper functions for high-performance data access
export class CacheManager {
  private static instance: CacheManager;
  private readonly defaultTTL = 3600; // 1 hour

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // User-specific caching
  async getUserCache<T>(userId: number, key: string): Promise<T | null> {
    return await cache.get<T>(`user:${userId}:${key}`);
  }

  async setUserCache(userId: number, key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    await cache.set(`user:${userId}:${key}`, value, ttl);
  }

  async invalidateUserCache(userId: number, pattern: string = '*'): Promise<void> {
    await cache.invalidatePattern(`user:${userId}:${pattern}`);
  }

  // Financial data caching (shorter TTL for accuracy)
  async getFinancialData<T>(userId: number, dataType: string): Promise<T | null> {
    return await cache.get<T>(`financial:${userId}:${dataType}`);
  }

  async setFinancialData(userId: number, dataType: string, value: any, ttl: number = 300): Promise<void> {
    // 5-minute TTL for financial data to ensure freshness
    await cache.set(`financial:${userId}:${dataType}`, value, ttl);
  }

  async invalidateFinancialData(userId: number): Promise<void> {
    await cache.invalidatePattern(`financial:${userId}:*`);
  }

  // Transaction caching
  async getTransactions(userId: number): Promise<any[] | null> {
    return await this.getFinancialData(userId, 'transactions');
  }

  async setTransactions(userId: number, transactions: any[]): Promise<void> {
    await this.setFinancialData(userId, 'transactions', transactions, 600); // 10 minutes
  }

  // Account balance caching
  async getAccountBalances(userId: number): Promise<any[] | null> {
    return await this.getFinancialData(userId, 'balances');
  }

  async setAccountBalances(userId: number, balances: any[]): Promise<void> {
    await this.setFinancialData(userId, 'balances', balances, 300); // 5 minutes
  }

  // Budget caching
  async getBudgets(userId: number): Promise<any[] | null> {
    return await this.getFinancialData(userId, 'budgets');
  }

  async setBudgets(userId: number, budgets: any[]): Promise<void> {
    await this.setFinancialData(userId, 'budgets', budgets, 1800); // 30 minutes
  }

  // Session caching for user metadata
  async getUserSession(userId: number): Promise<any | null> {
    return await cache.get(`session:${userId}`);
  }

  async setUserSession(userId: number, sessionData: any): Promise<void> {
    await cache.set(`session:${userId}`, sessionData, 7200); // 2 hours
  }

  // AI insights caching (longer TTL since they're computationally expensive)
  async getAIInsights(userId: number): Promise<any | null> {
    return await cache.get(`ai:${userId}:insights`);
  }

  async setAIInsights(userId: number, insights: any): Promise<void> {
    await cache.set(`ai:${userId}:insights`, insights, 7200); // 2 hours
  }

  // Global cache invalidation for user
  async invalidateAllUserData(userId: number): Promise<void> {
    await Promise.all([
      this.invalidateUserCache(userId),
      this.invalidateFinancialData(userId),
      cache.del(`session:${userId}`),
      cache.del(`ai:${userId}:insights`)
    ]);
  }
}

export const cacheManager = CacheManager.getInstance();