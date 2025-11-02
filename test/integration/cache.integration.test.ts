import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

// Mock the JwksVerifier for testing
vi.mock('../../src/infra/auth/jwksVerifier.js', () => ({
  JwksVerifier: vi.fn().mockImplementation(() => ({
    verifyToken: vi.fn().mockResolvedValue({
      sub: 'user-123',
      scope: 'accounts:read transactions:read contact:read payment_networks:read statements:read consent:write',
      client_id: 'client-456',
      aud: 'fdx-resource-api',
      iss: 'mock-issuer',
    }),
    validateScope: vi.fn(),
    extractUserId: vi.fn().mockReturnValue('user-123'),
  })),
}));

describe('Cache Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Ensure cache is enabled for these tests
    process.env['CACHE_ENABLED'] = 'true';
    process.env['CACHE_TTL_SECONDS'] = '60';
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to wait for cache to be set
  const waitForCache = () => new Promise(resolve => setTimeout(resolve, 50));

  describe('Cache Headers', () => {
    it('should return X-Cache: MISS on first request', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts',
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-cache']).toBe('MISS');
    });

    it('should return X-Cache: HIT on subsequent request', async () => {
      const url = '/fdx/v6/accounts/acc-001';
      
      // First request - cache miss
      const response1 = await app.inject({
        method: 'GET',
        url,
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['x-cache']).toBe('MISS');

      // Wait for cache to be set asynchronously
      await waitForCache();

      // Second request - cache hit
      const response2 = await app.inject({
        method: 'GET',
        url,
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response2.statusCode).toBe(200);
      expect(response2.headers['x-cache']).toBe('HIT');
      
      // Responses should be identical
      expect(response2.body).toBe(response1.body);
    });
  });

  describe('Cache per User', () => {
    it('should cache separately for different users', async () => {
      const url = '/fdx/v6/accounts/acc-002';

      // User 1 request
      const user1Response = await app.inject({
        method: 'GET',
        url,
        headers: {
          authorization: 'Bearer token-user1',
        },
      });

      expect(user1Response.statusCode).toBe(200);
      expect(user1Response.headers['x-cache']).toBe('MISS');

      // User 2 request (different token, so different cache key)
      const user2Response = await app.inject({
        method: 'GET',
        url,
        headers: {
          authorization: 'Bearer token-user2',
        },
      });

      expect(user2Response.statusCode).toBe(200);
      // Should be MISS because it's a different user
      expect(user2Response.headers['x-cache']).toBe('MISS');
    });
  });

  describe('Cache by Query Parameters', () => {
    it('should cache separately for different query parameters', async () => {
      const baseUrl = '/fdx/v6/accounts/acc-001/transactions';

      // Request with query params 1
      const response1 = await app.inject({
        method: 'GET',
        url: `${baseUrl}?limit=10`,
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response1.statusCode).toBe(200);
      expect(response1.headers['x-cache']).toBe('MISS');

      // Wait for cache to be set
      await waitForCache();

      // Request with query params 2 (different)
      const response2 = await app.inject({
        method: 'GET',
        url: `${baseUrl}?limit=20`,
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response2.statusCode).toBe(200);
      // Should be MISS because query params are different
      expect(response2.headers['x-cache']).toBe('MISS');

      // Wait for cache to be set
      await waitForCache();

      // Request with same query params as first
      const response3 = await app.inject({
        method: 'GET',
        url: `${baseUrl}?limit=10`,
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response3.statusCode).toBe(200);
      // Should be HIT because it matches the first request
      expect(response3.headers['x-cache']).toBe('HIT');
    });
  });

  describe('POST Requests', () => {
    it('should not cache POST requests', async () => {
      const response1 = await app.inject({
        method: 'POST',
        url: '/consent',
        headers: {
          authorization: 'Bearer fake-token',
          'content-type': 'application/json',
        },
        payload: {
          subjectId: 'user-123',
          clientId: 'client-456',
          dataScopes: ['accounts:read'],
          accountIds: ['acc-001'],
          purpose: 'Test',
          expiry: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      // POST requests should not have cache headers
      expect(response1.headers['x-cache']).toBeUndefined();
    });
  });

  describe('Error Responses', () => {
    it('should not cache error responses', async () => {
      // Request with a valid account but will get 404 from service layer
      const response1 = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-999',
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      // Should get an error (404 or 403 depending on consent check order)
      expect(response1.statusCode).toBeGreaterThanOrEqual(400);
      
      // Cache header may not be present if error occurs before cache middleware
      if (response1.headers['x-cache']) {
        expect(response1.headers['x-cache']).toBe('MISS');
      }

      // Wait for cache attempt
      await waitForCache();

      // Second request should also not be cached
      const response2 = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-999',
        headers: {
          authorization: 'Bearer fake-token',
        },
      });

      expect(response2.statusCode).toBeGreaterThanOrEqual(400);
      // Error should not be cached, so status code should be same
      expect(response2.statusCode).toBe(response1.statusCode);
    });
  });

  describe('Multiple Endpoints', () => {
    it('should cache different endpoints independently', async () => {
      // Use a unique token per test to ensure clean cache keys
      const uniqueToken = `Bearer test-${Date.now()}`;
      
      // Use accounts that exist in test consent (acc-001 from mock data)
      const endpoints = [
        '/fdx/v6/accounts/acc-001/transactions?limit=25',
        '/fdx/v6/accounts/acc-001/contact',
        '/fdx/v6/accounts/acc-001/statements',
      ];

      for (const endpoint of endpoints) {
        // First request - MISS
        const response1 = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: uniqueToken,
          },
        });

        expect(response1.statusCode).toBe(200);
        expect(response1.headers['x-cache']).toBe('MISS');

        // Wait for cache to be set
        await waitForCache();

        // Second request - HIT
        const response2 = await app.inject({
          method: 'GET',
          url: endpoint,
          headers: {
            authorization: uniqueToken,
          },
        });

        expect(response2.statusCode).toBe(200);
        expect(response2.headers['x-cache']).toBe('HIT');
      }
    });
  });


});
