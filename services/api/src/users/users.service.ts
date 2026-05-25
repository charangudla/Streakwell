import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/domain/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return { ...user, role: user.role as UserRole };
  }

  /**
   * Hard-deletes the user. Prisma's onDelete: Cascade on UserChallenge and
   * ShareEvent (and UserChallenge → DailyCheckin) cleans up all owned data
   * in the same transaction.
   *
   * This is the App Store guideline 5.1.1(v) hook: the in-app entry point
   * the user can reach without contacting support.
   */
  async deleteSelf(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        // Record not found — treat as already-deleted (idempotent).
        throw new NotFoundException('User not found.');
      }
      throw e;
    }
  }

  async updateById(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    // class-validator already restricts which fields are accepted; we still
    // build the update payload explicitly so we never relay client values
    // straight through to Prisma.
    const data: { name?: string } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { ...user, role: user.role as UserRole };
  }
}
