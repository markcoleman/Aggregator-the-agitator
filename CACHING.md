# Caching Implementation

## Overview

The FDX Resource API implements an intelligent caching layer to improve performance and reduce load on backend services. The caching system is designed following SOLID principles and is fully configurable.

## Architecture

### Components

1. **ICacheService Interface** (`src/infra/cache/cache.interface.ts`)
   - Defines the contract for cache implementations
   - Supports get, set, delete, clear, and has operations
   - Enables easy swapping of cache backends (e.g., Redis)

2. **MemoryCacheService** (`src/infra/cache/memory-cache.service.ts`)
   - In-memory cache implementation using JavaScript Map
   - Automatic cleanup of expired entries
   - Suitable for single-instance deployments
   - Can be replaced with Redis for distributed systems

3. **CacheMiddleware** (`src/http/middleware/cache.ts`)
   - Fastify middleware for HTTP caching
   - Integrates with route preHandler hooks
   - Generates secure cache keys
   - Adds observability headers

## Features

### Smart Caching

- **GET Requests Only**: Only caches GET requests (read operations)
- **Success Responses**: Only caches 2xx status codes
- **User-Aware**: Cache keys include user ID for security
- **Query Parameter Support**: Different query parameters result in different cache keys

### Configuration

Environment variables:

```bash
CACHE_ENABLED=true          # Enable/disable caching
CACHE_TTL_SECONDS=60        # Time-to-live in seconds (default: 60)
```

### Cache Key Strategy

Cache keys are generated as:
```
cache:{method}:{url}:user:{userId}
```

Example:
```
cache:GET:/fdx/v6/accounts/acc-001:user:user-123
cache:GET:/fdx/v6/accounts/acc-001/transactions?limit=10:user:user-123
```

This ensures:
- Different users get different cached responses
- Different query parameters are cached separately
- Different endpoints are cached independently

### Observability

The cache adds HTTP headers to all responses:

- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response generated fresh (and cached for next request)

### Automatic Cleanup

- Expired entries are automatically removed every 60 seconds
- Cleanup runs in the background without blocking requests
- Memory usage is kept under control

## Cached Endpoints

The following endpoints are cached:

- `GET /fdx/v6/accounts` - List user accounts
- `GET /fdx/v6/accounts/:accountId` - Get account details
- `GET /fdx/v6/accounts/:accountId/transactions` - Get transactions
- `GET /fdx/v6/accounts/:accountId/contact` - Get contact information
- `GET /fdx/v6/accounts/:accountId/payment-networks` - Get payment networks
- `GET /fdx/v6/accounts/:accountId/statements` - List statements
- `GET /fdx/v6/accounts/:accountId/statements/:statementId` - Get statement details

### Not Cached

- `POST /consent` - Create consent (write operation)
- `PUT /consent/:consentId` - Update consent (write operation)
- `GET /consent/:consentId` - Get consent (frequently updated, excluded)
- `GET /health` - Health check (no auth required)

## Performance Benefits

With a 1-minute TTL and typical usage patterns:

- **Reduced Backend Load**: Repeated requests for the same data are served from cache
- **Faster Response Times**: Cache hits avoid database/service layer calls
- **Better User Experience**: Sub-millisecond response times for cached data

## Monitoring

### Cache Statistics

The `MemoryCacheService` provides statistics:

```typescript
const stats = cacheService.getStats();
// { size: 100, expired: 5 }
```

### Metrics to Monitor

- Cache hit rate (X-Cache headers in logs)
- Cache size growth
- Number of expired entries
- Memory usage

## Testing

### Unit Tests

- 17 unit tests covering all cache service operations
- Tests for TTL expiration and automatic cleanup
- Tests for different data types

### Integration Tests

- 8 integration tests for HTTP caching behavior
- Tests for cache hit/miss scenarios
- Tests for user isolation
- Tests for query parameter handling

All tests maintain >90% code coverage.

## Future Enhancements

### Redis Integration

For distributed deployments, consider implementing a Redis-based cache:

```typescript
class RedisCacheService implements ICacheService {
  constructor(private redis: RedisClient) {}
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
  
  // ... other methods
}
```

Then update `src/app.ts`:

```typescript
// Replace MemoryCacheService with RedisCacheService
const cacheService = new RedisCacheService(redisClient);
```

### Cache Invalidation

For more sophisticated cache invalidation:

1. **Time-based**: Current implementation (TTL)
2. **Event-based**: Invalidate cache when data changes
3. **Pattern-based**: Clear all caches matching a pattern (requires Redis)

Example event-based invalidation:

```typescript
// After updating an account
await cacheMiddleware.invalidate({
  method: 'GET',
  url: `/fdx/v6/accounts/${accountId}`,
  user: { sub: userId }
} as FastifyRequest);
```

### Cache Warming

Pre-populate cache with frequently accessed data:

```typescript
async function warmCache() {
  // Get frequently accessed accounts
  const accounts = await getPopularAccounts();
  
  for (const account of accounts) {
    const data = await accountsService.getAccountById(account.id, account.userId);
    await cacheService.set(
      `cache:GET:/fdx/v6/accounts/${account.id}:user:${account.userId}`,
      data,
      60
    );
  }
}
```

### Tiered Caching

Implement multiple cache layers:

1. **L1**: In-memory (very fast, small capacity)
2. **L2**: Redis (fast, medium capacity)
3. **L3**: CDN (for static content)

## Troubleshooting

### Cache Not Working

1. Check `CACHE_ENABLED` environment variable
2. Verify requests are GET methods
3. Check response status codes (only 2xx cached)
4. Look for `X-Cache` headers in responses

### Memory Issues

1. Check cache statistics with `getStats()`
2. Reduce `CACHE_TTL_SECONDS`
3. Implement cache size limits
4. Consider Redis for large-scale deployments

### Stale Data

1. Reduce TTL for frequently changing data
2. Implement cache invalidation on updates
3. Exclude specific endpoints from caching

## Best Practices

1. **Monitor cache hit rates** - Aim for >70% hit rate
2. **Set appropriate TTLs** - Balance freshness vs. performance
3. **Include user context** - Always include user ID in cache keys
4. **Handle errors gracefully** - Cache failures should not break requests
5. **Test thoroughly** - Verify cache behavior with integration tests
6. **Document exceptions** - Clearly document which endpoints are not cached

## SOLID Principles

The caching implementation follows SOLID principles:

- **Single Responsibility**: Each class has one reason to change
  - `MemoryCacheService`: Data storage
  - `CacheMiddleware`: HTTP integration
  
- **Open/Closed**: Can add new cache implementations without modifying existing code
  
- **Liskov Substitution**: Any `ICacheService` implementation can be used interchangeably
  
- **Interface Segregation**: `ICacheService` provides focused, cohesive interface
  
- **Dependency Inversion**: Components depend on `ICacheService` interface, not concrete implementations
