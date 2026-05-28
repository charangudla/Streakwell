import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateReferralCode } from './referral-code';

const MAX_GENERATE_ATTEMPTS = 6;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrCreateForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, referralCode: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const code = user.referralCode ?? (await this.assignNewCode(userId));
    const referredCount = await this.prisma.user.count({
      where: { referredById: userId },
    });
    return {
      code,
      referredCount,
      // Convenience for the mobile share sheet.
      shareText: this.buildShareText(user.name, code),
    };
  }

  async redeem(userId: string, code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized || normalized.length < 4) {
      throw new BadRequestException('Invalid referral code.');
    }

    const inviter = await this.prisma.user.findUnique({
      where: { referralCode: normalized },
      select: { id: true, name: true },
    });
    if (!inviter) {
      throw new NotFoundException('Referral code not found.');
    }
    if (inviter.id === userId) {
      throw new BadRequestException("You can't redeem your own code.");
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, referredById: true },
    });
    if (!currentUser) throw new NotFoundException('User not found.');
    if (currentUser.referredById) {
      throw new BadRequestException(
        'You have already redeemed a referral code.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { referredById: inviter.id },
    });

    await this.notifications.emit({
      userId: inviter.id,
      type: 'REFERRAL_JOIN',
      title: 'Someone joined with your code',
      body: `${currentUser.name} signed up using your Vital30 referral code.`,
      data: { newUserId: userId },
    });

    return { ok: true };
  }

  async ensureCodeForUser(userId: string): Promise<string> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (existing?.referralCode) return existing.referralCode;
    return this.assignNewCode(userId);
  }

  private async assignNewCode(userId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
      const candidate = generateReferralCode();
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: candidate },
        });
        return candidate;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // Code collision — try again.
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to generate a unique referral code.');
  }

  private buildShareText(name: string, code: string): string {
    return `${name} is on Vital30. Join with code ${code} — pick a 30-day wellness challenge and check in daily. https://challenge.charangudla.com/download`;
  }
}
