# Pomi Backend Testing

This directory contains test files for the Pomi backend API.

## Test Structure

```
tests/
├── health.spec.ts      # Health check endpoint tests
├── api.spec.ts         # API base routes and middleware tests
└── README.md          # This file
```

## Running Tests

### All Tests
```bash
npm test               # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run test:ci       # Run tests with coverage for CI
```

### Specific Test File
```bash
npm test -- health.spec.ts
npm test -- api.spec.ts
```

### With Coverage
```bash
npm run test:ci
# Opens coverage report in tests/coverage/
```

## Test Categories

### Health Check Tests (health.spec.ts)
Tests the `/health` endpoint that monitors API health.

**What we test:**
- Returns 200 status code
- Returns valid JSON with `status: 'ok'`
- Includes timestamp
- Responds quickly (<100ms)

### API Tests (api.spec.ts)
Tests base API routes, error handling, and middleware.

**What we test:**
- `/api/v1/status` returns valid response
- Undefined routes return 404
- CORS headers are set correctly
- Security headers (Helmet) are applied

## Testing Best Practices

### Test Structure
Use the AAA pattern:
- **Arrange** - Setup test conditions
- **Act** - Execute the code being tested
- **Assert** - Verify the results

```typescript
it('should do something', async () => {
  // Arrange
  const testData = { /* ... */ };

  // Act
  const response = await request(app).post('/endpoint').send(testData);

  // Assert
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

### Testing Database Operations
When testing database operations:
1. Use a test database (separate from development)
2. Clear data before each test with `beforeEach`
3. Use fixtures for consistent test data

```typescript
beforeEach(async () => {
  // Clear test database
  await db.clear();
});

afterEach(async () => {
  // Cleanup after test
  await db.close();
});
```

### Testing Async Code
Always use `async/await`:

```typescript
it('should handle async operations', async () => {
  const response = await request(app).get('/endpoint');
  expect(response.status).toBe(200);
});
```

### Testing Error Cases
Test both success and error scenarios:

```typescript
it('should handle validation errors', async () => {
  const response = await request(app)
    .post('/users')
    .send({ email: 'invalid-email' });

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
});
```

## Common Testing Patterns

### Testing GET Endpoints
```typescript
it('should get data', async () => {
  const response = await request(app)
    .get('/api/v1/resource')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});
```

### Testing POST Endpoints
```typescript
it('should create resource', async () => {
  const response = await request(app)
    .post('/api/v1/users')
    .send({
      name: 'John Doe',
      email: 'john@example.com',
    });

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

### Testing PUT Endpoints
```typescript
it('should update resource', async () => {
  const response = await request(app)
    .put('/api/v1/users/1')
    .send({ name: 'Jane Doe' });

  expect(response.status).toBe(200);
  expect(response.body.name).toBe('Jane Doe');
});
```

### Testing DELETE Endpoints
```typescript
it('should delete resource', async () => {
  const response = await request(app)
    .delete('/api/v1/users/1');

  expect(response.status).toBe(204);
});
```

### Testing Authentication
```typescript
it('should reject unauthenticated requests', async () => {
  const response = await request(app)
    .get('/api/v1/protected');

  expect(response.status).toBe(401);
});

it('should accept authenticated requests', async () => {
  const token = generateTestToken();
  const response = await request(app)
    .get('/api/v1/protected')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
});
```

## Coverage Goals

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

View coverage:
```bash
npm run test:ci
```

## Debugging Tests

### Run single test file
```bash
npm test -- health.spec.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="health"
```

### Debug in Node Inspector
```bash
node --inspect-brk node_modules/jest/bin/jest.js
```

### Verbose output
```bash
npm test -- --verbose
```

## Troubleshooting

### Tests timeout
- Increase timeout: `jest.setTimeout(10000)` in test
- Check database connectivity
- Verify async/await is used correctly

### Database connection errors
- Check database is running
- Verify connection string in `.env.test`
- Check database migrations ran

### Import errors
- Clear cache: `npm run test:ci -- --clearCache`
- Verify TypeScript is compiled: `npm run build`

## Writing New Tests

1. Create test file in `tests/` directory
2. Follow naming convention: `feature.spec.ts`
3. Group tests with `describe` blocks
4. Use descriptive test names
5. Keep tests independent
6. Aim for >70% coverage

Example:
```typescript
import request from 'supertest';
import app from '../src/app';

describe('Feature Name', () => {
  describe('GET /api/v1/endpoint', () => {
    it('should return success response', async () => {
      const response = await request(app).get('/api/v1/endpoint');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
