import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, NotificationType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type EmitNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
};

const PAGE_LIMIT = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PAGE_LIMIT,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification
      .count({ where: { userId, readAt: null } })
      .then((count) => ({ count }));
  }

  async markRead(userId: string, id: string) {
    const found = await this.prisma.notification.findUnique({ where: { id } });
    if (!found || found.userId !== userId) {
      throw new NotFoundException('Notification not found.');
    }
    if (found.readAt) return found;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  emit(input: EmitNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? Prisma.JsonNull,
      },
    });
  }
}
