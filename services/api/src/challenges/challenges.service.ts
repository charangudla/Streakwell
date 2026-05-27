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

  /**
   * `userId` is set when the caller is authenticated. PRIVATE challenges
   * are exposed by id only when:
   *   - the caller created the challenge, OR
   *   - the caller has a UserChallenge for it (they joined via the
   *     share link or an accepted invite).
   * Anonymous callers + authenticated callers without an existing join
   * see a 404 for private challenges so we don't leak metadata about
   * private challenges to URL guessers.
   */
  async findById(id: string, userId?: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      select: challengeSelect,
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found.');
    }
    if (challenge.visibility === ChallengeVisibility.PRIVATE) {
      const allowed = userId
        ? challenge.createdById === userId ||
          (await this.userHasJoined(id, userId))
        : false;
      if (!allowed) {
        throw new NotFoundException('Challenge not found.');
      }
    }
    return challenge;
  }

  private async userHasJoined(
    challengeId: string,
    userId: string,
  ): Promise<boolean> {
    const uc = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      select: { id: true },
    });
    return !!uc;
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
