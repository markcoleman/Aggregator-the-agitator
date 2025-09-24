import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsentMiddleware } from '../../src/http/middleware/consent.js';
import { ConsentService } from '../../src/domain/services/consent.service.js';
import { ForbiddenError } from '../../src/shared/errors/index.js';

describe('ConsentMiddleware', () => {
  let consentMiddleware: ConsentMiddleware;
  let mockConsentService: ConsentService;

  beforeEach(() => {
    mockConsentService = {
      checkConsentForResource: vi.fn(),
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
      await expect(middleware(mockRequest)).rejects.toThrow('Authentication required for consent check');
    });

    it('should throw error if accountId is missing from params', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: {},
      } as any;

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).rejects.toThrow(ForbiddenError);
      await expect(middleware(mockRequest)).rejects.toThrow('Account ID required for consent verification');
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
      await expect(middleware(mockRequest)).rejects.toThrow('Client ID not found in token for consent verification');
    });

    it('should throw error if no valid consent found', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.checkConsentForResource).mockResolvedValue(false);

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).rejects.toThrow(ForbiddenError);
      await expect(middleware(mockRequest)).rejects.toThrow('No valid consent found for requested resource');

      expect(mockConsentService.checkConsentForResource).toHaveBeenCalledWith(
        'user-123',
        'client-456',
        'acc-001',
        ['accounts:read']
      );
    });

    it('should pass if valid consent found', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { client_id: 'client-456' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.checkConsentForResource).mockResolvedValue(true);

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.checkConsentForResource).toHaveBeenCalledWith(
        'user-123',
        'client-456',
        'acc-001',
        ['accounts:read']
      );
    });

    it('should use azp from token if client_id is not available', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { azp: 'client-789' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.checkConsentForResource).mockResolvedValue(true);

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.checkConsentForResource).toHaveBeenCalledWith(
        'user-123',
        'client-789',
        'acc-001',
        ['accounts:read']
      );
    });

    it('should use aud from token if client_id and azp are not available', async () => {
      const mockRequest = {
        user: {
          userId: 'user-123',
          payload: { aud: 'client-999' },
        },
        params: { accountId: 'acc-001' },
      } as any;

      vi.mocked(mockConsentService.checkConsentForResource).mockResolvedValue(true);

      const middleware = consentMiddleware.requireConsent(['accounts:read']);

      await expect(middleware(mockRequest)).resolves.toBeUndefined();

      expect(mockConsentService.checkConsentForResource).toHaveBeenCalledWith(
        'user-123',
        'client-999',
        'acc-001',
        ['accounts:read']
      );
    });
  });
});