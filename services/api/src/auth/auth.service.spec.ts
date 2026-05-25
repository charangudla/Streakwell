import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

import { AuthService } from './auth.service';
import { UserRole } from './domain/user-role.enum';
import { PasswordService } from './security/password.service';

type PrismaStub = {
  user: {
    create: jest.Mock;
    findUnique: jest.Mock;
  };
};

function buildService(): {
  service: AuthService;
  prisma: PrismaStub;
  passwords: PasswordService;
  jwt: JwtService;
} {
  const prisma: PrismaStub = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const passwords = new PasswordService();
  const jwt = new JwtService({ secret: 'test_secret' });
  const service = new AuthService(
    prisma as unknown as Parameters<
      typeof AuthService.prototype.register
    >[0] extends never
      ? never
      : ConstructorParameters<typeof AuthService>[0],
    passwords,
    jwt,
  );
  return { service, prisma, passwords, jwt };
}

describe('AuthService', () => {
  describe('register', () => {
    it('hashes the password and returns a signed token + safe user shape', async () => {
      const { service, prisma } = buildService();
      type CreateArgs = {
        data: { email: string; name: string; passwordHash: string };
        select?: Record<string, true>;
      };
      prisma.user.create.mockImplementation(({ data, select }: CreateArgs) => {
        // class-validator runs before this; just echo whatever Prisma would
        // return given the supplied `select`.
        const created: Record<string, unknown> = {
          id: '11111111-1111-1111-1111-111111111111',
          email: data.email,
          name: data.name,
          role: UserRole.USER,
        };
        const projected: Record<string, unknown> = {};
        for (const key of Object.keys(select ?? {})) {
          projected[key] = created[key];
        }
        return Promise.resolve(projected);
      });

      const result = await service.register({
        name: 'Vital User',
        email: 'New@Example.COM',
        password: 'correct horse battery staple',
      });

      const firstCall = prisma.user.create.mock.calls[0] as [CreateArgs];
      const passedData = firstCall[0].data;
      expect(passedData.email).toBe('new@example.com');
      expect(passedData.passwordHash).not.toContain(
        'correct horse battery staple',
      );
      expect(result.token.length).toBeGreaterThan(20);
      expect(result.user).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'new@example.com',
        name: 'Vital User',
        role: UserRole.USER,
      });
    });

    it('translates a Prisma unique-violation into a 409', async () => {
      const { service, prisma } = buildService();
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({
          name: 'Whoever',
          email: 'taken@example.com',
          password: 'correct horse battery staple',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('issues a token when the password matches', async () => {
      const { service, prisma, passwords } = buildService();
      const hash = await passwords.hashPassword('correct horse battery staple');
      prisma.user.findUnique.mockResolvedValue({
        id: '22222222-2222-2222-2222-222222222222',
        email: 'returning@example.com',
        name: 'Returning User',
        role: UserRole.USER,
        passwordHash: hash,
      });

      const result = await service.login({
        email: 'Returning@Example.com',
        password: 'correct horse battery staple',
      });

      expect(result.token.length).toBeGreaterThan(20);
      expect(result.user.email).toBe('returning@example.com');
    });

    it('rejects an unknown email with the same error shape as a bad password', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nobody@example.com',
          password: 'correct horse battery staple',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password without revealing user existence', async () => {
      const { service, prisma, passwords } = buildService();
      const hash = await passwords.hashPassword('right password right here!');
      prisma.user.findUnique.mockResolvedValue({
        id: '33333333-3333-3333-3333-333333333333',
        email: 'real@example.com',
        name: 'Real User',
        role: UserRole.USER,
        passwordHash: hash,
      });

      await expect(
        service.login({
          email: 'real@example.com',
          password: 'definitely wrong password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
