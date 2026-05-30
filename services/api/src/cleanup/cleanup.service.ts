import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_NOTIFICATION_RETENTION_DAYS = 90;

/**
 * Daily data-retention housekeeping.
 *
 * Conservative scope — only prunes rows that are provably safe to drop:
 *   - Sessions whose `expiresAt` is already in the past (Better Auth rejects
 *     these at auth time anyway; we just reclaim the rows).
 *   - Notifications that have been READ and are older than the retention
 *     window. Unread notifications are never deleted regardless of age.
 *
 * Deliberately leaves contact submissions, share events, chat history, and
 * audit logs untouched — those have product/compliance value.
 *
 * Each step is failure-isolated so one bad delete never blocks the others.
 * DB backup-file rotation lives in `scripts/backup-postgres.sh`, not here:
 * the API container has no access to the host's `./backups` directory.
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Runs at 03:00 server time (UTC in our containers) — a low-traffic window.
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'daily-retention-cleanup' })
  async handleDailyCleanup(): Promise<void> {
    this.logger.log('Starting daily data-retention cleanup...');
    const sessions = await this.pruneExpiredSessions();
    const notifications = await this.pruneReadNotifications();
    this.logger.log(
      `Daily cleanup complete: removed ${sessions} expired session(s), ` +
        `${notifications} old read notification(s).`,
    );
  }

  /** Delete every session whose `expiresAt` is before `now`. */
  async pruneExpiredSessions(now: Date = new Date()): Promise<number> {
    try {
      const { count } = await this.prisma.session.deleteMany({
        where: { expiresAt: { lt: now } },
      });
      return count;
    } catch (err) {
      this.logger.error(
        `Failed to prune expired sessions: ${(err as Error).message}`,
      );
      return 0;
    }
  }

  /**
   * Delete READ notifications older than the retention window
   * (`NOTIFICATION_RETENTION_DAYS`, default 90). Unread rows are kept.
   */
  async pruneReadNotifications(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(
      now.getTime() - this.notificationRetentionDays() * DAY_MS,
    );
    try {
      const { count } = await this.prisma.notification.deleteMany({
        where: {
          readAt: { not: null },
          createdAt: { lt: cutoff },
        },
      });
      return count;
    } catch (err) {
      this.logger.error(
        `Failed to prune read notifications: ${(err as Error).message}`,
      );
      return 0;
    }
  }

  /** Resolve the notification retention window, falling back to the default. */
  private notificationRetentionDays(): number {
    const raw = this.config.get<string>('NOTIFICATION_RETENTION_DAYS');
    const parsed = Number(raw);
    if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_NOTIFICATION_RETENTION_DAYS;
    }
    return Math.floor(parsed);
  }
}
