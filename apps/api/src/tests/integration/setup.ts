// Safety Guard: Ensure test database is explicitly targeted
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('_test')) {
  throw new Error('STOP! Integration tests must run against a dedicated test database containing "_test" in its URL.');
}

beforeAll(async () => {
  // Global integration test setup code here
});

afterAll(async () => {
  // Disconnect or cleanup if needed
});