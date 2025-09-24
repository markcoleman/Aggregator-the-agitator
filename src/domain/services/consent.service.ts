import {
  Consent,
  ConsentStatus,
  CreateConsentRequest,
  UpdateConsentRequest,
  CreateConsentResponse,
  AuditEntry,
  ConsentCheckInput,
  ConsentCheckResult,
} from '../entities/consent.js';
import { ConsentRepository } from '../../infra/repositories/consent.repo.mock.js';
import { ValidationError, ForbiddenError, ConflictError } from '../../shared/errors/index.js';
import { randomUUID } from 'crypto';

/**
 * Service for managing consent lifecycle and authorization checks.
 * Implements FDX consent management patterns with comprehensive audit trails.
 *
 * @example
 * ```typescript
 * const consentService = new ConsentService(consentRepository);
 *
 * // Create new consent
 * const consent = await consentService.createConsent({
 *   subjectId: 'user-123',
 *   dataScopes: ['accounts:read'],
 *   accountIds: ['acc-001']
 * }, 'client-456');
 *
 * // Check authorization
 * const result = await consentService.check({
 *   subjectId: 'user-123',
 *   clientId: 'client-456',
 *   scopes: ['accounts:read'],
 *   accountIds: ['acc-001']
 * });
 * ```
 */
export class ConsentService {
  constructor(private consentRepository: ConsentRepository) {}

  /**
   * Creates a new consent request in PENDING status.
   *
   * @param request - The consent creation request with scope and account details
   * @param clientId - The client ID making the request
   * @returns Promise resolving to the created consent response
   * @throws {ValidationError} When request data is invalid
   */
  async createConsent(
    request: CreateConsentRequest,
    clientId: string,
  ): Promise<CreateConsentResponse> {
    // Validate request data
    this.validateCreateRequest(request);

    // Create consent in PENDING state
    const now = new Date().toISOString();
    const consentId = randomUUID();

    const consent: Consent = {
      id: consentId,
      subjectId: request.subjectId,
      clientId: request.clientId,
      dataScopes: request.dataScopes,
      accountIds: request.accountIds,
      purpose: request.purpose,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      expiresAt: request.expiry,
      auditTrail: [
        {
          timestamp: now,
          action: 'consent.created',
          actor: clientId,
          actorType: 'client',
          newStatus: 'PENDING',
        },
      ],
    };

    await this.consentRepository.create(consent);

    return {
      id: consent.id,
      status: consent.status as 'PENDING',
      subjectId: consent.subjectId,
      clientId: consent.clientId,
      dataScopes: consent.dataScopes,
      accountIds: consent.accountIds,
      purpose: consent.purpose,
      createdAt: consent.createdAt,
      expiresAt: consent.expiresAt,
    };
  }

  /**
   * Updates consent status through approved state transitions.
   * Validates actor permissions and handles consent lifecycle management.
   *
   * @param consentId - The ID of the consent to update
   * @param request - The update request with action and optional reason
   * @param actorId - The ID of the actor performing the update
   * @param actorType - The type of actor (subject, client, or admin)
   * @returns Promise resolving to the updated consent
   * @throws {ForbiddenError} When actor lacks permission for the action
   * @throws {ConflictError} When consent is expired or invalid state transition
   */
  async updateConsent(
    consentId: string,
    request: UpdateConsentRequest,
    actorId: string,
    actorType: 'subject' | 'client' | 'admin',
  ): Promise<Consent> {
    const consent = await this.consentRepository.findById(consentId);

    // Check if consent has expired
    if (new Date() > new Date(consent.expiresAt)) {
      await this.expireConsent(consent);
      throw new ConflictError('Cannot update expired consent');
    }

    // Validate permissions
    this.validateUpdatePermissions(consent, request.action, actorId, actorType);

    // Validate state transition
    const newStatus = this.getNewStatusForAction(request.action);
    this.validateStateTransition(consent.status, newStatus, request.action);

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: `consent.${request.action}`,
      actor: actorId,
      actorType,
      previousStatus: consent.status,
      newStatus,
      reason: request.reason,
    };

    // Update consent
    const updatedConsent = await this.consentRepository.update(consentId, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    await this.consentRepository.addAuditEntry(consentId, auditEntry);

    return updatedConsent;
  }

