/**
 * QUANTUM FORGE™ Intelligent Caching System
 * 
 * High-performance caching layer for real-time trading data
 * - Redis-based distributed caching
 * - Smart cache invalidation
 * - Fallback mechanisms
 * - Real-time data optimization
 */

import Redis from 'ioredis';

interface CacheConfig {
  defaultTTL: number; // seconds
  maxRetries: number;
  retryDelay: number;
  keyPrefix: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

interface RealTimeDataOptions {
  forceRefresh?: boolean;
  maxAge?: number; // milliseconds
  fallbackToStale?: boolean;
}

class IntelligentCache {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private isRedisAvailable: boolean = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 30, // 30 seconds default
      maxRetries: 3,
      retryDelay: 1000,
      keyPrefix: 'qf:', // QUANTUM FORGE™ prefix
      ...config
    };

    this.initializeRedis();
    this.startMemoryCacheCleanup();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        connectTimeout: 3000,
        commandTimeout: 2000
      });

      this.redis.on('connect', () => {
        console.log('🔥 QUANTUM FORGE™ Cache: Redis connected');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (error) => {
        console.warn('⚠️ Redis unavailable, using memory cache:', error.message);
        this.isRedisAvailable = false;
      });

      // Test connection
      await this.redis.ping();
      this.isRedisAvailable = true;
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, using memory cache only');
      this.isRedisAvailable = false;
    }
  }

  private startMemoryCacheCleanup(): void {
    // Clean expired entries every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now > entry.timestamp + (entry.ttl * 1000)) {
          this.memoryCache.delete(key);
        }
      }
    }, 30000);
  }

  private generateKey(namespace: string, identifier: string): string {
    return `${this.config.keyPrefix}${namespace}:${identifier}`;
  }

  /**
   * Get cached data with intelligent fallback
   */
  async get<T>(
    namespace: string, 
    identifier: string,
    options: RealTimeDataOptions = {}
  ): Promise<T | null> {
    const key = this.generateKey(namespace, identifier);
    const now = Date.now();

    try {
      // Check Redis first if available
      if (this.isRedisAvailable && this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          
          // Check if data is fresh enough
          const age = now - entry.timestamp;
          if (!options.forceRefresh && (!options.maxAge || age <= options.maxAge)) {
            return entry.data;
          }
          
          // Return stale data if allowed
          if (options.fallbackToStale) {
            return entry.data;
          }
        }
      }

      // Fallback to memory cache
      const memEntry = this.memoryCache.get(key);
      if (memEntry) {
        const age = now - memEntry.timestamp;
        if (!options.forceRefresh && (!options.maxAge || age <= options.maxAge)) {
          return memEntry.data;
        }
        
        if (options.fallbackToStale) {
          return memEntry.data;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with intelligent distribution
   */
  async set<T>(
    namespace: string,
    identifier: string,
    data: T,
    ttl: number = this.config.defaultTTL
  ): Promise<void> {
    const key = this.generateKey(namespace, identifier);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    };

    try {
      // Set in Redis if available
      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(entry));
      }

      // Always set in memory as backup
      this.memoryCache.set(key, entry);
    } catch (error) {
      console.warn(`Cache set error for ${key}:`, error);
      // Ensure memory cache is set even if Redis fails
      this.memoryCache.set(key, entry);
    }
  }

  /**
   * Get or compute data with caching
   */
  async getOrSet<T>(
    namespace: string,
    identifier: string,
    computeFn: () => Promise<T>,
    ttl: number = this.config.defaultTTL,
    options: RealTimeDataOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(namespace, identifier, options);
    if (cached !== null) {
      return cached;
    }

    // Compute fresh data
    const data = await computeFn();
    
    // Cache the result
    await this.set(namespace, identifier, data, ttl);
    
    return data;
  }

  /**
   * Invalidate specific cache entries
   */
  async invalidate(namespace: string, identifier?: string): Promise<void> {
    try {
      if (identifier) {
        // Invalidate specific key
        const key = this.generateKey(namespace, identifier);
        if (this.isRedisAvailable && this.redis) {
          await this.redis.del(key);
        }
        this.memoryCache.delete(key);
      } else {
        // Invalidate all keys in namespace
        const pattern = `${this.config.keyPrefix}${namespace}:*`;
        
        if (this.isRedisAvailable && this.redis) {
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }

        // Clear memory cache for namespace
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(`${this.config.keyPrefix}${namespace}:`)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  /**
   * Real-time data optimized caching
   * - Ultra-fast retrieval for trading data
   * - 2-second refresh cycle optimization
   */
  async getRealTimeData<T>(
    namespace: string,
    identifier: string,
    computeFn: () => Promise<T>,
    maxAge: number = 2000 // 2 seconds for real-time data
  ): Promise<T> {
    return this.getOrSet(
      namespace,
      identifier,
      computeFn,
      Math.ceil(maxAge / 1000), // Convert to seconds for TTL
      { maxAge, fallbackToStale: true }
    );
  }

  /**
   * Batch operations for multiple data points
   */
  async getBatch<T>(
    requests: Array<{ namespace: string; identifier: string }>,
    options: RealTimeDataOptions = {}
  ): Promise<Array<{ key: string; data: T | null }>> {
    const results = await Promise.allSettled(
      requests.map(async req => ({
        key: `${req.namespace}:${req.identifier}`,
        data: await this.get<T>(req.namespace, req.identifier, options)
      }))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { key: '', data: null }
    );
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    redisAvailable: boolean;
    memoryCacheSize: number;
    hitRatio?: number;
  } {
    return {
      redisAvailable: this.isRedisAvailable,
      memoryCacheSize: this.memoryCache.size
    };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    this.memoryCache.clear();
  }
}

// Singleton instance for the application
export const intelligentCache = new IntelligentCache({
  defaultTTL: 30,
  keyPrefix: 'quantum_forge:',
  maxRetries: 3,
  retryDelay: 1000
});

export default IntelligentCache;