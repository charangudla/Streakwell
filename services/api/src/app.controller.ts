import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/security/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getRoot(): { message: string } {
    return this.appService.getRoot();
  }
}
