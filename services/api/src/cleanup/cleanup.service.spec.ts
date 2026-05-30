import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { CleanupService } from './cleanup.service';

type MockPrisma = {
  session: { deleteMany: jest.Mock };
  notification: { deleteMany: jest.Mock };
};

const makePrisma = (): MockPrisma => ({
  session: { deleteMany: jest.fn() },
  notification: { deleteMany: jest.fn() },
});

const makeConfig = (values: Record<string, string> = {}): ConfigService =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

const makeService = (prisma: MockPrisma, config: ConfigService) =>
  new CleanupService(prisma as unknown as PrismaService, config);

describe('CleanupService', () => {
  const now = new Date('2026-05-30T00:00:00.000Z');

  describe('pruneExpiredSessions', () => {
    it('deletes sessions whose expiresAt is in the past and returns the count', async () => {
      const prisma = makePrisma();
      prisma.session.deleteMany.mockResolvedValue({ count: 4 });
      const service = makeService(prisma, makeConfig());

      const removed = await service.pruneExpiredSessions(now);

      expect(removed).toBe(4);
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: now } },
      });
    });

    it('returns 0 (not throw) when the delete fails', async () => {
      const prisma = makePrisma();
      prisma.session.deleteMany.mockRejectedValue(new Error('db down'));
      const service = makeService(prisma, makeConfig());

      await expect(service.pruneExpiredSessions(now)).resolves.toBe(0);
    });
  });

  describe('pruneReadNotifications', () => {
    it('deletes READ notifications older than the default 90-day window', async () => {
      const prisma = makePrisma();
      prisma.notification.deleteMany.mockResolvedValue({ count: 7 });
      const service = makeService(prisma, makeConfig());

      const removed = await service.pruneReadNotifications(now);

      expect(removed).toBe(7);
      // 90 days before 2026-05-30 is 2026-03-01.
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          readAt: { not: null },
          createdAt: { lt: new Date('2026-03-01T00:00:00.000Z') },
        },
      });
    });

    it('honors a NOTIFICATION_RETENTION_DAYS override', async () => {
      const prisma = makePrisma();
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 });
      const service = makeService(
        prisma,
        makeConfig({ NOTIFICATION_RETENTION_DAYS: '30' }),
      );

      await service.pruneReadNotifications(now);

      // 30 days before 2026-05-30 is 2026-04-30.
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          readAt: { not: null },
          createdAt: { lt: new Date('2026-04-30T00:00:00.000Z') },
        },
      });
    });

    it('ignores a non-positive / non-numeric override and uses the default', async () => {
      const prisma = makePrisma();
      prisma.notification.deleteMany.mockResolvedValue({ count: 1 });
      const service = makeService(
        prisma,
        makeConfig({ NOTIFICATION_RETENTION_DAYS: 'not-a-number' }),
      );

      await service.pruneReadNotifications(now);

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          readAt: { not: null },
          createdAt: { lt: new Date('2026-03-01T00:00:00.000Z') },
        },
      });
    });
  });

  describe('handleDailyCleanup', () => {
    it('runs both prune steps', async () => {
      const prisma = makePrisma();
      prisma.session.deleteMany.mockResolvedValue({ count: 2 });
      prisma.notification.deleteMany.mockResolvedValue({ count: 3 });
      const service = makeService(prisma, makeConfig());

      await service.handleDailyCleanup();

      expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.notification.deleteMany).toHaveBeenCalledTimes(1);
    });
  });
});
