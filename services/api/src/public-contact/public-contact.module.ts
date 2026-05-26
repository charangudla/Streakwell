import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PublicContactController } from './public-contact.controller';
import { PublicContactService } from './public-contact.service';

@Module({
  imports: [EmailModule],
  controllers: [PublicContactController],
  providers: [PublicContactService],
})
export class PublicContactModule {}
