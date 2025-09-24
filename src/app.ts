import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { appConfig } from './config/index.js';
import { AuthMiddleware } from './http/middleware/authz.js';
import { ConsentMiddleware } from './http/middleware/consent.js';

// Controllers
import { AccountsController } from './http/controllers/accounts.controller.js';
import { TransactionsController } from './http/controllers/transactions.controller.js';
import { ContactController } from './http/controllers/contact.controller.js';
import { PaymentNetworksController } from './http/controllers/payment-networks.controller.js';
import { StatementsController } from './http/controllers/statements.controller.js';
import { ConsentController } from './http/controllers/consent.controller.js';

// Services
import { AccountsService } from './domain/services/accounts.service.js';
import { TransactionsService } from './domain/services/transactions.service.js';
import { ContactService } from './domain/services/contact.service.js';
import { PaymentNetworksService } from './domain/services/payment-networks.service.js';
import { StatementsService } from './domain/services/statements.service.js';
import { ConsentService } from './domain/services/consent.service.js';

// Repositories
import { MockAccountRepository } from './infra/repositories/accounts.repo.mock.js';
import { MockTransactionRepository } from './infra/repositories/transactions.repo.mock.js';
import { MockContactRepository } from './infra/repositories/contact.repo.mock.js';
import { MockPaymentNetworkRepository } from './infra/repositories/payment-networks.repo.mock.js';
import { MockStatementRepository } from './infra/repositories/statements.repo.mock.js';
import { MockConsentRepository } from './infra/repositories/consent.repo.mock.js';

export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: appConfig.logging.level,
    },
  });

  // Register plugins
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register OpenAPI documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'FDX Resource API',
        description: 'FDX-aligned REST API for financial data aggregation',
        version: '6.0.0',
      },
      servers: [
        {
          url: `http://localhost:${appConfig.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
    transformSpecification: swaggerObject => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Initialize dependencies
  const authMiddleware = new AuthMiddleware();

  // Repositories
  const accountRepository = new MockAccountRepository();
  const transactionRepository = new MockTransactionRepository();
  const contactRepository = new MockContactRepository();
  const paymentNetworkRepository = new MockPaymentNetworkRepository();
  const statementRepository = new MockStatementRepository();
  const consentRepository = new MockConsentRepository();

  // Seed consent repository with test data
  consentRepository.seedTestData();

  // Services
  const accountsService = new AccountsService(accountRepository);
  const transactionsService = new TransactionsService(transactionRepository, accountRepository);
  const contactService = new ContactService(contactRepository, accountRepository);
  const paymentNetworksService = new PaymentNetworksService(
    paymentNetworkRepository,
    accountRepository,
  );
  const statementsService = new StatementsService(statementRepository, accountRepository);
  const consentService = new ConsentService(consentRepository);

  // Initialize middleware that depends on services
  const consentMiddleware = new ConsentMiddleware(consentService);

  // TODO: Use consentMiddleware in resource routes - currently prepared for integration
  // Temporary reference to avoid unused variable warning
  void consentMiddleware;

  // Controllers
  const accountsController = new AccountsController(accountsService);
  const transactionsController = new TransactionsController(transactionsService);
  const contactController = new ContactController(contactService);
  const paymentNetworksController = new PaymentNetworksController(paymentNetworksService);
  const statementsController = new StatementsController(statementsService);
  const consentController = new ConsentController(consentService);

  // Health check endpoint
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // Consent API routes (not under /fdx/v6)
  fastify.register(async function (fastify) {
    // Auth middleware for consent routes
    fastify.addHook('preHandler', authMiddleware.authenticate.bind(authMiddleware));

    // Consent routes
    fastify.post('/consent', {
      preHandler: [authMiddleware.requireScope('consent:write')],
      handler: consentController.createConsent.bind(consentController),
    });

    fastify.put('/consent/:consentId', {
      handler: consentController.updateConsent.bind(consentController),
    });

    fastify.get('/consent/:consentId', {
      handler: consentController.getConsent.bind(consentController),
    });
  });

  // Register routes with authentication
  fastify.register(async function (fastify) {
    // Auth middleware for all FDX routes
    fastify.addHook('preHandler', authMiddleware.authenticate.bind(authMiddleware));

    // Accounts routes
    fastify.get('/fdx/v6/accounts', {
      preHandler: [authMiddleware.requireScope('accounts:read')],
      handler: accountsController.getAccounts.bind(accountsController),
    });

    fastify.get('/fdx/v6/accounts/:accountId', {
      preHandler: [authMiddleware.requireScope('accounts:read')],
      handler: accountsController.getAccountById.bind(accountsController),
    });

    // Transactions routes
    fastify.get('/fdx/v6/accounts/:accountId/transactions', {
      preHandler: [authMiddleware.requireScope('transactions:read')],
      handler: transactionsController.getTransactions.bind(transactionsController),
    });

    // Contact routes
    fastify.get('/fdx/v6/accounts/:accountId/contact', {
      preHandler: [authMiddleware.requireScope('contact:read')],
      handler: contactController.getAccountContact.bind(contactController),
    });

    // Payment networks routes
    fastify.get('/fdx/v6/accounts/:accountId/payment-networks', {
      preHandler: [authMiddleware.requireScope('payment_networks:read')],
      handler: paymentNetworksController.getPaymentNetworks.bind(paymentNetworksController),
    });

    // Statements routes
    fastify.get('/fdx/v6/accounts/:accountId/statements', {
      preHandler: [authMiddleware.requireScope('statements:read')],
      handler: statementsController.getStatements.bind(statementsController),
    });

    fastify.get('/fdx/v6/accounts/:accountId/statements/:statementId', {
      preHandler: [authMiddleware.requireScope('statements:read')],
      handler: statementsController.getStatementById.bind(statementsController),
    });
  });

  return fastify;
}
