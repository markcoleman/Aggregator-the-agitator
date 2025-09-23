import { FastifyRequest, FastifyReply } from 'fastify';
import { JwksVerifier, JwtPayload } from '../../infra/auth/jwksVerifier.js';
import { appConfig } from '../../config/index.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      payload: JwtPayload;
    };
  }
}

export class AuthMiddleware {
  private jwksVerifier: JwksVerifier;

  constructor() {
    this.jwksVerifier = new JwksVerifier(appConfig.jwtConfig.jwksUri);
  }

  async authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = await this.jwksVerifier.verifyToken(token);
      const userId = this.jwksVerifier.extractUserId(payload);

      request.user = {
        userId,
        payload,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Token validation failed');
    }
  }

  requireScope(scope: string) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      if (!request.user) {
        throw new UnauthorizedError('Authentication required');
      }

      this.jwksVerifier.validateScope(request.user.payload, scope);
    };
  }
}
