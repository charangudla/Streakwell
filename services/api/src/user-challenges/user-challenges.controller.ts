import { Body, Controller, Get, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { UserChallengesService } from './user-challenges.service';

@Controller('user-challenges')
export class UserChallengesController {
  constructor(private readonly userChallenges: UserChallengesService) {}

  @Post()
  join(@Session() session: UserSession<Auth>, @Body() dto: JoinChallengeDto) {
    return this.userChallenges.join(
      session.user.id,
      dto.challengeId,
      dto.inviteToken,
    );
  }

  @Get()
  listMine(@Session() session: UserSession<Auth>) {
    return this.userChallenges.listForUser(session.user.id);
  }
}
