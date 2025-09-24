import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthMiddleware } from '../../src/http/middleware/authz.js';
import { UnauthorizedError, ForbiddenError } from '../../src/shared/errors/index.js';

// Mock the JwksVerifier
vi.mock('../../src/infra/auth/jwksVerifier.js', () => ({
  JwksVerifier: vi.fn().mockImplementation(() => ({
    verifyToken: vi.fn(),
    validateScope: vi.fn(),
    extractUserId: vi.fn(),
  })),
}));

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
    mockRequest = {
      headers: {},
    };
    mockReply = {};
  });

  describe('authenticate', () => {
    it('should throw error when Authorization header is missing', async () => {
      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(UnauthorizedError);
      
      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow('Authorization header required');
    });

    it('should throw error when Authorization header is malformed', async () => {
      mockRequest.headers = { authorization: 'InvalidHeader' };

      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(UnauthorizedError);
      
      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow('Authorization header required');
    });

    it('should set user when token is valid', async () => {
      const mockPayload = {
        sub: 'user123',
        scope: 'accounts:read',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      
      // Mock the JwksVerifier methods
      const mockJwksVerifier = (authMiddleware as any).jwksVerifier;
      mockJwksVerifier.verifyToken.mockResolvedValue(mockPayload);
      mockJwksVerifier.extractUserId.mockReturnValue('user123');

      await authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('user123');
      expect(mockRequest.user?.payload).toEqual(mockPayload);
    });

    it('should throw error when token verification fails', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      
      const mockJwksVerifier = (authMiddleware as any).jwksVerifier;
      mockJwksVerifier.verifyToken.mockRejectedValue(new UnauthorizedError('Invalid token'));

      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw generic error when unexpected error occurs', async () => {
      mockRequest.headers = { authorization: 'Bearer some-token' };
      
      const mockJwksVerifier = (authMiddleware as any).jwksVerifier;
      mockJwksVerifier.verifyToken.mockRejectedValue(new Error('Unexpected error'));

      await expect(
        authMiddleware.authenticate(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow('Token validation failed');
    });
  });

  describe('requireScope', () => {
    it('should throw error when user is not authenticated', async () => {
      const scopeMiddleware = authMiddleware.requireScope('accounts:read');

      await expect(
        scopeMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow('Authentication required');
    });

    it('should validate scope when user is authenticated', async () => {
      const mockPayload = {
        sub: 'user123',
        scope: 'accounts:read',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      mockRequest.user = {
        userId: 'user123',
        payload: mockPayload,
      };

      const mockJwksVerifier = (authMiddleware as any).jwksVerifier;
      mockJwksVerifier.validateScope.mockImplementation(() => {
        // Mock successful validation
      });

      const scopeMiddleware = authMiddleware.requireScope('accounts:read');
      
      await expect(
        scopeMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).resolves.not.toThrow();

      expect(mockJwksVerifier.validateScope).toHaveBeenCalledWith(mockPayload, 'accounts:read');
    });

    it('should throw error when scope validation fails', async () => {
      const mockPayload = {
        sub: 'user123',
        scope: 'other:scope',
        aud: 'fdx-resource-api',
        iss: 'mock-issuer',
      };

      mockRequest.user = {
        userId: 'user123',
        payload: mockPayload,
      };

      const mockJwksVerifier = (authMiddleware as any).jwksVerifier;
      mockJwksVerifier.validateScope.mockImplementation(() => {
        throw new ForbiddenError('Insufficient scope');
      });

      const scopeMiddleware = authMiddleware.requireScope('accounts:read');

      await expect(
        scopeMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});