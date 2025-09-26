import { BaseAggregatorImpl } from './base.aggregator.js';
import { Account, AccountsResponse } from '../../domain/entities/account.js';
import { Transaction } from '../../domain/entities/transaction.js';
import { Contact } from '../../domain/entities/contact.js';
import { PaymentNetwork } from '../../domain/entities/payment-network.js';
import { Statement } from '../../domain/entities/statement.js';

// Import existing mock repositories
import { MockAccountRepository } from '../repositories/accounts.repo.mock.js';
import { MockTransactionRepository } from '../repositories/transactions.repo.mock.js';
import { MockContactRepository } from '../repositories/contact.repo.mock.js';
import { MockPaymentNetworkRepository } from '../repositories/payment-networks.repo.mock.js';
import { MockStatementRepository } from '../repositories/statements.repo.mock.js';

/**
 * Mock aggregator implementation that wraps existing mock repositories
 * This maintains backward compatibility while providing the aggregator interface
 */
export class MockAggregator extends BaseAggregatorImpl {
  private accountRepository: MockAccountRepository;
  private transactionRepository: MockTransactionRepository;
  private contactRepository: MockContactRepository;
  private paymentNetworkRepository: MockPaymentNetworkRepository;
  private statementRepository: MockStatementRepository;

  constructor() {
    super();
    this.accountRepository = new MockAccountRepository();
    this.transactionRepository = new MockTransactionRepository();
    this.contactRepository = new MockContactRepository();
    this.paymentNetworkRepository = new MockPaymentNetworkRepository();
    this.statementRepository = new MockStatementRepository();
  }

  async initialize(): Promise<void> {
    // Mock aggregator doesn't need initialization
    this.authConfig = {
      accessToken: 'mock-token',
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    };
  }

  async getAccounts(userId: string, limit: number, offset: number): Promise<AccountsResponse> {
    return this.accountRepository.findByUserId(userId, limit, offset);
  }

  async getAccount(accountId: string, userId: string): Promise<Account> {
    return this.accountRepository.findById(accountId, userId);
  }

  async getTransactions(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<Transaction[]> {
    const result = await this.transactionRepository.findByAccountId(
      accountId,
      userId,
      fromDate,
      toDate,
      limit,
      offset,
    );
    return result.transactions;
  }

  async getContact(accountId: string, userId: string): Promise<Contact> {
    return this.contactRepository.findByAccountId(accountId, userId);
  }

  async getPaymentNetworks(accountId: string, userId: string): Promise<PaymentNetwork[]> {
    const result = await this.paymentNetworkRepository.findByAccountId(accountId, userId);
    return result.paymentNetworks;
  }

  async getStatements(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Statement[]> {
    const result = await this.statementRepository.findByAccountId(accountId, userId, limit, offset);
    return result.statements;
  }

  async getStatement(accountId: string, statementId: string, userId: string): Promise<Statement> {
    return this.statementRepository.findById(accountId, statementId, userId);
  }
}
