import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AdminOnly, Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { SetActiveDto, SetRoleDto } from './dto/user-admin.dto';

/**
 * Admin API. The whole controller is gated by RolesGuard + @AdminOnly
 * (ADMIN or SUPER_ADMIN); individual routes can tighten further (e.g. role
 * changes are SUPER_ADMIN only). The global Better Auth AuthGuard runs first
 * and populates the session RolesGuard reads.
 */
@Controller('admin')
@UseGuards(RolesGuard)
@AdminOnly()
// Scoped to the admin surface — validates the admin DTOs without changing
// behaviour on the rest of the app (which has no global ValidationPipe).
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard-stats')
  dashboardStats() {
    return this.admin.dashboardStats();
  }

  // ---- Users ----

  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.admin.listUsers({
      search: search?.trim() || undefined,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('users/:id')
  getUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.getUserDetail(id);
  }

  @Post('users/:id/active')
  setUserActive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return this.admin.setUserActive(id, dto.isActive);
  }

  /** Role changes are the most sensitive admin action — SUPER_ADMIN only. */
  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  setUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.admin.setUserRole(id, dto.role);
  }
}
