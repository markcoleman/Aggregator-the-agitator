import { Contact } from '../entities/contact.js';
import { ContactRepository } from '../../infra/repositories/contact.repo.mock.js';
import { AccountRepository } from '../../infra/repositories/accounts.repo.mock.js';
import { ForbiddenError } from '../../shared/errors/index.js';

export class ContactService {
  constructor(
    private contactRepository: ContactRepository,
    private accountRepository: AccountRepository,
  ) {}

  async getAccountContact(accountId: string, userId: string, scopes: string[]): Promise<Contact> {
    this.validateContactScope(scopes);

    // Verify account exists and belongs to user
    await this.accountRepository.findById(accountId, userId);

    return this.contactRepository.findByAccountId(accountId, userId);
  }

  private validateContactScope(scopes: string[]): void {
    if (!scopes.includes('contact:read')) {
      throw new ForbiddenError('Missing required scope: contact:read');
    }
  }
}
