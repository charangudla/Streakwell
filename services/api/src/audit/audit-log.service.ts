import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

export type AuditLogEntry = {
  /** Dotted namespace, e.g. "auth.signup", "user.role_changed". */
  action: string;
  /** Null when the event happens before authentication (e.g. signup attempt). */
  userId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Free-form JSON payload — keep it small and never include credentials. */
  metadata?: Prisma.InputJsonValue | null;
};

/**
 * Append-only audit trail. Writes never block the calling request — if the
 * insert fails we log the error and swallow it, because losing one audit
 * row is preferable to failing a user-visible action.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          entityType: entry.entityType ?? null,
          entityId: entry.entityId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: entry.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Audit log write failed for action="${entry.action}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
