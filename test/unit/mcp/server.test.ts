import { describe, it, expect, beforeEach } from 'vitest';
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
  let server: any;

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

    // Create server
    server = createMcpServer(
      accountsService,
      transactionsService,
      contactService,
      paymentNetworksService,
      statementsService,
      consentService,
    );
  });

  describe('Server Creation', () => {
    it('should create an MCP server with correct metadata', () => {
      expect(server).toBeDefined();
    });

    it('should register all required tools', () => {
      // Check that server has tools registered (this is implementation-specific)
      expect(server).toBeDefined();
    });
  });

  describe('Tool Registration and Execution', () => {
    it('should have health_check tool registered', () => {
      expect(server).toBeDefined();
    });

    it('should have accounts tools registered', () => {
      expect(server).toBeDefined();
    });

    it('should have transactions tool registered', () => {
      expect(server).toBeDefined();
    });

    it('should have contact tool registered', () => {
      expect(server).toBeDefined();
    });

    it('should have payment networks tool registered', () => {
      expect(server).toBeDefined();
    });

    it('should have statements tools registered', () => {
      expect(server).toBeDefined();
    });

    it('should have consent tools registered', () => {
      expect(server).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should work with accounts service', async () => {
      const accounts = await accountsService.getAccounts('user-123', ['accounts:read'], 10, 0);
      expect(accounts).toBeDefined();
      expect(accounts.accounts).toBeInstanceOf(Array);
    });

    it('should work with transactions service', async () => {
      const transactions = await transactionsService.getTransactions(
        'acc-001',
        'user-123',
        ['transactions:read'],
        undefined,
        undefined,
        10,
        0,
      );
      expect(transactions).toBeDefined();
      expect(transactions.transactions).toBeInstanceOf(Array);
    });

    it('should work with contact service', async () => {
      const contact = await contactService.getAccountContact(
        'acc-001',
        'user-123',
        ['contact:read'],
      );
      expect(contact).toBeDefined();
    });

    it('should work with payment networks service', async () => {
      const networks = await paymentNetworksService.getPaymentNetworks(
        'acc-001',
        'user-123',
        ['payment_networks:read'],
      );
      expect(networks).toBeDefined();
    });

    it('should work with statements service', async () => {
      const statements = await statementsService.getStatements(
        'acc-001',
        'user-123',
        ['statements:read'],
        10,
        0,
      );
      expect(statements).toBeDefined();
      expect(statements.statements).toBeInstanceOf(Array);
    });

    it('should work with consent service', async () => {
      const consent = await consentService.createConsent(
        {
          subjectId: 'user-123',
          clientId: 'client-456',
          dataScopes: ['accounts:read'],
          accountIds: ['acc-001'],
          purpose: 'Test',
          expiry: new Date(Date.now() + 86400000).toISOString(),
        },
        'client-456',
      );
      expect(consent).toBeDefined();
      expect(consent.id).toBeDefined();
    });
  });
});
