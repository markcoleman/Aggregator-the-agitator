import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentMiddleware } from '../../src/http/middleware/consent.js';
import { ConsentService } from '../../src/domain/services/consent.service.js';
import { ForbiddenError } from '../../src/shared/errors/index.js';

describe('ConsentMiddleware', () => {
  let consentMiddleware: ConsentMiddleware;
  let mockConsentService: ConsentService;

  beforeEach(() => {
    mockConsentService = {
      check: vi.fn(),
      checkConsentForResource: vi.fn(), // Keep for backwards compatibility
    } as any;
    consentMiddleware = new ConsentMiddleware(mockConsentService);
  });

  describe('requireConsent', () => {
    it('should throw error if user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
      } as any;

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).rejects.toThrow(ForbiddenError);
      await expect(middleware(mockRequest)).rejects.toThrow('Consent denied: authentication_required');
    });

    it('should throw error if clientId is missing from token', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: {},
        },
        params: { accountId: 'acc-001' },
      } as any;

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).rejects.toThrow(ForbiddenError);
      await expect(middleware(mockRequest)).rejects.toThrow('Consent denied: client_id_missing');
    });

    it('should throw error if no valid consent found', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: false,
        reasons: ['no_consent'],
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).rejects.toThrow(ForbiddenError);
      await expect(middleware(mockRequest)).rejects.toThrow('Consent denied: no_consent');
    });

    it('should pass if valid consent found', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: true,
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.check).toHaveBeenCalledWith({
        subjectId: 'user-123',
        clientId: 'client-456',
        scopes: ['accounts:read'],
        accountIds: ['acc-001'],
      });
    });

    it('should use azp from token if client_id is not available', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { azp: 'client-789' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: true,
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.check).toHaveBeenCalledWith({
        subjectId: 'user-123',
        clientId: 'client-789',
        scopes: ['accounts:read'],
        accountIds: ['acc-001'],
      });
    });

    it('should use aud from token if client_id and azp are not available', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { aud: 'client-999' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: true,
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.check).toHaveBeenCalledWith({
        subjectId: 'user-123',
        clientId: 'client-999',
        scopes: ['accounts:read'],
        accountIds: ['acc-001'],
      });
    });

    it('should store filtered account IDs and consent info in request', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: true,
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
        filteredAccountIds: ['acc-001'],
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await middleware(mockRequest);

      expect((mockRequest as any).consentFilteredAccountIds).toEqual(['acc-001']);
      expect((mockRequest as any).consentInfo).toEqual({
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });
    });
  });
});