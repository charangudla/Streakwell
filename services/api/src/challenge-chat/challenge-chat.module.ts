import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChallengeChatController } from './challenge-chat.controller';
import { ChallengeChatService } from './challenge-chat.service';

@Module({
  imports: [PrismaModule, FriendsModule],
  controllers: [ChallengeChatController],
  providers: [ChallengeChatService],
})
export class ChallengeChatModule {}
