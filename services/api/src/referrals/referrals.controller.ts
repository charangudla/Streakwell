import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { ReferralsService } from './referrals.service';

class RedeemReferralDto {
  @IsString()
  @Length(4, 32)
  code!: string;
}

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get('me')
  me(@Session() session: UserSession<Auth>) {
    return this.referrals.getOrCreateForUser(session.user.id);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  redeem(
    @Session() session: UserSession<Auth>,
    @Body() dto: RedeemReferralDto,
  ) {
    return this.referrals.redeem(session.user.id, dto.code);
  }
}
