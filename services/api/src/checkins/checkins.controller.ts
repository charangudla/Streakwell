import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/security/current-user.decorator';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.checkins.create(user.id, dto);
  }

  @Get('challenge/:userChallengeId')
  listForChallenge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userChallengeId', new ParseUUIDPipe()) userChallengeId: string,
  ) {
    return this.checkins.listForUserChallenge(user.id, userChallengeId);
  }
}
