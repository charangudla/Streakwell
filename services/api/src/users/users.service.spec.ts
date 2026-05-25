import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { UserRole } from '../auth/domain/user-role.enum';
import { UsersService } from './users.service';

type PrismaStub = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function buildService(): { service: UsersService; prisma: PrismaStub } {
  const prisma: PrismaStub = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new UsersService(
    prisma as unknown as ConstructorParameters<typeof UsersService>[0],
  );
  return { service, prisma };
}

describe('UsersService', () => {
  describe('findById', () => {
    it('returns the projected user when present', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'u@example.com',
        name: 'U',
        role: UserRole.USER,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      });

      const user = await service.findById('u1');
      expect(user.email).toBe('u@example.com');
      expect(user.role).toBe(UserRole.USER);
    });

    it('throws 404 when the user is gone', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    it('trims whitespace before persisting the new name', async () => {
      const { service, prisma } = buildService();
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        email: 'u@example.com',
        name: 'Renamed',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await service.updateById('u1', { name: '  Renamed  ' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { name: 'Renamed' },
        }),
      );
      expect(user.name).toBe('Renamed');
    });

    it('no-ops (and falls back to findById) when the patch is empty', async () => {
      const { service, prisma } = buildService();
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'u@example.com',
        name: 'Original',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await service.updateById('u1', {});
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(user.name).toBe('Original');
    });
  });

  describe('deleteSelf', () => {
    it('hard-deletes by id (cascades to owned data via Prisma)', async () => {
      const { service, prisma } = buildService();
      prisma.user.delete.mockResolvedValue({ id: 'u1' });

      await service.deleteSelf('u1');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('translates P2025 (record not found) into a 404', async () => {
      const { service, prisma } = buildService();
      prisma.user.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record to delete not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(service.deleteSelf('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
