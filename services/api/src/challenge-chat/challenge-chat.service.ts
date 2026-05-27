import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChatMessageKind,
  CheckinStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CHAT_PRESETS,
  REACTION_EMOJI,
  isValidEmojiCode,
  isValidPresetCode,
} from './chat-presets';

/**
 * Per-challenge community chat.
 *
 * Three things live in one logical channel per Challenge:
 *
 *   1. PRESET messages   — user-posted, constrained to a fixed catalog.
 *   2. CELEBRATION cards — one auto-generated card per day. Lazily
 *                          materialised on the first GET of a new day
 *                          (no cron). Race-safe via a unique constraint
 *                          on (challengeId, kind, scheduledDate).
 *   3. Daily check-in poll — NOT persisted. Derived live from
 *                            DailyCheckin counts so it always matches
 *                            the real check-in state. The same /checkins
 *                            POST that drives a user's calendar also
 *                            drives their poll vote — no extra wiring.
 *
 * Authorisation: every endpoint requires the caller to be a joiner of
 * the Challenge (any UserChallenge status). This covers both PUBLIC
 * (anyone can join) and PRIVATE custom challenges (gated by inviteToken
 * elsewhere). Members keep chat access even after completing or
 * abandoning so the channel's history stays visible to alumni.
 */
