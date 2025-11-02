/**
 * Cache service interface
 * Provides abstraction for caching operations following Dependency Inversion Principle
 */
export interface ICacheService {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cached values
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists in cache and is not expired
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;
}
