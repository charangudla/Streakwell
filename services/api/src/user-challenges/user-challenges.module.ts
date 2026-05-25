import { Module } from '@nestjs/common';

import { UserChallengesController } from './user-challenges.controller';
import { UserChallengesService } from './user-challenges.service';

@Module({
  controllers: [UserChallengesController],
  providers: [UserChallengesService],
  exports: [UserChallengesService],
})
export class UserChallengesModule {}
