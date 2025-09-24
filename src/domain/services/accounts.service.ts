import { Account, AccountsResponse } from '../entities/account.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError, ValidationError } from '../../shared/errors/index.js';

/**
 * Service for managing account data access with FDX compliance.
 * Handles scope validation, pagination, and access control for financial accounts.
 *
 * @example
 * ```typescript
 * const service = new AccountsService(accountRepository);
 *
 * // Get user accounts with pagination
 * const accounts = await service.getAccounts('user-123', ['accounts:read'], 10, 0);
 *
 * // Get specific account
 * const account = await service.getAccountById('acc-001', 'user-123', ['accounts:read']);
 * ```
 */
export class AccountsService {
  constructor(private accountRepository: AccountRepository) {}

  /**
   * Retrieves user accounts with pagination and scope validation.
   *
   * @param userId - The user ID to fetch accounts for
   * @param scopes - Array of OAuth scopes to validate
   * @param limit - Maximum number of accounts to return (default: 25)
   * @param offset - Number of accounts to skip for pagination (default: 0)
   * @returns Promise resolving to paginated accounts response
   * @throws {ValidationError} When scopes are invalid or pagination params are out of range
   */
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
