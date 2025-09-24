import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentService } from '../../src/domain/services/consent.service.js';
import { MockConsentRepository } from '../../src/infra/repositories/consent.repo.mock.js';
import { ValidationError, ForbiddenError, ConflictError } from '../../src/shared/errors/index.js';

describe('ConsentService', () => {
  let consentService: ConsentService;
  let mockRepository: MockConsentRepository;

  beforeEach(() => {
    mockRepository = new MockConsentRepository();
    consentService = new ConsentService(mockRepository);
  });

  describe('createConsent', () => {
    it('should create consent in PENDING state', async () => {
      const request = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      };

      const result = await consentService.createConsent(request, 'client-456');

      expect(result).toMatchObject({
        status: 'PENDING',
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
      });
      expect(result.id).toBeDefined();
    });

    it('should reject consent with past expiry date', async () => {
      const request = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      };

      await expect(consentService.createConsent(request, 'client-456'))
        .rejects.toThrow(ValidationError);
    });

    it('should reject consent with expiry more than 1 year in future', async () => {
      const request = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() + 400 * 86400000).toISOString(), // 400 days from now
      };

      await expect(consentService.createConsent(request, 'client-456'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateConsent', () => {
    it('should approve consent by subject', async () => {
      // Create a consent first
      const createRequest = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      const created = await consentService.createConsent(createRequest, 'client-456');

      // Approve it
      const updateRequest = {
        action: 'approve' as const,
        reason: 'User approved',
      };

      const result = await consentService.updateConsent(
        created.id,
        updateRequest,
        'user-123',
        'subject'
      );

      expect(result.status).toBe('ACTIVE');
    });

    it('should prevent non-subject from approving consent', async () => {
      // Create a consent first
      const createRequest = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      const created = await consentService.createConsent(createRequest, 'client-456');

      // Try to approve as different user
      const updateRequest = {
        action: 'approve' as const,
      };

      await expect(
        consentService.updateConsent(created.id, updateRequest, 'user-456', 'subject')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate state transitions', async () => {
      // Create a consent first
      const createRequest = {
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'] as const,
        accountIds: ['acc-001'],
        purpose: 'Test purpose',
        expiry: new Date(Date.now() + 86400000).toISOString(),
      };

      const created = await consentService.createConsent(createRequest, 'client-456');

      // Try to suspend from PENDING (invalid transition)
      const updateRequest = {
        action: 'suspend' as const,
      };

      await expect(
        consentService.updateConsent(created.id, updateRequest, 'admin-123', 'admin')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getConsent', () => {
    it('should allow subject to get their own consent', async () => {
      mockRepository.seedTestData();

      const result = await consentService.getConsent('consent-001', 'user-123', 'subject');

      expect(result.id).toBe('consent-001');
      expect(result.subjectId).toBe('user-123');
    });

    it('should prevent subject from getting others consent', async () => {
      mockRepository.seedTestData();

      await expect(
        consentService.getConsent('consent-001', 'user-456', 'subject')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow admin to get any consent', async () => {
      mockRepository.seedTestData();

      const result = await consentService.getConsent('consent-001', 'admin-123', 'admin');

      expect(result.id).toBe('consent-001');
    });
  });

  describe('checkConsentForResource', () => {
    it('should return true for valid active consent', async () => {
      mockRepository.seedTestData();

      const hasConsent = await consentService.checkConsentForResource(
        'user-123',
        'client-456',
        'acc-001',
        ['accounts:read']
      );

      expect(hasConsent).toBe(true);
    });

    it('should return false for missing scope', async () => {
      mockRepository.seedTestData();

      const hasConsent = await consentService.checkConsentForResource(
        'user-123',
        'client-456',
        'acc-001',
        ['statements:read']
      );

      expect(hasConsent).toBe(false);
    });

    it('should return false for wrong account', async () => {
      mockRepository.seedTestData();

      const hasConsent = await consentService.checkConsentForResource(
        'user-123',
        'client-456',
        'acc-999',
        ['accounts:read']
      );

      expect(hasConsent).toBe(false);
    });

    it('should return false for wrong client', async () => {
      mockRepository.seedTestData();

      const hasConsent = await consentService.checkConsentForResource(
        'user-123',
        'client-999',
        'acc-001',
        ['accounts:read']
      );

      expect(hasConsent).toBe(false);
    });
  });
});