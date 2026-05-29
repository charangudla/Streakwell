import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Admin dashboard API. Every route is ADMIN/SUPER_ADMIN-gated via RolesGuard
 * (applied at the controller). Read/write access to all domains for the
 * operator dashboard at admin.challenge.charangudla.com.
 */
@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
