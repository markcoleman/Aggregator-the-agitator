import { Account, AccountsResponse } from '../entities/account.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError, ValidationError } from '../../shared/errors/index.js';

export class AccountsService {
  constructor(private accountRepository: AccountRepository) {}

  async getAccounts(
    userId: string,
    scopes: string[],
    limit = 25,
    offset = 0,
  ): Promise<AccountsResponse> {
    this.validateAccountsScope(scopes);
    this.validatePaginationParams(limit, offset);

    return this.accountRepository.findByUserId(userId, limit, offset);
  }

  async getAccountById(accountId: string, userId: string, scopes: string[]): Promise<Account> {
    this.validateAccountsScope(scopes);

    return this.accountRepository.findById(accountId, userId);
  }

  private validateAccountsScope(scopes: string[]): void {
    if (!scopes.includes('accounts:read')) {
      throw new ForbiddenError('Missing required scope: accounts:read');
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
}
