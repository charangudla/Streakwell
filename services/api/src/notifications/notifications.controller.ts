import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Session() session: UserSession<Auth>) {
    return this.notifications.list(session.user.id);
  }

  @Get('unread-count')
  unread(@Session() session: UserSession<Auth>) {
    return this.notifications.unreadCount(session.user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.notifications.markRead(session.user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@Session() session: UserSession<Auth>) {
    return this.notifications.markAllRead(session.user.id);
  }
}
