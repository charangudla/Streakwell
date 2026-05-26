import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        challenge: {
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            difficulty: true,
            durationDays: true,
            categoryId: true,
          },
        },
      },
    });
  }

  async add(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, isActive: true },
    });
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found.');
    }
    try {
      return await this.prisma.favorite.create({
        data: { userId, challengeId },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Already favorited.');
      }
      throw err;
    }
  }

  async remove(userId: string, challengeId: string) {
    const result = await this.prisma.favorite.deleteMany({
      where: { userId, challengeId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Favorite not found.');
    }
    return { removed: result.count };
  }
}
