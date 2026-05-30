/**
 * Integration-level API contracts that require a REAL Postgres database and a
 * REAL Better Auth instance. The default e2e harness (test-app.ts) stubs
 * Prisma and mocks Better Auth, so these stay as `it.todo` placeholders and
 * are exercised against a live stack (manual on-device runs today; a future
 * DB-backed e2e job can implement them). HTTP-boundary contracts that do NOT
 * need a DB — input validation, CORS, routing — are covered in
 * api-contracts.e2e-spec.ts.
 */
describe('Vital30 MVP API contracts', () => {
  it.todo('auth register creates a user with a hashed password');
  it.todo('auth login returns a JWT for valid credentials');
  it.todo('protected routes reject anonymous requests');
  it.todo('admin routes reject non-admin users');
  it.todo('admin routes allow ADMIN and SUPER_ADMIN users');
  it.todo('challenge listing returns active challenges only');
  it.todo('joining a challenge creates one active user challenge per user');
  it.todo('daily check-in records one check-in per challenge day');
  it.todo('users cannot read another user challenge or check-in data');
});
