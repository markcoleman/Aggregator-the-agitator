import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JwksVerifier } from '../../src/infra/auth/jwksVerifier.js';
import { UnauthorizedError, ForbiddenError } from '../../src/shared/errors/index.js';

// Mock the jose library
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
}));

describe('JwksVerifier', () => {
  let jwksVerifier: JwksVerifier;
  
  beforeEach(() => {
    vi.clearAllMocks();
    jwksVerifier = new JwksVerifier('https://example.com/.well-known/jwks.json');
  });

  describe('verifyToken', () => {
    it('should return payload when token is valid', async () => {
      const mockPayload = {
        sub: 'user123',
        scope: 'accounts:read',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: {},
      });

      const result = await jwksVerifier.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
    });

    it('should throw UnauthorizedError when token verification fails', async () => {
      const { jwtVerify } = await import('jose');
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'));

      await expect(jwksVerifier.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedError);
      await expect(jwksVerifier.verifyToken('invalid-token')).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('validateScope', () => {
    it('should not throw when scope is present', () => {
      const payload = {
        sub: 'user123',
        scope: 'accounts:read transactions:read',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      expect(() => jwksVerifier.validateScope(payload, 'accounts:read')).not.toThrow();
    });

    it('should throw ForbiddenError when scope is missing', () => {
      const payload = {
        sub: 'user123',
        scope: 'other:scope',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      expect(() => jwksVerifier.validateScope(payload, 'accounts:read')).toThrow(ForbiddenError);
      expect(() => jwksVerifier.validateScope(payload, 'accounts:read')).toThrow('Insufficient scope. Required: accounts:read');
    });

    it('should throw ForbiddenError when scope claim is undefined', () => {
      const payload = {
        sub: 'user123',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      expect(() => jwksVerifier.validateScope(payload, 'accounts:read')).toThrow(ForbiddenError);
    });
  });

  describe('extractUserId', () => {
    it('should return userId when sub is present', () => {
      const payload = {
        sub: 'user123',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      const result = jwksVerifier.extractUserId(payload);
      expect(result).toBe('user123');
    });

    it('should throw UnauthorizedError when sub is missing', () => {
      const payload = {
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      expect(() => jwksVerifier.extractUserId(payload)).toThrow(UnauthorizedError);
      expect(() => jwksVerifier.extractUserId(payload)).toThrow('Token missing subject claim');
    });
  });
});