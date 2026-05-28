import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AchievementKind, CheckinStatus, Prisma, UserChallengeStatus } from '@prisma/client';

import { FriendsService } from '../friends/friends.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalisePhone, validatePhoneFormat } from './phone-validation';
import {
  usernameReasonMessage,
  validateUsernameFormat,
} from './username-validation';

/**
 * Public-facing user profile data for the friend-discovery UX.
 *
 * Privacy model — we deliberately ship two tiers in one shape:
 *
 *   Always-visible (preview tier) — enough info to decide whether to
 *   accept a friend request from this person:
 *     - id, name, joinedAt
 *     - active + completed challenge counts (zero-effort signal that
 *       this is a real engaged Vital30 user, not a throwaway)
 *
 *   Friend-only (full tier) — only present when viewer + target are
 *   already ACCEPTED friends OR the same user:
 *     - sharedChallengeCount (how many challenges both are on)
 *     - achievementsCount
 *
 * NEVER returned: email, exact birthdates, any field that would
 * compromise the user's privacy. Only data the target user has
 * already chosen to publish through their engagement with the
 * platform.
 */
export interface ProfileChallengeSummary {
  challengeId: string;
  title: string;
  durationDays: number;
  startDate: Date;
  /** Set on COMPLETED, null on ACTIVE. */
  endDate: Date | null;
  /** 0–100. */
  progressPercent: number;
}

export interface ProfileAchievement {
  kind: AchievementKind;
  earnedAt: Date;
}

