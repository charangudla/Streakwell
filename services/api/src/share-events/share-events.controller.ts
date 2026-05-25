import { Body, Controller, Post } from '@nestjs/common';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/security/current-user.decorator';
import { CreateShareEventDto } from './dto/create-share-event.dto';
import { ShareEventsService } from './share-events.service';

@Controller('share-events')
export class ShareEventsController {
  constructor(private readonly shareEvents: ShareEventsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShareEventDto,
  ) {
    return this.shareEvents.create(user.id, dto);
  }
}
