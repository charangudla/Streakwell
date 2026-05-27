import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { AchievementsModule } from './achievements/achievements.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogService } from './audit/audit-log.service';
import { AuditModule } from './audit/audit.module';
import { createAuth } from './auth/auth';
import { CategoriesModule } from './categories/categories.module';
import { ChallengeChatModule } from './challenge-chat/challenge-chat.module';
import { ChallengesModule } from './challenges/challenges.module';
import { CheckinsModule } from './checkins/checkins.module';
import { CustomChallengesModule } from './custom-challenges/custom-challenges.module';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';
import { FavoritesModule } from './favorites/favorites.module';
import { FriendsModule } from './friends/friends.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { PublicContactModule } from './public-contact/public-contact.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ShareEventsModule } from './share-events/share-events.module';
import { UserChallengesModule } from './user-challenges/user-challenges.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    EmailModule,
    AuditModule,

    // Better Auth — mounts at /api/auth/* and registers a global AuthGuard
    // that protects every non-/api/auth route by default. Use @AllowAnonymous
    // on individual public handlers (categories list, challenges, health).
    AuthModule.forRootAsync({
      imports: [EmailModule, AuditModule],
      inject: [PrismaService, ConfigService, EmailService, AuditLogService],
      useFactory: (
        prisma: PrismaService,
        config: ConfigService,
        email: EmailService,
        audit: AuditLogService,
      ) => ({
        auth: createAuth(prisma, config, email, audit),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
        },
      }),
    }),

    HealthModule,
    CategoriesModule,
    ChallengesModule,
    UserChallengesModule,
    NotificationsModule,
    AchievementsModule,
    CheckinsModule,
    FavoritesModule,
    FriendsModule,
    ReferralsModule,
    PublicContactModule,
    ShareEventsModule,
    CustomChallengesModule,
    ChallengeChatModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
