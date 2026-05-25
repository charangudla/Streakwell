import { Controller, Get } from '@nestjs/common';

import { Public } from '../auth/security/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'vital30-api',
      timestamp: new Date().toISOString(),
    };
  }
}
