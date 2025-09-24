import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentNetworksService } from '../../src/domain/services/payment-networks.service.js';
import { MockPaymentNetworkRepository } from '../../src/infra/repositories/payment-networks.repo.mock.js';
import { MockAccountRepository } from '../../src/infra/repositories/accounts.repo.mock.js';

describe('PaymentNetworksService', () => {
  let paymentNetworksService: PaymentNetworksService;
  let mockPaymentNetworkRepository: MockPaymentNetworkRepository;
  let mockAccountRepository: MockAccountRepository;

  beforeEach(() => {
    mockPaymentNetworkRepository = new MockPaymentNetworkRepository();
    mockAccountRepository = new MockAccountRepository();
    paymentNetworksService = new PaymentNetworksService(
      mockPaymentNetworkRepository,
      mockAccountRepository,
    );
  });

  describe('getPaymentNetworks', () => {
    it('should return payment networks when user has proper scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['payment_networks:read'];

      const result = await paymentNetworksService.getPaymentNetworks(
        accountId,
        userId,
        scopes,
      );

      expect(result).toBeDefined();
      expect(result.paymentNetworks).toBeDefined();
      expect(Array.isArray(result.paymentNetworks)).toBe(true);
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        paymentNetworksService.getPaymentNetworks(accountId, userId, scopes),
      ).rejects.toThrow('Missing required scope: payment_networks:read');
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const userId = 'user123';
      const scopes = ['payment_networks:read'];

      await expect(
        paymentNetworksService.getPaymentNetworks(accountId, userId, scopes),
      ).rejects.toThrow('Account non-existent not found');
    });

    it('should return empty array for account with no payment networks', async () => {
      const accountId = 'acc-999'; // Account exists but no payment networks
      const userId = 'user123';
      const scopes = ['payment_networks:read'];

      const result = await paymentNetworksService.getPaymentNetworks(
        accountId,
        userId,
        scopes,
      );

      expect(result.paymentNetworks).toEqual([]);
    });
  });
});