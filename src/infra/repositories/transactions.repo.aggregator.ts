import { TransactionRepository } from './transactions.repo.mock.js';
import { TransactionsResponse } from '../../domain/entities/transaction.js';
import { Pagination } from '../../domain/entities/account.js';
import { BaseAggregator } from '../aggregators/base.aggregator.js';

/**
 * Transaction repository implementation that uses an aggregator
 */
export class AggregatorTransactionRepository implements TransactionRepository {
  constructor(private aggregator: BaseAggregator) {}

  async findByAccountId(
    accountId: string,
    userId: string,
    fromDate?: string,
    toDate?: string,
    limit?: number,
    offset?: number,
  ): Promise<TransactionsResponse> {
    const transactions = await this.aggregator.getTransactions(
      accountId,
      userId,
      limit || 50,
      offset || 0,
      fromDate,
      toDate,
    );

    // Create pagination info (aggregators may not provide this directly)
    const pagination: Pagination = {
      totalCount: transactions.length, // This would be better if aggregator provided total count
      offset: offset || 0,
      limit: limit || 50,
      hasMore: transactions.length === (limit || 50), // Approximation
    };

    return {
      transactions,
      pagination,
    };
  }
}