import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryCacheService } from '../../src/infra/cache/memory-cache.service.js';

describe('MemoryCacheService', () => {
  let cacheService: MemoryCacheService;

  beforeEach(() => {
    cacheService = new MemoryCacheService(1000); // 1 second cleanup interval
  });

  afterEach(() => {
    cacheService.destroy();
  });

  describe('get and set', () => {
    it('should store and retrieve values', async () => {
      await cacheService.set('key1', 'value1', 60);
      const result = await cacheService.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get<string>('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      // String
      await cacheService.set('string', 'test', 60);
      expect(await cacheService.get<string>('string')).toBe('test');

      // Number
      await cacheService.set('number', 123, 60);
      expect(await cacheService.get<number>('number')).toBe(123);

      // Object
      const obj = { name: 'test', value: 42 };
      await cacheService.set('object', obj, 60);
      expect(await cacheService.get<typeof obj>('object')).toEqual(obj);

      // Array
      const arr = [1, 2, 3];
      await cacheService.set('array', arr, 60);
      expect(await cacheService.get<typeof arr>('array')).toEqual(arr);
    });

    it('should overwrite existing values', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key1', 'value2', 60);
      const result = await cacheService.get<string>('key1');
      expect(result).toBe('value2');
    });
  });

  describe('expiration', () => {
    it('should expire values after TTL', async () => {
      await cacheService.set('key1', 'value1', 1); // 1 second TTL
      
      // Should exist initially
      let result = await cacheService.get<string>('key1');
      expect(result).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be null after expiration
      result = await cacheService.get<string>('key1');
      expect(result).toBeNull();
    });

    it('should not expire values before TTL', async () => {
      await cacheService.set('key1', 'value1', 10); // 10 seconds TTL
      
      // Wait a bit but not long enough to expire
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await cacheService.get<string>('key1');
      expect(result).toBe('value1');
    });
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.delete('key1');
      const result = await cacheService.get<string>('key1');
      expect(result).toBeNull();
    });

    it('should handle deleting non-existent keys', async () => {
      await expect(cacheService.delete('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all cached values', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);
      await cacheService.set('key3', 'value3', 60);

      await cacheService.clear();

      expect(await cacheService.get<string>('key1')).toBeNull();
      expect(await cacheService.get<string>('key2')).toBeNull();
      expect(await cacheService.get<string>('key3')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired keys', async () => {
      await cacheService.set('key1', 'value1', 60);
      const exists = await cacheService.has('key1');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      const exists = await cacheService.has('non-existent');
      expect(exists).toBe(false);
    });

    it('should return false for expired keys', async () => {
      await cacheService.set('key1', 'value1', 1); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const exists = await cacheService.has('key1');
      expect(exists).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('key1', 'value1', 60);
      await cacheService.set('key2', 'value2', 60);

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.expired).toBe(0);
    });

    it('should count expired entries', async () => {
      await cacheService.set('key1', 'value1', 1); // Will expire
      await cacheService.set('key2', 'value2', 60); // Won't expire

      // Wait for first key to expire but before cleanup runs
      await new Promise(resolve => setTimeout(resolve, 1100));

      const stats = cacheService.getStats();
      // Either 1 or 2 entries depending on whether cleanup ran
      expect(stats.size).toBeGreaterThanOrEqual(1);
      expect(stats.size).toBeLessThanOrEqual(2);
      
      // If size is 2, one should be expired
      if (stats.size === 2) {
        expect(stats.expired).toBe(1);
      }
    });
  });

  describe('cleanup', () => {
    it('should automatically clean up expired entries', async () => {
      // Create a cache service with very short cleanup interval for testing
      const testCache = new MemoryCacheService(500); // 500ms cleanup

      await testCache.set('key1', 'value1', 1); // Will expire
      await testCache.set('key2', 'value2', 60); // Won't expire

      // Wait for expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 1600));

      const stats = testCache.getStats();
      // After cleanup, expired entries should be removed
      expect(stats.size).toBeLessThanOrEqual(1);

      testCache.destroy();
    });
  });

  describe('destroy', () => {
    it('should stop cleanup interval and clear cache', async () => {
      await cacheService.set('key1', 'value1', 60);
      cacheService.destroy();

      const stats = cacheService.getStats();
      expect(stats.size).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        cacheService.destroy();
        cacheService.destroy();
      }).not.toThrow();
    });
  });
});
