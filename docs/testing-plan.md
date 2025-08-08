# Testing Plan - SecCheck

## Overview

This document outlines the comprehensive testing strategy for SecCheck, a web-based automated security testing tool. The testing approach covers both UI components (using React Testing Library) and end-to-end workflows (using Playwright).

## Testing Strategy

### Test Types

1. **Unit Tests** - Individual component and function testing
2. **Integration Tests** - API endpoints and database interactions
3. **End-to-End Tests** - Complete user workflows
4. **Security Tests** - Validate security scanning functionality

### Testing Tools

- **UI Testing**: React Testing Library + Jest
- **E2E Testing**: Playwright
- **API Testing**: Supertest (recommended addition)
- **Database Testing**: In-memory SQLite for faster tests

## Test Structure

### 1. UI Component Tests (`src/__tests__/components/`)

#### Landing Page Components
- **HeroSection.test.tsx**
  - Renders hero content correctly
  - CTA buttons are clickable
  - Responsive layout works

- **FeaturesSection.test.tsx**
  - All security features are displayed
  - OWASP mapping is correct
  - Icons and descriptions render

- **PricingSection.test.tsx**
  - All pricing plans display
  - Upgrade buttons work
  - Plan comparison accurate

- **FAQSection.test.tsx**
  - All FAQ items expand/collapse
  - Content is accurate and helpful

- **Navbar.test.tsx**
  - Navigation links work
  - Auth state handling
  - Mobile responsive menu

#### Dashboard Components
- **Dashboard.test.tsx**
  - Usage statistics display correctly
  - Charts and progress bars work
  - Quick action buttons functional

- **ScanForm.test.tsx**
  - URL validation works
  - Domain verification flow
  - Error handling

- **LiveBrowserView.test.tsx**
  - Browser simulation displays
  - Real-time updates work
  - Progress indicators accurate

- **ReportViewer.test.tsx**
  - Security findings display
  - Severity indicators correct
  - Export functionality

#### UI Components
- **Button.test.tsx**
  - All variants render correctly
  - Click handlers work
  - Loading states

- **Card.test.tsx**
  - Content displays properly
  - Responsive design
  - Accessibility attributes

- **UrlInput.test.tsx**
  - URL validation logic
  - Error states
  - Autocomplete functionality

#### Authentication Components
- **SignIn.test.tsx**
  - Form validation
  - OAuth flow initiation
  - Error handling

- **SignUp.test.tsx**
  - Email validation
  - Password requirements
  - Terms acceptance

### 2. API Route Tests (`src/__tests__/api/`)

#### Scan API Tests
- **scan.test.ts**
  - POST /api/scan endpoint
  - Request validation
  - Queue job creation
  - Rate limiting enforcement
  - Authentication required

- **scan-stream.test.ts**
  - GET /api/scan/[scanId]/stream
  - Real-time progress updates
  - WebSocket connection handling
  - Error scenarios

#### Billing API Tests
- **checkout.test.ts**
  - POST /api/billing/checkout
  - Stripe session creation
  - Plan selection validation
  - User plan updates

- **subscription.test.ts**
  - GET/PATCH/DELETE subscription endpoints
  - Plan changes
  - Cancellation flow
  - Portal redirect

- **webhook.test.ts**
  - Stripe webhook validation
  - Database synchronization
  - Event handling
  - Idempotency

#### Report API Tests
- **reports.test.ts**
  - GET /api/reports
  - Report generation
  - Access control
  - Data sanitization

- **usage.test.ts**
  - GET /api/usage
  - Usage statistics calculation
  - Plan limits enforcement
  - Historical data

### 3. Database Tests (`src/__tests__/db/`)

#### Schema Tests
- **migrations.test.ts**
  - Migration execution
  - Schema validation
  - Data integrity
  - Rollback functionality

#### Model Tests
- **user.test.ts**
  - User creation/updates
  - Plan management
  - Usage tracking
  - Soft deletion

- **scan.test.ts**
  - Scan lifecycle management
  - Status transitions
  - Result storage
  - Cleanup procedures

- **subscription.test.ts**
  - Stripe integration
  - Plan changes
  - Billing history
  - Edge cases

### 4. Business Logic Tests (`src/__tests__/lib/`)

#### Authentication Tests
- **auth.test.ts**
  - Supabase integration
  - JWT validation
  - Session management
  - Permission checks

#### Billing Logic Tests
- **billing.test.ts**
  - Plan limit enforcement
  - Usage calculation
  - Upgrade/downgrade logic
  - Proration handling

#### Queue Management Tests
- **queue.test.ts**
  - Job queuing
  - Worker communication
  - Error handling
  - Retry logic

### 5. Worker Tests (`worker/__tests__/`)

#### Security Test Modules
- **SecurityHeadersTest.test.ts**
  - Header analysis logic
  - OWASP compliance checks
  - Severity scoring
  - False positive handling

- **CookieSecurityTest.test.ts**
  - Cookie flag validation
  - Security attribute checks
  - Domain scope analysis

- **DirectoryExposureTest.test.ts**
  - Path traversal detection
  - Sensitive file discovery
  - Response analysis

- **BrowserSecurityTest.test.ts**
  - Playwright integration
  - DOM analysis
  - XSS detection
  - Content Security Policy

