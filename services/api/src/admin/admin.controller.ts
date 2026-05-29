import {
  Body,
  Controller,
  Delete,
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
import {
  CreateCategoryDto,
  CreateChallengeDto,
  UpdateCategoryDto,
  UpdateChallengeDto,
} from './dto/catalog-admin.dto';
import { ResolveDto } from './dto/moderation-admin.dto';
import { SetActiveDto, SetRoleDto } from './dto/user-admin.dto';

/** Parse a string query flag into an optional boolean. */
function toBool(v?: string): boolean | undefined {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

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

  // ---- Catalog: challenges ----

  @Get('challenges')
  listChallenges() {
    return this.admin.listChallenges();
  }

  @Post('challenges')
  createChallenge(@Body() dto: CreateChallengeDto) {
    return this.admin.createChallenge(dto);
  }

  @Patch('challenges/:id')
  updateChallenge(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.admin.updateChallenge(id, dto);
  }

  /** Soft-delete (deactivate) — never hard-deletes, to protect user progress. */
  @Delete('challenges/:id')
  deactivateChallenge(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.deactivateChallenge(id);
  }

  // ---- Catalog: categories ----

  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.admin.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.admin.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.deleteCategory(id);
  }

  // ---- Activity viewers ----

  @Get('checkins')
  listCheckins(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.listCheckins({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('share-events')
  listShareEvents(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.listShareEvents({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  // ---- Moderation ----

  @Get('custom-challenges')
  listCustomChallenges() {
    return this.admin.listCustomChallenges();
  }

  @Get('chat-messages')
  listChatMessages(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.listChatMessages({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Delete('chat-messages/:id')
  deleteChatMessage(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admin.deleteChatMessage(id);
  }

  @Get('friendships')
  listFriendships(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.admin.listFriendships({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  // ---- Contact submissions inbox ----

  @Get('contact-submissions')
  listContactSubmissions(
    @Query('resolved') resolved?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.admin.listContactSubmissions({
      resolved: toBool(resolved),
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Post('contact-submissions/:id/resolve')
  resolveContactSubmission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveDto,
  ) {
    return this.admin.resolveContactSubmission(id, dto.resolved);
  }
}