  /**
   * Retrieves a consent by ID with access control validation.
   * Automatically expires consent if past expiration date.
   *
   * @param consentId - The ID of the consent to retrieve
   * @param requesterId - The ID of the requester
   * @param requesterType - The type of requester (subject, client, or admin)
   * @returns Promise resolving to the consent
   * @throws {ForbiddenError} When requester lacks access to the consent
   */
  async getConsent(
    consentId: string,
    requesterId: string,
    requesterType: 'subject' | 'client' | 'admin',
  ): Promise<Consent> {
    const consent = await this.consentRepository.findById(consentId);

    // Check if consent has expired
    if (new Date() > new Date(consent.expiresAt)) {
      await this.expireConsent(consent);
    }

    // Validate access permissions
    this.validateGetPermissions(consent, requesterId, requesterType);

    return consent;
  }

  /**
   * Check consent for resource access with detailed result
   * This is the main introspection function for FDX enforcement
   */
  async check(input: ConsentCheckInput): Promise<ConsentCheckResult> {
    try {
      // Validate input parameters
      if (!input.subjectId || !input.clientId || !input.scopes?.length) {
        return {
          allow: false,
          reasons: ['invalid_input'],
        };
      }

      // Find consents for the subject
      const consents = await this.consentRepository.findBySubjectId(input.subjectId);

      if (consents.length === 0) {
        return {
          allow: false,
          reasons: ['no_consent'],
        };
      }

      // Find the best matching consent
      for (const consent of consents) {
        // Check client binding
        if (consent.clientId !== input.clientId) {
          continue;
        }

        // Check consent status
        if (consent.status !== 'ACTIVE') {
          continue;
        }

        // Check expiry
        const checkTime = input.asOf ? new Date(input.asOf) : new Date();
        if (checkTime > new Date(consent.expiresAt)) {
          await this.expireConsent(consent);
          consent.status = 'EXPIRED'; // Update local object to reflect the change
          continue;
        }

        // Check scopes - requested scopes must be subset of consent scopes
        const missingScopes = input.scopes.filter(
          scope => !consent.dataScopes.includes(scope as any),
        );

        if (missingScopes.length > 0) {
          continue;
        }

        // Check account scoping if accountIds provided
        let filteredAccountIds: string[] | undefined;
        if (input.accountIds && input.accountIds.length > 0) {
          filteredAccountIds = input.accountIds.filter(accountId =>
            consent.accountIds.includes(accountId),
          );

          if (filteredAccountIds.length === 0) {
            continue;
          }
        }

        // Log access decision for audit
        await this.logConsentCheck(consent, input, true, filteredAccountIds);

        return {
          allow: true,
          consentId: consent.id,
          expiresAt: consent.expiresAt,
          filteredAccountIds,
        };
      }

      // Log denial for audit
      await this.logConsentCheck(null, input, false);

      // Determine the most specific reason for denial
      const activeConsents = consents.filter(
        c => c.clientId === input.clientId && c.status === 'ACTIVE',
      );
      if (activeConsents.length === 0) {
        const clientConsents = consents.filter(c => c.clientId === input.clientId);
        if (clientConsents.length === 0) {
          return {
            allow: false,
            reasons: ['client_mismatch'],
          };
        } else {
          const statuses = clientConsents.map(c => c.status);
          if (statuses.includes('EXPIRED')) {
            return {
              allow: false,
              reasons: ['expired'],
            };
          } else if (statuses.includes('REVOKED')) {
            return {
              allow: false,
              reasons: ['revoked'],
            };
          } else if (statuses.includes('SUSPENDED')) {
            return {
              allow: false,
              reasons: ['suspended'],
            };
          } else {
            return {
              allow: false,
              reasons: ['not_active'],
            };
          }
        }
      }

      // Check if it's a scope issue
      const scopeMatches = activeConsents.some(consent =>
        input.scopes.every(scope => consent.dataScopes.includes(scope as any)),
      );

      if (!scopeMatches) {
        return {
          allow: false,
          reasons: ['missing_scope'],
        };
      }

      // Must be account scoping issue
      return {
        allow: false,
        reasons: ['not_account_scoped'],
      };
    } catch (error) {
      // Log error for debugging but don't expose details
      console.error('Consent check error:', error);

      await this.logConsentCheck(null, input, false, undefined, 'system_error');

      return {
        allow: false,
        reasons: ['system_error'],
      };
    }
  }

  private async logConsentCheck(
    consent: Consent | null,
    input: ConsentCheckInput,
    allowed: boolean,
    filteredAccountIds?: string[],
    errorReason?: string,
  ): Promise<void> {
    // Create audit entry for the consent check
    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: 'consent.check',
      actor: input.subjectId,
      actorType: 'subject',
      reason: allowed ? 'access_granted' : errorReason || 'access_denied',
    };

