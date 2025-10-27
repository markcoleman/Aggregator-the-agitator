import { FastifyRequest, FastifyReply } from 'fastify';
import { ICacheService } from '../../infra/cache/cache.interface.js';

/**
 * Cache middleware for Fastify routes
 * Caches GET request responses with configurable TTL
 */
export class CacheMiddleware {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly defaultTtlSeconds = 60,
  ) {}

  /**
   * Generate cache key from request
   * Includes route, query params, and user ID for user-specific caching
   */
  private generateCacheKey(request: FastifyRequest): string {
    const userId = (request.user as { sub?: string })?.sub || 'anonymous';
    const url = request.url;
    const method = request.method;

    // Create a deterministic key from route, query, and user
    return `cache:${method}:${url}:user:${userId}`;
  }

  /**
   * Cache middleware handler
   * Returns cached response if available, otherwise continues to route handler
   */
  cache(ttlSeconds?: number) {
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const cacheService = this.cacheService;

    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Only cache GET requests
      if (request.method !== 'GET') {
        return;
      }

      const cacheKey = this.generateCacheKey(request);

      // Try to get from cache
      const cachedData = await cacheService.get<unknown>(cacheKey);

      if (cachedData !== null) {
        // Cache hit - return cached data
        reply.header('X-Cache', 'HIT');
        reply.send(cachedData);
        return;
      }

      // Cache miss - continue to route handler
      reply.header('X-Cache', 'MISS');

      // Hook into the response to cache it
      const originalSend = reply.send.bind(reply);
      reply.send = function (payload: unknown) {
        // Only cache successful responses (2xx status codes)
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          // Cache the response asynchronously (don't block response)
          setImmediate(async () => {
            try {
              await cacheService.set(cacheKey, payload, ttl);
            } catch (error) {
              // Log error but don't fail the request
              request.log.error({ error, cacheKey }, 'Failed to cache response');
            }
          });
        }
        return originalSend(payload);
      };
    };
  }

  /**
   * Invalidate cache for a specific pattern
   * Useful for cache invalidation after data modifications
   */
  async invalidatePattern(_pattern: string): Promise<void> {
    // Note: Simple in-memory cache doesn't support pattern matching
    // For pattern-based invalidation, consider using Redis with SCAN
    // For now, we'll clear the entire cache as a simple approach
    await this.cacheService.clear();
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidate(request: FastifyRequest): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    await this.cacheService.delete(cacheKey);
  }
}
