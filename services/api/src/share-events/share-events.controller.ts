import { Body, Controller, Post } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { CreateShareEventDto } from './dto/create-share-event.dto';
import { ShareEventsService } from './share-events.service';

@Controller('share-events')
export class ShareEventsController {
  constructor(private readonly shareEvents: ShareEventsService) {}

  @Post()
  create(
    @Session() session: UserSession<Auth>,
    @Body() dto: CreateShareEventDto,
  ) {
    return this.shareEvents.create(session.user.id, dto);
  }
}
