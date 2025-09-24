import { Statement, StatementsResponse } from '../entities/statement.js';
import { StatementRepository } from '../../infra/repositories/statements.repo.mock.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError, ValidationError } from '../../shared/errors/index.js';

export class StatementsService {
  constructor(
    private statementRepository: StatementRepository,
    private accountRepository: AccountRepository,
  ) {}

  async getStatements(
    accountId: string,
    userId: string,
    scopes: string[],
    limit = 25,
    offset = 0,
  ): Promise<StatementsResponse> {
    this.validateStatementsScope(scopes);
    this.validatePaginationParams(limit, offset);

    // Verify account exists and belongs to user
    await this.accountRepository.findById(accountId, userId);

    return this.statementRepository.findByAccountId(accountId, userId, limit, offset);
  }

  async getStatementById(
    accountId: string,
    statementId: string,
    userId: string,
    scopes: string[],
  ): Promise<Statement> {
    this.validateStatementsScope(scopes);

    // Verify account exists and belongs to user
    await this.accountRepository.findById(accountId, userId);

    return this.statementRepository.findById(statementId, accountId, userId);
  }

  private validateStatementsScope(scopes: string[]): void {
    if (!scopes.includes('statements:read')) {
      throw new ForbiddenError('Missing required scope: statements:read');
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
