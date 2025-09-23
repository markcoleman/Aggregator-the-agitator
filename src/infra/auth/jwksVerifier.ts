import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { appConfig } from '../../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';

export interface JwtPayload extends JWTPayload {
  sub: string;
  scope?: string;
  aud: string | string[];
  iss: string;
}

export class JwksVerifier {
  private jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(jwksUri: string) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: appConfig.jwtConfig.issuer,
        audience: appConfig.jwtConfig.audience,
      });

      return payload as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  validateScope(payload: JwtPayload, requiredScope: string): void {
    const scopes = payload.scope?.split(' ') || [];

    if (!scopes.includes(requiredScope)) {
      throw new ForbiddenError(`Insufficient scope. Required: ${requiredScope}`);
    }
  }

  extractUserId(payload: JwtPayload): string {
    if (!payload.sub) {
      throw new UnauthorizedError('Token missing subject claim');
    }
    return payload.sub;
  }
}
