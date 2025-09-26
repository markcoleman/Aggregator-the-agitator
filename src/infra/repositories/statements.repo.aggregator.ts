import { StatementRepository } from './statements.repo.mock.js';
import { Statement, StatementsResponse } from '../../domain/entities/statement.js';
import { Pagination } from '../../domain/entities/account.js';
import { BaseAggregator } from '../aggregators/base.aggregator.js';

/**
 * Statement repository implementation that uses an aggregator
 */
export class AggregatorStatementRepository implements StatementRepository {
  constructor(private aggregator: BaseAggregator) {}

  async findByAccountId(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<StatementsResponse> {
    const statements = await this.aggregator.getStatements(accountId, userId, limit, offset);

    // Create pagination info
    const pagination: Pagination = {
      totalCount: statements.length, // This would be better if aggregator provided total count
      offset,
      limit,
      hasMore: statements.length === limit, // Approximation
    };

    return {
      statements,
      pagination,
    };
  }

  async findById(accountId: string, statementId: string, userId: string): Promise<Statement> {
    return this.aggregator.getStatement(accountId, statementId, userId);
  }
}