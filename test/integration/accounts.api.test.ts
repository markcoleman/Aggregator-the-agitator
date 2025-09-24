import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app.js';

// Mock the JwksVerifier for testing
vi.mock('../../src/infra/auth/jwksVerifier.js', () => ({
  JwksVerifier: vi.fn().mockImplementation(() => ({
    verifyToken: vi.fn().mockResolvedValue({
      sub: 'user-123', // Match the test consent subject
      scope: 'accounts:read transactions:read contact:read payment_networks:read statements:read',
      client_id: 'client-456', // Match the test consent client
      aud: 'fdx-resource-api',
      iss: 'mock-issuer',
    }),
    validateScope: vi.fn(),
    extractUserId: vi.fn().mockReturnValue('user-123'), // Match the test consent subject
  })),
}));

describe('Accounts API Integration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /fdx/v6/accounts', () => {
    it('should return accounts with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.accounts).toBeDefined();
      expect(body.pagination).toBeDefined();
      expect(Array.isArray(body.accounts)).toBe(true);
    });

    it('should return 401 without authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts',
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should handle pagination parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts?limit=2&offset=1',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.offset).toBe(1);
    });
  });

  describe('GET /fdx/v6/accounts/:accountId', () => {
    it('should return account details with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.accountId).toBe('acc-001');
      expect(body.accountType).toBeDefined();
      expect(body.balance).toBeDefined();
    });

    it('should return 403 for non-existent account (consent check first)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/non-existent',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(403);
      
      const body = JSON.parse(response.body);
      expect(body.code).toBe('ACCOUNT_NOT_PERMITTED');
    });
  });

  describe('GET /fdx/v6/accounts/:accountId/transactions', () => {
    it('should return transactions with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/transactions',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.transactions).toBeDefined();
      expect(body.pagination).toBeDefined();
      expect(Array.isArray(body.transactions)).toBe(true);
    });

    it('should handle date filtering', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/transactions?fromDate=2024-01-01&toDate=2024-01-31',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.transactions).toBeDefined();
    });
  });

  describe('GET /fdx/v6/accounts/:accountId/contact', () => {
    it('should return contact information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/contact',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.name).toBeDefined();
    });
  });

  describe('GET /fdx/v6/accounts/:accountId/payment-networks', () => {
    it('should return payment networks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/payment-networks',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.paymentNetworks).toBeDefined();
      expect(Array.isArray(body.paymentNetworks)).toBe(true);
    });
  });

  describe('GET /fdx/v6/accounts/:accountId/statements', () => {
    it('should return statements', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/statements',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.statements).toBeDefined();
      expect(body.pagination).toBeDefined();
      expect(Array.isArray(body.statements)).toBe(true);
    });
  });

  describe('GET /fdx/v6/accounts/:accountId/statements/:statementId', () => {
    it('should return statement details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fdx/v6/accounts/acc-001/statements/stmt-001',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.statementId).toBe('stmt-001');
      expect(body.accountId).toBe('acc-001');
    });
  });
});