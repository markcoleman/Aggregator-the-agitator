import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionsService } from '../../src/domain/services/transactions.service.js';
import { MockTransactionRepository } from '../../src/infra/repositories/transactions.repo.mock.js';
import { MockAccountRepository } from '../../src/infra/repositories/accounts.repo.mock.js';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let mockTransactionRepository: MockTransactionRepository;
  let mockAccountRepository: MockAccountRepository;

  beforeEach(() => {
    mockTransactionRepository = new MockTransactionRepository();
    mockAccountRepository = new MockAccountRepository();
    transactionsService = new TransactionsService(
      mockTransactionRepository,
      mockAccountRepository,
    );
  });

  describe('getTransactions', () => {
    it('should return transactions when user has proper scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];

      const result = await transactionsService.getTransactions(
        accountId,
        userId,
        scopes,
      );

      expect(result.transactions).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        transactionsService.getTransactions(accountId, userId, scopes),
      ).rejects.toThrow('Missing required scope: transactions:read');
    });

    it('should throw error for invalid limit', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const limit = 150; // Invalid - over 100

      await expect(
        transactionsService.getTransactions(
          accountId,
          userId,
          scopes,
          undefined,
          undefined,
          limit,
        ),
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for negative offset', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const offset = -1; // Invalid - negative

      await expect(
        transactionsService.getTransactions(
          accountId,
          userId,
          scopes,
          undefined,
          undefined,
          25,
          offset,
        ),
      ).rejects.toThrow('Offset must be non-negative');
    });

    it('should throw error for invalid fromDate', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const fromDate = 'invalid-date';

      await expect(
        transactionsService.getTransactions(
          accountId,
          userId,
          scopes,
          fromDate,
        ),
      ).rejects.toThrow('Invalid fromDate format. Use YYYY-MM-DD');
    });

    it('should throw error for invalid toDate', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const toDate = 'invalid-date';

      await expect(
        transactionsService.getTransactions(
          accountId,
          userId,
          scopes,
          undefined,
          toDate,
        ),
      ).rejects.toThrow('Invalid toDate format. Use YYYY-MM-DD');
    });

    it('should throw error when fromDate is after toDate', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const fromDate = '2024-02-01';
      const toDate = '2024-01-01';

      await expect(
        transactionsService.getTransactions(
          accountId,
          userId,
          scopes,
          fromDate,
          toDate,
        ),
      ).rejects.toThrow('fromDate must be before or equal to toDate');
    });

    it('should work with valid date range', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['transactions:read'];
      const fromDate = '2024-01-01';
      const toDate = '2024-01-31';

      const result = await transactionsService.getTransactions(
        accountId,
        userId,
        scopes,
        fromDate,
        toDate,
      );

      expect(result.transactions).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const userId = 'user123';
      const scopes = ['transactions:read'];

      await expect(
        transactionsService.getTransactions(accountId, userId, scopes),
      ).rejects.toThrow('Account non-existent not found');
    });
  });
});