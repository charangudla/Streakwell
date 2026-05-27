import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CheckinStatus, UserChallengeStatus } from '@prisma/client';

import { AchievementsService } from '../achievements/achievements.service';
import { calculateChallengeProgress } from '../challenges/domain/progress-calculator';
import { PrismaService } from '../prisma/prisma.service';
import { UserChallengesService } from '../user-challenges/user-challenges.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CheckinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userChallenges: UserChallengesService,
    private readonly achievements: AchievementsService,
  ) {}

  async create(userId: string, dto: CreateCheckinDto) {
    await this.userChallenges.assertOwnership(dto.userChallengeId, userId);

    // Determine the date this check-in belongs to. Default = today UTC;
    // clients can override with `checkinDate` to backfill or correct a
    // past day from the progress calendar. We validate the chosen date
    // sits INSIDE the challenge window and isn't in the future before
    // letting it through — otherwise a malicious client could log a
    // check-in for an unrelated day or pre-claim tomorrow's streak.
    const checkinDate = dto.checkinDate
      ? startOfUtcDay(new Date(dto.checkinDate))
      : startOfUtcDay(new Date());

    const todayMs = startOfUtcDay(new Date()).getTime();
    if (checkinDate.getTime() > todayMs) {
      throw new BadRequestException('Cannot check in for a future day.');
    }

    const uc = await this.prisma.userChallenge.findUnique({
      where: { id: dto.userChallengeId },
      select: {
        startDate: true,
        challenge: { select: { durationDays: true } },
      },
    });
    if (!uc) throw new NotFoundException('Challenge not found.');

    const startMs = startOfUtcDay(uc.startDate).getTime();
    const dayIdx = Math.floor((checkinDate.getTime() - startMs) / DAY_MS);
    if (dayIdx < 0 || dayIdx >= uc.challenge.durationDays) {
      throw new BadRequestException(
        'Check-in date is outside the challenge window.',
      );
    }

    const checkin = await this.prisma.dailyCheckin.upsert({
      where: {
        userChallengeId_checkinDate: {
          userChallengeId: dto.userChallengeId,
          checkinDate,
        },
      },
      create: {
        userChallengeId: dto.userChallengeId,
        checkinDate,
        status: dto.status,
        notes: dto.notes ?? null,
      },
      update: {
        status: dto.status,
        notes: dto.notes ?? null,
      },
    });

    if (dto.status === CheckinStatus.COMPLETED) {
      // Fire-and-forget — we don't want a slow achievement write to delay
      // the check-in response, but a failure here is a real bug worth
      // surfacing in logs.
      void this.evaluateAchievements(userId, dto.userChallengeId).catch(
        (err) => {
          console.error('Achievement evaluation failed', err);
        },
      );
    }

    // Count completed days AFTER the upsert so the response can tell the
    // client "this check-in completed the challenge" — used by the web
    // CheckinModal to swap its result panel for a celebratory variant
    // and by mobile to trigger the day-30 celebration screen. Mirrors
    // the same `completedDays >= durationDays` trigger the achievement
    // evaluator uses for the COMPLETED flip.
    const completedCount = await this.prisma.dailyCheckin.count({
      where: {
        userChallengeId: dto.userChallengeId,
        status: CheckinStatus.COMPLETED,
      },
    });
    const challengeComplete =
      completedCount >= uc.challenge.durationDays;

    return { ...checkin, challengeComplete };
  }

  async listForUserChallenge(userId: string, userChallengeId: string) {
    await this.userChallenges.assertOwnership(userChallengeId, userId);
    return this.prisma.dailyCheckin.findMany({
      where: { userChallengeId },
      orderBy: { checkinDate: 'asc' },
    });
  }

  private async evaluateAchievements(
    userId: string,
    userChallengeId: string,
  ): Promise<void> {
    const uc = await this.prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: {
        challenge: { select: { id: true, title: true, durationDays: true } },
        checkins: {
          where: { status: CheckinStatus.COMPLETED },
          select: { checkinDate: true },
        },
      },
    });
    if (!uc) return;

    const totalDays = uc.challenge.durationDays;
    const progress = calculateChallengeProgress(
      uc.checkins.map((c) => ({ completedOn: c.checkinDate })),
      totalDays,
    );

    // First completed check-in ever (across all challenges).
    const completedCount = await this.prisma.dailyCheckin.count({
      where: {
        status: CheckinStatus.COMPLETED,
        userChallenge: { userId },
      },
    });
    if (completedCount === 1) {
      await this.achievements.award(userId, 'FIRST_CHECKIN', {
        userChallengeId,
      });
    }

    if (progress.currentStreak >= 7) {
      await this.achievements.award(userId, 'SEVEN_DAY_STREAK', {
        userChallengeId,
      });
    }
    if (progress.currentStreak >= 21) {
      await this.achievements.award(userId, 'TWENTY_ONE_DAY_STREAK', {
        userChallengeId,
      });
    }

    // Challenge completed: either active days reached the target or we're
    // past the duration window.
    if (progress.completedDays >= totalDays) {
      await this.achievements.award(userId, 'CHALLENGE_COMPLETED', {
        userChallengeId,
        challengeTitle: uc.challenge.title,
      });

      // Mark the user-challenge as completed on the server side too so the
      // mobile UI flips to "Completed".
      if (uc.status === UserChallengeStatus.ACTIVE) {
        await this.prisma.userChallenge.update({
          where: { id: userChallengeId },
          data: {
            status: UserChallengeStatus.COMPLETED,
            endDate: new Date(),
          },
        });
      }

      const completedChallenges = await this.prisma.userChallenge.count({
        where: { userId, status: UserChallengeStatus.COMPLETED },
      });
      if (completedChallenges >= 3) {
        await this.achievements.award(userId, 'THREE_CHALLENGES_COMPLETED');
      }
    }
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
