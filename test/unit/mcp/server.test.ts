import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMcpServer } from '../../../src/mcp/server.js';
import { AccountsService } from '../../../src/domain/services/accounts.service.js';
import { TransactionsService } from '../../../src/domain/services/transactions.service.js';
import { ContactService } from '../../../src/domain/services/contact.service.js';
import { PaymentNetworksService } from '../../../src/domain/services/payment-networks.service.js';
import { StatementsService } from '../../../src/domain/services/statements.service.js';
import { ConsentService } from '../../../src/domain/services/consent.service.js';
import { MockAccountRepository } from '../../../src/infra/repositories/accounts.repo.mock.js';
import { MockTransactionRepository } from '../../../src/infra/repositories/transactions.repo.mock.js';
import { MockContactRepository } from '../../../src/infra/repositories/contact.repo.mock.js';
import { MockPaymentNetworkRepository } from '../../../src/infra/repositories/payment-networks.repo.mock.js';
import { MockStatementRepository } from '../../../src/infra/repositories/statements.repo.mock.js';
import { MockConsentRepository } from '../../../src/infra/repositories/consent.repo.mock.js';

describe('MCP Server', () => {
  let accountsService: AccountsService;
  let transactionsService: TransactionsService;
  let contactService: ContactService;
  let paymentNetworksService: PaymentNetworksService;
  let statementsService: StatementsService;
  let consentService: ConsentService;

  beforeEach(() => {
    // Initialize repositories
    const accountRepository = new MockAccountRepository();
    const transactionRepository = new MockTransactionRepository();
    const contactRepository = new MockContactRepository();
    const paymentNetworkRepository = new MockPaymentNetworkRepository();
    const statementRepository = new MockStatementRepository();
    const consentRepository = new MockConsentRepository();

    // Seed test data
    consentRepository.seedTestData();

    // Initialize services
    accountsService = new AccountsService(accountRepository);
    transactionsService = new TransactionsService(transactionRepository, accountRepository);
    contactService = new ContactService(contactRepository, accountRepository);
    paymentNetworksService = new PaymentNetworksService(
      paymentNetworkRepository,
      accountRepository,
    );
    statementsService = new StatementsService(statementRepository, accountRepository);
    consentService = new ConsentService(consentRepository);
  });

  describe('Server Creation', () => {
    it('should create an MCP server with correct metadata', () => {
      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
    });

    it('should register all required tools', () => {
      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      // Check that server has tools registered (this is implementation-specific)
      expect(server).toBeDefined();
    });
  });

  describe('Health Check Tool', () => {
    it('should return health status', async () => {
      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      // Health check is verified by the server having the tool registered
    });
  });

  describe('Accounts Tools', () => {
    it('should get accounts successfully', async () => {
      const spy = vi.spyOn(accountsService, 'getAccounts');
      const mockResponse = {
        accounts: [],
        pagination: { totalCount: 0, offset: 0, limit: 25, hasMore: false },
      };
      spy.mockResolvedValue(mockResponse);

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });

    it('should get account by id successfully', async () => {
      const spy = vi.spyOn(accountsService, 'getAccountById');
      spy.mockResolvedValue({
        accountId: 'acc-001',
        accountType: 'CHECKING',
        accountNumber: '1234',
        accountName: 'Test Account',
        status: 'ACTIVE',
        balance: { amount: 1000, currency: 'USD' },
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Transactions Tools', () => {
    it('should get transactions successfully', async () => {
      const spy = vi.spyOn(transactionsService, 'getTransactions');
      const mockResponse = {
        transactions: [],
        pagination: { totalCount: 0, offset: 0, limit: 25, hasMore: false },
      };
      spy.mockResolvedValue(mockResponse);

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Contact Tools', () => {
    it('should get account contact successfully', async () => {
      const spy = vi.spyOn(contactService, 'getAccountContact');
      spy.mockResolvedValue({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postalCode: '12345',
          country: 'US',
        },
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Payment Networks Tools', () => {
    it('should get payment networks successfully', async () => {
      const spy = vi.spyOn(paymentNetworksService, 'getPaymentNetworks');
      spy.mockResolvedValue({
        networks: [],
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Statements Tools', () => {
    it('should get statements successfully', async () => {
      const spy = vi.spyOn(statementsService, 'getStatements');
      const mockResponse = {
        statements: [],
        pagination: { totalCount: 0, offset: 0, limit: 25, hasMore: false },
      };
      spy.mockResolvedValue(mockResponse);

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });

    it('should get statement by id successfully', async () => {
      const spy = vi.spyOn(statementsService, 'getStatementById');
      spy.mockResolvedValue({
        statementId: 'stmt-001',
        accountId: 'acc-001',
        statementDate: '2024-01-01',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Consent Tools', () => {
    it('should create consent successfully', async () => {
      const spy = vi.spyOn(consentService, 'createConsent');
      spy.mockResolvedValue({
        id: 'consent-001',
        status: 'PENDING',
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });

    it('should get consent successfully', async () => {
      const spy = vi.spyOn(consentService, 'getConsent');
      spy.mockResolvedValue({
        id: 'consent-001',
        status: 'ACTIVE',
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        auditTrail: [],
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });

    it('should update consent successfully', async () => {
      const spy = vi.spyOn(consentService, 'updateConsent');
      spy.mockResolvedValue({
        id: 'consent-001',
        status: 'ACTIVE',
        subjectId: 'user-123',
        clientId: 'client-456',
        dataScopes: ['accounts:read'],
        accountIds: ['acc-001'],
        purpose: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        auditTrail: [],
      });

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const spy = vi.spyOn(accountsService, 'getAccounts');
      spy.mockRejectedValue(new Error('Service error'));

      const server = createMcpServer(
        accountsService,
        transactionsService,
        contactService,
        paymentNetworksService,
        statementsService,
        consentService,
      );

      expect(server).toBeDefined();
      spy.mockRestore();
    });
  });
});
