# Bloodline Backend Testing Setup

This document provides a complete guide for running and maintaining tests for the Bloodline blood donation platform backend.

## 🧪 Testing Framework Overview

We use **Jest** as our main testing framework with **Supertest** for API route testing. The setup includes comprehensive test coverage for controllers, routes, services, and utility functions.

## 📁 Test Structure

```
backend/
├── tests/
│   ├── setupTests.js              # Global test setup and mocking
│   ├── controllers/
│   │   └── auth.test.js           # Authentication controller tests
│   ├── routes/
│   │   ├── auth.test.js           # Authentication route tests
│   │   └── bloodRequests.test.js  # Blood request route tests
│   ├── services/
│   │   └── mailService.test.js     # Email service tests
│   └── utils/
│       └── tokenGenerator.test.js  # Token utility tests
├── jest.config.js                 # Jest configuration
└── package.json                   # Test scripts and dependencies
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install all testing dependencies including:
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `@types/jest` - TypeScript definitions for Jest

### 2. Run Tests

```bash
# Run all tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests once (for CI/CD)
npm run test:ci
```

## 📋 Test Coverage Areas

### ✅ Authentication Tests
- **Donor Registration**: Valid data, duplicate users, validation errors
- **Donor Login**: Valid credentials, invalid credentials, missing data
- **Organization Registration**: Valid data, duplicate organizations
- **Organization Login**: Valid credentials, invalid credentials

### ✅ Blood Request Tests
- **Create Request**: Valid data, missing fields, unauthorized access
- **Get Requests**: Organization-specific requests, unauthorized access
- **Update Request**: Valid updates, ownership validation, not found
- **Delete Request**: Ownership validation, completed requests, not found
- **Respond to Request**: Donor responses, duplicate responses

### ✅ Email Service Tests
- **Welcome Emails**: Donor and organization registration
- **Blood Request Notifications**: Multiple donors, partial failures
- **Thank You Emails**: Post-donation acknowledgments
- **Password Reset**: Token-based reset functionality
- **Donation Reminders**: Eligible donor notifications

### ✅ Utility Function Tests
- **Token Generation**: Reset tokens, verification tokens, API keys
- **Token Validation**: Format validation, edge cases
- **Token Hashing**: Secure storage, error handling
- **Error Handling**: Network errors, invalid inputs

## 🎯 Test Cases Examples

### Successful API Response (200/201)
```javascript
it('should register a new donor successfully', async () => {
  const donorData = {
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    bloodGroup: 'A+',
    phone: '1234567890',
    location: 'Kathmandu',
    dateOfBirth: '1990-01-01'
  };

  const response = await request(app)
    .post('/api/auth/register/donor')
    .send(donorData);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('message', 'Donor registered successfully');
  expect(response.body).toHaveProperty('token');
});
```

### Invalid Input (400)
```javascript
it('should return 400 for missing required fields', async () => {
  const incompleteData = {
    bloodGroup: 'A+',
    quantity: 2
    // missing hospitalName, location, urgencyLevel, requiredDate
  };

  const response = await request(app)
    .post('/api/blood-requests')
    .set('Authorization', authToken)
    .send(incompleteData);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('message', 'Please provide all required fields');
});
```

### Unauthorized Access (401)
```javascript
it('should return 401 for unauthorized access', async () => {
  const response = await request(app)
    .get('/api/blood-requests');

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('message', 'Access denied');
});
```

### Server Error Handling (500)
```javascript
it('should handle server errors gracefully', async () => {
  // Mock database error
  Donor.findOne.mockRejectedValue(new Error('Database error'));

  const response = await request(app)
    .post('/api/auth/register/donor')
    .send(validDonorData);

  expect(response.status).toBe(500);
  expect(response.body).toHaveProperty('message', 'Server error');
});
```

## 🔧 Mocking Strategy

### Database Mocking
```javascript
// Mock Mongoose models
jest.mock('../../models/Donor');
jest.mock('../../models/Organization');

// Mock database operations
Donor.findOne.mockResolvedValue(null);
Donor.create.mockResolvedValue(mockDonor);
```

### External Dependencies
```javascript
// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'mock-user-id' }),
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
  }),
}));
```

## 📊 Coverage Reports

After running `npm run test:coverage`, you'll find:

- **Terminal Output**: Text-based coverage summary
- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info` for CI integration

### Coverage Targets
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## 🛠️ Configuration

### Jest Configuration (`jest.config.js`)
```javascript
{
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "routes/**/*.js",
    "utils/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  testTimeout: 10000,
  verbose: true
}
```

### Test Setup (`tests/setupTests.js`)
- Global test environment configuration
- Mock setup for external dependencies
- Test database configuration
- Cleanup and reset utilities

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    cd backend
    npm ci
    npm run test:ci
```

### Coverage Reporting
- Coverage reports automatically generated on CI
- LCOV format compatible with coverage services
- HTML reports for local development

## 🐛 Debugging Tests

### Watch Mode
```bash
npm test  # Runs in watch mode by default
```

### Specific Test Files
```bash
npx jest tests/routes/auth.test.js
npx jest --testNamePattern="should register donor"
```

### Verbose Output
```bash
npx jest --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📝 Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Mock external dependencies in setup
- Clear mocks between tests
- Use realistic mock data

### 3. Error Testing
- Test both success and failure scenarios
- Include edge cases and boundary conditions
- Verify error messages and status codes

### 4. Async Testing
- Use async/await consistently
- Handle promise rejections
- Set appropriate timeouts

### 5. Test Data
- Use consistent test data fixtures
- Avoid hardcoded values where possible
- Test with various data sizes and formats

## 🚨 Common Issues

### 1. Module Import Errors
```javascript
// Ensure proper mocking before imports
jest.mock('../../models/Donor');
const Donor = require('../../models/Donor');
```

### 2. Timeout Issues
```javascript
// Increase timeout for slow operations
it('should handle slow database operations', async () => {
  // test code
}, 15000); // 15 seconds
```

### 3. Mock Persistence
```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#testing)

## 🤝 Contributing

When adding new features:

1. Write tests before implementation (TDD)
2. Ensure > 80% test coverage
3. Test both success and failure scenarios
4. Update documentation as needed

---

**Happy Testing! 🧪✨**
