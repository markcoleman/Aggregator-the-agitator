import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { AggregatorFactory } from '../../src/infra/aggregators/aggregator.factory.js';
import { MockAggregator } from '../../src/infra/aggregators/mock.aggregator.js';
import { YodleeAggregator } from '../../src/infra/aggregators/yodlee/yodlee.aggregator.js';
import { appConfig } from '../../src/config/index.js';

// Mock the config
vi.mock('../../src/config/index.js', () => ({
  appConfig: {
    aggregator: {
      provider: 'mock',
      yodlee: {
        baseUrl: 'https://sandbox.api.yodlee.com',
        clientId: 'test-client',
        clientSecret: 'test-secret',
      },
    },
  },
}));

describe('Aggregator Factory', () => {
  beforeEach(() => {
    AggregatorFactory.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should create MockAggregator when provider is mock', async () => {
    vi.mocked(appConfig).aggregator.provider = 'mock';
    
    const aggregator = await AggregatorFactory.getAggregator();
    
    expect(aggregator).toBeInstanceOf(MockAggregator);
  });

  test('should create YodleeAggregator when provider is yodlee', async () => {
    vi.mocked(appConfig).aggregator.provider = 'yodlee';
    
    const aggregator = await AggregatorFactory.getAggregator();
    
    expect(aggregator).toBeInstanceOf(YodleeAggregator);
  });

  test('should return same instance on subsequent calls (singleton)', async () => {
    vi.mocked(appConfig).aggregator.provider = 'mock';
    
    const aggregator1 = await AggregatorFactory.getAggregator();
    const aggregator2 = await AggregatorFactory.getAggregator();
    
    expect(aggregator1).toBe(aggregator2);
  });

  test('should throw error for unsupported provider', async () => {
    // @ts-expect-error - Testing invalid provider
    vi.mocked(appConfig).aggregator.provider = 'invalid';
    
    await expect(AggregatorFactory.getAggregator()).rejects.toThrow(
      'Unsupported aggregator provider: invalid'
    );
  });

  test('should throw error when yodlee config is missing', async () => {
    vi.mocked(appConfig).aggregator.provider = 'yodlee';
    vi.mocked(appConfig).aggregator.yodlee = undefined;
    
    await expect(AggregatorFactory.getAggregator()).rejects.toThrow(
      'Yodlee configuration is required when using Yodlee aggregator'
    );
  });
});

describe('MockAggregator', () => {
  let aggregator: MockAggregator;

  beforeEach(async () => {
    aggregator = new MockAggregator();
    await aggregator.initialize();
  });

  test('should initialize successfully', async () => {
    await expect(aggregator.initialize()).resolves.not.toThrow();
  });

  test('should get accounts', async () => {
    const result = await aggregator.getAccounts('user-123', 10, 0);
    
    expect(result).toHaveProperty('accounts');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.accounts)).toBe(true);
  });

  test('should get account by id', async () => {
    const account = await aggregator.getAccount('acc-001', 'user-123');
    
    expect(account).toHaveProperty('accountId');
    expect(account).toHaveProperty('accountName');
    expect(account).toHaveProperty('balance');
  });

  test('should get transactions', async () => {
    const transactions = await aggregator.getTransactions('acc-001', 'user-123', 10, 0);
    
    expect(Array.isArray(transactions)).toBe(true);
  });

  test('should get contact', async () => {
    const contact = await aggregator.getContact('acc-001', 'user-123');
    
    expect(contact).toHaveProperty('name');
  });

  test('should get payment networks', async () => {
    const networks = await aggregator.getPaymentNetworks('acc-001', 'user-123');
    
    expect(Array.isArray(networks)).toBe(true);
  });

  test('should get statements', async () => {
    const statements = await aggregator.getStatements('acc-001', 'user-123', 10, 0);
    
    expect(Array.isArray(statements)).toBe(true);
  });
});

describe('YodleeAggregator', () => {
  let aggregator: YodleeAggregator;

  beforeEach(async () => {
    aggregator = new YodleeAggregator({
      baseUrl: 'https://sandbox.api.yodlee.com',
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });
    
    // Mock console.log to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await aggregator.initialize();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should initialize and authenticate', async () => {
    await expect(aggregator.initialize()).resolves.not.toThrow();
  });

  test('should get accounts with Yodlee format', async () => {
    const result = await aggregator.getAccounts('user-123', 10, 0);
    
    expect(result).toHaveProperty('accounts');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.accounts)).toBe(true);
    
    if (result.accounts.length > 0) {
      const account = result.accounts[0];
      expect(account).toHaveProperty('accountId');
      expect(account).toHaveProperty('accountName');
      expect(account).toHaveProperty('balance');
    }
  });

  test('should get account by id', async () => {
    const account = await aggregator.getAccount('yodlee-acc-001', 'user-123');
    
    expect(account).toHaveProperty('accountId', 'yodlee-acc-001');
    expect(account).toHaveProperty('accountName');
    expect(account).toHaveProperty('balance');
  });

  test('should get contact with formatted data', async () => {
    const contact = await aggregator.getContact('yodlee-acc-001', 'user-123');
    
    expect(contact).toHaveProperty('name');
    expect(contact).toHaveProperty('phoneNumber');
    expect(contact).toHaveProperty('emailAddress');
    expect(contact).toHaveProperty('address');
  });

  test('should get payment networks based on account type', async () => {
    const networks = await aggregator.getPaymentNetworks('yodlee-acc-002', 'user-123');
    
    expect(Array.isArray(networks)).toBe(true);
    
    if (networks.length > 0) {
      const network = networks[0];
      expect(network).toHaveProperty('networkId');
      expect(network).toHaveProperty('networkName');
      expect(network).toHaveProperty('accountNumber');
    }
  });

  test('should handle authentication properly', async () => {
    // Test re-authentication
    await expect(aggregator.initialize()).resolves.not.toThrow();
  });
});