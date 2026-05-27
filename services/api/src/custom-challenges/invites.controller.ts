import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { CustomChallengesService } from './custom-challenges.service';
import { RespondToInviteDto } from './dto/respond-to-invite.dto';

/**
 * Invitee-facing endpoints. Separate from `/custom-challenges` so the
 * route URLs read naturally: `/invites` is the recipient's inbox,
 * `/custom-challenges/:id/invites` is the creator's outbox.
 */
@Controller('invites')
export class InvitesController {
  constructor(private readonly svc: CustomChallengesService) {}

  @Get()
  myInbox(@Session() session: UserSession<Auth>) {
    return this.svc.myInbox(session.user.id);
  }

  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  respond(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondToInviteDto,
  ) {
    return this.svc.respondToInvite(session.user.id, id, dto);
  }
}
