import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post()
  create(@Session() session: UserSession<Auth>, @Body() dto: CreateCheckinDto) {
    return this.checkins.create(session.user.id, dto);
  }

  @Get('challenge/:userChallengeId')
  listForChallenge(
    @Session() session: UserSession<Auth>,
    @Param('userChallengeId', new ParseUUIDPipe()) userChallengeId: string,
  ) {
    return this.checkins.listForUserChallenge(session.user.id, userChallengeId);
  }
}
