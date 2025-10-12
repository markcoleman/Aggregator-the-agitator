# MCP Server Architecture

## Overview

The MCP (Model Context Protocol) server provides a standardized interface for AI agents to interact with the FDX Resource API.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent / Client                         │
│              (e.g., Claude Desktop, Custom Agent)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MCP Protocol (stdio/SSE)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       MCP Server Layer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            src/mcp/index.ts (Entry Point)                │   │
│  │  - Initializes services                                  │   │
│  │  - Sets up stdio transport                               │   │
│  │  - Handles graceful shutdown                             │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │       src/mcp/server.ts (Tool Registration)             │   │
│  │                                                           │   │
│  │  Tools:                                                   │   │
│  │  • health_check                                           │   │
│  │  • get_accounts, get_account_by_id                        │   │
│  │  • get_transactions                                       │   │
│  │  • get_account_contact                                    │   │
│  │  • get_payment_networks                                   │   │
│  │  • get_statements, get_statement_by_id                    │   │
│  │  • create_consent, get_consent, update_consent            │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                   Domain Services Layer                          │
│  ┌──────────────┬───────────────┬────────────────┬──────────┐  │
│  │  Accounts    │ Transactions  │   Contact      │ Consent  │  │
│  │  Service     │   Service     │   Service      │ Service  │  │
│  └──────┬───────┴───────┬───────┴────────┬───────┴────┬─────┘  │
│         │               │                │            │         │
│  ┌──────▼───────┬───────▼────────┬───────▼────────┬──▼─────┐  │
│  │ Payment      │  Statements    │                │         │  │
│  │ Networks     │   Service      │  ... more      │         │  │
│  │ Service      │                │                │         │  │
│  └──────────────┴────────────────┴────────────────┴─────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                  Repository Layer (Data Access)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   MockAccountRepository, MockTransactionRepository, etc.  │  │
│  │   (In production: Real database repositories)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Flow

### Example: Get Accounts Tool

```
1. AI Agent sends MCP request:
   {
     "method": "tools/call",
     "params": {
       "name": "get_accounts",
       "arguments": {
         "userId": "user-123",
         "limit": 10
       }
     }
   }

2. MCP Server receives request via stdio

3. Tool handler executes:
   - Calls accountsService.getAccounts()
   - Passes required scopes: ['accounts:read']

4. Service layer:
   - Validates scopes
   - Calls repository

5. Repository returns data

6. MCP Server formats response:
   {
     "content": [{
       "type": "text",
       "text": "{...account data JSON...}"
     }]
   }

7. Response sent back to AI Agent via stdio
```

## Key Features

### 1. Tool Registration
Each API endpoint is exposed as an MCP tool with:
- **Name**: Descriptive tool name (e.g., `get_accounts`)
- **Description**: What the tool does
- **Parameters**: Zod schema for type-safe input validation
- **Handler**: Async function that calls the appropriate service

### 2. Error Handling
All tools include proper error handling:
```typescript
try {
  const result = await service.method(...);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
    isError: true
  };
}
```

### 3. Scope Management
Tools automatically include required OAuth scopes:
- `accounts:read` for account operations
- `transactions:read` for transactions
- `contact:read` for contact info
- etc.

### 4. Type Safety
- Uses Zod for runtime parameter validation
- TypeScript for compile-time type checking
- Service layer validates business rules

## Benefits

### For AI Agents
- **Standardized Interface**: Uses MCP protocol for consistent interactions
- **Type-Safe**: Parameter validation prevents errors
- **Discoverable**: Tools are automatically listed by MCP clients
- **Error Handling**: Clear error messages for debugging

### For Developers
- **Separation of Concerns**: MCP layer is independent of core API
- **Testable**: Services can be tested without MCP protocol
- **Maintainable**: Adding new tools is straightforward
- **Extensible**: Easy to add new tools or modify existing ones

## Testing Strategy

### Unit Tests
- Test tool registration
- Verify service integration
- Validate error handling
- Check parameter validation

### Integration Testing
- Manual testing with MCP clients (e.g., Claude Desktop)
- Verify end-to-end tool execution
- Test error scenarios

### Coverage
- Maintained >90% overall test coverage
- MCP layer tested via service integration tests
- Entry point tested via manual execution

## Configuration

### For MCP Clients

```json
{
  "mcpServers": {
    "fdx-resource-api": {
      "command": "node",
      "args": ["dist/mcp/index.js"]
    }
  }
}
```

### Environment Variables
The MCP server uses the same configuration as the main API:
- JWT settings
- Port configuration
- Logging level

## Future Enhancements

Potential improvements:
1. **HTTP Transport**: Support HTTP/SSE in addition to stdio
2. **Authentication**: Add MCP-level authentication
3. **Rate Limiting**: Implement per-agent rate limits
4. **Caching**: Cache frequently accessed data
5. **Streaming**: Support streaming responses for large datasets
6. **Resources**: Expose API data as MCP resources
7. **Prompts**: Add pre-configured prompts for common operations

## Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [FDX API v6 Specification](https://financialdataexchange.org/)
