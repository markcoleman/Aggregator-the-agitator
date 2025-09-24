import { describe, it, expect, beforeEach } from 'vitest';
import { AccountsService } from '../../src/domain/services/accounts.service.js';
import { MockAccountRepository } from '../../src/infra/repositories/accounts.repo.mock.js';

describe('AccountsService', () => {
  let accountsService: AccountsService;
  let mockAccountRepository: MockAccountRepository;

  beforeEach(() => {
    mockAccountRepository = new MockAccountRepository();
    accountsService = new AccountsService(mockAccountRepository);
  });

  describe('getAccounts', () => {
    it('should return accounts when user has proper scope', async () => {
      const userId = 'user123';
      const scopes = ['accounts:read'];
      const limit = 10;
      const offset = 0;

      const result = await accountsService.getAccounts(userId, scopes, limit, offset);

      expect(result.accounts).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.limit).toBe(limit);
      expect(result.pagination.offset).toBe(offset);
    });

    it('should throw error when user lacks required scope', async () => {
      const userId = 'user123';
      const scopes = ['some:other:scope'];
      const limit = 10;
      const offset = 0;

      await expect(
        accountsService.getAccounts(userId, scopes, limit, offset)
      ).rejects.toThrow('Missing required scope: accounts:read');
    });

    it('should throw error for invalid limit', async () => {
      const userId = 'user123';
      const scopes = ['accounts:read'];
      const limit = 150; // Invalid - over 100
      const offset = 0;

      await expect(
        accountsService.getAccounts(userId, scopes, limit, offset)
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for negative offset', async () => {
      const userId = 'user123';
      const scopes = ['accounts:read'];
      const limit = 10;
      const offset = -1; // Invalid - negative

      await expect(
        accountsService.getAccounts(userId, scopes, limit, offset)
      ).rejects.toThrow('Offset must be non-negative');
    });
  });

  describe('getAccountById', () => {
    it('should return account when user has proper scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['accounts:read'];

      const result = await accountsService.getAccountById(accountId, userId, scopes);

      expect(result).toBeDefined();
      expect(result.accountId).toBe(accountId);
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        accountsService.getAccountById(accountId, userId, scopes)
      ).rejects.toThrow('Missing required scope: accounts:read');
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const userId = 'user123';
      const scopes = ['accounts:read'];

      await expect(
        accountsService.getAccountById(accountId, userId, scopes)
      ).rejects.toThrow('Account non-existent not found');
    });
  });
});