# GitHub Copilot Instructions for FDX Resource API

## Project Overview
This is a TypeScript-based FDX-aligned REST API for financial data aggregation built with Fastify. The project follows SOLID principles, clean architecture patterns, and maintains high test coverage (>90%).

## Architecture Guidelines

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
```

### Code Organization Principles

#### 1. Domain-Driven Design
- **Entities**: Use Zod schemas for validation and type safety
- **Services**: Contain business logic, depend on repository interfaces
- **Repositories**: Handle data access, use interfaces for testability

#### 2. SOLID Principles
- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: New features should extend, not modify existing code
- **Liskov Substitution**: Mock implementations should be interchangeable with real ones
- **Interface Segregation**: Create focused interfaces for different concerns
- **Dependency Inversion**: Depend on abstractions, not concrete implementations

#### 3. Clean Architecture
- Controllers handle HTTP concerns only
- Services contain business logic
- Repositories manage data access
- Entities define domain models

## Coding Standards

### TypeScript Best Practices
```typescript
// ✅ Good: Use interfaces for dependency injection
interface AccountRepository {
  findById(id: string): Promise<Account>;
  findByUserId(userId: string): Promise<Account[]>;
}

// ✅ Good: Use Zod for validation
const AccountSchema = z.object({
  id: z.string(),
  accountNumber: z.string(),
  balance: z.number(),
});

// ✅ Good: Proper error handling
try {
  const account = await accountRepository.findById(id);
  return account;
} catch (error) {
  throw new NotFoundError(`Account ${id} not found`);
}
```

### Function Design
- Functions should be pure when possible
- Use descriptive names that explain what the function does
- Keep functions small and focused (< 20 lines when possible)
- Document complex business logic with JSDoc comments

### Error Handling
- Use custom error classes from `src/shared/errors/`
- Always provide meaningful error messages
- Use appropriate HTTP status codes
- Log errors at the service layer

### Testing Requirements
- Maintain >90% test coverage (currently at 97%+)
- Write unit tests for all services and utilities
- Write integration tests for API endpoints
- Use descriptive test names that explain the behavior being tested
- Mock external dependencies in unit tests

### Naming Conventions

#### Files and Directories
- Use kebab-case for file names: `account.service.ts`
- Use camelCase for variable and function names
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

#### Database/API Conventions
- Use camelCase for JSON properties
- Use kebab-case for URL paths: `/api/v1/accounts`
- Use plural nouns for collections: `/accounts`
- Use singular nouns with ID for specific resources: `/accounts/{id}`

## Development Workflow

### Before Writing Code
1. Understand the FDX specification requirements
2. Identify which layer the change belongs to (controller, service, repository)
3. Consider how the change affects existing tests
4. Plan for backwards compatibility

### Code Generation Guidelines
When generating new code:

1. **Controllers**: 
   - Handle HTTP request/response only
   - Validate request parameters using Zod
   - Delegate business logic to services
   - Return appropriate HTTP status codes

2. **Services**:
   - Implement business logic
   - Use repository interfaces for data access
   - Handle business rule validation
   - Throw domain-specific errors

3. **Repositories**:
   - Focus on data access patterns
   - Implement interfaces for testability
   - Handle data mapping between domain and storage
   - Use async/await consistently

4. **Tests**:
   - Write tests before or alongside implementation
   - Cover happy path and error cases
   - Use descriptive test names
   - Mock dependencies appropriately

### Security Considerations
- Always validate input using Zod schemas
- Use JWT authentication for protected endpoints
- Implement proper authorization checks
- Sanitize data before logging
- Follow OWASP security guidelines

### Performance Guidelines
- Target p95 latency ≤200ms for in-memory operations
- Use efficient data structures and algorithms
- Implement proper pagination for large datasets
- Cache frequently accessed data when appropriate
- Profile and measure performance impacts

## FDX Compliance Notes
- Follow FDX v6.0 specification for API design
- Use standard FDX error response formats
- Implement proper OAuth2/OIDC flows
- Support required FDX headers and parameters
- Maintain backwards compatibility with FDX standards

## Common Patterns

### Service Pattern
```typescript
export class AccountsService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async getAccountById(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    
    if (!account) {
      throw new NotFoundError(`Account ${id} not found`);
    }
    
    if (account.userId !== userId) {
      throw new ForbiddenError('Access denied to account');
    }
    
    return account;
  }
}
```

### Controller Pattern
```typescript
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  async getAccount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user as JWTPayload;
      
      const account = await this.accountsService.getAccountById(id, userId);
      
      return reply.code(200).send(account);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  }
}
```

### Repository Pattern
```typescript
export class MockAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async findById(id: string): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new NotFoundError(`Account ${id} not found`);
    }
    return account;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return Array.from(this.accounts.values())
      .filter(account => account.userId === userId);
  }
}
```

## Code Quality Metrics
- Maintain test coverage >90% (target: 95%+)
- Keep cyclomatic complexity <10 per function
- Ensure all public methods have JSDoc documentation
- Follow consistent code formatting (Prettier + ESLint)
- No TypeScript compilation errors or warnings

## When to Ask for Human Review
- Making breaking changes to public APIs
- Modifying security-related code
- Changes that significantly impact performance
- Complex business logic that affects multiple domains
- Updates to authentication or authorization logic