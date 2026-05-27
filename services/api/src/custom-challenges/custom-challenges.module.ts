import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserChallengesModule } from '../user-challenges/user-challenges.module';
import { CustomChallengesController } from './custom-challenges.controller';
import { CustomChallengesService } from './custom-challenges.service';
import { InvitesController } from './invites.controller';

@Module({
  imports: [EmailModule, NotificationsModule, UserChallengesModule],
  controllers: [CustomChallengesController, InvitesController],
  providers: [CustomChallengesService],
})
export class CustomChallengesModule {}
