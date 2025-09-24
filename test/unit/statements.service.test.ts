import { describe, it, expect, beforeEach } from 'vitest';
import { StatementsService } from '../../src/domain/services/statements.service.js';
import { MockStatementRepository } from '../../src/infra/repositories/statements.repo.mock.js';
import { MockAccountRepository } from '../../src/infra/repositories/accounts.repo.mock.js';

describe('StatementsService', () => {
  let statementsService: StatementsService;
  let mockStatementRepository: MockStatementRepository;
  let mockAccountRepository: MockAccountRepository;

  beforeEach(() => {
    mockStatementRepository = new MockStatementRepository();
    mockAccountRepository = new MockAccountRepository();
    statementsService = new StatementsService(
      mockStatementRepository,
      mockAccountRepository,
    );
  });

  describe('getStatements', () => {
    it('should return statements when user has proper scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['statements:read'];

      const result = await statementsService.getStatements(accountId, userId, scopes);

      expect(result.statements).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        statementsService.getStatements(accountId, userId, scopes),
      ).rejects.toThrow('Missing required scope: statements:read');
    });

    it('should throw error for invalid limit', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['statements:read'];
      const limit = 150; // Invalid - over 100

      await expect(
        statementsService.getStatements(accountId, userId, scopes, limit),
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for negative offset', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['statements:read'];
      const offset = -1; // Invalid - negative

      await expect(
        statementsService.getStatements(accountId, userId, scopes, 25, offset),
      ).rejects.toThrow('Offset must be non-negative');
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const userId = 'user123';
      const scopes = ['statements:read'];

      await expect(
        statementsService.getStatements(accountId, userId, scopes),
      ).rejects.toThrow('Account non-existent not found');
    });
  });

  describe('getStatementById', () => {
    it('should return statement when user has proper scope', async () => {
      const accountId = 'acc-001';
      const statementId = 'stmt-001';
      const userId = 'user123';
      const scopes = ['statements:read'];

      const result = await statementsService.getStatementById(
        accountId,
        statementId,
        userId,
        scopes,
      );

      expect(result).toBeDefined();
      expect(result.statementId).toBe(statementId);
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const statementId = 'stmt-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        statementsService.getStatementById(accountId, statementId, userId, scopes),
      ).rejects.toThrow('Missing required scope: statements:read');
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const statementId = 'stmt-001';
      const userId = 'user123';
      const scopes = ['statements:read'];

      await expect(
        statementsService.getStatementById(accountId, statementId, userId, scopes),
      ).rejects.toThrow('Account non-existent not found');
    });

    it('should throw error for non-existent statement', async () => {
      const accountId = 'acc-001';
      const statementId = 'non-existent';
      const userId = 'user123';
      const scopes = ['statements:read'];

      await expect(
        statementsService.getStatementById(accountId, statementId, userId, scopes),
      ).rejects.toThrow('Statement non-existent not found for account acc-001');
    });
  });
});