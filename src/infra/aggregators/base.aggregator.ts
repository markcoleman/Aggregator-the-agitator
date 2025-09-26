import { Account, AccountsResponse } from '../../domain/entities/account.js';
import { Transaction } from '../../domain/entities/transaction.js';
import { Contact } from '../../domain/entities/contact.js';
import { PaymentNetwork } from '../../domain/entities/payment-network.js';
import { Statement } from '../../domain/entities/statement.js';

/**
 * Base aggregator interface that all aggregator providers must implement
 * This provides a consistent API regardless of the underlying aggregator service
 */
export interface BaseAggregator {
  /**
   * Initialize the aggregator connection
   */
  initialize(): Promise<void>;

  /**
   * Get accounts for a user
   */
  getAccounts(userId: string, limit: number, offset: number): Promise<AccountsResponse>;

  /**
   * Get a specific account by ID
   */
  getAccount(accountId: string, userId: string): Promise<Account>;

  /**
   * Get transactions for an account
   */
  getTransactions(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<Transaction[]>;

  /**
   * Get contact information for an account
   */
  getContact(accountId: string, userId: string): Promise<Contact>;

  /**
   * Get payment networks for an account
   */
  getPaymentNetworks(accountId: string, userId: string): Promise<PaymentNetwork[]>;

  /**
   * Get statements for an account
   */
  getStatements(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Statement[]>;

  /**
   * Get a specific statement by ID
   */
  getStatement(accountId: string, statementId: string, userId: string): Promise<Statement>;
}

/**
 * Configuration for aggregator authentication
 */
export interface AggregatorAuthConfig {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Base class with common functionality for aggregators
 */
export abstract class BaseAggregatorImpl implements BaseAggregator {
  protected authConfig?: AggregatorAuthConfig;

  abstract initialize(): Promise<void>;
  abstract getAccounts(userId: string, limit: number, offset: number): Promise<AccountsResponse>;
  abstract getAccount(accountId: string, userId: string): Promise<Account>;
  abstract getTransactions(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<Transaction[]>;
  abstract getContact(accountId: string, userId: string): Promise<Contact>;
  abstract getPaymentNetworks(accountId: string, userId: string): Promise<PaymentNetwork[]>;
  abstract getStatements(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Statement[]>;
  abstract getStatement(accountId: string, statementId: string, userId: string): Promise<Statement>;

  /**
   * Check if the aggregator is authenticated
   */
  protected isAuthenticated(): boolean {
    return !!(
      this.authConfig?.accessToken &&
      this.authConfig?.expiresAt &&
      this.authConfig.expiresAt > new Date()
    );
  }
}
