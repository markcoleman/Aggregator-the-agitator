# FDX Resource API

A Node.js implementation of the Financial Data Exchange (FDX) Resource API specification, providing standardized endpoints for accessing financial account data, transactions, contacts, payment networks, and statements.

## Features

- **FDX v6 Compliance**: Implements FDX API specification for standardized financial data access
- **JWT Authentication**: OAuth2/OIDC token validation with JWKs support
- **Response Caching**: Intelligent in-memory caching with configurable TTL (default 1 minute)
- **Comprehensive Endpoints**: Accounts, transactions, contacts, payment networks, and statements
- **MCP Server**: Model Context Protocol server for AI agent integration
- **Type Safety**: Full TypeScript implementation with Zod validation
- **High Performance**: Built with Fastify for optimal performance
- **Comprehensive Testing**: Unit and integration tests with >90% coverage
- **Developer Experience**: DevContainer support, API documentation, and linting

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript
- **Framework**: Fastify (high-performance web framework)
- **Authentication**: JWT with JWKs validation using `jose`
- **Validation**: Zod schemas
- **Testing**: Vitest + Supertest
- **Documentation**: OpenAPI/Swagger
- **Linting**: ESLint + Prettier
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 20 or higher
- pnpm (or npm)

### Installation

```bash
# Clone the repository
git clone https://github.com/markcoleman/Aggregator-the-agitator.git
cd Aggregator-the-agitator

# Install dependencies
pnpm install

# Build the project
pnpm build

# Start the development server
pnpm dev
```

The API will be available at `http://localhost:3000` and documentation at `http://localhost:3000/docs`.

### Using the MCP Server

To use the Model Context Protocol (MCP) server for AI agent integration:

```bash
# Build the project
npm run build

# Start the MCP server
npm run mcp

# Or for development with hot reload
npm run mcp:dev
```

See [MCP_README.md](MCP_README.md) for detailed MCP server documentation and usage examples.

### Using DevContainer

For a consistent development environment:

1. Open the project in VS Code
2. Install the Dev Containers extension
3. Run "Dev Containers: Reopen in Container"
4. The container will automatically install dependencies

## API Endpoints

All FDX endpoints require authentication via `Authorization: Bearer <JWT>` header.

### Core Endpoints

- `GET /fdx/v6/accounts` - List user accounts
- `GET /fdx/v6/accounts/{accountId}` - Get account details
- `GET /fdx/v6/accounts/{accountId}/transactions` - Get account transactions
- `GET /fdx/v6/accounts/{accountId}/contact` - Get account holder contact info
- `GET /fdx/v6/accounts/{accountId}/payment-networks` - Get payment network info
- `GET /fdx/v6/accounts/{accountId}/statements` - List statements
- `GET /fdx/v6/accounts/{accountId}/statements/{statementId}` - Get statement details

### Consent API

The Consent API manages user consent for data sharing according to the Mastercard FDX guide:

- `POST /consent` - Create a new consent request
- `GET /consent/{consentId}` - Retrieve consent details  
- `PUT /consent/{consentId}` - Update consent status (approve/suspend/resume/revoke)

#### Consent Lifecycle

1. **PENDING** → Client creates consent via POST /consent
2. **ACTIVE** → Subject approves consent via PUT /consent/{id} with action="approve"  
3. **SUSPENDED** ↔ **ACTIVE** → Admin can suspend/resume via PUT /consent/{id}
4. **REVOKED** → Subject, client, or admin can revoke (terminal state)
5. **EXPIRED** → System expires consent when expiry date reached (terminal state)

### Health Check

- `GET /health` - Service health status

### Documentation

- `GET /docs` - Interactive API documentation (Swagger UI)

## Authentication

The API uses JWT tokens for authentication. Configure the following environment variables:

```bash
# JWT Configuration
JWT_ISSUER=https://your-auth-server.com
JWT_AUDIENCE=fdx-resource-api
JWKS_URI=https://your-auth-server.com/.well-known/jwks.json

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info
```

### Required Scopes

- `accounts:read` - Access to account information
- `transactions:read` - Access to transaction data
- `contact:read` - Access to contact information
- `payment_networks:read` - Access to payment network data
- `statements:read` - Access to statement data

## Development

### Available Scripts

```bash
# Development
pnpm dev           # Start development server with hot reload
pnpm build         # Build TypeScript to JavaScript
pnpm start         # Start production server

# Testing
pnpm test          # Run tests in watch mode
pnpm test:ci       # Run tests once (CI mode)
pnpm test:coverage # Run tests with coverage report

# Code Quality
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint errors
pnpm format        # Format code with Prettier
pnpm format:check  # Check code formatting
pnpm typecheck     # Run TypeScript compiler checks
```

