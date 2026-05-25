import { Body, Controller, Get, Post } from '@nestjs/common';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/security/current-user.decorator';
import { JoinChallengeDto } from './dto/join-challenge.dto';
import { UserChallengesService } from './user-challenges.service';

@Controller('user-challenges')
export class UserChallengesController {
  constructor(private readonly userChallenges: UserChallengesService) {}

  @Post()
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinChallengeDto) {
    return this.userChallenges.join(user.id, dto.challengeId);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.userChallenges.listForUser(user.id);
  }
}
