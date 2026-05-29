import {
  BadRequestException,
  ConflictException,
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
import {
  CreateCategoryDto,
  CreateChallengeDto,
  UpdateCategoryDto,
  UpdateChallengeDto,
} from './dto/catalog-admin.dto';

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

  // -------------------------------------------------------------------
  // Catalog — challenges
  // -------------------------------------------------------------------

  /** Every challenge (catalog + custom), with category + joined count. */
  async listChallenges() {
    const rows = await this.prisma.challenge.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        durationDays: true,
        difficulty: true,
        isActive: true,
        isPopular: true,
        isRecommended: true,
        visibility: true,
        createdById: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        _count: { select: { userChallenges: true } },
      },
      orderBy: [{ createdById: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDescription: c.shortDescription,
      durationDays: c.durationDays,
      difficulty: c.difficulty,
      isActive: c.isActive,
      isPopular: c.isPopular,
      isRecommended: c.isRecommended,
      visibility: c.visibility,
      isCustom: c.createdById !== null,
      createdAt: c.createdAt,
      categoryId: c.category.id,
      categoryName: c.category.name,
      joinedCount: c._count.userChallenges,
    }));
  }

  async createChallenge(dto: CreateChallengeDto) {
    await this.assertCategoryExists(dto.categoryId);
    try {
      return await this.prisma.challenge.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          shortDescription: dto.shortDescription,
          description: dto.description,
          dailyTask: dto.dailyTask,
          durationDays: dto.durationDays,
          difficulty: dto.difficulty,
          benefits: dto.benefits,
          safetyNote: dto.safetyNote ?? null,
          isPopular: dto.isPopular ?? false,
          isRecommended: dto.isRecommended ?? false,
          isActive: true,
          categoryId: dto.categoryId,
        },
      });
    } catch (e) {
      throw this.slugConflict(e, 'challenge');
    }
  }

  async updateChallenge(id: string, dto: UpdateChallengeDto) {
    await this.assertChallengeExists(id);
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    const data: Prisma.ChallengeUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.shortDescription !== undefined)
      data.shortDescription = dto.shortDescription;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dailyTask !== undefined) data.dailyTask = dto.dailyTask;
    if (dto.durationDays !== undefined) data.durationDays = dto.durationDays;
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.benefits !== undefined) data.benefits = dto.benefits;
    if (dto.safetyNote !== undefined) data.safetyNote = dto.safetyNote;
    if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
    if (dto.isRecommended !== undefined) data.isRecommended = dto.isRecommended;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    try {
      return await this.prisma.challenge.update({ where: { id }, data });
    } catch (e) {
      throw this.slugConflict(e, 'challenge');
    }
  }

  /**
   * Soft-delete: deactivate (isActive=false) rather than hard-delete. A hard
   * delete cascades to every user's UserChallenge + check-ins on it, which
   * would erase real progress. Deactivating hides it from the catalog.
   */
  async deactivateChallenge(id: string) {
    await this.assertChallengeExists(id);
    await this.prisma.challenge.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, isActive: false };
  }

  // -------------------------------------------------------------------
  // Catalog — categories
  // -------------------------------------------------------------------

  async listCategories() {
    const rows = await this.prisma.challengeCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        _count: { select: { challenges: true } },
      },
      orderBy: { name: 'asc' },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      createdAt: c.createdAt,
      challengeCount: c._count.challenges,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.challengeCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description ?? null,
        },
      });
    } catch (e) {
      throw this.slugConflict(e, 'category');
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.challengeCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Category not found.');
    const data: Prisma.ChallengeCategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    try {
      return await this.prisma.challengeCategory.update({ where: { id }, data });
    } catch (e) {
      throw this.slugConflict(e, 'category');
    }
  }

  /** Refuse to delete a category that still has challenges (cascade would
   *  wipe those challenges + everyone's progress on them). */
  async deleteCategory(id: string) {
    const count = await this.prisma.challenge.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        `Category has ${count} challenge(s). Move or remove them before deleting.`,
      );
    }
    await this.prisma.challengeCategory.delete({ where: { id } });
    return { id, deleted: true };
  }

  // -------------------------------------------------------------------
  // Activity viewers (read-only)
  // -------------------------------------------------------------------

  async listCheckins(opts: { skip?: number; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const [rows, total] = await Promise.all([
      this.prisma.dailyCheckin.findMany({
        select: {
          id: true,
          checkinDate: true,
          status: true,
          notes: true,
          createdAt: true,
          userChallenge: {
            select: {
              user: { select: { id: true, name: true, email: true } },
              challenge: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.dailyCheckin.count(),
    ]);
    return {
      total,
      skip,
      take,
      checkins: rows.map((c) => ({
        id: c.id,
        checkinDate: c.checkinDate,
        status: c.status,
        notes: c.notes,
        createdAt: c.createdAt,
        userId: c.userChallenge.user.id,
        userName: c.userChallenge.user.name,
        userEmail: c.userChallenge.user.email,
        challengeTitle: c.userChallenge.challenge.title,
      })),
    };
  }

  async listShareEvents(opts: { skip?: number; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const [rows, total] = await Promise.all([
      this.prisma.shareEvent.findMany({
        select: {
          id: true,
          type: true,
          platform: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.shareEvent.count(),
    ]);
    return {
      total,
      skip,
      take,
      events: rows.map((e) => ({
        id: e.id,
        type: e.type,
        platform: e.platform,
        createdAt: e.createdAt,
        userId: e.user.id,
        userName: e.user.name,
        userEmail: e.user.email,
      })),
    };
  }

  // -------------------------------------------------------------------
  // Moderation — custom challenges, chat, friends
  // -------------------------------------------------------------------

  /** User-created (custom) challenges, with creator + free-text for review. */
  async listCustomChallenges() {
    const rows = await this.prisma.challenge.findMany({
      where: { createdById: { not: null } },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        dailyTask: true,
        visibility: true,
        isActive: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { userChallenges: true, invites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDescription: c.shortDescription,
      description: c.description,
      dailyTask: c.dailyTask,
      visibility: c.visibility,
      isActive: c.isActive,
      createdAt: c.createdAt,
      creatorId: c.createdBy?.id ?? null,
      creatorName: c.createdBy?.name ?? null,
      creatorEmail: c.createdBy?.email ?? null,
      joinedCount: c._count.userChallenges,
      inviteCount: c._count.invites,
    }));
  }

  /** Recent community-chat messages (preset-only + celebrations). */
  async listChatMessages(opts: { skip?: number; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const [rows, total] = await Promise.all([
      this.prisma.challengeChatMessage.findMany({
        select: {
          id: true,
          kind: true,
          presetCode: true,
          body: true,
          createdAt: true,
          challenge: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.challengeChatMessage.count(),
    ]);
    return {
      total,
      skip,
      take,
      messages: rows.map((m) => ({
        id: m.id,
        kind: m.kind,
        presetCode: m.presetCode,
        body: m.body,
        createdAt: m.createdAt,
        challengeId: m.challenge.id,
        challengeTitle: m.challenge.title,
        userId: m.user?.id ?? null,
        userName: m.user?.name ?? null,
      })),
    };
  }

  async deleteChatMessage(id: string) {
    const m = await this.prisma.challengeChatMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!m) throw new NotFoundException('Message not found.');
    await this.prisma.challengeChatMessage.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Friendship graph overview. */
  async listFriendships(opts: { skip?: number; take?: number }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const [rows, total] = await Promise.all([
      this.prisma.challengeFriendship.findMany({
        select: {
          id: true,
          status: true,
          createdAt: true,
          respondedAt: true,
          requester: { select: { id: true, name: true } },
          recipient: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.challengeFriendship.count(),
    ]);
    return {
      total,
      skip,
      take,
      friendships: rows.map((f) => ({
        id: f.id,
        status: f.status,
        createdAt: f.createdAt,
        respondedAt: f.respondedAt,
        requesterId: f.requester.id,
        requesterName: f.requester.name,
        recipientId: f.recipient.id,
        recipientName: f.recipient.name,
      })),
    };
  }

  // -------------------------------------------------------------------
  // Contact submissions (the admin inbox)
  // -------------------------------------------------------------------

  async listContactSubmissions(opts: {
    resolved?: boolean;
    skip?: number;
    take?: number;
  }) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const skip = Math.max(opts.skip ?? 0, 0);
    const where: Prisma.ContactSubmissionWhereInput =
      opts.resolved === undefined
        ? {}
        : opts.resolved
          ? { resolvedAt: { not: null } }
          : { resolvedAt: null };
    const [submissions, total] = await Promise.all([
      this.prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.contactSubmission.count({ where }),
    ]);
    return { total, skip, take, submissions };
  }

  async resolveContactSubmission(id: string, resolved: boolean) {
    const s = await this.prisma.contactSubmission.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!s) throw new NotFoundException('Submission not found.');
    const resolvedAt = resolved ? new Date() : null;
    await this.prisma.contactSubmission.update({
      where: { id },
      data: { resolvedAt },
    });
    return { id, resolvedAt };
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  private async assertChallengeExists(id: string) {
    const c = await this.prisma.challenge.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Challenge not found.');
  }

  private async assertCategoryExists(id: string) {
    const c = await this.prisma.challengeCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!c) throw new BadRequestException('Category not found.');
  }

  private slugConflict(e: unknown, label: string): Error {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new ConflictException(
        `A ${label} with that slug already exists.`,
      );
    }
    return e as Error;
  }
}