    // If we have a consent, add the audit entry to it
    if (consent) {
      await this.consentRepository.addAuditEntry(consent.id, auditEntry);
    }

    // TODO: Add structured logging with correlation ID
    // This would typically go to a separate audit log service
    console.log('Consent check:', {
      subjectId: input.subjectId,
      clientId: input.clientId,
      scopes: input.scopes,
      accountIds: input.accountIds,
      allowed,
      consentId: consent?.id,
      filteredAccountIds,
      timestamp: auditEntry.timestamp,
    });
  }

  async checkConsentForResource(
    subjectId: string,
    clientId: string,
    accountId: string,
    requiredScopes: string[],
  ): Promise<boolean> {
    // Delegate to the new check method for backwards compatibility
    const result = await this.check({
      subjectId,
      clientId,
      scopes: requiredScopes,
      accountIds: [accountId],
    });

    return result.allow;
  }

  private async expireConsent(consent: Consent): Promise<void> {
    if (consent.status === 'EXPIRED') {
      return;
    }

    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: 'consent.expired',
      actor: 'system',
      actorType: 'admin',
      previousStatus: consent.status,
      newStatus: 'EXPIRED',
      reason: 'Consent expiry time reached',
    };

    await this.consentRepository.update(consent.id, {
      status: 'EXPIRED',
      updatedAt: new Date().toISOString(),
    });

    await this.consentRepository.addAuditEntry(consent.id, auditEntry);
  }

  private validateCreateRequest(request: CreateConsentRequest): void {
    // Validate expiry is in the future
    const expiryDate = new Date(request.expiry);
    if (expiryDate <= new Date()) {
      throw new ValidationError('Expiry date must be in the future');
    }

    // Validate expiry is not more than 1 year in the future
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (expiryDate > oneYearFromNow) {
      throw new ValidationError('Expiry date cannot be more than one year in the future');
    }
  }

  private validateUpdatePermissions(
    consent: Consent,
    action: string,
    actorId: string,
    actorType: 'subject' | 'client' | 'admin',
  ): void {
    switch (action) {
      case 'approve':
        if (actorType !== 'subject' || actorId !== consent.subjectId) {
          throw new ForbiddenError('Only the subject can approve consent');
        }
        break;

      case 'revoke':
        if (actorType === 'subject' && actorId !== consent.subjectId) {
          throw new ForbiddenError('Subject can only revoke their own consent');
        } else if (actorType === 'client' && actorId !== consent.clientId) {
          throw new ForbiddenError('Client can only revoke their own consent');
        } else if (actorType !== 'subject' && actorType !== 'client' && actorType !== 'admin') {
          throw new ForbiddenError('Insufficient permissions to revoke consent');
        }
        break;

      case 'suspend':
      case 'resume':
        if (actorType !== 'admin') {
          throw new ForbiddenError('Only admins can suspend/resume consent');
        }
        break;

      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }
  }

  private validateGetPermissions(
    consent: Consent,
    requesterId: string,
    requesterType: 'subject' | 'client' | 'admin',
  ): void {
    switch (requesterType) {
      case 'subject':
        if (requesterId !== consent.subjectId) {
          throw new ForbiddenError('Subject can only access their own consent');
        }
        break;

      case 'client':
        if (requesterId !== consent.clientId) {
          throw new ForbiddenError('Client can only access their own consent');
        }
        break;

      case 'admin':
        // Admins can access any consent
        break;

      default:
        throw new ForbiddenError('Invalid requester type');
    }
  }

  private getNewStatusForAction(action: string): ConsentStatus {
    switch (action) {
      case 'approve':
        return 'ACTIVE';
      case 'suspend':
        return 'SUSPENDED';
      case 'resume':
        return 'ACTIVE';
      case 'revoke':
        return 'REVOKED';
      default:
        throw new ValidationError(`Invalid action: ${action}`);
    }
  }

  private validateStateTransition(
    currentStatus: ConsentStatus,
    newStatus: ConsentStatus,
    action: string,
  ): void {
    const validTransitions: Record<ConsentStatus, ConsentStatus[]> = {
      PENDING: ['ACTIVE', 'REVOKED'],
      ACTIVE: ['SUSPENDED', 'REVOKED'],
      SUSPENDED: ['ACTIVE', 'REVOKED'],
      REVOKED: [], // Terminal state
      EXPIRED: [], // Terminal state
    };

    const allowedNextStates = validTransitions[currentStatus];
    if (!allowedNextStates.includes(newStatus)) {
      throw new ConflictError(
        `Invalid state transition from ${currentStatus} to ${newStatus} via action ${action}`,
      );
    }
  }
}
