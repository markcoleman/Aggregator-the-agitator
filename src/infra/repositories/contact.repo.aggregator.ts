import { ContactRepository } from './contact.repo.mock.js';
import { Contact } from '../../domain/entities/contact.js';
import { BaseAggregator } from '../aggregators/base.aggregator.js';

/**
 * Contact repository implementation that uses an aggregator
 */
export class AggregatorContactRepository implements ContactRepository {
  constructor(private aggregator: BaseAggregator) {}

  async findByAccountId(accountId: string, userId: string): Promise<Contact> {
    return this.aggregator.getContact(accountId, userId);
  }
}