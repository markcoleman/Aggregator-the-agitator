import { Consent, AuditEntry } from '../../domain/entities/consent.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface ConsentRepository {
  create(consent: Consent): Promise<Consent>;
  findById(id: string): Promise<Consent>;
  update(id: string, updates: Partial<Consent>): Promise<Consent>;
  addAuditEntry(id: string, auditEntry: AuditEntry): Promise<void>;
  findBySubjectId(subjectId: string): Promise<Consent[]>;
  findByClientId(clientId: string): Promise<Consent[]>;
}

export class MockConsentRepository implements ConsentRepository {
  private consents: Map<string, Consent> = new Map();

  async create(consent: Consent): Promise<Consent> {
    this.consents.set(consent.id, consent);
    return consent;
  }

  async findById(id: string): Promise<Consent> {
    const consent = this.consents.get(id);
    if (!consent) {
      throw new NotFoundError(`Consent with ID ${id} not found`);
    }
    return consent;
  }

  async update(id: string, updates: Partial<Consent>): Promise<Consent> {
    const consent = await this.findById(id);
    const updatedConsent = { ...consent, ...updates };
    this.consents.set(id, updatedConsent);
    return updatedConsent;
  }

  async addAuditEntry(id: string, auditEntry: AuditEntry): Promise<void> {
    const consent = await this.findById(id);
    if (!consent) {
      throw new Error(`Consent not found: ${id}`);
    }
    consent.auditTrail.push(auditEntry);
    this.consents.set(id, consent);
  }

  async findBySubjectId(subjectId: string): Promise<Consent[]> {
    return Array.from(this.consents.values()).filter(consent => consent.subjectId === subjectId);
  }

  async findByClientId(clientId: string): Promise<Consent[]> {
    return Array.from(this.consents.values()).filter(consent => consent.clientId === clientId);
  }

  // Helper methods for testing
  clear(): void {
    this.consents.clear();
  }

  seedTestData(): void {
    const testConsent: Consent = {
      id: 'consent-001',
      subjectId: 'user-123', // Match the mock user from integration tests
      clientId: 'client-456', // Match the mock client from integration tests
      dataScopes: [
        'accounts:read',
        'transactions:read',
        'contact:read',
        'payment_networks:read',
        'statements:read',
      ],
      accountIds: ['acc-001', 'acc-002'],
      purpose: 'Account aggregation for budgeting app',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T10:00:00.000Z',
      expiresAt: '2025-12-31T23:59:59.999Z', // Set to future date
      auditTrail: [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          action: 'consent.created',
          actor: 'client-456', // Match mock client
          actorType: 'client',
          newStatus: 'PENDING',
        },
        {
          timestamp: '2024-01-01T10:00:00.000Z',
          action: 'consent.approved',
          actor: 'user-123', // Match mock user
          actorType: 'subject',
          previousStatus: 'PENDING',
          newStatus: 'ACTIVE',
        },
      ],
    };

    this.consents.set(testConsent.id, testConsent);
  }
}