### Project Structure

```
src/
├── app.ts                    # Fastify application setup
├── server.ts                 # Server entry point
├── config/                   # Configuration management
├── domain/
│   ├── entities/             # Domain models with Zod schemas
│   └── services/             # Business logic services
├── http/
│   ├── controllers/          # HTTP request handlers
│   └── middleware/           # Authentication & other middleware
├── infra/
│   ├── auth/                 # JWT verification utilities
│   └── repositories/         # Data access layer (mock implementations)
└── shared/
    ├── errors/               # Custom error classes
    └── utils/                # Shared utilities

test/
├── unit/                     # Unit tests
└── integration/              # Integration tests
```

## Sample Usage

### Get User Accounts

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/fdx/v6/accounts
```

### Get Account Transactions

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:3000/fdx/v6/accounts/acc-001/transactions?fromDate=2024-01-01&toDate=2024-01-31&limit=10"
```

### Consent API Examples

#### Create Consent

```bash
curl -X POST \
     -H "Authorization: Bearer CLIENT_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "subjectId": "user-123",
       "clientId": "my-app",
       "dataScopes": ["accounts:read", "transactions:read"],
       "accountIds": ["acc-001", "acc-002"],
       "purpose": "Personal finance management",
       "expiry": "2025-12-31T23:59:59.999Z"
     }' \
     http://localhost:3000/consent
```

#### Approve Consent (as subject)

```bash
curl -X PUT \
     -H "Authorization: Bearer USER_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"action": "approve", "reason": "User approved access"}' \
     http://localhost:3000/consent/consent-123
```

#### Get Consent Details

```bash
curl -H "Authorization: Bearer USER_JWT_TOKEN" \
     http://localhost:3000/consent/consent-123
```

### Response Format

All responses follow the FDX specification:

```json
{
  "accounts": [
    {
      "accountId": "acc-001",
      "accountType": "CHECKING",
      "accountNumber": "****1234",
      "accountName": "Primary Checking",
      "status": "ACTIVE",
      "balance": {
        "amount": 2500.50,
        "currency": "USD"
      }
    }
  ],
  "pagination": {
    "totalCount": 4,
    "offset": 0,
    "limit": 25,
    "hasMore": false
  }
}
```

## Testing

The project includes comprehensive testing:

```bash
# Run all tests
pnpm test:ci

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test accounts.service.test.ts
```

### Test Coverage Goals

- **Statements**: ≥90% coverage
- **Branches**: ≥90% coverage  
- **Functions**: ≥90% coverage
- **Lines**: ≥90% coverage

## Configuration

### Environment Variables

Create a `.env` file for local development:

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL_SECONDS=60

# JWT Authentication
JWT_ISSUER=https://mock-fdx-auth.example.com
JWT_AUDIENCE=fdx-resource-api
JWKS_URI=https://mock-fdx-auth.example.com/.well-know/jwks.json
```

#### Cache Configuration

- **CACHE_ENABLED**: Enable/disable response caching (default: `true`)
- **CACHE_TTL_SECONDS**: Cache time-to-live in seconds (default: `60`)

The cache:
- Only caches successful GET requests (2xx status codes)
- Uses in-memory storage (suitable for single-instance deployments)
- Includes user context in cache keys for security
- Automatically expires entries after TTL
- Adds `X-Cache: HIT` or `X-Cache: MISS` headers to responses

### Mock Data

The current implementation uses mock repositories with sample data. In production, these would be replaced with real database connections and core banking system integrations.

## CI/CD

The project includes GitHub Actions workflows for:

- **Continuous Integration**: Type checking, linting, testing, and building
- **Dependency Updates**: Automated dependency updates via Dependabot
- **Coverage Reporting**: Test coverage analysis

## Architecture

The codebase follows SOLID principles:

- **Single Responsibility**: Controllers handle HTTP, services contain business logic, repositories manage data access
- **Open/Closed**: New account types and endpoints can be added without modifying existing code
- **Liskov Substitution**: Repository interfaces allow swapping mock implementations with real databases
- **Interface Segregation**: Focused interfaces for different data types
- **Dependency Inversion**: Controllers depend on service abstractions, not concrete implementations

## Performance

- Target p95 latency: ≤200ms for in-memory mock data
- Built with Fastify for high throughput
- Efficient JWT validation with caching
- Optimized pagination and filtering

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass and code is properly formatted
6. Submit a pull request

## Support

For issues and questions:

- Create an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the test files for usage examples