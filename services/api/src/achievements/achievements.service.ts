import { Injectable } from '@nestjs/common';
import { AchievementKind, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationsService,
  type EmitNotificationInput,
} from '../notifications/notifications.service';

type AchievementMeta = {
  title: string;
  body: string;
};

const ACHIEVEMENT_META: Record<AchievementKind, AchievementMeta> = {
  FIRST_CHECKIN: {
    title: 'First check-in',
    body: 'You took the first step — the hardest one. Keep going.',
  },
  SEVEN_DAY_STREAK: {
    title: '7-day streak',
    body: 'A full week of consistency. The habit is taking root.',
  },
  TWENTY_ONE_DAY_STREAK: {
    title: '21-day streak',
    body: 'Three weeks straight. You are well on your way to 30.',
  },
  CHALLENGE_COMPLETED: {
    title: 'Challenge complete',
    body: '30 days done. Take a breath and pick the next one.',
  },
  THREE_CHALLENGES_COMPLETED: {
    title: 'Three challenges done',
    body: 'You have built three habits with Vital30. Compounding.',
  },
};

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * Award `kind` to `userId` if they do not already have it.
   * Idempotent — the (userId, kind) unique constraint means a duplicate
   * award is a no-op. Emits a notification only the first time it is
   * earned.
   */
  async award(
    userId: string,
    kind: AchievementKind,
    data?: Record<string, unknown>,
  ) {
    const existing = await this.prisma.achievement.findUnique({
      where: { userId_kind: { userId, kind } },
    });
    if (existing) return existing;

    const created = await this.prisma.achievement.create({
      data: {
        userId,
        kind,
        data: (data as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      },
    });

    const meta = ACHIEVEMENT_META[kind];
    const notificationData: Record<string, unknown> = { kind, ...(data ?? {}) };
    const payload: EmitNotificationInput = {
      userId,
      type: 'ACHIEVEMENT',
      title: meta.title,
      body: meta.body,
      data: notificationData as Prisma.InputJsonValue,
    };
    await this.notifications.emit(payload);
    return created;
  }
}
