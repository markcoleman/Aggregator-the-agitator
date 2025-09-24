import { PaymentNetwork, PaymentNetworksResponse } from '../../domain/entities/payment-network.js';

export interface PaymentNetworkRepository {
  findByAccountId(accountId: string, userId: string): Promise<PaymentNetworksResponse>;
}

export class MockPaymentNetworkRepository implements PaymentNetworkRepository {
  private mockPaymentNetworks: Record<string, PaymentNetwork[]> = {
    'acc-001': [
      {
        networkId: 'ach-001',
        networkName: 'ACH',
        accountNumber: '****1234',
        routingNumber: '021000021',
      },
      {
        networkId: 'wire-001',
        networkName: 'Wire Transfer',
        accountNumber: '****1234',
        routingNumber: '021000021',
      },
    ],
    'acc-002': [
      {
        networkId: 'ach-002',
        networkName: 'ACH',
        accountNumber: '****5678',
        routingNumber: '021000021',
      },
    ],
    'acc-003': [
      {
        networkId: 'card-001',
        networkName: 'Visa',
        accountNumber: '****9012',
      },
    ],
    'acc-004': [
      {
        networkId: 'ach-004',
        networkName: 'ACH',
        accountNumber: '****3456',
        routingNumber: '021000021',
      },
    ],
  };

  async findByAccountId(accountId: string, _userId: string): Promise<PaymentNetworksResponse> {
    const paymentNetworks = this.mockPaymentNetworks[accountId] || [];

    return {
      paymentNetworks,
    };
  }
}
