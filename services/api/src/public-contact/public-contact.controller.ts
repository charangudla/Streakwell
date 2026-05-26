import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { SubmitContactDto } from './dto/submit-contact.dto';
import { PublicContactService } from './public-contact.service';

@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly contact: PublicContactService) {}

  /**
   * Anonymous, rate-limited contact form endpoint.
   *
   * - 5 submissions per hour per IP (way more than legitimate users need;
   *   tight enough that spammers can't hose the inbox).
   * - 204 No Content regardless of whether the email actually shipped
   *   (success path) or the honeypot tripped — bots can't differentiate.
   * - Real validation errors (missing name, bad email, message too short)
   *   still surface as 400 because the global ValidationPipe rejects them
   *   before this handler runs.
   */
  @AllowAnonymous()
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async submit(@Body() dto: SubmitContactDto, @Ip() ip: string): Promise<void> {
    await this.contact.submit(dto, ip);
  }
}
