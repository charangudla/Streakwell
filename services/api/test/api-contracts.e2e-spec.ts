import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './test-app';

/**
 * Contract tests that do NOT need a real database or real Better Auth.
 *
 * The e2e harness stubs PrismaService and mocks Better Auth (see test-app.ts
 * and test/mocks/), so these specs only assert behaviour at the HTTP boundary
 * — the global ValidationPipe, CORS policy, and routing — all of which run
 * before any controller touches the database.
 *
 * Database/auth-dependent contracts (register, login, RBAC, per-user data
 * isolation) live as `it.todo` in mvp-contract.e2e-spec.ts and are exercised
 * against a real stack.
 */
describe('API contracts (e2e, no DB)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = (await createTestApp()) as INestApplication<App>;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  const http = () => request(app.getHttpAdapter().getInstance());

  describe('input validation (global ValidationPipe)', () => {
    it('rejects an empty contact submission with 400', async () => {
      await http().post('/public/contact').send({}).expect(400);
    });

    it('rejects a malformed email with 400', async () => {
      await http()
        .post('/public/contact')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          message: 'A message of valid length.',
        })
        .expect(400);
    });

    it('rejects unknown fields with 400 (forbidNonWhitelisted)', async () => {
      await http()
        .post('/public/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          message: 'A message of valid length.',
          unexpectedField: 'should be rejected',
        })
        .expect(400);
    });
  });

  describe('routing', () => {
    it('returns 404 for an unknown route', async () => {
      await http().get('/this-route-does-not-exist').expect(404);
    });
  });

  describe('CORS policy', () => {
    it('does not reflect a disallowed origin', async () => {
      const response = await http()
        .get('/health')
        .set('Origin', 'https://evil.example.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
