import { Module } from '@nestjs/common';

import { ShareEventsController } from './share-events.controller';
import { ShareEventsService } from './share-events.service';

@Module({
  controllers: [ShareEventsController],
  providers: [ShareEventsService],
})
export class ShareEventsModule {}
