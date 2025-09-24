import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AccountsController } from '../../src/http/controllers/accounts.controller.js';
import { TransactionsController } from '../../src/http/controllers/transactions.controller.js';
import { ContactController } from '../../src/http/controllers/contact.controller.js';
import { PaymentNetworksController } from '../../src/http/controllers/payment-networks.controller.js';
import { StatementsController } from '../../src/http/controllers/statements.controller.js';
import { NotFoundError, ValidationError } from '../../src/shared/errors/index.js';

// Mock services
const mockAccountsService = {
  getAccounts: vi.fn(),
  getAccountById: vi.fn(),
};

const mockTransactionsService = {
  getTransactions: vi.fn(),
};

const mockContactService = {
  getAccountContact: vi.fn(),
};

const mockPaymentNetworksService = {
  getPaymentNetworks: vi.fn(),
};

const mockStatementsService = {
  getStatements: vi.fn(),
  getStatementById: vi.fn(),
};

describe('Controllers Error Handling', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      user: {
        userId: 'user123',
        payload: {
          sub: 'user123',
          scope:
            'accounts:read transactions:read contact:read payment_networks:read statements:read',
          aud: 'fdx-resource-api',
          iss: 'mock-issuer',
        },
      },
      query: {},
      params: {},
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('AccountsController', () => {
    let controller: AccountsController;

    beforeEach(() => {
      controller = new AccountsController(mockAccountsService as any);
    });

    it('should handle validation errors in getAccounts', async () => {
      mockRequest.query = { limit: 'invalid' };

      await controller.getAccounts(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
        }),
      );
    });

    it('should handle validation errors in getAccountById', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getAccountById(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle unexpected errors', async () => {
      mockAccountsService.getAccounts.mockRejectedValue(new Error('Unexpected error'));

      await controller.getAccounts(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        }),
      );
    });
  });

  describe('TransactionsController', () => {
    let controller: TransactionsController;

    beforeEach(() => {
      controller = new TransactionsController(mockTransactionsService as any);
    });

    it('should handle validation errors', async () => {
      mockRequest.query = { limit: 'invalid' };
      mockRequest.params = { accountId: 'acc-001' };

      await controller.getTransactions(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockTransactionsService.getTransactions.mockRejectedValue(new Error('Unexpected error'));

      await controller.getTransactions(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('ContactController', () => {
    let controller: ContactController;

    beforeEach(() => {
      controller = new ContactController(mockContactService as any);
    });

    it('should handle validation errors', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getAccountContact(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockContactService.getAccountContact.mockRejectedValue(new Error('Unexpected error'));

      await controller.getAccountContact(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('PaymentNetworksController', () => {
    let controller: PaymentNetworksController;

    beforeEach(() => {
      controller = new PaymentNetworksController(mockPaymentNetworksService as any);
    });

    it('should handle validation errors', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getPaymentNetworks(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle unexpected errors', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockPaymentNetworksService.getPaymentNetworks.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await controller.getPaymentNetworks(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('StatementsController', () => {
    let controller: StatementsController;

    beforeEach(() => {
      controller = new StatementsController(mockStatementsService as any);
    });

    it('should handle validation errors in getStatements', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getStatements(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle validation errors in getStatementById', async () => {
      mockRequest.params = { accountId: 'acc-001' }; // Missing statementId

      await controller.getStatementById(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle unexpected errors in getStatements', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockStatementsService.getStatements.mockRejectedValue(new Error('Unexpected error'));

      await controller.getStatements(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });

    it('should handle unexpected errors in getStatementById', async () => {
      mockRequest.params = { accountId: 'acc-001', statementId: 'stmt-001' };
      mockStatementsService.getStatementById.mockRejectedValue(new Error('Unexpected error'));

      await controller.getStatementById(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
    });
  });

  describe('AccountsController', () => {
    let controller: AccountsController;

    beforeEach(() => {
      controller = new AccountsController(mockAccountsService as any);
    });

    it('should handle malformed query parameters in getAccounts', async () => {
      mockRequest.query = { limit: 'not-a-number' };
      mockRequest.params = {};

      await controller.getAccounts(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle missing accountId parameter in getAccountById', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getAccountById(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle service returning null in getAccountById', async () => {
      mockRequest.params = { accountId: 'non-existent' };
      const notFoundError = new NotFoundError('Account not found');
      mockAccountsService.getAccountById.mockRejectedValue(notFoundError);

      await controller.getAccountById(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
    });
  });

  describe('TransactionsController', () => {
    let controller: TransactionsController;

    beforeEach(() => {
      controller = new TransactionsController(mockTransactionsService as any);
    });

    it('should handle malformed date parameters', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockRequest.query = { fromDate: 'invalid-date' };

      const validationError = new ValidationError('Invalid fromDate format. Use YYYY-MM-DD');
      mockTransactionsService.getTransactions.mockRejectedValue(validationError);

      await controller.getTransactions(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle missing accountId parameter', async () => {
      mockRequest.params = {}; // Missing accountId
      mockRequest.query = {};

      await controller.getTransactions(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });
  });

  describe('ContactController', () => {
    let controller: ContactController;

    beforeEach(() => {
      controller = new ContactController(mockContactService as any);
    });

    it('should handle missing accountId parameter', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getAccountContact(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle service returning null', async () => {
      mockRequest.params = { accountId: 'non-existent' };
      const notFoundError = new NotFoundError('Contact not found');
      mockContactService.getAccountContact.mockRejectedValue(notFoundError);

      await controller.getAccountContact(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
    });
  });

  describe('PaymentNetworksController', () => {
    let controller: PaymentNetworksController;

    beforeEach(() => {
      controller = new PaymentNetworksController(mockPaymentNetworksService as any);
    });

    it('should handle missing accountId parameter', async () => {
      mockRequest.params = {}; // Missing accountId

      await controller.getPaymentNetworks(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
    });

    it('should handle service returning empty array', async () => {
      mockRequest.params = { accountId: 'acc-001' };
      mockPaymentNetworksService.getPaymentNetworks.mockResolvedValue([]);

      await controller.getPaymentNetworks(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith([]);
    });
  });
});
