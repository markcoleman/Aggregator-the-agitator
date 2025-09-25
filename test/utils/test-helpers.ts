import { randomUUID } from 'crypto';
import { vi } from 'vitest';

/**
 * Test utilities for consent API testing
 * Provides factory functions, mock data generators, and test helpers
 */

export interface TestUser {
  id: string;
  clientId: string;
  scopes: string[];
  type: 'subject' | 'client' | 'admin';
}

export interface TestConsent {
  subjectId: string;
  clientId: string;
  dataScopes: string[];
  accountIds: string[];
  purpose: string;
  expiry: string;
}

/**
 * Factory for creating test users with different permissions
 */
export class TestUserFactory {
  static createSubject(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: `user-${randomUUID().substring(0, 8)}`,
      clientId: `client-${randomUUID().substring(0, 8)}`,
      scopes: ['consent:write', 'accounts:read', 'transactions:read'],
      type: 'subject',
      ...overrides,
    };
  }

  static createClient(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: `client-${randomUUID().substring(0, 8)}`,
      clientId: `client-${randomUUID().substring(0, 8)}`,
      scopes: ['consent:write'],
      type: 'client',
      ...overrides,
    };
  }

  static createAdmin(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: `admin-${randomUUID().substring(0, 8)}`,
      clientId: `admin-client-${randomUUID().substring(0, 8)}`,
      scopes: ['admin', 'consent:write', 'accounts:read'],
      type: 'admin',
      ...overrides,
    };
  }

  static createUserWithoutPermissions(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: `user-${randomUUID().substring(0, 8)}`,
      clientId: `client-${randomUUID().substring(0, 8)}`,
      scopes: [], // No permissions
      type: 'subject',
      ...overrides,
    };
  }
}

/**
 * Factory for creating test consent data
 */
export class TestConsentFactory {
  static createValid(overrides: Partial<TestConsent> = {}): TestConsent {
    return {
      subjectId: `user-${randomUUID().substring(0, 8)}`,
      clientId: `client-${randomUUID().substring(0, 8)}`,
      dataScopes: ['accounts:read'],
      accountIds: [`acc-${randomUUID().substring(0, 8)}`],
      purpose: 'Test financial application for budget management',
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      ...overrides,
    };
  }

  static createWithMultipleScopes(overrides: Partial<TestConsent> = {}): TestConsent {
    return this.createValid({
      dataScopes: ['accounts:read', 'transactions:read', 'statements:read'],
      accountIds: [`acc-001`, `acc-002`, `acc-003`],
      purpose: 'Comprehensive financial analysis platform',
      ...overrides,
    });
  }

  static createWithSingleAccount(accountId: string, overrides: Partial<TestConsent> = {}): TestConsent {
    return this.createValid({
      accountIds: [accountId],
      ...overrides,
    });
  }

  static createNearExpiry(minutesFromNow: number = 5, overrides: Partial<TestConsent> = {}): TestConsent {
    return this.createValid({
      expiry: new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString(),
      ...overrides,
    });
  }

  static createMaxExpiry(overrides: Partial<TestConsent> = {}): TestConsent {
    return this.createValid({
      expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      ...overrides,
    });
  }

  static createInvalid(): Partial<TestConsent>[] {
    const base = this.createValid();
    return [
      { ...base, subjectId: '' }, // Empty subject ID
      { ...base, clientId: '' }, // Empty client ID
      { ...base, dataScopes: [] }, // Empty scopes
      { ...base, accountIds: [] }, // Empty accounts
      { ...base, purpose: '' }, // Empty purpose
      { ...base, expiry: 'invalid-date' }, // Invalid date
      { ...base, expiry: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }, // Past date
      { ...base, expiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString() }, // Too far future
      { ...base, dataScopes: ['invalid:scope'] }, // Invalid scope
      { ...base, purpose: 'A'.repeat(10000) }, // Too long purpose
    ];
  }
}

/**
 * JWT Token generator for testing
 */
