import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AccountsService } from '../domain/services/accounts.service.js';
import { TransactionsService } from '../domain/services/transactions.service.js';
import { ContactService } from '../domain/services/contact.service.js';
import { PaymentNetworksService } from '../domain/services/payment-networks.service.js';
import { StatementsService } from '../domain/services/statements.service.js';
import { ConsentService } from '../domain/services/consent.service.js';

/**
 * Creates and configures an MCP server for the FDX Resource API.
 * This enables AI agents to interact with the financial data API through standardized MCP tools.
 */
export function createMcpServer(
  accountsService: AccountsService,
  transactionsService: TransactionsService,
  contactService: ContactService,
  paymentNetworksService: PaymentNetworksService,
  statementsService: StatementsService,
  consentService: ConsentService,
): McpServer {
  const server = new McpServer(
    {
      name: 'fdx-resource-api',
      version: '6.0.0',
      description: 'FDX-aligned REST API for financial data aggregation',
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    },
  );

  // Register health check tool
  server.tool('health_check', 'Check the health status of the API', {}, async () => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'ok',
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  });

  // Register accounts tools
  server.tool(
    'get_accounts',
    'Get a list of user accounts',
    {
      userId: z.string().describe('The ID of the user whose accounts to retrieve'),
      limit: z.number().optional().describe('Maximum number of accounts to return (default: 25)'),
      offset: z.number().optional().describe('Number of accounts to skip (default: 0)'),
    },
    async ({ userId, limit, offset }) => {
      try {
        const result = await accountsService.getAccounts(
          userId,
          ['accounts:read'],
          limit || 25,
          offset || 0,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'get_account_by_id',
    'Get details of a specific account by ID',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account to retrieve'),
    },
    async ({ userId, accountId }) => {
      try {
        const result = await accountsService.getAccountById(accountId, userId, ['accounts:read']);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register transactions tool
  server.tool(
    'get_transactions',
    'Get transactions for a specific account',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account'),
      fromDate: z.string().optional().describe('Start date for transactions (ISO 8601 format)'),
      toDate: z.string().optional().describe('End date for transactions (ISO 8601 format)'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of transactions to return (default: 25)'),
      offset: z.number().optional().describe('Number of transactions to skip (default: 0)'),
    },
    async ({ userId, accountId, fromDate, toDate, limit, offset }) => {
      try {
        const result = await transactionsService.getTransactions(
          accountId,
          userId,
          ['transactions:read'],
          fromDate,
          toDate,
          limit || 25,
          offset || 0,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register contact tool
  server.tool(
    'get_account_contact',
    'Get contact information for an account',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account'),
    },
    async ({ userId, accountId }) => {
      try {
        const result = await contactService.getAccountContact(accountId, userId, ['contact:read']);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register payment networks tool
  server.tool(
    'get_payment_networks',
    'Get payment network information for an account',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account'),
    },
    async ({ userId, accountId }) => {
      try {
        const result = await paymentNetworksService.getPaymentNetworks(accountId, userId, [
          'payment_networks:read',
        ]);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register statements tools
  server.tool(
    'get_statements',
    'Get a list of statements for an account',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account'),
      limit: z.number().optional().describe('Maximum number of statements to return (default: 25)'),
      offset: z.number().optional().describe('Number of statements to skip (default: 0)'),
    },
    async ({ userId, accountId, limit, offset }) => {
      try {
        const result = await statementsService.getStatements(
          accountId,
          userId,
          ['statements:read'],
          limit || 25,
          offset || 0,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'get_statement_by_id',
    'Get details of a specific statement',
    {
      userId: z.string().describe('The ID of the user who owns the account'),
      accountId: z.string().describe('The ID of the account'),
      statementId: z.string().describe('The ID of the statement to retrieve'),
    },
    async ({ userId, accountId, statementId }) => {
      try {
        const result = await statementsService.getStatementById(accountId, statementId, userId, [
          'statements:read',
        ]);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Register consent tools
  server.tool(
    'create_consent',
    'Create a new consent request for data sharing',
    {
      subjectId: z.string().describe('The ID of the user subject'),
      clientId: z.string().describe('The ID of the client application'),
      dataScopes: z
        .array(
          z.enum([
            'accounts:read',
            'transactions:read',
            'contact:read',
            'payment_networks:read',
            'statements:read',
          ]),
        )
        .describe('Array of data scopes requested'),
      accountIds: z.array(z.string()).describe('Array of account IDs to grant access to'),
      purpose: z.string().describe('Purpose of the consent request'),
      expiry: z.string().describe('Expiry date/time of the consent (ISO 8601 format)'),
    },
    async ({ subjectId, clientId, dataScopes, accountIds, purpose, expiry }) => {
      try {
        const result = await consentService.createConsent(
          {
            subjectId,
            clientId,
            dataScopes,
            accountIds,
            purpose,
            expiry,
          },
          clientId,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'get_consent',
    'Get details of a specific consent',
    {
      consentId: z.string().describe('The ID of the consent to retrieve'),
      userId: z.string().describe('The ID of the user (subject or client)'),
      requesterType: z
        .enum(['subject', 'client', 'admin'])
        .describe('Type of requester (subject, client, or admin)'),
    },
    async ({ consentId, userId, requesterType }) => {
      try {
        const result = await consentService.getConsent(consentId, userId, requesterType);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'update_consent',
    'Update the status of a consent (approve, suspend, resume, revoke)',
    {
      consentId: z.string().describe('The ID of the consent to update'),
      userId: z.string().describe('The ID of the user (subject or client)'),
      actorType: z
        .enum(['subject', 'client', 'admin'])
        .describe('Type of actor performing the update'),
      action: z
        .enum(['approve', 'suspend', 'resume', 'revoke'])
        .describe('Action to perform on the consent'),
      reason: z.string().optional().describe('Optional reason for the action'),
    },
    async ({ consentId, userId, actorType, action, reason }) => {
      try {
        const result = await consentService.updateConsent(
          consentId,
          { action, reason },
          userId,
          actorType,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: (error as Error).message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
