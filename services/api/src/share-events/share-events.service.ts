import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateShareEventDto } from './dto/create-share-event.dto';

@Injectable()
export class ShareEventsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateShareEventDto) {
    return this.prisma.shareEvent.create({
      data: {
        userId,
        type: dto.type,
        platform: dto.platform ?? null,
        payload:
          (dto.payload as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      },
    });
  }
}
