import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/auth/domain/user-role.enum';
import { configureAppSecurity } from '../src/common/bootstrap/app-security';
import { PrismaService } from '../src/prisma/prisma.service';

type StoredUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type AuthResponseBody = {
  token: string;
  user: { id: string; email: string; name: string | null; role: string };
};

type UserResponseBody = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

function buildPrismaStub() {
  const usersById = new Map<string, StoredUser>();
  const usersByEmail = new Map<string, StoredUser>();

  function project<T extends Record<string, unknown>>(
    row: T,
    select?: Record<string, true>,
  ): Partial<T> {
    if (!select) return row;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(select)) {
      out[key] = row[key];
    }
    return out as Partial<T>;
  }

  return {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    onModuleInit: () => Promise.resolve(),
    onModuleDestroy: () => Promise.resolve(),
    user: {
      create: ({
        data,
        select,
      }: {
        data: { email: string; name?: string; passwordHash: string };
        select?: Record<string, true>;
      }) => {
        if (usersByEmail.has(data.email)) {
          return Promise.reject(
            new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              { code: 'P2002', clientVersion: 'test' },
            ),
          );
        }
        const id = `u-${usersById.size + 1}`;
        const now = new Date();
        const row: StoredUser = {
          id,
          email: data.email,
          name: data.name ?? null,
          passwordHash: data.passwordHash,
          role: UserRole.USER,
          createdAt: now,
          updatedAt: now,
        };
        usersById.set(id, row);
        usersByEmail.set(row.email, row);
        return Promise.resolve(project(row, select));
      },
      findUnique: ({
        where,
        select,
      }: {
        where: { id?: string; email?: string };
        select?: Record<string, true>;
      }) => {
        const row =
          (where.id && usersById.get(where.id)) ??
          (where.email && usersByEmail.get(where.email)) ??
          null;
        return Promise.resolve(row ? project(row, select) : null);
      },
      update: ({
        where,
        data,
        select,
      }: {
        where: { id: string };
        data: { name?: string };
        select?: Record<string, true>;
      }) => {
        const row = usersById.get(where.id);
        if (!row) return Promise.reject(new Error('not found'));
        if (data.name !== undefined) row.name = data.name;
        row.updatedAt = new Date();
        return Promise.resolve(project(row, select));
      },
      delete: ({ where }: { where: { id: string } }) => {
        const row = usersById.get(where.id);
        if (!row) {
          return Promise.reject(
            new Prisma.PrismaClientKnownRequestError(
              'Record to delete not found',
              { code: 'P2025', clientVersion: 'test' },
            ),
          );
        }
        usersById.delete(where.id);
        usersByEmail.delete(row.email);
        return Promise.resolve(row);
      },
    },
  };
}

/**
 * Walks the auth chain end-to-end without a real database: register issues
 * a JWT, the JWT decodes back into a request user via JwtStrategy, /users/me
 * roundtrips through the global JwtAuthGuard, and PATCH /users/me actually
 * mutates the persisted record.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(buildPrismaStub())
      .compile();

    app = moduleFixture.createNestApplication();
    configureAppSecurity(app);
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rejects /users/me without a token (401)', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('registers, then reads and updates the current user with the token', async () => {
    const server = app.getHttpServer();

    const registration = await request(server)
      .post('/auth/register')
      .send({
        name: 'Edit Me',
        email: 'edit@example.com',
        password: 'correct horse battery staple',
      })
      .expect(201);

    const auth = registration.body as AuthResponseBody;
    expect(typeof auth.token).toBe('string');
    expect(auth.token.length).toBeGreaterThan(20);
    expect(auth.user).toMatchObject({
      email: 'edit@example.com',
      name: 'Edit Me',
      role: 'USER',
    });

    const me = await request(server)
      .get('/users/me')
      .set('Authorization', `Bearer ${auth.token}`)
      .expect(200);
    const meBody = me.body as UserResponseBody;
    expect(meBody.email).toBe('edit@example.com');
    expect(meBody.name).toBe('Edit Me');

    const patched = await request(server)
      .patch('/users/me')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ name: 'Edited Name' })
      .expect(200);
    expect((patched.body as UserResponseBody).name).toBe('Edited Name');
  });

  it('rejects registration with a weak password (validation)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Weak',
        email: 'weak@example.com',
        password: 'short',
      })
      .expect(400);
  });

  it('returns 409 when the same email registers twice', async () => {
    const server = app.getHttpServer();
    const body = {
      name: 'Dup',
      email: 'dup@example.com',
      password: 'correct horse battery staple',
    };
    await request(server).post('/auth/register').send(body).expect(201);
    await request(server).post('/auth/register').send(body).expect(409);
  });

  it('deletes the account and invalidates subsequent token use', async () => {
    const server = app.getHttpServer();

    const registration = await request(server)
      .post('/auth/register')
      .send({
        name: 'Goodbye',
        email: 'gone@example.com',
        password: 'correct horse battery staple',
      })
      .expect(201);
    const token = (registration.body as AuthResponseBody).token;

    await request(server)
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    // The JwtStrategy re-checks the user exists on every request, so the
    // same token must now fail.
    await request(server)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    // And the email is free again — confirms the row was actually removed.
    await request(server)
      .post('/auth/register')
      .send({
        name: 'Reborn',
        email: 'gone@example.com',
        password: 'correct horse battery staple',
      })
      .expect(201);
  });
});