@Injectable()
export class ChallengeChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load everything the client needs to render the chat panel in one
   * round-trip: catalogs (presets + emoji), the live poll, and the
   * message list with reactions.
   */
  async getChannel(userId: string, challengeId: string) {
    await this.assertJoiner(userId, challengeId);

    const today = startOfUtcDay(new Date());

    // Lazy-create today's celebration card BEFORE the message fetch so
    // it lands in the same list as everything else, ordered by
    // createdAt. The upsert is race-safe via the unique
    // (challengeId, kind, scheduledDate) constraint.
    await this.ensureCelebrationCard(challengeId, today);

    const [messages, poll] = await Promise.all([
      this.loadMessages(challengeId, userId),
      this.computePoll(challengeId, userId, today),
    ]);

    return {
      presets: CHAT_PRESETS,
      emoji: REACTION_EMOJI,
      poll,
      messages,
    };
  }

  async postMessage(
    userId: string,
    challengeId: string,
    presetCode: string,
  ) {
    await this.assertJoiner(userId, challengeId);
    if (!isValidPresetCode(presetCode)) {
      throw new BadRequestException('Unknown preset.');
    }

    const message = await this.prisma.challengeChatMessage.create({
      data: {
        challengeId,
        userId,
        kind: ChatMessageKind.PRESET,
        presetCode,
      },
      include: this.messageInclude,
    });
    return this.toMessageView(message, userId);
  }

  async toggleReaction(
    userId: string,
    messageId: string,
    emoji: string,
  ) {
    if (!isValidEmojiCode(emoji)) {
      throw new BadRequestException('Unknown reaction emoji.');
    }

    const message = await this.prisma.challengeChatMessage.findUnique({
      where: { id: messageId },
      select: { challengeId: true },
    });
    if (!message) throw new NotFoundException('Message not found.');
    await this.assertJoiner(userId, message.challengeId);

    // Toggle: delete if exists, otherwise create. We don't return early
    // on delete failures because the user-facing intent is "make the
    // server match my desired state" — the create branch hits a unique
    // constraint if it already exists, which we treat as "already on,
    // turn off" by falling through to delete.
    const existing = await this.prisma.chatReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      select: { id: true },
    });
    let added: boolean;
    if (existing) {
      await this.prisma.chatReaction.delete({ where: { id: existing.id } });
      added = false;
    } else {
      try {
        await this.prisma.chatReaction.create({
          data: { messageId, userId, emoji },
        });
        added = true;
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          // Lost the race — another tab/click already wrote the row.
          // Treat as "already reacted" and surface the current totals.
          added = true;
        } else {
          throw e;
        }
      }
    }

    // Return the fresh per-emoji totals + whether the user is currently
    // reacting with each emoji, so the client can update the row
    // without a full refetch.
    const counts = await this.reactionCounts(messageId, userId);
    return { added, ...counts };
  }

  // -------------------------------------------------------------------
  // internals
  // -------------------------------------------------------------------

  private async assertJoiner(userId: string, challengeId: string) {
    const uc = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      select: { id: true },
    });
    if (!uc) {
      throw new ForbiddenException(
        'Join this challenge to access its chat.',
      );
    }
  }

  /**
   * One celebration card per challenge per day. The unique constraint
   * means concurrent first-views from two clients both attempt the
   * insert and only one wins; the other catches P2002 silently.
   */
  private async ensureCelebrationCard(
    challengeId: string,
    todayUtc: Date,
  ) {
    try {
      await this.prisma.challengeChatMessage.create({
        data: {
          challengeId,
          kind: ChatMessageKind.CELEBRATION,
          scheduledDate: todayUtc,
          body: this.celebrationBody(todayUtc),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Card already exists for today — fine.
        return;
      }
      throw e;
    }
  }

  /**
   * Celebration card body. Rotates through a small set of opener
   * phrases keyed off the date so the channel doesn't look like
   * literal copy-paste day to day. Kept text-only; the client can
   * style it.
   */
  private celebrationBody(todayUtc: Date): string {
    const dayOfYear = Math.floor(
      (todayUtc.getTime() -
        Date.UTC(todayUtc.getUTCFullYear(), 0, 0)) /
        86_400_000,
    );
    const dateLabel = todayUtc.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    const openers = [
      `🎉 ${dateLabel} — another shot at a small win.`,
      `🌟 ${dateLabel} — show up for yourself today.`,
      `💪 ${dateLabel} — every check-in counts.`,
      `🔥 ${dateLabel} — let's see who's in today.`,
      `✨ ${dateLabel} — small actions, big change.`,
      `🌱 ${dateLabel} — your future self is watching.`,
      `🎯 ${dateLabel} — focus on TODAY, not the streak.`,
    ];
    return openers[dayOfYear % openers.length];
  }

  private async loadMessages(challengeId: string, userId: string) {
    const rows = await this.prisma.challengeChatMessage.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: this.messageInclude,
    });
    return rows.map((r) => this.toMessageView(r, userId));
  }

  private readonly messageInclude = {
    user: { select: { id: true, name: true } },
    reactions: { select: { userId: true, emoji: true } },
  } as const;

  private toMessageView(
    row: {
      id: string;
      challengeId: string;
      kind: ChatMessageKind;
      presetCode: string | null;
      body: string | null;
      scheduledDate: Date | null;
      createdAt: Date;
      user: { id: string; name: string } | null;
      reactions: { userId: string; emoji: string }[];
    },
    viewerId: string,
  ) {
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    for (const r of row.reactions) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      if (r.userId === viewerId) mine[r.emoji] = true;
    }
    return {
      id: row.id,
      kind: row.kind,
      presetCode: row.presetCode,
      body: row.body,
      scheduledDate: row.scheduledDate,
      createdAt: row.createdAt,
      user: row.user,
      reactions: { counts, mine },
    };
  }

  /**
   * Derive today's poll from DailyCheckin counts. We count check-ins
   * by status for all joiners of this challenge that have a check-in
   * row dated today, then back out the "pending" bucket from the
   * total-joiner count. yourStatus mirrors the viewer's own row.
   */
  private async computePoll(
    challengeId: string,
    viewerId: string,
    todayUtc: Date,
  ) {
    // Total joiners — all UserChallenges for this challenge, regardless
    // of status, so alumni still count toward "X people are with you".
    const totalJoiners = await this.prisma.userChallenge.count({
      where: { challengeId },
    });

    // Today's check-ins grouped by status. We filter via the relation
    // back to UserChallenge so we only count THIS challenge.
    const todayCheckins = await this.prisma.dailyCheckin.findMany({
      where: {
        checkinDate: todayUtc,
        userChallenge: { challengeId },
      },
      select: { status: true, userChallenge: { select: { userId: true } } },
    });
    let completed = 0;
    let missed = 0;
    let skipped = 0;
    let yourStatus: CheckinStatus | null = null;
    for (const c of todayCheckins) {
      if (c.status === CheckinStatus.COMPLETED) completed += 1;
      else if (c.status === CheckinStatus.MISSED) missed += 1;
      else if (c.status === CheckinStatus.SKIPPED) skipped += 1;
      if (c.userChallenge.userId === viewerId) yourStatus = c.status;
    }
    const accountedFor = completed + missed + skipped;
    const pending = Math.max(0, totalJoiners - accountedFor);
    return {
      completed,
      missed,
      skipped,
      pending,
      total: totalJoiners,
      yourStatus,
    };
  }

  private async reactionCounts(messageId: string, viewerId: string) {
    const rows = await this.prisma.chatReaction.findMany({
      where: { messageId },
      select: { userId: true, emoji: true },
    });
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    for (const r of rows) {
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      if (r.userId === viewerId) mine[r.emoji] = true;
    }
    return { counts, mine };
  }
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}