export class TestTokenFactory {
  static createTokenPayload(user: TestUser, overrides: any = {}) {
    const base = {
      aud: 'fdx-resource-api',
      iss: 'mock-issuer',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      scope: user.scopes.join(' '),
      ...overrides,
    };

    if (user.type === 'subject') {
      return {
        ...base,
        sub: user.id,
        client_id: user.clientId,
      };
    } else if (user.type === 'client') {
      return {
        ...base,
        client_id: user.clientId,
      };
    } else if (user.type === 'admin') {
      return {
        ...base,
        sub: user.id,
        client_id: user.clientId,
      };
    }

    return base;
  }

  static createExpiredToken(user: TestUser) {
    return this.createTokenPayload(user, {
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    });
  }

  static createTokenWithoutScope(user: TestUser) {
    return this.createTokenPayload({
      ...user,
      scopes: [],
    });
  }

  static createMockTokenString(payload: any): string {
    // Create a mock JWT-like string for testing (not a real JWT)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${payloadStr}.mock-signature`;
  }
}

/**
 * Test assertion helpers
 */
export class TestAssertions {
  static expectValidConsentResponse(response: any, expectedData: Partial<TestConsent>) {
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      status: 'PENDING',
      ...expectedData,
    });
    expect(response.body.id).toMatch(/^[0-9a-f-]+$/);
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
    expect(response.body.expiresAt).toBeDefined();
    expect(response.body.auditTrail).toHaveLength(1);
    expect(response.body.auditTrail[0].action).toBe('consent.created');
  }

  static expectValidAuditEntry(entry: any, expectedValues: {
    action: string;
    actor: string;
    actorType: string;
    reason?: string;
    previousStatus?: string;
    newStatus?: string;
  }) {
    expect(entry.timestamp).toBeDefined();
    expect(entry.action).toBe(expectedValues.action);
    expect(entry.actor).toBe(expectedValues.actor);
    expect(entry.actorType).toBe(expectedValues.actorType);
    
    if (expectedValues.reason) {
      expect(entry.reason).toBe(expectedValues.reason);
    }
    
    if (expectedValues.previousStatus) {
      expect(entry.previousStatus).toBe(expectedValues.previousStatus);
    }
    
    if (expectedValues.newStatus) {
      expect(entry.newStatus).toBe(expectedValues.newStatus);
    }
  }

  static expectErrorResponse(response: any, expectedCode: number, expectedErrorCode?: string) {
    expect(response.status).toBe(expectedCode);
    
    if (expectedErrorCode) {
      expect(response.body.code).toBe(expectedErrorCode);
    }
    
    expect(response.body.message).toBeDefined();
  }
}

/**
 * Test data cleanup utilities
 */
export class TestCleanup {
  private static createdConsents: string[] = [];

  static trackConsent(consentId: string) {
    this.createdConsents.push(consentId);
  }

  static getTrackedConsents(): string[] {
    return [...this.createdConsents];
  }

  static clearTrackedConsents() {
    this.createdConsents = [];
  }
}

/**
 * Wait utilities for testing async operations
 */
export class TestWait {
  static async forTimeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async forCondition(
    condition: () => boolean | Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      if (await condition()) {
        return;
      }
      await this.forTimeout(intervalMs);
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }
}

/**
 * Mock server response utilities
 */
export class TestMockHelpers {
  static createJwksVerifierMock(userClaims: any) {
    return {
      verifyToken: vi.fn().mockResolvedValue(userClaims),
      validateScope: vi.fn(),
      extractUserId: vi.fn().mockReturnValue(userClaims.sub || userClaims.client_id),
    };
  }

  static createAuthMiddlewareMock(user: TestUser) {
    return {
      authenticate: vi.fn().mockImplementation(async (request: any, reply: any, done: any) => {
        request.user = {
          userId: user.id,
          payload: TestTokenFactory.createTokenPayload(user),
        };
        done();
      }),
      requireScope: vi.fn().mockImplementation((requiredScope: string) => 
        async (request: any, reply: any, done: any) => {
          if (!user.scopes.includes(requiredScope)) {
            reply.code(403).send({ code: 'INSUFFICIENT_SCOPE', message: 'Insufficient scope' });
            return;
          }
          done();
        }
      ),
    };
  }
}

/**
 * Performance testing utilities
 */
export class TestPerformance {
  static async measureResponseTime(operation: () => Promise<any>): Promise<{ result: any; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static expectResponseTimeUnder(duration: number, maxMs: number) {
    expect(duration).toBeLessThan(maxMs);
  }
}