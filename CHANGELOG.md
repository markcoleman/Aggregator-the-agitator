# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive GitHub issue templates (bug reports, feature requests, questions)
- Multiple pull request templates for different change types
- Automated PR validation workflow with security scanning and auto-labeling
- Release automation workflow with semantic versioning
- GitHub repository governance files (CODEOWNERS, Code of Conduct, Contributing guidelines)
- Security policy with responsible disclosure guidelines
- Comprehensive documentation workflows
- Docker support with multi-stage builds
- Docker Compose configuration for local development
- Mock authentication server for testing
- Development setup scripts
- Stale issue management automation

### Changed
- Enhanced CI/CD pipeline with additional security and quality checks
- Improved developer experience with better templates and automation

### Fixed
- Fixed TruffleHog secret scanning failure in scheduled security workflow runs

### Security
- Added CodeQL security scanning
- Implemented secret scanning with TruffleHog
- Added dependency vulnerability scanning
- Automated security issue creation for failed scans

## [1.0.0] - 2025-01-XX

### Added
- Initial release of FDX Resource API
- FDX v6.0 compliant REST API endpoints
- JWT authentication and authorization
- Consent management system
- Mock data repositories for development
- Comprehensive test suite (>90% coverage)
- OpenAPI/Swagger documentation
- Docker containerization support
- Development container configuration

### API Endpoints
- `GET /fdx/v6/accounts` - List user accounts
- `GET /fdx/v6/accounts/{accountId}` - Get account details
- `GET /fdx/v6/accounts/{accountId}/transactions` - List account transactions  
- `GET /fdx/v6/accounts/{accountId}/contact` - Get account contact information
- `GET /fdx/v6/accounts/{accountId}/payment-networks` - List payment networks
- `GET /fdx/v6/accounts/{accountId}/statements` - List account statements
- `GET /fdx/v6/accounts/{accountId}/statements/{statementId}` - Get statement details
- `POST /consent` - Create consent request
- `PATCH /consent/{consentId}` - Update consent status
- `GET /consent/{consentId}` - Get consent details
- `GET /health` - Health check endpoint

### Security Features
- JWT token validation with JWKS
- OAuth 2.0 / OIDC compliance
- Scope-based authorization
- Consent-based resource access
- Input validation with Zod schemas
- Security headers with Helmet
- CORS protection

### Architecture
- Clean Architecture principles
- SOLID design patterns
- Dependency injection
- Repository pattern for data access
- Service layer for business logic
- Controller layer for HTTP handling
- Domain-driven design with entities

### Development Features
- TypeScript for type safety
- ESLint and Prettier for code quality
- Vitest for testing with high coverage
- Hot reload development server
- Comprehensive logging
- Environment-based configuration

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features and capabilities

#### Changed  
- Changes to existing functionality

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Features that have been removed

#### Fixed
- Bug fixes and corrections

#### Security
- Security improvements and vulnerability fixes

---

**Legend:**
- 🎉 **Major Release** - New major version with breaking changes
- ✨ **Minor Release** - New features and improvements, backward compatible  
- 🐛 **Patch Release** - Bug fixes and minor improvements
- 🔒 **Security Release** - Security fixes and improvements