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
      await expect(middleware(mockRequest)).rejects.toThrow(
        'Consent denied: authentication_required',
      );
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

    it('should handle request without params (no accountId)', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: {},
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: true,
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await middleware(mockRequest);

      expect(mockConsentService.check).toHaveBeenCalledWith({
        subjectId: 'user-123',
        clientId: 'client-456',
        scopes: ['accounts:read'],
        accountIds: undefined,
      });
    });

    it('should map error codes correctly', async () => {
      const errorCases = [
        { reason: 'missing_scope', expectedCode: 'INSUFFICIENT_SCOPE' },
        { reason: 'expired', expectedCode: 'CONSENT_EXPIRED' },
        { reason: 'revoked', expectedCode: 'CONSENT_REVOKED' },
        { reason: 'suspended', expectedCode: 'CONSENT_SUSPENDED' },
        { reason: 'not_account_scoped', expectedCode: 'ACCOUNT_NOT_PERMITTED' },
        { reason: 'client_mismatch', expectedCode: 'CLIENT_MISMATCH' },
        { reason: 'no_consent', expectedCode: 'NO_CONSENT_FOUND' },
        { reason: 'system_error', expectedCode: 'SYSTEM_ERROR' },
        { reason: 'unknown_reason', expectedCode: 'CONSENT_DENIED' },
      ];

      for (const { reason, expectedCode } of errorCases) {
        const mockRequest = {
          user: {
            userId: 'user-123',
            payload: { client_id: 'client-456' },
          },
          params: { accountId: 'acc-001' },
        } as any;

        vi.mocked(mockConsentService.check).mockResolvedValue({
          allow: false,
          reasons: [reason],
        });

        const middleware = consentMiddleware.requireConsent(['accounts:read']);

        try {
          await middleware(mockRequest);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenError);
          expect((error as ForbiddenError).code).toBe(expectedCode);
        }
      }
    });

    it('should handle empty reasons array', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: false,
        reasons: [],
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      try {
        await middleware(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).code).toBe('CONSENT_DENIED');
        expect((error as ForbiddenError).message).toBe('Consent denied: unknown');
      }
    });

    it('should handle undefined reasons', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.check).mockResolvedValue({
        allow: false,
        reasons: undefined,
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      try {
        await middleware(mockRequest);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).code).toBe('CONSENT_DENIED');
        expect((error as ForbiddenError).message).toBe('Consent denied: unknown');
      }
    });

    it('should not store filtered account IDs if not provided', async () => {
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
        filteredAccountIds: undefined,
      });

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await middleware(mockRequest);

      expect((mockRequest as any).consentFilteredAccountIds).toBeUndefined();
      expect((mockRequest as any).consentInfo).toEqual({
        consentId: 'consent-123',
        expiresAt: '2024-12-31T23:59:59.000Z',
      });
    });
  });

  describe('requireConsentForAccount (legacy method)', () => {
    it('should work as alias for requireConsent', async () => {
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

      const middleware = consentMiddleware.requireConsentForAccount(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.check).toHaveBeenCalledWith({
        subjectId: 'user-123',
        clientId: 'client-456',
        scopes: ['accounts:read'],
        accountIds: ['acc-001'],
      });
    });
  });

  describe('performConsentCheck', () => {
    it('should return authentication_required when user is not present', async () => {
      const mockRequest = {
        user: undefined,
        params: {},
      } as any;

      const result = await consentMiddleware.performConsentCheck(mockRequest, ['accounts:read']);

      expect(result).toEqual({
        allow: false,
        reasons: ['authentication_required'],
      });
    });

    it('should return client_id_missing when clientId cannot be extracted', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: {},
        },
        params: {},
      } as any;

      const result = await consentMiddleware.performConsentCheck(mockRequest, ['accounts:read']);

      expect(result).toEqual({
        allow: false,
        reasons: ['client_id_missing'],
      });
    });
  });
});
