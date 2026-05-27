import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @AllowAnonymous()
  @Get()
  list() {
    return this.challenges.list();
  }

  @AllowAnonymous()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.challenges.findBySlug(slug);
  }

  @AllowAnonymous()
  @Get('by-token/:token')
  findByInviteToken(@Param('token') token: string) {
    return this.challenges.findByInviteToken(token);
  }

  /**
   * @OptionalAuth makes the route work with or without a session. When
   * authenticated, the session lets us expose PRIVATE challenges the
   * caller has joined or created; otherwise PRIVATE 404s.
   */
  @OptionalAuth()
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Session() session: UserSession<Auth> | null,
  ) {
    return this.challenges.findById(id, session?.user?.id);
  }
}
