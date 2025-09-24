import { Statement, StatementsResponse } from '../../domain/entities/statement.js';
import { Pagination } from '../../domain/entities/account.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface StatementRepository {
  findByAccountId(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
  ): Promise<StatementsResponse>;
  findById(statementId: string, accountId: string, userId: string): Promise<Statement>;
}

export class MockStatementRepository implements StatementRepository {
  private mockStatements: Statement[] = [
    {
      statementId: 'stmt-001',
      accountId: 'acc-001',
      statementDate: '2024-01-31',
      status: 'AVAILABLE',
      beginDate: '2024-01-01',
      endDate: '2024-01-31',
      downloadUrl: 'https://api.example.com/statements/stmt-001/download',
    },
    {
      statementId: 'stmt-002',
      accountId: 'acc-001',
      statementDate: '2023-12-31',
      status: 'AVAILABLE',
      beginDate: '2023-12-01',
      endDate: '2023-12-31',
      downloadUrl: 'https://api.example.com/statements/stmt-002/download',
    },
    {
      statementId: 'stmt-003',
      accountId: 'acc-001',
      statementDate: '2023-11-30',
      status: 'AVAILABLE',
      beginDate: '2023-11-01',
      endDate: '2023-11-30',
      downloadUrl: 'https://api.example.com/statements/stmt-003/download',
    },
    {
      statementId: 'stmt-004',
      accountId: 'acc-002',
      statementDate: '2024-01-31',
      status: 'AVAILABLE',
      beginDate: '2024-01-01',
      endDate: '2024-01-31',
      downloadUrl: 'https://api.example.com/statements/stmt-004/download',
    },
    {
      statementId: 'stmt-005',
      accountId: 'acc-003',
      statementDate: '2024-01-31',
      status: 'PROCESSING',
      beginDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  ];

  async findByAccountId(
    accountId: string,
    _userId: string,
    limit: number,
    offset: number,
  ): Promise<StatementsResponse> {
    const filteredStatements = this.mockStatements
      .filter(stmt => stmt.accountId === accountId)
      .sort((a, b) => new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime());

    const totalCount = filteredStatements.length;
    const statements = filteredStatements.slice(offset, offset + limit);

    const pagination: Pagination = {
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
    };

    return {
      statements,
      pagination,
    };
  }

  async findById(statementId: string, accountId: string, _userId: string): Promise<Statement> {
    const statement = this.mockStatements.find(
      stmt => stmt.statementId === statementId && stmt.accountId === accountId,
    );

    if (!statement) {
      throw new NotFoundError(`Statement ${statementId} not found for account ${accountId}`);
    }

    return statement;
  }
}
