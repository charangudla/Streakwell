import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FriendshipStatus,
  Prisma,
  UserChallengeStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * All read/write logic behind the admin dashboard. Admins see everything
 * (no viewer-scoped gating like the user-facing services), so these are
 * direct Prisma queries. Every consumer route is protected by RolesGuard +
 * @AdminOnly at the controller level.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------
  // Overview
  // -------------------------------------------------------------------

  async dashboardStats() {
    const [
      totalUsers,
      suspendedUsers,
      catalogChallenges,
      customChallenges,
      activeUserChallenges,
      completedUserChallenges,
      totalCheckins,
      contactTotal,
      contactUnresolved,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.challenge.count({ where: { createdById: null } }),
      this.prisma.challenge.count({ where: { createdById: { not: null } } }),
      this.prisma.userChallenge.count({
        where: { status: UserChallengeStatus.ACTIVE },
      }),
      this.prisma.userChallenge.count({
        where: { status: UserChallengeStatus.COMPLETED },
      }),
      this.prisma.dailyCheckin.count(),
      this.prisma.contactSubmission.count(),
      this.prisma.contactSubmission.count({ where: { resolvedAt: null } }),
    ]);

    return {
      totalUsers,
      suspendedUsers,
      catalogChallenges,
      customChallenges,
      activeUserChallenges,
      completedUserChallenges,
      totalCheckins,
      contactTotal,
      contactUnresolved,
    };
  }

  // -------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------

  /** Paginated user list with optional name/email search. */
  async listUsers(opts: { search?: string; skip?: number; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const where: Prisma.UserWhereInput = opts.search
      ? {
          OR: [
            { name: { contains: opts.search, mode: 'insensitive' } },
            { email: { contains: opts.search, mode: 'insensitive' } },
            { username: { contains: opts.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { userChallenges: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      skip,
      take,
      users: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        challengeCount: u._count.userChallenges,
      })),
    };
  }

  /** Full user record for the admin detail page (everything we hold). */
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        username: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        gender: true,
        birthYear: true,
        heightCm: true,
        weightKg: true,
        unitPreference: true,
        primaryGoal: true,
        interestCategoryIds: true,
        dailyMinutes: true,
        onboardingCompletedAt: true,
        referralCode: true,
      },
    });
    if (!user) throw new NotFoundException('User not found.');

    const [joinedChallenges, createdChallenges, friendCount, chatMessageCount] =
      await Promise.all([
        this.prisma.userChallenge.findMany({
          where: { userId },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            challenge: { select: { title: true, durationDays: true } },
            _count: { select: { checkins: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.challenge.findMany({
          where: { createdById: userId },
          select: {
            id: true,
            title: true,
            visibility: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.challengeFriendship.count({
          where: {
            status: FriendshipStatus.ACCEPTED,
            OR: [{ requesterId: userId }, { recipientId: userId }],
          },
        }),
        this.prisma.challengeChatMessage.count({ where: { userId } }),
      ]);

    return {
      user,
      joinedChallenges: joinedChallenges.map((uc) => ({
        id: uc.id,
        status: uc.status,
        startDate: uc.startDate,
        endDate: uc.endDate,
        challengeTitle: uc.challenge.title,
        durationDays: uc.challenge.durationDays,
        checkinsCount: uc._count.checkins,
      })),
      createdChallenges,
      friendCount,
      chatMessageCount,
    };
  }

  /**
   * Suspend (active=false) or reactivate a user. Suspending also revokes the
   * user's sessions so they're logged out immediately; the sign-in hook
   * (auth.ts) then blocks them from signing back in.
   */
  async setUserActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    await this.prisma.user.update({ where: { id: userId }, data: { isActive } });
    if (!isActive) {
      await this.prisma.session.deleteMany({ where: { userId } });
    }
    return { id: userId, isActive };
  }

  /** Change a user's role. Restricted to SUPER_ADMIN at the controller. */
  async setUserRole(userId: string, role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Invalid role.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return { id: userId, role };
  }
}
