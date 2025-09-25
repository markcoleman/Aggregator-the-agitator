# Consent API Test Suite

This directory contains comprehensive test suites for the FDX-aligned Consent API.

## 🚀 Running the Consent Flow E2E Test Suite

The comprehensive end-to-end test suite validates the entire consent lifecycle and can be run locally to verify the API is working correctly.

### Prerequisites

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

### Running Tests

#### Run the complete consent flow test suite:
```bash
npm run test -- test/integration/consent-api-e2e.test.ts
```

#### Run all tests:
```bash
npm run test
```

#### Run tests with coverage:
```bash
npm run test:coverage
```

#### Run tests in CI mode (no watch):
```bash
npm run test:ci
```

## Test Coverage

The consent flow E2E test suite covers:

### ✅ Complete Consent Lifecycle
- **Consent Creation**: Basic and advanced consent creation scenarios
- **Consent Approval/Rejection**: User approval and rejection flows
- **Consent Revocation**: User and client revocation capabilities  
- **Complete Flow Test**: Full end-to-end lifecycle validation

### ✅ Authentication & Authorization
- **Authentication Failures**: Missing, invalid, and malformed tokens
- **Authorization Boundaries**: Scope-based access control
- **Permission Testing**: User isolation and access boundaries

### ✅ Input Validation & Error Handling
- **Creation Validation**: Required fields, data types, constraints
- **Update Validation**: Invalid actions and state transitions
- **Boundary Testing**: Edge cases and limits

### ✅ Resource Access with Consent
- **Valid Consent Access**: Successful resource access with active consent
- **Consent Enforcement**: Access control based on consent status
- **Account Filtering**: Access only to consented accounts

### ✅ State Transitions and Edge Cases
- **State Machine Validation**: Proper consent state transitions
- **Error Scenarios**: Invalid transitions and conflicts
- **Large Payload Handling**: Performance under load

### ✅ Performance and Reliability
- **Response Time Testing**: Performance validation
- **Concurrent Operations**: Multi-user scenario testing
- **Stability Testing**: System reliability under various conditions

## Test Structure

```
test/
├── integration/
│   ├── consent-api-e2e.test.ts    # Comprehensive consent flow tests
│   ├── consent.api.test.ts        # Basic consent API tests
│   ├── accounts.api.test.ts       # Account resource tests
│   └── app.test.ts                # Application-level tests
├── unit/
│   ├── consent.service.test.ts    # Consent service unit tests
│   ├── consent.middleware.test.ts # Consent middleware tests
│   └── ...                       # Other unit tests
└── utils/
    └── test-helpers.ts            # Test utilities and factories
```

## Test Scenarios Covered

### Success Scenarios
- ✅ Create consent with single and multiple scopes
- ✅ Approve consent by subject
- ✅ Reject consent by subject  
- ✅ Revoke consent by subject and client
- ✅ Access resources with valid consent
- ✅ Complete consent lifecycle (create → approve → use → revoke)

### Failure Scenarios
- ✅ Authentication failures (missing/invalid tokens)
- ✅ Authorization failures (insufficient scopes)
- ✅ Validation failures (missing fields, invalid data)
- ✅ State transition failures (invalid operations)
- ✅ Resource access denied (no consent, revoked consent)
- ✅ Permission boundary violations

### Edge Cases
- ✅ Concurrent consent operations
- ✅ Large payload handling
- ✅ State transition edge cases
- ✅ Performance under load
- ✅ Multiple account scenarios

## Best Practices

The test suite follows modern testing best practices:

- **Comprehensive Coverage**: Tests cover success, failure, and edge cases
- **Isolation**: Each test is independent and uses fresh data
- **Realistic Scenarios**: Tests mirror real-world usage patterns
- **Performance Aware**: Includes performance and load testing
- **Clear Assertions**: Tests have descriptive names and clear expectations
- **Maintainable**: Uses helper functions and factories for test data
- **Documentation**: Tests serve as living documentation of API behavior

## Debugging Failed Tests

If tests fail, check:

1. **Dependencies**: Ensure all dependencies are installed with `npm install --legacy-peer-deps`
2. **Environment**: Make sure no other services are running on test ports
3. **Logs**: Check application logs for detailed error information
4. **Network**: Verify no network connectivity issues
5. **Data**: Ensure test data is not conflicting with existing data

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the test helper utilities in `test/utils/`
3. Ensure tests are isolated and independent
4. Include both success and failure scenarios
5. Add descriptive test names and comments
6. Maintain high test coverage (>90%)