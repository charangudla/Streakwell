import { Injectable, NotFoundException } from '@nestjs/common';
import { ChallengeVisibility } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const challengeSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  durationDays: true,
  difficulty: true,
  dailyTask: true,
  benefits: true,
  safetyNote: true,
  isPopular: true,
  isRecommended: true,
  isActive: true,
  categoryId: true,
  visibility: true,
  createdById: true,
  inviteToken: true,
} as const;

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public browse: seeded catalog + PUBLIC user-created challenges.
   * PRIVATE custom challenges are never exposed here — they're reachable
   * only via the share-link route (`findByInviteToken`) or an explicit
   * invite.
   */
  list() {
    return this.prisma.challenge.findMany({
      where: {
        isActive: true,
        visibility: ChallengeVisibility.PUBLIC,
      },
      orderBy: [
        { isRecommended: 'desc' },
        { isPopular: 'desc' },
        { title: 'asc' },
      ],
      select: challengeSelect,
    });
  }

  async findById(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      select: challengeSelect,
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found.');
    }
    // PRIVATE challenges are reachable by id only if you already know
    // the id (e.g. you're the creator or you're joining via the share
    // link). The visibility gate on join() handles the permission check;
    // here we just refuse anonymous prying for unauthenticated callers
    // by hiding them from the public-by-id endpoint.
    if (challenge.visibility === ChallengeVisibility.PRIVATE) {
      throw new NotFoundException('Challenge not found.');
    }
    return challenge;
  }

  async findBySlug(slug: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { slug },
      select: challengeSelect,
    });
    if (
      !challenge ||
      !challenge.isActive ||
      challenge.visibility === ChallengeVisibility.PRIVATE
    ) {
      throw new NotFoundException('Challenge not found.');
    }
    return challenge;
  }

  /**
   * Resolve a private custom challenge via its shareable invite token.
   * Anyone with the token can fetch the basic challenge details so the
   * `/c/<token>` join landing can render. The visibility gate on
   * `UserChallengesService.join()` re-checks the token before persisting.
   */
  async findByInviteToken(token: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { inviteToken: token },
      select: challengeSelect,
    });
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found.');
    }
    return challenge;
  }
}
