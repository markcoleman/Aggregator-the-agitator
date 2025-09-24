import { FastifyRequest } from 'fastify';
import { ConsentService } from '../../domain/services/consent.service.js';
import { ForbiddenError } from '../../shared/errors/index.js';

export class ConsentMiddleware {
  constructor(private consentService: ConsentService) {}

  requireConsent(requiredScopes: string[]) {
    return async (request: FastifyRequest): Promise<void> => {
      if (!request.user) {
        throw new ForbiddenError('Authentication required for consent check');
      }

      const { userId, payload } = request.user;
      const clientId = payload['client_id'] || payload['azp'] || payload['aud'];
      
      // Extract accountId from request params (assumes path like /fdx/v6/accounts/:accountId/...)
      const params = request.params as any;
      const accountId = params.accountId;

      if (!accountId) {
        throw new ForbiddenError('Account ID required for consent verification');
      }

      if (!clientId) {
        throw new ForbiddenError('Client ID not found in token for consent verification');
      }

      const hasConsent = await this.consentService.checkConsentForResource(
        userId,
        clientId as string,
        accountId,
        requiredScopes
      );

      if (!hasConsent) {
        throw new ForbiddenError('No valid consent found for requested resource');
      }
    };
  }
}