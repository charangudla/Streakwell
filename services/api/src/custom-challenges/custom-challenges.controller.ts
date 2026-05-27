import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { CustomChallengesService } from './custom-challenges.service';
import { CreateCustomChallengeDto } from './dto/create-custom-challenge.dto';
import { InviteToChallengeDto } from './dto/invite-to-challenge.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateCustomChallengeDto } from './dto/update-custom-challenge.dto';

@Controller('custom-challenges')
export class CustomChallengesController {
  constructor(private readonly svc: CustomChallengesService) {}

  // Rate-limited: 10 created challenges per hour per user is generous
  // for legit use, tight enough to slow a scripted abuser.
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @Post()
  create(
    @Session() session: UserSession<Auth>,
    @Body() dto: CreateCustomChallengeDto,
  ) {
    return this.svc.create(session.user.id, dto);
  }

  @Get('mine')
  listMine(@Session() session: UserSession<Auth>) {
    return this.svc.listMineCreated(session.user.id);
  }

  @Patch(':id')
  update(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCustomChallengeDto,
  ) {
    return this.svc.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.softDelete(session.user.id, id);
  }

  // 20 invites per hour per user. Tight because the email path could be
  // weaponized for spam.
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  @Post(':id/invites')
  invite(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: InviteToChallengeDto,
  ) {
    return this.svc.invite(session.user.id, id, dto);
  }

  /**
   * Invite an existing user by their userId (no email exposed to the
   * inviter). Used by the chat Members sheet. Same 20-per-hour
   * throttle as the by-email path so a user can't sidestep the
   * rate limit by using a different endpoint.
   */
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  @Post(':id/invites/by-user')
  inviteUser(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: InviteUserDto,
  ) {
    return this.svc.inviteUser(session.user.id, id, dto.userId);
  }

  @Get(':id/invites')
  listInvites(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.listInvites(id, session.user.id);
  }

  @Get(':id/joiners')
  listJoiners(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.svc.listJoiners(id, session.user.id);
  }
}
