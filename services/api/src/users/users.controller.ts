import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

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