export interface UserProfileView {
  id: string;
  name: string;
  joinedAt: Date;
  activeChallengeCount: number;
  completedChallengeCount: number;
  /** Viewer-relative — true for accepted-friend OR self. */
  isFriend: boolean;
  /** True when viewer === target. */
  isSelf: boolean;
  // Full-tier fields (gated). Omitted entirely (not just nulled) when
  // viewer doesn't qualify, so a leak on the wire is obvious. Lists
  // replace the previous Count summaries — clients can take .length
  // when they only need the number.
  sharedChallengeCount?: number;
  achievementsCount?: number;
  activeChallenges?: ProfileChallengeSummary[];
  completedChallenges?: ProfileChallengeSummary[];
  sharedChallenges?: Array<{ challengeId: string; title: string }>;
  achievements?: ProfileAchievement[];
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
  ) {}

  async getProfile(
    viewerId: string,
    targetId: string,
  ): Promise<UserProfileView> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, createdAt: true },
    });
    if (!target) throw new NotFoundException('User not found.');

    const isSelf = viewerId === targetId;
    // Self always counts as "friend" so the same modal can render
    // the full tier when the viewer opens their own profile.
    const isFriend = isSelf || (await this.isFriendWith(viewerId, targetId));

    // Always-visible counts. Two cheap COUNT queries; we don't pull
    // the rows themselves since the preview doesn't need them.
    const [activeCount, completedCount] = await Promise.all([
      this.prisma.userChallenge.count({
        where: { userId: targetId, status: UserChallengeStatus.ACTIVE },
      }),
      this.prisma.userChallenge.count({
        where: { userId: targetId, status: UserChallengeStatus.COMPLETED },
      }),
    ]);

    const view: UserProfileView = {
      id: target.id,
      name: target.name,
      joinedAt: target.createdAt,
      activeChallengeCount: activeCount,
      completedChallengeCount: completedCount,
      isFriend,
      isSelf,
    };

    if (isFriend) {
      // Three parallel fetches: target's challenges + completed
      // checkins (for derived progress), target's achievements, and
      // the viewer's own challenge ids (to compute shared list).
      const [ucs, achievements, viewerChallengeIds] = await Promise.all([
        this.prisma.userChallenge.findMany({
          where: {
            userId: targetId,
            status: {
              in: [
                UserChallengeStatus.ACTIVE,
                UserChallengeStatus.COMPLETED,
              ],
            },
          },
          orderBy: { startDate: 'desc' },
          select: {
            challengeId: true,
            status: true,
            startDate: true,
            endDate: true,
            challenge: {
              select: { id: true, title: true, durationDays: true },
            },
            // Only COMPLETED check-ins matter for the headline percent.
            checkins: {
              where: { status: CheckinStatus.COMPLETED },
              select: { checkinDate: true },
            },
          },
        }),
        this.prisma.achievement.findMany({
          where: { userId: targetId },
          orderBy: { earnedAt: 'desc' },
          select: { kind: true, earnedAt: true },
        }),
        this.prisma.userChallenge.findMany({
          where: { userId: viewerId },
          select: { challengeId: true },
        }),
      ]);

      const viewerIds = new Set(viewerChallengeIds.map((u) => u.challengeId));
      const activeList: ProfileChallengeSummary[] = [];
      const completedList: ProfileChallengeSummary[] = [];
      const sharedList: Array<{ challengeId: string; title: string }> = [];

      for (const uc of ucs) {
        const completedDays = uc.checkins.length;
        const percent =
          uc.challenge.durationDays === 0
            ? 0
            : Math.round(
                (completedDays / uc.challenge.durationDays) * 100 * 10,
              ) / 10;
        const summary: ProfileChallengeSummary = {
          challengeId: uc.challengeId,
          title: uc.challenge.title,
          durationDays: uc.challenge.durationDays,
          startDate: uc.startDate,
          endDate: uc.endDate,
          progressPercent: percent,
        };
        if (uc.status === UserChallengeStatus.ACTIVE) activeList.push(summary);
        else completedList.push(summary);

        if (viewerIds.has(uc.challengeId)) {
          sharedList.push({
            challengeId: uc.challengeId,
            title: uc.challenge.title,
          });
        }
      }

      view.activeChallenges = activeList;
      view.completedChallenges = completedList;
      view.sharedChallenges = sharedList;
      view.achievements = achievements;
      // Keep count fields too so the preview-tier modal (which never
      // pulls lists) still has stable summary numbers — and so any
      // client that only ever consumed counts doesn't break.
      view.sharedChallengeCount = sharedList.length;
      view.achievementsCount = achievements.length;
    }

    return view;
  }

  private async isFriendWith(
    viewerId: string,
    targetId: string,
  ): Promise<boolean> {
    const map = await this.friends.statusByUser(viewerId, [targetId]);
    return map.get(targetId)?.state === 'accepted';
  }

  // -------------------------------------------------------------------
  // Username + phone (self-management — see UsersController for routes)
  // -------------------------------------------------------------------

  /**
   * The viewer's own full user row — includes username + phone, which
   * the Better Auth session.user doesn't carry. The web profile page
   * uses this to render the read-only username and editable phone.
   */
  async getMe(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        createdAt: true,
      },
    });
    if (!u) throw new NotFoundException('User not found.');
    return u;
  }

  /**
   * Live "is this username available?" check used by the signup form.
   * Returns BOTH whether it's available AND why-not when it's not, so
   * the UI can show "Already taken" vs "Too short" vs "Reserved" with
   * one round-trip. Doesn't reserve the name (no holds, no expiring
   * locks) — race protection lives on the unique constraint at write.
   */
  async checkUsername(raw: string) {
    const normalised = raw.trim().toLowerCase();
    const formatReason = validateUsernameFormat(normalised);
    if (formatReason) {
      return {
        available: false,
        reason: formatReason,
        message: usernameReasonMessage(formatReason),
      } as const;
    }
    const taken = await this.prisma.user.findUnique({
      where: { username: normalised },
      select: { id: true },
    });
    if (taken) {
      return {
        available: false,
        reason: 'taken' as const,
        message: 'That username is already taken.',
      };
    }
    return { available: true } as const;
  }

  /**
   * Patch the caller's own username and/or phone with full validation.
   * Either field can be passed independently; missing fields aren't
   * touched. Phone can be CLEARED by passing an empty string.
   *
   * Race protection: validateUsernameFormat + the unique index. If two
   * users race for the same handle, the slower request hits a P2002
   * and we re-throw as a ConflictException with a clear message.
   */
  async updateMe(
    userId: string,
    patch: { username?: string; phone?: string },
  ) {
    const data: Prisma.UserUpdateInput = {};

    if (patch.username !== undefined) {
      const normalised = patch.username.trim().toLowerCase();
      const reason = validateUsernameFormat(normalised);
      if (reason) {
        throw new BadRequestException(usernameReasonMessage(reason));
      }
      // Skip the DB roundtrip if nothing actually changed.
      const me = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      if (me?.username !== normalised) {
        data.username = normalised;
      }
    }

    if (patch.phone !== undefined) {
      const trimmed = patch.phone.trim();
      if (trimmed === '') {
        // Empty string = clear phone. Skip if it was already null.
        data.phone = null;
      } else {
        const normalised = normalisePhone(trimmed);
        if (!validatePhoneFormat(normalised)) {
          throw new BadRequestException(
            'Phone must be in international format, e.g. +14155552671.',
          );
        }
        data.phone = normalised;
      }
    }

    if (Object.keys(data).length === 0) {
      // Nothing to do — return current state for client consistency.
      return this.getMe(userId);
    }

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Race on the username or phone unique index. Tell the user
        // which one collided when possible — Prisma puts the field
        // name in `meta.target`.
        const target = (e.meta as { target?: string[] } | undefined)?.target;
        if (target?.includes('username')) {
          throw new ConflictException('That username is already taken.');
        }
        if (target?.includes('phone')) {
          throw new ConflictException(
            'That phone number is linked to another account.',
          );
        }
        throw new ConflictException('That value is already in use.');
      }
      throw e;
    }
    return this.getMe(userId);
  }
}
