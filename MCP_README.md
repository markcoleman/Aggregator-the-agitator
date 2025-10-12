# MCP Server for FDX Resource API

This directory contains the Model Context Protocol (MCP) server implementation for the FDX Resource API. The MCP server enables AI agents to interact with financial data through standardized tools.

## Overview

The MCP server provides a bridge between AI agents and the FDX Resource API, exposing all API functionality through MCP tools. This allows agents to:

- Query financial account information
- Retrieve transaction data
- Access contact information
- Get payment network details
- Manage consent for data sharing
- View account statements

## Architecture

```
src/mcp/
├── server.ts      # MCP server configuration and tool registration
└── index.ts       # Entry point with stdio transport setup
```

## Available Tools

### Health & Status

- **health_check**: Check the health status of the API

### Account Management

- **get_accounts**: Get a list of user accounts
  - Parameters: `userId`, `limit?`, `offset?`
- **get_account_by_id**: Get details of a specific account
  - Parameters: `userId`, `accountId`

### Transactions

- **get_transactions**: Get transactions for a specific account
  - Parameters: `userId`, `accountId`, `fromDate?`, `toDate?`, `limit?`, `offset?`

### Contact Information

- **get_account_contact**: Get contact information for an account
  - Parameters: `userId`, `accountId`

### Payment Networks

- **get_payment_networks**: Get payment network information for an account
  - Parameters: `userId`, `accountId`

### Statements

- **get_statements**: Get a list of statements for an account
  - Parameters: `userId`, `accountId`, `limit?`, `offset?`
- **get_statement_by_id**: Get details of a specific statement
  - Parameters: `userId`, `accountId`, `statementId`

### Consent Management

- **create_consent**: Create a new consent request for data sharing
  - Parameters: `subjectId`, `clientId`, `dataScopes`, `accountIds`, `purpose`, `expiry`
- **get_consent**: Get details of a specific consent
  - Parameters: `consentId`, `userId`, `requesterType`
- **update_consent**: Update the status of a consent
  - Parameters: `consentId`, `userId`, `actorType`, `action`, `reason?`

## Installation & Setup

### Prerequisites

- Node.js 20 or higher
- TypeScript 5.x
- @modelcontextprotocol/sdk (automatically installed)

### Build

```bash
npm run build
```

### Running the MCP Server

#### Production Mode

```bash
npm run mcp
```

#### Development Mode (with hot reload)

```bash
npm run mcp:dev
```

## Configuration

The MCP server can be configured in your MCP client's configuration file. Example configuration:

```json
{
  "mcpServers": {
    "fdx-resource-api": {
      "command": "node",
      "args": ["dist/mcp/index.js"],
      "description": "FDX-aligned REST API for financial data aggregation"
    }
  }
}
```

Or for development:

```json
{
  "mcpServers": {
    "fdx-resource-api": {
      "command": "npx",
      "args": ["tsx", "src/mcp/index.ts"]
    }
  }
}
```

## Using with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fdx-resource-api": {
      "command": "node",
      "args": ["/absolute/path/to/Aggregator-the-agitator/dist/mcp/index.js"]
    }
  }
}
```

Then restart Claude Desktop and you'll see the FDX tools available in your conversation.

## Example Usage

Once connected to an MCP client (like Claude Desktop), you can use natural language to interact with the API:

```
"Show me all accounts for user user-123"
→ Uses get_accounts tool

"Get transactions for account acc-001 for user user-123"
→ Uses get_transactions tool

"Create a consent for user user-123 to access accounts:read for account acc-001"
→ Uses create_consent tool
```

## Development

### Project Structure

- **server.ts**: Contains the MCP server factory function `createMcpServer()` that registers all tools
- **index.ts**: Entry point that initializes services and starts the MCP server with stdio transport

### Adding New Tools

To add a new tool:

1. Add the tool registration in `src/mcp/server.ts`:

```typescript
server.tool(
  'tool_name',
  'Tool description',
  {
    param1: z.string().describe('Parameter description'),
    // ... more parameters
  },
  async ({ param1 }) => {
    try {
      const result = await someService.someMethod(param1);
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
```

2. Add corresponding tests in `test/unit/mcp/server.test.ts`

### Testing

Tests are located in `test/unit/mcp/`:

```bash
# Run all tests
npm test

# Run tests in CI mode
npm run test:ci

# Run with coverage
npm run test:coverage
```

### Best Practices

1. **Error Handling**: All tools should catch errors and return them in a structured format
2. **Input Validation**: Use Zod schemas for parameter validation
3. **Documentation**: Provide clear descriptions for tools and parameters
4. **Scopes**: Tools automatically include appropriate OAuth scopes for API calls
5. **Testing**: Maintain high test coverage (>90%)

## Security Considerations

- The MCP server operates with mock data in the current implementation
- In production, ensure proper authentication and authorization
- Sensitive data should be handled according to security policies
- Audit logging is recommended for all operations

## Troubleshooting

### Server Won't Start

- Ensure all dependencies are installed: `npm install`
- Build the project: `npm run build`
- Check for TypeScript errors: `npm run typecheck`

### Tools Not Working

- Verify the MCP client is properly configured
- Check stderr output for error messages (stdout is used for MCP protocol)
- Ensure services are properly initialized

### Performance Issues

- Monitor tool execution times
- Consider pagination for large datasets
- Check mock repository performance

## Contributing

When contributing MCP server functionality:

1. Follow existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Ensure >90% test coverage
5. Run linting and formatting: `npm run lint:fix && npm run format`

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [FDX API Specification](https://financialdataexchange.org/)

## License

MIT License - see [LICENSE](LICENSE) file for details.
