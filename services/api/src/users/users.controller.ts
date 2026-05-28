import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Caller's own full user row including username + phone (which the
   * Better Auth session.user doesn't carry). The profile page uses
   * this as the source of truth for those two fields.
   */
  @Get('me')
  me(@Session() session: UserSession<Auth>) {
    return this.users.getMe(session.user.id);
  }

  /**
   * Update caller's username and/or phone. Validation lives in the
   * service — controller is just plumbing. Behind a tight throttle
   * because a successful username change is rare (we don't yet
   * support free changes) and abuse here would noisy-poll the
   * unique-index error path.
   */
  @Patch('me')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  updateMe(
    @Session() session: UserSession<Auth>,
    @Body() dto: UpdateMeDto,
  ) {
    return this.users.updateMe(session.user.id, {
      username: dto.username,
      phone: dto.phone,
    });
  }

  /**
   * Live "is this username available?" check used by the signup form.
   * Lightly throttled (60/min) so keystroke-by-keystroke checks
   * during typing don't trip the limit, but a malicious bulk-probe
   * is bounded.
   */
  @Get('check-username')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  checkUsername(@Query('username') username = '') {
    return this.users.checkUsername(username);
  }

  /**
   * Public-tier user profile with a friend-gated bonus tier of fields.
   * Behind global AuthGuard — any authed user can request any other
   * user's preview; the service decides which fields to include based
   * on the viewer ↔ target friendship.
   */
  @Get(':id/profile')
  getProfile(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.users.getProfile(session.user.id, id);
  }
}
