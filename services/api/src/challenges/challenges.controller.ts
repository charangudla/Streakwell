import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

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
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.challenges.findById(id);
  }
}
