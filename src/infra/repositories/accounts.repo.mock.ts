import { Account, AccountsResponse, Pagination } from '../../domain/entities/account.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface AccountRepository {
  findByUserId(userId: string, limit: number, offset: number): Promise<AccountsResponse>;
  findById(accountId: string, userId: string): Promise<Account>;
}

export class MockAccountRepository implements AccountRepository {
  private mockAccounts: Account[] = [
    {
      accountId: 'acc-001',
      accountType: 'CHECKING',
      accountNumber: '****1234',
      accountName: 'Primary Checking',
      status: 'ACTIVE',
      balance: { amount: 2500.5, currency: 'USD' },
      availableBalance: { amount: 2300.5, currency: 'USD' },
      openedDate: '2020-01-15',
    },
    {
      accountId: 'acc-002',
      accountType: 'SAVINGS',
      accountNumber: '****5678',
      accountName: 'High Yield Savings',
      status: 'ACTIVE',
      balance: { amount: 15000.0, currency: 'USD' },
      availableBalance: { amount: 15000.0, currency: 'USD' },
      openedDate: '2020-03-20',
    },
    {
      accountId: 'acc-003',
      accountType: 'CREDIT_CARD',
      accountNumber: '****9012',
      accountName: 'Rewards Credit Card',
      status: 'ACTIVE',
      balance: { amount: -850.25, currency: 'USD' },
      availableBalance: { amount: 4149.75, currency: 'USD' },
      openedDate: '2021-06-10',
    },
    {
      accountId: 'acc-004',
      accountType: 'INVESTMENT',
      accountNumber: '****3456',
      accountName: 'Investment Portfolio',
      status: 'ACTIVE',
      balance: { amount: 45230.8, currency: 'USD' },
      openedDate: '2019-11-05',
    },
    {
      accountId: 'acc-999',
      accountType: 'SAVINGS',
      accountNumber: '****9999',
      accountName: 'Test Account',
      status: 'ACTIVE',
      balance: { amount: 100.0, currency: 'USD' },
      openedDate: '2024-01-01',
    },
  ];

  async findByUserId(_userId: string, limit: number, offset: number): Promise<AccountsResponse> {
    // In a real implementation, we would filter by userId
    // For mock purposes, we return the same accounts for all users
    const totalCount = this.mockAccounts.length;
    const accounts = this.mockAccounts.slice(offset, offset + limit);

    const pagination: Pagination = {
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
    };

    return {
      accounts,
      pagination,
    };
  }

  async findById(accountId: string, _userId: string): Promise<Account> {
    // In a real implementation, we would verify the account belongs to the user
    const account = this.mockAccounts.find(acc => acc.accountId === accountId);

    if (!account) {
      throw new NotFoundError(`Account ${accountId} not found`);
    }

    return account;
  }
}
