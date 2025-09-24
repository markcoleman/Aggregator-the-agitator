import { PaymentNetworksResponse } from '../entities/payment-network.js';
import { PaymentNetworkRepository } from '../../infra/repositories/payment-networks.repo.mock.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError } from '../../shared/errors/index.js';

export class PaymentNetworksService {
  constructor(
    private paymentNetworkRepository: PaymentNetworkRepository,
    private accountRepository: AccountRepository,
  ) {}

  async getPaymentNetworks(
    accountId: string,
    userId: string,
    scopes: string[],
  ): Promise<PaymentNetworksResponse> {
    this.validatePaymentNetworksScope(scopes);

    // Verify account exists and belongs to user
    await this.accountRepository.findById(accountId, userId);

    return this.paymentNetworkRepository.findByAccountId(accountId, userId);
  }

  private validatePaymentNetworksScope(scopes: string[]): void {
    if (!scopes.includes('payment_networks:read')) {
      throw new ForbiddenError('Missing required scope: payment_networks:read');
    }
  }
}
