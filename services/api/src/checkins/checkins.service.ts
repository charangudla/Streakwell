import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UserChallengesService } from '../user-challenges/user-challenges.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userChallenges: UserChallengesService,
  ) {}

  async create(userId: string, dto: CreateCheckinDto) {
    await this.userChallenges.assertOwnership(dto.userChallengeId, userId);

    const today = startOfUtcDay(new Date());
    // Re-checking in on the same day overwrites the prior entry. Matches the
    // mobile's optimistic behaviour and the unique constraint on
    // (userChallengeId, checkinDate).
    return this.prisma.dailyCheckin.upsert({
      where: {
        userChallengeId_checkinDate: {
          userChallengeId: dto.userChallengeId,
          checkinDate: today,
        },
      },
      create: {
        userChallengeId: dto.userChallengeId,
        checkinDate: today,
        status: dto.status,
        notes: dto.notes ?? null,
      },
      update: {
        status: dto.status,
        notes: dto.notes ?? null,
      },
    });
  }

  async listForUserChallenge(userId: string, userChallengeId: string) {
    await this.userChallenges.assertOwnership(userChallengeId, userId);
    return this.prisma.dailyCheckin.findMany({
      where: { userChallengeId },
      orderBy: { checkinDate: 'asc' },
    });
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
