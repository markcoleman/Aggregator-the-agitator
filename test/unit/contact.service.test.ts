import { describe, it, expect, beforeEach } from 'vitest';
import { ContactService } from '../../src/domain/services/contact.service.js';
import { MockContactRepository } from '../../src/infra/repositories/contact.repo.mock.js';
import { MockAccountRepository } from '../../src/infra/repositories/accounts.repo.mock.js';

describe('ContactService', () => {
  let contactService: ContactService;
  let mockContactRepository: MockContactRepository;
  let mockAccountRepository: MockAccountRepository;

  beforeEach(() => {
    mockContactRepository = new MockContactRepository();
    mockAccountRepository = new MockAccountRepository();
    contactService = new ContactService(mockContactRepository, mockAccountRepository);
  });

  describe('getAccountContact', () => {
    it('should return contact when user has proper scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['contact:read'];

      const result = await contactService.getAccountContact(accountId, userId, scopes);

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
    });

    it('should throw error when user lacks required scope', async () => {
      const accountId = 'acc-001';
      const userId = 'user123';
      const scopes = ['some:other:scope'];

      await expect(
        contactService.getAccountContact(accountId, userId, scopes),
      ).rejects.toThrow('Missing required scope: contact:read');
    });

    it('should throw error for non-existent account', async () => {
      const accountId = 'non-existent';
      const userId = 'user123';
      const scopes = ['contact:read'];

      await expect(
        contactService.getAccountContact(accountId, userId, scopes),
      ).rejects.toThrow('Account non-existent not found');
    });

    it('should throw error for non-existent contact', async () => {
      const accountId = 'acc-999'; // Account exists but no contact
      const userId = 'user123';
      const scopes = ['contact:read'];

      await expect(
        contactService.getAccountContact(accountId, userId, scopes),
      ).rejects.toThrow('Contact information for account acc-999 not found');
    });
  });
});