import { Module } from '@nestjs/common';

import { UserChallengesModule } from '../user-challenges/user-challenges.module';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';

@Module({
  imports: [UserChallengesModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
})
export class CheckinsModule {}
