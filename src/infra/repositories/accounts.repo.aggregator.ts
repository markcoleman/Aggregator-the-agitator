import { AccountRepository } from './accounts.repo.mock.js';
import { Account, AccountsResponse } from '../../domain/entities/account.js';
import { BaseAggregator } from '../aggregators/base.aggregator.js';

/**
 * Account repository implementation that uses an aggregator
 * This adapter allows existing services to work with any aggregator
 */
export class AggregatorAccountRepository implements AccountRepository {
  constructor(private aggregator: BaseAggregator) {}

  async findByUserId(userId: string, limit: number, offset: number): Promise<AccountsResponse> {
    return this.aggregator.getAccounts(userId, limit, offset);
  }

  async findById(accountId: string, userId: string): Promise<Account> {
    return this.aggregator.getAccount(accountId, userId);
  }
}