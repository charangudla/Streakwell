import { Injectable, NotFoundException } from '@nestjs/common';

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
} as const;

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
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
    return challenge;
  }

  async findBySlug(slug: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { slug },
      select: challengeSelect,
    });
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found.');
    }
    return challenge;
  }
}
