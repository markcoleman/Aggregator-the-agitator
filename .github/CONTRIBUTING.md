# Contributing to FDX Resource API

Thank you for your interest in contributing to the FDX Resource API! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm (preferred) or npm
- Git
- Basic understanding of TypeScript, Fastify, and FDX specifications

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/Aggregator-the-agitator.git
   cd Aggregator-the-agitator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run tests to ensure everything works**
   ```bash
   pnpm test:ci
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Verify API documentation**
   - Open http://localhost:3000/docs to view the Swagger UI

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- 🐛 **Bug fixes**: Fix issues with existing functionality
- ✨ **New features**: Add new FDX-compliant endpoints or functionality
- 📚 **Documentation**: Improve README, API docs, or code comments
- 🧪 **Tests**: Add or improve test coverage
- 🔧 **Tooling**: Improve build, CI/CD, or development tools
- ♻️ **Refactoring**: Improve code structure without changing functionality

### Before You Start

1. **Check existing issues** to see if your idea is already being discussed
2. **Create an issue** for new features or major changes to discuss the approach
3. **Check the roadmap** to ensure your contribution aligns with project goals
4. **Review FDX specifications** to ensure compliance (https://financialdataexchange.org/)

## Pull Request Process

### 1. Branch Naming

Use descriptive branch names following this pattern:
- `feat/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation
- `test/description` - for test improvements
- `chore/description` - for maintenance tasks

### 2. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(api): add transaction filtering endpoint`
- `fix(auth): resolve JWT token validation issue`
- `docs(readme): update installation instructions`

### 3. Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Follow our [coding standards](#coding-standards)
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:ci
   pnpm build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

5. **Push and create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

### 4. Pull Request Requirements

Before submitting a PR, ensure:

- [ ] All tests pass (`pnpm test:ci`)
- [ ] Code is properly formatted (`pnpm format`)
- [ ] No linting errors (`pnpm lint`)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Test coverage is maintained (>90%)
- [ ] Documentation is updated (if applicable)
- [ ] FDX compliance is maintained (if applicable)

### 5. PR Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge by maintainers

## Issue Reporting

### Bug Reports

Use the [Bug Report template](ISSUE_TEMPLATE/bug_report.yml) and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Relevant logs or error messages

### Feature Requests

Use the [Feature Request template](ISSUE_TEMPLATE/feature_request.yml) and include:

- Problem description
- Proposed solution
- FDX compliance requirements
- Use case and business justification
- Implementation ideas (if any)

### Questions

Use the [Question template](ISSUE_TEMPLATE/question.yml) for:

- Usage questions
- API clarifications
- Development setup help
- FDX specification questions

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define explicit types for function parameters and return values
- Use interfaces for complex object types
- Prefer `const` assertions where appropriate

### Code Style

- Follow ESLint and Prettier configurations
- Use descriptive variable and function names
- Keep functions small and focused (<50 lines)
- Add JSDoc comments for public APIs

### Architecture Principles

Follow SOLID principles and clean architecture:

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Repositories**: Handle data access
- **Entities**: Define domain models with Zod schemas

### Error Handling

- Use custom error classes from `src/shared/errors/`
- Provide meaningful error messages
- Log errors at appropriate levels
- Return consistent error response formats

## Testing

### Test Structure

```
test/
├── unit/          # Unit tests for individual components
├── integration/   # Integration tests for API endpoints
└── fixtures/      # Test data and helpers
```

### Writing Tests

- Write tests for all new functionality
- Maintain >90% test coverage
- Use descriptive test names
- Test both happy path and error cases
- Mock external dependencies

### Running Tests

```bash
# Run all tests
pnpm test:ci

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test accounts.service.test.ts

# Watch mode during development
pnpm test
```

## Documentation

### Types of Documentation

1. **API Documentation**: OpenAPI/Swagger specs
2. **Code Documentation**: JSDoc comments
3. **User Documentation**: README and guides
4. **Development Documentation**: Setup and architecture docs

### Documentation Standards

- Keep README up to date
- Document all public APIs
- Include usage examples
- Maintain OpenAPI specification
- Update architecture diagrams when needed

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Requests**: Code reviews and discussions

### Getting Help

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the question template
4. Join GitHub discussions

### Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project documentation

## Release Process

Releases are automated through GitHub Actions:

1. **Semantic versioning** based on conventional commits
2. **Automated changelog** generation
3. **Comprehensive testing** before release
4. **GitHub releases** with detailed notes

## Security

For security issues, please:

1. **Do not** create public issues
2. **Use** GitHub Security Advisories
3. **Email** maintainers privately if needed
4. **Follow** responsible disclosure practices

---

Thank you for contributing to the FDX Resource API! Your contributions help make financial data aggregation more accessible and standardized.