import { Injectable, NotFoundException } from '@nestjs/common';
import { UserChallengeStatus } from '@prisma/client';

import { FriendsService } from '../friends/friends.service';
import { PrismaService } from '../prisma/prisma.service';

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
  // viewer doesn't qualify, so a leak on the wire is obvious.
  sharedChallengeCount?: number;
  achievementsCount?: number;
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
      // Friend-only counts in parallel to keep response time flat.
      const [sharedCount, achievementsCount] = await Promise.all([
        this.sharedChallengeCount(viewerId, targetId),
        this.prisma.achievement.count({ where: { userId: targetId } }),
      ]);
      view.sharedChallengeCount = sharedCount;
      view.achievementsCount = achievementsCount;
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

  /**
   * Count of challenges where BOTH viewer and target have a
   * UserChallenge row (any status). Reasonable proxy for "common
   * ground" without exposing the actual list.
   */
  private async sharedChallengeCount(
    viewerId: string,
    targetId: string,
  ): Promise<number> {
    const viewerChallengeIds = await this.prisma.userChallenge.findMany({
      where: { userId: viewerId },
      select: { challengeId: true },
    });
    if (viewerChallengeIds.length === 0) return 0;
    return this.prisma.userChallenge.count({
      where: {
        userId: targetId,
        challengeId: { in: viewerChallengeIds.map((u) => u.challengeId) },
      },
    });
  }
}
