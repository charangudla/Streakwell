import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { Public } from '../auth/security/public.decorator';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Public()
  @Get()
  list() {
    return this.challenges.list();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.challenges.findById(id);
  }
}
