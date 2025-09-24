import { Transaction, TransactionsResponse } from '../../domain/entities/transaction.js';
import { Pagination } from '../../domain/entities/account.js';

export interface TransactionRepository {
  findByAccountId(
    accountId: string,
    userId: string,
    fromDate?: string,
    toDate?: string,
    limit?: number,
    offset?: number,
  ): Promise<TransactionsResponse>;
}

export class MockTransactionRepository implements TransactionRepository {
  private mockTransactions: Transaction[] = [
    {
      transactionId: 'txn-001',
      accountId: 'acc-001',
      amount: { amount: -45.99, currency: 'USD' },
      description: 'STARBUCKS COFFEE #1234',
      merchantName: 'Starbucks',
      transactionDate: '2024-01-15T14:30:00Z',
      postedDate: '2024-01-15T14:30:00Z',
      status: 'POSTED',
      category: 'Food & Dining',
    },
    {
      transactionId: 'txn-002',
      accountId: 'acc-001',
      amount: { amount: -1200.0, currency: 'USD' },
      description: 'RENT PAYMENT - APARTMENT COMPLEX',
      transactionDate: '2024-01-01T08:00:00Z',
      postedDate: '2024-01-01T08:00:00Z',
      status: 'POSTED',
      category: 'Housing',
    },
    {
      transactionId: 'txn-003',
      accountId: 'acc-001',
      amount: { amount: 2500.0, currency: 'USD' },
      description: 'PAYROLL DEPOSIT - ACME CORP',
      transactionDate: '2024-01-15T00:00:00Z',
      postedDate: '2024-01-15T00:00:00Z',
      status: 'POSTED',
      category: 'Income',
    },
    {
      transactionId: 'txn-004',
      accountId: 'acc-001',
      amount: { amount: -89.42, currency: 'USD' },
      description: 'GROCERY STORE PURCHASE',
      merchantName: 'Fresh Market',
      transactionDate: '2024-01-14T16:22:00Z',
      postedDate: '2024-01-14T16:22:00Z',
      status: 'POSTED',
      category: 'Groceries',
    },
    {
      transactionId: 'txn-005',
      accountId: 'acc-003',
      amount: { amount: -150.0, currency: 'USD' },
      description: 'MONTHLY PAYMENT',
      transactionDate: '2024-01-10T10:00:00Z',
      postedDate: '2024-01-10T10:00:00Z',
      status: 'POSTED',
      category: 'Credit Card Payment',
    },
    {
      transactionId: 'txn-006',
      accountId: 'acc-001',
      amount: { amount: -25.99, currency: 'USD' },
      description: 'NETFLIX SUBSCRIPTION',
      merchantName: 'Netflix',
      transactionDate: '2024-01-12T00:00:00Z',
      status: 'PENDING',
      category: 'Entertainment',
    },
  ];

  async findByAccountId(
    accountId: string,
    _userId: string,
    fromDate?: string,
    toDate?: string,
    limit = 25,
    offset = 0,
  ): Promise<TransactionsResponse> {
    // Filter transactions by account ID
    let filteredTransactions = this.mockTransactions.filter(txn => txn.accountId === accountId);

    // Apply date filtering if provided
    if (fromDate) {
      const fromDateTime = new Date(fromDate);
      filteredTransactions = filteredTransactions.filter(
        txn => new Date(txn.transactionDate) >= fromDateTime,
      );
    }

    if (toDate) {
      const toDateTime = new Date(toDate);
      filteredTransactions = filteredTransactions.filter(
        txn => new Date(txn.transactionDate) <= toDateTime,
      );
    }

    // Sort by transaction date (newest first)
    filteredTransactions.sort(
      (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );

    const totalCount = filteredTransactions.length;
    const transactions = filteredTransactions.slice(offset, offset + limit);

    const pagination: Pagination = {
      totalCount,
      offset,
      limit,
      hasMore: offset + limit < totalCount,
    };

    return {
      transactions,
      pagination,
    };
  }
}
