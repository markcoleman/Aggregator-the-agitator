import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';

// Mock the JwksVerifier for testing
vi.mock('../../src/infra/auth/jwksVerifier.js', () => ({
  JwksVerifier: vi.fn().mockImplementation(() => ({
    verifyToken: vi.fn().mockResolvedValue({
      sub: 'user-123',
      scope: 'consent:write accounts:read',
      aud: 'fdx-resource-api',
      iss: 'mock-issuer',
      client_id: 'client-456',
    }),
    validateScope: vi.fn(),
    extractUserId: vi.fn().mockReturnValue('user-123'),
  })),
}));

describe('Consent API Integration', () => {
  let app: FastifyInstance;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(async () => {
    app = await createApp();
    await app.ready();
    request = supertest(app.server);
  });

  afterEach(async () => {
    await app.close();
  });

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInNjb3BlIjoiY29uc2VudDp3cml0ZSIsImNsaWVudF9pZCI6ImNsaWVudC00NTYiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6OTk5OTk5OTk5OX0.invalid-signature';

  describe('POST /consent', () => {
    it('should create consent with valid request', async () => {
      const consentData = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test budgeting app',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request
        .post('/consent')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(consentData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'PENDING',
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test budgeting app',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should reject request without authorization', async () => {
      const consentData = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test budgeting app',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      await request
        .post('/consent')
        .send(consentData)
        .expect(401);
    });

    it('should reject invalid request data', async () => {
      const invalidData = {
        subjectId: 'user-123',
        // Missing required fields
      };

      await request
        .post('/consent')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /consent/:consentId', () => {
    it('should get existing consent', async () => {
      const response = await request
        .get('/consent/consent-001')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.id).toBe('consent-001');
      expect(response.body.status).toBeDefined();
    });

    it('should return 404 for non-existent consent', async () => {
      await request
        .get('/consent/non-existent')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);
    });

    it('should reject request without authorization', async () => {
      await request
        .get('/consent/consent-001')
        .expect(401);
    });
  });

  describe('PUT /consent/:consentId', () => {
    it('should update consent with valid action', async () => {
      // First create a consent in PENDING state
      const consentData = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test budgeting app',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      const createResponse = await request
        .post('/consent')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(consentData)
        .expect(201);

      const consentId = createResponse.body.id;

      // Now approve it
      const updateData = {
        action: 'approve',
        reason: 'User approved consent',
      };

      const response = await request
        .put(`/consent/${consentId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');
    });

    it('should reject invalid action', async () => {
      const updateData = {
        action: 'invalid-action',
      };

      await request
        .put('/consent/consent-001')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject request without authorization', async () => {
      const updateData = {
        action: 'approve',
      };

      await request
        .put('/consent/consent-001')
        .send(updateData)
        .expect(401);
    });
  });
});