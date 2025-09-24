import { Contact } from '../../domain/entities/contact.js';
import { NotFoundError } from '../../shared/errors/index.js';

export interface ContactRepository {
  findByAccountId(accountId: string, userId: string): Promise<Contact>;
}

export class MockContactRepository implements ContactRepository {
  private mockContacts: Record<string, Contact> = {
    'acc-001': {
      name: 'John Smith',
      emailAddress: 'john.smith@example.com',
      phoneNumber: '+1-555-123-4567',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    },
    'acc-002': {
      name: 'John Smith',
      emailAddress: 'john.smith@example.com',
      phoneNumber: '+1-555-123-4567',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    },
    'acc-003': {
      name: 'John Smith',
      emailAddress: 'john.smith@example.com',
      phoneNumber: '+1-555-123-4567',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    },
    'acc-004': {
      name: 'John Smith',
      emailAddress: 'john.smith@example.com',
      phoneNumber: '+1-555-123-4567',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US',
      },
    },
  };

  async findByAccountId(accountId: string, _userId: string): Promise<Contact> {
    const contact = this.mockContacts[accountId];

    if (!contact) {
      throw new NotFoundError(`Contact information for account ${accountId} not found`);
    }

    return contact;
  }
}
