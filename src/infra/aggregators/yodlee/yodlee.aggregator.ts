import { BaseAggregatorImpl } from '../base.aggregator.js';
import { Account, AccountsResponse, AccountType, AccountStatus } from '../../../domain/entities/account.js';
import { Transaction } from '../../../domain/entities/transaction.js';
import { Contact } from '../../../domain/entities/contact.js';
import { PaymentNetwork } from '../../../domain/entities/payment-network.js';
import { Statement } from '../../../domain/entities/statement.js';
import { YodleeConfig } from '../../../config/index.js';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/index.js';

/**
 * Yodlee aggregator implementation
 * This class integrates with Yodlee's API to fetch financial data
 */
export class YodleeAggregator extends BaseAggregatorImpl {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: YodleeConfig) {
    super();
    this.baseUrl = config.baseUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async initialize(): Promise<void> {
    // Initialize Yodlee connection and authenticate
    await this.authenticate();
  }

  async getAccounts(userId: string, limit: number, offset: number): Promise<AccountsResponse> {
    await this.ensureAuthenticated();
    
    try {
      // In a real implementation, this would call Yodlee's accounts API
      // For now, we'll simulate the response with Yodlee-like data structure
      const yodleeAccounts = await this.callYodleeAPI(`/accounts`, {
        loginName: userId,
        container: 'bank,creditCard,investment',
        skip: offset,
        top: limit,
      });

      const accounts = yodleeAccounts.account?.map((yodleeAccount: any) => 
        this.mapYodleeAccountToFDX(yodleeAccount)
      ) || [];

      return {
        accounts,
        pagination: {
          totalCount: yodleeAccounts.totalCount || accounts.length,
          offset,
          limit,
          hasMore: (offset + limit) < (yodleeAccounts.totalCount || accounts.length),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch accounts from Yodlee: ${error}`);
    }
  }

  async getAccount(accountId: string, userId: string): Promise<Account> {
    await this.ensureAuthenticated();
    
    try {
      const yodleeAccount = await this.callYodleeAPI(`/accounts/${accountId}`, {
        loginName: userId,
      });

      if (!yodleeAccount?.account?.[0]) {
        throw new NotFoundError(`Account ${accountId} not found`);
      }

      return this.mapYodleeAccountToFDX(yodleeAccount.account[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to fetch account from Yodlee: ${error}`);
    }
  }

  async getTransactions(
    accountId: string,
    userId: string,
    limit: number,
    offset: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<Transaction[]> {
    await this.ensureAuthenticated();
    
    try {
      const params: any = {
        loginName: userId,
        accountId,
        skip: offset,
        top: limit,
      };

      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const yodleeTransactions = await this.callYodleeAPI('/transactions', params);
      
      return yodleeTransactions.transaction?.map((yodleeTxn: any) => 
        this.mapYodleeTransactionToFDX(yodleeTxn)
      ) || [];
    } catch (error) {
      throw new Error(`Failed to fetch transactions from Yodlee: ${error}`);
    }
  }

  async getContact(accountId: string, userId: string): Promise<Contact> {
    await this.ensureAuthenticated();
    
    try {
      // Yodlee doesn't have a direct contact endpoint, so we'll derive from account info
      const account = await this.getAccount(accountId, userId);
      
      return {
        name: `${account.accountName} Contact`,
        address: {
          line1: '123 Bank Street',
          city: 'Financial City',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        phoneNumber: '1-800-BANK-123',
        emailAddress: 'customerservice@bank.com',
      };
    } catch (error) {
      throw new Error(`Failed to fetch contact from Yodlee: ${error}`);
    }
  }

  async getPaymentNetworks(accountId: string, userId: string): Promise<PaymentNetwork[]> {
    await this.ensureAuthenticated();
    
    try {
      // Yodlee doesn't have a specific payment networks endpoint
      // We'll return default networks based on account type
      const account = await this.getAccount(accountId, userId);
      
      const networks: PaymentNetwork[] = [];
      
      if (account.accountType === 'CREDIT_CARD') {
        networks.push(
          {
            networkId: 'visa-001',
            networkName: 'Visa',
            accountNumber: account.accountNumber,
          },
          {
            networkId: 'mastercard-001',
            networkName: 'Mastercard',
            accountNumber: account.accountNumber,
          }
        );
      } else if (account.accountType === 'CHECKING' || account.accountType === 'SAVINGS') {
        networks.push({
          networkId: 'ach-001',
          networkName: 'ACH Network',
          accountNumber: account.accountNumber,
          routingNumber: '123456789',
        });
      }

      return networks;
    } catch (error) {
      throw new Error(`Failed to fetch payment networks from Yodlee: ${error}`);
    }
  }

  async getStatements(accountId: string, userId: string, limit: number, offset: number): Promise<Statement[]> {
    await this.ensureAuthenticated();
    
    try {
      const yodleeStatements = await this.callYodleeAPI('/statements', {
        loginName: userId,
        accountId,
        skip: offset,
        top: limit,
      });

      return yodleeStatements.statement?.map((yodleeStmt: any) => 
        this.mapYodleeStatementToFDX(yodleeStmt)
      ) || [];
    } catch (error) {
      throw new Error(`Failed to fetch statements from Yodlee: ${error}`);
    }
  }

  async getStatement(accountId: string, statementId: string, userId: string): Promise<Statement> {
    await this.ensureAuthenticated();
    
    try {
      const yodleeStatement = await this.callYodleeAPI(`/statements/${statementId}`, {
        loginName: userId,
        accountId,
      });

      if (!yodleeStatement?.statement?.[0]) {
        throw new NotFoundError(`Statement ${statementId} not found`);
      }

      return this.mapYodleeStatementToFDX(yodleeStatement.statement[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to fetch statement from Yodlee: ${error}`);
    }
  }

  private async authenticate(): Promise<void> {
    try {
      // In a real implementation, this would authenticate with Yodlee using OAuth2 or similar
      // Using the configured Yodlee credentials
      console.log(`Authenticating with Yodlee at ${this.baseUrl} using client ${this.clientId}`);
      
      // For now, we'll simulate the authentication
      this.authConfig = {
        accessToken: `mock-yodlee-token-${this.clientSecret.slice(0, 4)}`, // Use part of secret for uniqueness
        refreshToken: 'mock-yodlee-refresh',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      };
    } catch (error) {
      throw new UnauthorizedError(`Failed to authenticate with Yodlee: ${error}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }
  }

  private async callYodleeAPI(endpoint: string, _params: any): Promise<any> {
    // In a real implementation, this would make actual HTTP calls to Yodlee API
    // For now, we'll return mock data that simulates Yodlee's response structure
    
    if (endpoint === '/accounts') {
      return {
        account: [
          {
            id: 'yodlee-acc-001',
            accountName: 'Yodlee Checking Account',
            accountNumber: 'XXXX1234',
            accountType: 'SAVINGS',
            accountStatus: 'ACTIVE',
            balance: {
              amount: 5250.75,
              currency: 'USD',
            },
            availableBalance: {
              amount: 5000.75,
              currency: 'USD',
            },
            createdDate: '2023-01-15T00:00:00Z',
            container: 'bank',
          },
          {
            id: 'yodlee-acc-002',
            accountName: 'Yodlee Credit Card',
            accountNumber: 'XXXX5678',
            accountType: 'CREDIT_CARD',
            accountStatus: 'ACTIVE',
            balance: {
              amount: -1250.30,
              currency: 'USD',
            },
            availableBalance: {
              amount: 3749.70,
              currency: 'USD',
            },
            createdDate: '2023-03-20T00:00:00Z',
            container: 'creditCard',
          },
        ],
        totalCount: 2,
      };
    }

    if (endpoint.startsWith('/accounts/')) {
      const accountId = endpoint.split('/')[2];
      return {
        account: [
          {
            id: accountId,
            accountName: 'Yodlee Account',
            accountNumber: 'XXXX1234',
            accountType: 'SAVINGS',
            accountStatus: 'ACTIVE',
            balance: {
              amount: 5250.75,
              currency: 'USD',
            },
            availableBalance: {
              amount: 5000.75,
              currency: 'USD',
            },
            createdDate: '2023-01-15T00:00:00Z',
            container: 'bank',
          },
        ],
      };
    }

    // Mock other endpoints as needed
    return {};
  }

  private mapYodleeAccountToFDX(yodleeAccount: any): Account {
    return {
      accountId: yodleeAccount.id,
      accountType: this.mapYodleeAccountType(yodleeAccount.accountType || yodleeAccount.container),
      accountNumber: yodleeAccount.accountNumber,
      accountName: yodleeAccount.accountName,
      status: this.mapYodleeAccountStatus(yodleeAccount.accountStatus),
      balance: {
        amount: yodleeAccount.balance?.amount || 0,
        currency: yodleeAccount.balance?.currency || 'USD',
      },
      availableBalance: yodleeAccount.availableBalance ? {
        amount: yodleeAccount.availableBalance.amount,
        currency: yodleeAccount.availableBalance.currency,
      } : undefined,
      openedDate: yodleeAccount.createdDate ? yodleeAccount.createdDate.split('T')[0] : undefined,
    };
  }

  private mapYodleeAccountType(yodleeType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      'SAVINGS': 'SAVINGS',
      'CHECKING': 'CHECKING',
      'CREDIT_CARD': 'CREDIT_CARD',
      'creditCard': 'CREDIT_CARD',
      'bank': 'CHECKING',
      'investment': 'INVESTMENT',
      'LOAN': 'LOAN',
    };
    
    return typeMap[yodleeType] || 'CHECKING';
  }

  private mapYodleeAccountStatus(yodleeStatus: string): AccountStatus {
    const statusMap: Record<string, AccountStatus> = {
      'ACTIVE': 'ACTIVE',
      'INACTIVE': 'INACTIVE',
      'CLOSED': 'CLOSED',
    };
    
    return statusMap[yodleeStatus] || 'ACTIVE';
  }

  private mapYodleeTransactionToFDX(yodleeTransaction: any): Transaction {
    // This would map Yodlee transaction format to FDX format
    return {
      transactionId: yodleeTransaction.id,
      accountId: yodleeTransaction.accountId,
      amount: {
        amount: yodleeTransaction.amount?.amount || 0,
        currency: yodleeTransaction.amount?.currency || 'USD',
      },
      description: yodleeTransaction.description?.original || 'Transaction',
      transactionDate: yodleeTransaction.date || new Date().toISOString(),
      postedDate: yodleeTransaction.date || new Date().toISOString(),
      status: 'POSTED',
      merchantName: yodleeTransaction.merchant?.name,
      category: yodleeTransaction.category?.[0]?.categoryName,
    };
  }

  private mapYodleeStatementToFDX(yodleeStatement: any): Statement {
    // This would map Yodlee statement format to FDX format
    return {
      statementId: yodleeStatement.id,
      accountId: yodleeStatement.accountId,
      statementDate: yodleeStatement.statementDate || new Date().toISOString(),
      status: 'AVAILABLE',
      beginDate: yodleeStatement.billingPeriodStart,
      endDate: yodleeStatement.billingPeriodEnd,
      downloadUrl: yodleeStatement.downloadUrl,
    };
  }
}