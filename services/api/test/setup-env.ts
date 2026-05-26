process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '3000';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

// Better Auth — long-enough secret for in-process signing during tests.
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ??
  'test_better_auth_secret_long_enough_for_signing_xxxxx';
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

// Email — point at Mailpit by default. E2e specs that want to assert the
// content of a sent email override EmailService directly.
process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ?? 'mailpit';
process.env.EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'Vital30 Test <no-reply@vital30.local>';
process.env.MAILPIT_HOST = process.env.MAILPIT_HOST ?? 'localhost';
process.env.MAILPIT_PORT = process.env.MAILPIT_PORT ?? '1025';

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://vital30:vital30_password@localhost:5432/vital30_db?schema=public';
