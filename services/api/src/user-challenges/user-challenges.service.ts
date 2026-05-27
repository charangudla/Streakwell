import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChallengeInviteStatus,
  ChallengeVisibility,
  CheckinStatus,
  Prisma,
  UserChallengeStatus,
} from '@prisma/client';

import { calculateChallengeProgress } from '../challenges/domain/progress-calculator';
import { PrismaService } from '../prisma/prisma.service';

export type UserChallengeView = {
  id: string;
  userId: string;
  challengeId: string;
  status: UserChallengeStatus;
  startDate: Date;
  endDate: Date | null;
  progressPercent: number;
  /**
   * Embedded challenge fields the mobile + web UIs need to render the
   * card (title, daily task, etc.) without an extra round-trip per row.
   * Critical for PRIVATE custom challenges since `/challenges` filters
   * those out — without this embed, joiners couldn't see them in
   * `/my-challenges` after joining.
   */
  challenge: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    dailyTask: string;
    durationDays: number;
    difficulty: string;
    categoryId: string;
    visibility: string;
    createdById: string | null;
  };
};

@Injectable()
export class UserChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async join(
    userId: string,
    challengeId: string,
    inviteToken?: string,
  ): Promise<UserChallengeView> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: {
        id: true,
        isActive: true,
        visibility: true,
        createdById: true,
        inviteToken: true,
      },
    });
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found.');
    }

    // Visibility gate for PRIVATE custom challenges. Seeded challenges
    // default to PUBLIC and short-circuit through.
    if (challenge.visibility === ChallengeVisibility.PRIVATE) {
      const isCreator = challenge.createdById === userId;
      const tokenMatches =
        !!inviteToken &&
        !!challenge.inviteToken &&
        inviteToken === challenge.inviteToken;
      let hasInvite = false;
      if (!isCreator && !tokenMatches) {
        const invite = await this.prisma.challengeInvite.findFirst({
          where: {
            challengeId,
            invitedUserId: userId,
            status: {
              in: [
                ChallengeInviteStatus.PENDING,
                ChallengeInviteStatus.ACCEPTED,
              ],
            },
          },
          select: { id: true },
        });
        hasInvite = !!invite;
      }
      if (!isCreator && !tokenMatches && !hasInvite) {
        throw new ForbiddenException(
          'This challenge is private. You need an invite or share link to join.',
        );
      }
    }

    try {
      const uc = await this.prisma.userChallenge.create({
        data: { userId, challengeId },
        select: this.userChallengeSelect,
      });
      return this.toView(uc, []);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Already joined — return the existing record so the mobile can
        // continue to its detail screen.
        const existing = await this.prisma.userChallenge.findUnique({
          where: { userId_challengeId: { userId, challengeId } },
          select: this.userChallengeSelect,
        });
        if (existing && existing.status === UserChallengeStatus.ACTIVE) {
          const checkins = await this.completedCheckins(existing.id);
          return this.toView(existing, checkins);
        }
        throw new ConflictException('Already joined this challenge.');
      }
      throw e;
    }
  }

  async listForUser(userId: string): Promise<UserChallengeView[]> {
    const rows = await this.prisma.userChallenge.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: this.userChallengeSelect,
    });
    if (rows.length === 0) return [];

    const checkinsByUc = await this.completedCheckinsByUserChallenge(
      rows.map((r) => r.id),
    );
    return rows.map((row) => this.toView(row, checkinsByUc.get(row.id) ?? []));
  }

  /** Throws if the userChallenge isn't owned by `userId`. */
  async assertOwnership(
    userChallengeId: string,
    userId: string,
  ): Promise<void> {
    const uc = await this.prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      select: { userId: true },
    });
    if (!uc) {
      throw new NotFoundException('User challenge not found.');
    }
    if (uc.userId !== userId) {
      throw new ForbiddenException('Not your challenge.');
    }
  }

  private get userChallengeSelect() {
    return {
      id: true,
      userId: true,
      challengeId: true,
      status: true,
      startDate: true,
      endDate: true,
      challenge: {
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          dailyTask: true,
          durationDays: true,
          difficulty: true,
          categoryId: true,
          visibility: true,
          createdById: true,
        },
      },
    } satisfies Prisma.UserChallengeSelect;
  }

  private async completedCheckins(userChallengeId: string): Promise<Date[]> {
    const rows = await this.prisma.dailyCheckin.findMany({
      where: {
        userChallengeId,
        status: CheckinStatus.COMPLETED,
      },
      select: { checkinDate: true },
    });
    return rows.map((r) => r.checkinDate);
  }

  private async completedCheckinsByUserChallenge(
    userChallengeIds: string[],
  ): Promise<Map<string, Date[]>> {
    const rows = await this.prisma.dailyCheckin.findMany({
      where: {
        userChallengeId: { in: userChallengeIds },
        status: CheckinStatus.COMPLETED,
      },
      select: { userChallengeId: true, checkinDate: true },
    });
    const grouped = new Map<string, Date[]>();
    for (const r of rows) {
      const list = grouped.get(r.userChallengeId) ?? [];
      list.push(r.checkinDate);
      grouped.set(r.userChallengeId, list);
    }
    return grouped;
  }

  private toView(
    row: {
      id: string;
      userId: string;
      challengeId: string;
      status: UserChallengeStatus;
      startDate: Date;
      endDate: Date | null;
      challenge: {
        id: string;
        title: string;
        slug: string;
        shortDescription: string;
        dailyTask: string;
        durationDays: number;
        difficulty: string;
        categoryId: string;
        visibility: string;
        createdById: string | null;
      };
    },
    completedDates: Date[],
  ): UserChallengeView {
    const progress = calculateChallengeProgress(
      completedDates.map((d) => ({ completedOn: d })),
    );
    return {
      ...row,
      progressPercent: Math.round(progress.completionRate * 100 * 10) / 10,
    };
  }
}
