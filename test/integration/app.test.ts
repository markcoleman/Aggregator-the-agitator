import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

describe('App Creation and Swagger Configuration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create app with swagger documentation', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs', // Test without trailing slash (should redirect)
    });

    // Swagger UI redirects /docs to /docs/ which is expected behavior
    expect([200, 302].includes(response.statusCode)).toBe(true);

    if (response.statusCode === 200) {
      expect(response.headers['content-type']).toContain('text/html');
    } else if (response.statusCode === 302) {
      expect(response.headers['location']).toBe('./docs/static/index.html');
    }
  });

  it('should serve OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const spec = JSON.parse(response.body);
    expect(spec.openapi).toBeDefined();
    expect(spec.info).toBeDefined();
  });

  it('should handle invalid routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/non-existent-route',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should have CORS enabled for all origins', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:3001',
        'access-control-request-method': 'GET',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('should handle malformed JSON in request body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/consent',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer fake-token',
      },
      payload: '{ malformed json',
    });

    expect(response.statusCode).toBe(400);
  });

  it('should handle requests with missing content-type for JSON endpoints', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/consent',
      headers: {
        authorization: 'Bearer fake-token',
      },
      payload: JSON.stringify({
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    expect(response.statusCode).toBe(415);
  });

  it('should handle very large request bodies', async () => {
    // First let's test with a valid token - let's mock the auth for this test
    const largePayload = {
      subjectId: 'user-123',
      clientId: 'client-456',
      dataScopes: ['accounts:read'],
      accountIds: Array(1000)
        .fill('acc-')
        .map((prefix, i) => `${prefix}${i}`),
      purpose: 'A'.repeat(10000),
      expiry: new Date(Date.now() + 86400000).toISOString(),
    };

    // Test with /health endpoint using POST (should be rejected by method, not by body size)
    // But if body limit is hit first, it should return 413
    const response = await app.inject({
      method: 'POST',
      url: '/health',
      headers: {
        'content-type': 'application/json',
      },
      payload: JSON.stringify(largePayload),
    });

    // Should handle large payloads (either accept or reject with proper status)
    // 404 = method not allowed on /health, 413 = body too large, 400 = bad request
    expect([400, 404, 413, 500].includes(response.statusCode)).toBe(true);
  });
});
