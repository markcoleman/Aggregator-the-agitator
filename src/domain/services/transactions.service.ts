import { TransactionsResponse } from '../entities/transaction.js';
import { TransactionRepository } from '../../infra/repositories/transactions.repo.mock.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError, ValidationError } from '../../shared/errors/index.js';

export class TransactionsService {
  constructor(
    private transactionRepository: TransactionRepository,
    private accountRepository: AccountRepository,
  ) {}

  async getTransactions(
    accountId: string,
    userId: string,
    scopes: string[],
    fromDate?: string,
    toDate?: string,
    limit = 25,
    offset = 0,
  ): Promise<TransactionsResponse> {
    this.validateTransactionsScope(scopes);
    this.validatePaginationParams(limit, offset);
    this.validateDateRange(fromDate, toDate);

    // Verify account exists and belongs to user
    await this.accountRepository.findById(accountId, userId);

    return this.transactionRepository.findByAccountId(
      accountId,
      userId,
      fromDate,
      toDate,
      limit,
      offset,
    );
  }

  private validateTransactionsScope(scopes: string[]): void {
    if (!scopes.includes('transactions:read')) {
      throw new ForbiddenError('Missing required scope: transactions:read');
    }
  }

  private validatePaginationParams(limit: number, offset: number): void {
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new ValidationError('Offset must be non-negative');
    }
  }

  private validateDateRange(fromDate?: string, toDate?: string): void {
    if (fromDate && !this.isValidDate(fromDate)) {
      throw new ValidationError('Invalid fromDate format. Use YYYY-MM-DD');
    }

    if (toDate && !this.isValidDate(toDate)) {
      throw new ValidationError('Invalid toDate format. Use YYYY-MM-DD');
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      throw new ValidationError('fromDate must be before or equal to toDate');
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
