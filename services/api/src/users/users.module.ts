import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, FriendsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
