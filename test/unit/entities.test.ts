import { describe, it, expect } from 'vitest';
import { AccountSchema, AccountTypeEnum, AccountStatusEnum } from '../../src/domain/entities/account.js';
import { TransactionSchema, TransactionStatusEnum } from '../../src/domain/entities/transaction.js';
import { ContactSchema } from '../../src/domain/entities/contact.js';
import { PaymentNetworkSchema } from '../../src/domain/entities/payment-network.js';
import { StatementSchema, StatementStatusEnum } from '../../src/domain/entities/statement.js';

describe('Domain Entities', () => {
  describe('AccountSchema', () => {
    it('should validate a valid account', () => {
      const validAccount = {
        accountId: 'acc-001',
        accountType: 'CHECKING',
        accountNumber: '****1234',
        accountName: 'Primary Checking',
        status: 'ACTIVE',
        balance: { amount: 1000.0, currency: 'USD' },
      };

      const result = AccountSchema.parse(validAccount);
      expect(result).toEqual(validAccount);
    });

    it('should reject invalid account type', () => {
      const invalidAccount = {
        accountId: 'acc-001',
        accountType: 'INVALID_TYPE',
        accountNumber: '****1234',
        accountName: 'Primary Checking',
        status: 'ACTIVE',
        balance: { amount: 1000.0, currency: 'USD' },
      };

      expect(() => AccountSchema.parse(invalidAccount)).toThrow();
    });

    it('should reject missing required fields', () => {
      const incompleteAccount = {
        accountId: 'acc-001',
        accountType: 'CHECKING',
        // Missing required fields
      };

      expect(() => AccountSchema.parse(incompleteAccount)).toThrow();
    });
  });

  describe('AccountTypeEnum', () => {
    it('should validate valid account types', () => {
      expect(AccountTypeEnum.parse('CHECKING')).toBe('CHECKING');
      expect(AccountTypeEnum.parse('SAVINGS')).toBe('SAVINGS');
      expect(AccountTypeEnum.parse('CREDIT_CARD')).toBe('CREDIT_CARD');
      expect(AccountTypeEnum.parse('LOAN')).toBe('LOAN');
      expect(AccountTypeEnum.parse('INVESTMENT')).toBe('INVESTMENT');
    });

    it('should reject invalid account types', () => {
      expect(() => AccountTypeEnum.parse('INVALID')).toThrow();
    });
  });

  describe('AccountStatusEnum', () => {
    it('should validate valid account statuses', () => {
      expect(AccountStatusEnum.parse('ACTIVE')).toBe('ACTIVE');
      expect(AccountStatusEnum.parse('INACTIVE')).toBe('INACTIVE');
      expect(AccountStatusEnum.parse('CLOSED')).toBe('CLOSED');
    });
  });

  describe('TransactionSchema', () => {
    it('should validate a valid transaction', () => {
      const validTransaction = {
        transactionId: 'txn-001',
        accountId: 'acc-001',
        amount: { amount: -50.0, currency: 'USD' },
        description: 'Coffee Shop',
        transactionDate: '2024-01-15T10:30:00Z',
        status: 'POSTED',
      };

      const result = TransactionSchema.parse(validTransaction);
      expect(result).toEqual(validTransaction);
    });

    it('should validate transaction with optional fields', () => {
      const transactionWithOptionals = {
        transactionId: 'txn-001',
        accountId: 'acc-001',
        amount: { amount: -50.0, currency: 'USD' },
        description: 'Coffee Shop',
        merchantName: 'Starbucks',
        transactionDate: '2024-01-15T10:30:00Z',
        postedDate: '2024-01-15T10:30:00Z',
        status: 'POSTED',
        category: 'Food & Dining',
      };

      const result = TransactionSchema.parse(transactionWithOptionals);
      expect(result).toEqual(transactionWithOptionals);
    });
  });

  describe('TransactionStatusEnum', () => {
    it('should validate valid transaction statuses', () => {
      expect(TransactionStatusEnum.parse('PENDING')).toBe('PENDING');
      expect(TransactionStatusEnum.parse('POSTED')).toBe('POSTED');
      expect(TransactionStatusEnum.parse('CANCELLED')).toBe('CANCELLED');
    });
  });

  describe('ContactSchema', () => {
    it('should validate a valid contact', () => {
      const validContact = {
        name: 'John Doe',
        emailAddress: 'john@example.com',
        phoneNumber: '+1-555-123-4567',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'US',
        },
      };

      const result = ContactSchema.parse(validContact);
      expect(result).toEqual(validContact);
    });

    it('should validate contact with only required fields', () => {
      const minimalContact = {
        name: 'John Doe',
      };

      const result = ContactSchema.parse(minimalContact);
      expect(result).toEqual(minimalContact);
    });

    it('should reject invalid email', () => {
      const invalidContact = {
        name: 'John Doe',
        emailAddress: 'invalid-email',
      };

      expect(() => ContactSchema.parse(invalidContact)).toThrow();
    });
  });

  describe('PaymentNetworkSchema', () => {
    it('should validate a valid payment network', () => {
      const validPaymentNetwork = {
        networkId: 'net-001',
        networkName: 'ACH',
        accountNumber: '****1234',
        routingNumber: '021000021',
      };

      const result = PaymentNetworkSchema.parse(validPaymentNetwork);
      expect(result).toEqual(validPaymentNetwork);
    });

    it('should validate payment network without routing number', () => {
      const paymentNetworkWithoutRouting = {
        networkId: 'net-001',
        networkName: 'Visa',
        accountNumber: '****1234',
      };

      const result = PaymentNetworkSchema.parse(paymentNetworkWithoutRouting);
      expect(result).toEqual(paymentNetworkWithoutRouting);
    });
  });

  describe('StatementSchema', () => {
    it('should validate a valid statement', () => {
      const validStatement = {
        statementId: 'stmt-001',
        accountId: 'acc-001',
        statementDate: '2024-01-31',
        status: 'AVAILABLE',
        beginDate: '2024-01-01',
        endDate: '2024-01-31',
        downloadUrl: 'https://example.com/download/stmt-001',
      };

      const result = StatementSchema.parse(validStatement);
      expect(result).toEqual(validStatement);
    });

    it('should validate statement with only required fields', () => {
      const minimalStatement = {
        statementId: 'stmt-001',
        accountId: 'acc-001',
        statementDate: '2024-01-31',
        status: 'AVAILABLE',
      };

      const result = StatementSchema.parse(minimalStatement);
      expect(result).toEqual(minimalStatement);
    });
  });

  describe('StatementStatusEnum', () => {
    it('should validate valid statement statuses', () => {
      expect(StatementStatusEnum.parse('AVAILABLE')).toBe('AVAILABLE');
      expect(StatementStatusEnum.parse('PROCESSING')).toBe('PROCESSING');
      expect(StatementStatusEnum.parse('UNAVAILABLE')).toBe('UNAVAILABLE');
    });
  });
});