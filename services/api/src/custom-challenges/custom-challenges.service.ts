import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChallengeInviteStatus,
  ChallengeVisibility,
  Prisma,
} from '@prisma/client';

import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserChallengesService } from '../user-challenges/user-challenges.service';
import { CreateCustomChallengeDto } from './dto/create-custom-challenge.dto';
import { InviteToChallengeDto } from './dto/invite-to-challenge.dto';
import { RespondToInviteDto } from './dto/respond-to-invite.dto';
import { UpdateCustomChallengeDto } from './dto/update-custom-challenge.dto';
import { generateInviteToken } from './invite-token';

const TOKEN_RETRIES = 6;

@Injectable()
export class CustomChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly userChallenges: UserChallengesService,
  ) {}

  /** Create a custom challenge owned by `userId`. */
  async create(userId: string, dto: CreateCustomChallengeDto) {
    // Ensure the picked category exists.
    const category = await this.prisma.challengeCategory.findUnique({
      where: { id: dto.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException('Invalid category.');
    }

    // slug must be unique. Auto-mint as `<slugified-title>-<6-char-token-suffix>`
    // so two users can both create "30 Days Walking" without colliding.
    for (let attempt = 0; attempt < TOKEN_RETRIES; attempt += 1) {
      const token = generateInviteToken();
      const slug =
        slugify(dto.title) + '-' + token.slice(0, 6).toLowerCase();
      try {
        return await this.prisma.challenge.create({
          data: {
            title: dto.title,
            slug,
            shortDescription: dto.shortDescription,
            description: dto.description ?? '',
            durationDays: dto.durationDays,
            difficulty: dto.difficulty,
            dailyTask: dto.dailyTask,
            benefits: [],
            categoryId: dto.categoryId,
            createdById: userId,
            visibility: dto.visibility ?? ChallengeVisibility.PRIVATE,
            inviteToken: token,
            // Custom challenges never appear in the seeded recommended /
            // popular lanes on the home screen.
            isPopular: false,
            isRecommended: false,
          },
          select: this.detailSelect,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          // Either slug or token collided — retry with fresh values.
          continue;
        }
        throw e;
      }
    }
    throw new ConflictException('Could not allocate a unique invite token.');
  }

  async update(
    userId: string,
    challengeId: string,
    dto: UpdateCustomChallengeDto,
  ) {
    const existing = await this.assertOwnership(challengeId, userId);

    return this.prisma.challenge.update({
      where: { id: existing.id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.shortDescription !== undefined
          ? { shortDescription: dto.shortDescription }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.dailyTask !== undefined ? { dailyTask: dto.dailyTask } : {}),
        ...(dto.visibility !== undefined
          ? { visibility: dto.visibility }
          : {}),
      },
      select: this.detailSelect,
    });
  }

  async softDelete(userId: string, challengeId: string) {
    const existing = await this.assertOwnership(challengeId, userId);
    // Soft-delete via isActive=false so already-joined users keep their
    // history. The browse + join paths both gate on isActive.
    await this.prisma.challenge.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    return { ok: true };
  }

  async listMineCreated(userId: string) {
    const rows = await this.prisma.challenge.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...this.detailSelect,
        _count: { select: { invites: true, userChallenges: true } },
      },
    });
    return rows.map((r) => ({
      ...r,
      inviteCount: r._count.invites,
      joinedCount: r._count.userChallenges,
    }));
  }

  async invite(
    inviterId: string,
    challengeId: string,
    dto: InviteToChallengeDto,
  ) {
    const challenge = await this.assertOwnership(challengeId, inviterId);

    // Don't let creators invite themselves — pointless and a confusing
    // notification.
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      select: { email: true, name: true },
    });
    if (inviter && inviter.email.toLowerCase() === dto.email) {
      throw new BadRequestException("You can't invite yourself.");
    }

    // Does this email already belong to a Vital30 user? If so we'll
    // resolve invitedUserId immediately so the invite shows up in their
    // /invites inbox. Either way the invite row gets created so we can
    // backfill invitedUserId on a later signup.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, name: true },
    });

    try {
      const invite = await this.prisma.challengeInvite.create({
        data: {
          challengeId: challenge.id,
          invitedById: inviterId,
          invitedEmail: dto.email,
          invitedUserId: existingUser?.id ?? null,
        },
      });

      // In-app notification for existing users.
      if (existingUser) {
        await this.notifications.emit({
          userId: existingUser.id,
          type: 'SYSTEM',
          title: 'You were invited to a challenge',
          body: `${inviter?.name ?? 'Someone'} invited you to "${challenge.title}".`,
          data: { challengeId: challenge.id, inviteId: invite.id },
        });
      }

      // Email — for both existing and new users.
      const joinUrl = `${this.publicSiteUrl()}/c/${challenge.inviteToken}`;
      await this.email.send({
        to: dto.email,
        subject: `${inviter?.name ?? 'A friend'} invited you to a Vital30 challenge`,
        text: [
          `Hi,`,
          '',
          `${inviter?.name ?? 'A Vital30 user'} invited you to join the "${challenge.title}" challenge.`,
          '',
          `Daily task: ${challenge.dailyTask}`,
          `Duration:   ${challenge.durationDays} days`,
          '',
          'Join here:',
          joinUrl,
          '',
          '— Vital30',
        ].join('\n'),
      });

      return invite;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('That email is already invited.');
      }
      throw e;
    }
  }

  async listInvites(challengeId: string, userId: string) {
    await this.assertOwnership(challengeId, userId);
    return this.prisma.challengeInvite.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Invites where the current user is the recipient. */
  async myInbox(userId: string) {
    return this.prisma.challengeInvite.findMany({
      where: { invitedUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            dailyTask: true,
            durationDays: true,
            inviteToken: true,
          },
        },
        invitedBy: { select: { id: true, name: true } },
      },
    });
  }

  async respondToInvite(
    userId: string,
    inviteId: string,
    dto: RespondToInviteDto,
  ) {
    const invite = await this.prisma.challengeInvite.findUnique({
      where: { id: inviteId },
      include: { challenge: { select: { id: true, isActive: true } } },
    });
    if (!invite || invite.invitedUserId !== userId) {
      throw new NotFoundException('Invite not found.');
    }
    if (invite.status !== ChallengeInviteStatus.PENDING) {
      throw new ConflictException('This invite has already been responded to.');
    }
    if (!invite.challenge.isActive) {
      throw new NotFoundException('That challenge is no longer available.');
    }

    if (dto.decision === 'DECLINED') {
      await this.prisma.challengeInvite.update({
        where: { id: invite.id },
        data: {
          status: ChallengeInviteStatus.DECLINED,
          respondedAt: new Date(),
        },
      });
      return { status: 'DECLINED' as const };
    }

    // ACCEPTED: mark the invite + auto-join the challenge.
    await this.prisma.challengeInvite.update({
      where: { id: invite.id },
      data: {
        status: ChallengeInviteStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });
    const uc = await this.userChallenges.join(userId, invite.challenge.id);
    return { status: 'ACCEPTED' as const, userChallengeId: uc.id };
  }

  // -------- helpers --------

  private async assertOwnership(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: this.detailSelect,
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found.');
    }
    if (challenge.createdById !== userId) {
      throw new ForbiddenException('You do not own this challenge.');
    }
    return challenge;
  }

  private publicSiteUrl(): string {
    return (
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.PUBLIC_SITE_URL ??
      'https://vital30.com'
    );
  }

  private readonly detailSelect = {
    id: true,
    title: true,
    slug: true,
    shortDescription: true,
    description: true,
    dailyTask: true,
    durationDays: true,
    difficulty: true,
    categoryId: true,
    createdById: true,
    visibility: true,
    inviteToken: true,
    isActive: true,
    createdAt: true,
  } as const;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'challenge';
}
