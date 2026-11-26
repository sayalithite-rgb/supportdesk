process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/unused_test_db';
process.env.JWT_SECRET = 'unit-test-only-secret-unit-test-only-secret';
process.env.BCRYPT_ROUNDS = '4';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173';
process.env.LOGIN_RATE_LIMIT_MAX = '5';
process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES = '15';