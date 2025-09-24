import {
  Consent,
  ConsentStatus,
  CreateConsentRequest,
  UpdateConsentRequest,
  CreateConsentResponse,
  AuditEntry,
} from '../entities/consent.js';
import { ConsentRepository } from '../../infra/repositories/consent.repo.mock.js';
import { ValidationError, ForbiddenError, ConflictError } from '../../shared/errors/index.js';
import { randomUUID } from 'crypto';

export class ConsentService {
  constructor(private consentRepository: ConsentRepository) {}

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

  async checkConsentForResource(
    subjectId: string,
    clientId: string,
    accountId: string,
    requiredScopes: string[],
  ): Promise<boolean> {
    try {
      const consents = await this.consentRepository.findBySubjectId(subjectId);

      for (const consent of consents) {
        // Check if consent matches client and is active
        if (consent.clientId !== clientId || consent.status !== 'ACTIVE') {
          continue;
        }

        // Check if consent has expired
        if (new Date() > new Date(consent.expiresAt)) {
          await this.expireConsent(consent);
          continue;
        }

        // Check if consent covers the required account
        if (!consent.accountIds.includes(accountId)) {
          continue;
        }

        // Check if consent has all required scopes
        const hasAllScopes = requiredScopes.every(scope =>
          consent.dataScopes.includes(scope as any),
        );

        if (hasAllScopes) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // If there's an error checking consent, deny access
      return false;
    }
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
