import { PaymentNetworkRepository } from './payment-networks.repo.mock.js';
import { PaymentNetworksResponse } from '../../domain/entities/payment-network.js';
import { BaseAggregator } from '../aggregators/base.aggregator.js';

/**
 * Payment Network repository implementation that uses an aggregator
 */
export class AggregatorPaymentNetworkRepository implements PaymentNetworkRepository {
  constructor(private aggregator: BaseAggregator) {}

  async findByAccountId(accountId: string, userId: string): Promise<PaymentNetworksResponse> {
    const paymentNetworks = await this.aggregator.getPaymentNetworks(accountId, userId);

    return {
      paymentNetworks,
    };
  }
}