#!/usr/bin/env node
/**
 * MCP Server Entry Point
 *
 * This server provides Model Context Protocol (MCP) access to the FDX Resource API,
 * enabling AI agents to interact with financial data through standardized tools.
 *
 * The server uses stdio transport for communication with MCP clients.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';

// Import services and repositories
import { AccountsService } from '../domain/services/accounts.service.js';
import { TransactionsService } from '../domain/services/transactions.service.js';
import { ContactService } from '../domain/services/contact.service.js';
import { PaymentNetworksService } from '../domain/services/payment-networks.service.js';
import { StatementsService } from '../domain/services/statements.service.js';
import { ConsentService } from '../domain/services/consent.service.js';

// Import repositories
import { MockAccountRepository } from '../infra/repositories/accounts.repo.mock.js';
import { MockTransactionRepository } from '../infra/repositories/transactions.repo.mock.js';
import { MockContactRepository } from '../infra/repositories/contact.repo.mock.js';
import { MockPaymentNetworkRepository } from '../infra/repositories/payment-networks.repo.mock.js';
import { MockStatementRepository } from '../infra/repositories/statements.repo.mock.js';
import { MockConsentRepository } from '../infra/repositories/consent.repo.mock.js';

async function main() {
  // Initialize repositories
  const accountRepository = new MockAccountRepository();
  const transactionRepository = new MockTransactionRepository();
  const contactRepository = new MockContactRepository();
  const paymentNetworkRepository = new MockPaymentNetworkRepository();
  const statementRepository = new MockStatementRepository();
  const consentRepository = new MockConsentRepository();

  // Seed consent repository with test data
  consentRepository.seedTestData();

  // Initialize services
  const accountsService = new AccountsService(accountRepository);
  const transactionsService = new TransactionsService(transactionRepository, accountRepository);
  const contactService = new ContactService(contactRepository, accountRepository);
  const paymentNetworksService = new PaymentNetworksService(
    paymentNetworkRepository,
    accountRepository,
  );
  const statementsService = new StatementsService(statementRepository, accountRepository);
  const consentService = new ConsentService(consentRepository);

  // Create MCP server with all services
  const server = createMcpServer(
    accountsService,
    transactionsService,
    contactService,
    paymentNetworksService,
    statementsService,
    consentService,
  );

  // Set up stdio transport
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('FDX Resource API MCP Server running on stdio');
  console.error('Available tools:');
  console.error('  - health_check: Check API health status');
  console.error('  - get_accounts: List user accounts');
  console.error('  - get_account_by_id: Get specific account details');
  console.error('  - get_transactions: Get account transactions');
  console.error('  - get_account_contact: Get account contact info');
  console.error('  - get_payment_networks: Get payment network info');
  console.error('  - get_statements: List account statements');
  console.error('  - get_statement_by_id: Get specific statement details');
  console.error('  - create_consent: Create a consent request');
  console.error('  - get_consent: Get consent details');
  console.error('  - update_consent: Update consent status');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch(error => {
  console.error('Fatal error starting MCP server:', error);
  process.exit(1);
});