#### Worker Integration Tests
- **scanner.test.ts**
  - Complete scan workflow
  - Test coordination
  - Result aggregation
  - Error recovery

- **worker.test.ts**
  - Queue processing
  - Job lifecycle
  - Concurrency handling
  - Resource cleanup

### 6. End-to-End Tests (`e2e/`)

#### User Journey Tests
- **onboarding.spec.ts**
  - Account creation flow
  - Email verification
  - First scan experience
  - Dashboard navigation

- **scan-workflow.spec.ts**
  - URL submission
  - Scan progress monitoring
  - Result viewing
  - Report generation

- **billing-workflow.spec.ts**
  - Plan upgrade flow
  - Payment processing
  - Subscription management
  - Billing portal access

#### Cross-Browser Tests
- **compatibility.spec.ts**
  - Chrome functionality
  - Firefox compatibility
  - Safari testing
  - Mobile responsiveness

#### Performance Tests
- **load-testing.spec.ts**
  - Page load times
  - Scan performance
  - Concurrent user handling
  - Database performance

## Test Data Management

### Fixtures and Mocks

#### Mock Data (`src/__tests__/__fixtures__/`)
- **users.ts** - Test user accounts
- **scans.ts** - Sample scan results
- **reports.ts** - Security report data
- **subscriptions.ts** - Billing test data

#### Mock Services (`src/__tests__/__mocks__/`)
- **supabase.ts** - Database mocking
- **stripe.ts** - Payment mocking
- **playwright.ts** - Browser mocking
- **redis.ts** - Queue mocking

### Test Databases
- **Development**: Supabase test project
- **CI/CD**: SQLite in-memory
- **Local**: Docker PostgreSQL

## Environment Setup

### Test Configuration Files

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

#### Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### Environment Variables

#### Test Environment (`.env.test`)
```bash
# Database
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test-anon-key
DATABASE_URL=postgresql://localhost:5432/seccheck_test

# Stripe (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Queue
REDIS_URL=redis://localhost:6379/1

# App
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
```

## Testing Guidelines

### Best Practices

#### 1. Test Structure
- Follow AAA pattern (Arrange, Act, Assert)
- One assertion per test when possible
- Descriptive test names
- Group related tests with `describe` blocks

#### 2. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (`getByRole`, `getByLabelText`)
- Mock external dependencies
- Test accessibility attributes

#### 3. API Testing
- Test both success and error scenarios
- Validate request/response schemas
- Test authentication and authorization
- Mock external services (Stripe, Supabase)

#### 4. E2E Testing
- Test critical user paths
- Use page object models
- Minimize test data dependencies
- Run against production-like environment

### Code Coverage Targets

- **Unit Tests**: 90% coverage minimum
- **Integration Tests**: 80% coverage minimum
- **E2E Tests**: Cover all critical user journeys
- **Security Tests**: 100% coverage of OWASP categories

### Performance Standards

- **Unit Tests**: Complete in <5 seconds
- **Integration Tests**: Complete in <30 seconds
- **E2E Tests**: Complete in <5 minutes
- **Full Test Suite**: Complete in <15 minutes

## CI/CD Integration

### GitHub Actions Workflow

#### Test Pipeline (`.github/workflows/test.yml`)
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm build
      - run: pnpm start &
      - uses: microsoft/playwright-github-action@v0.3.0
      - run: pnpm test:e2e
```

### Quality Gates

- All tests must pass before merge
- Code coverage must meet minimum thresholds
- No security vulnerabilities in dependencies
- Performance benchmarks must be met

## Test Maintenance

### Regular Reviews
- **Weekly**: Review test failures and flaky tests
- **Monthly**: Update test data and fixtures  
- **Quarterly**: Review test coverage and add missing tests
- **Release**: Full regression testing

### Documentation Updates
- Keep test documentation current
- Update examples when patterns change
- Maintain troubleshooting guides
- Document new testing patterns

## Security Testing Validation

### Test Security Scanner Accuracy

#### False Positive Testing
- Test against known secure sites
- Validate against security benchmarks
- Compare with industry-standard tools

#### False Negative Testing  
- Test against deliberately vulnerable sites
- Use OWASP WebGoat for validation
- Cross-reference with manual testing

#### Performance Testing
- Measure scan completion times
- Test concurrent scan handling
- Validate resource usage limits

## Risk Assessment

### High-Risk Areas Requiring Extra Testing
1. **Payment Processing** - Stripe integration
2. **Authentication** - Supabase Auth flows  
3. **Security Scanning** - Vulnerability detection accuracy
4. **Rate Limiting** - Plan enforcement and abuse prevention
5. **Data Privacy** - User data protection and GDPR compliance

### Mitigation Strategies
- Comprehensive test coverage for high-risk areas
- Regular security audits of test scenarios
- Automated vulnerability scanning of test infrastructure
- Penetration testing of staging environment

## Resources

### Documentation Links
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### Internal Resources
- Test data fixtures: `src/__tests__/__fixtures__/`
- Mock implementations: `src/__tests__/__mocks__/`
- Utility functions: `src/__tests__/utils/`
- CI/CD pipelines: `.github/workflows/`

---

**Last Updated**: August 8th 2025  
**Version**: 1.0  
**Owner**: Development Team