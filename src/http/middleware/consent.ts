import { FastifyRequest } from 'fastify';
import { ConsentService } from '../../domain/services/consent.service.js';
import { ForbiddenError } from '../../shared/errors/index.js';
import { ConsentCheckInput, ConsentCheckResult } from '../../domain/entities/consent.js';

export class ConsentMiddleware {
  constructor(private consentService: ConsentService) {}

  /**
   * Create a preHandler that requires consent for the specified scopes
   */
  requireConsent(requiredScopes: string[]) {
    return async (request: FastifyRequest): Promise<void> => {
      const checkResult = await this.performConsentCheck(request, requiredScopes);

      if (!checkResult.allow) {
        const errorCode = this.getErrorCodeFromReasons(checkResult.reasons);
        throw new ForbiddenError(
          `Consent denied: ${checkResult.reasons?.join(', ') || 'unknown'}`,
          {
            code: errorCode,
            details: checkResult.reasons || [],
          },
        );
      }

      // Store filtered account IDs in request for data minimization
      if (checkResult.filteredAccountIds) {
        (request as any).consentFilteredAccountIds = checkResult.filteredAccountIds;
      }

      // Store consent info for potential audit correlation
      (request as any).consentInfo = {
        consentId: checkResult.consentId,
        expiresAt: checkResult.expiresAt,
      };
    };
  }

  /**
   * Perform consent check with detailed results
   */
  async performConsentCheck(
    request: FastifyRequest,
    requiredScopes: string[],
  ): Promise<ConsentCheckResult> {
    if (!request.user) {
      return {
        allow: false,
        reasons: ['authentication_required'],
      };
    }

    const { userId, payload } = request.user;
    const clientId = payload['client_id'] || payload['azp'] || payload['aud'];

    if (!clientId) {
      return {
        allow: false,
        reasons: ['client_id_missing'],
      };
    }

    // Extract accountId(s) from request params
    const params = request.params as any;
    const accountIds: string[] = [];

    if (params.accountId) {
      accountIds.push(params.accountId);
    }

    const checkInput: ConsentCheckInput = {
      subjectId: userId,
      clientId: clientId as string,
      scopes: requiredScopes,
      accountIds: accountIds.length > 0 ? accountIds : undefined,
    };

    return await this.consentService.check(checkInput);
  }

  /**
   * Map consent denial reasons to standardized error codes
   */
  private getErrorCodeFromReasons(reasons?: string[]): string {
    if (!reasons || reasons.length === 0) {
      return 'CONSENT_DENIED';
    }

    const primaryReason = reasons[0];
    switch (primaryReason) {
      case 'missing_scope':
        return 'INSUFFICIENT_SCOPE';
      case 'expired':
        return 'CONSENT_EXPIRED';
      case 'revoked':
        return 'CONSENT_REVOKED';
      case 'suspended':
        return 'CONSENT_SUSPENDED';
      case 'not_account_scoped':
        return 'ACCOUNT_NOT_PERMITTED';
      case 'client_mismatch':
        return 'CLIENT_MISMATCH';
      case 'no_consent':
        return 'NO_CONSENT_FOUND';
      case 'authentication_required':
        return 'AUTHENTICATION_REQUIRED';
      case 'client_id_missing':
        return 'CLIENT_ID_MISSING';
      case 'system_error':
        return 'SYSTEM_ERROR';
      default:
        return 'CONSENT_DENIED';
    }
  }

  /**
   * Legacy method for backwards compatibility
   */
  requireConsentForAccount(requiredScopes: string[]) {
    return this.requireConsent(requiredScopes);
  }
}
