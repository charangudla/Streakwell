import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';

import {
  type AuthenticatedUser,
  CurrentUser,
} from '../auth/security/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUser, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() current: AuthenticatedUser): Promise<PublicUser> {
    return this.users.findById(current.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.users.updateById(current.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() current: AuthenticatedUser): Promise<void> {
    return this.users.deleteSelf(current.id);
  }
}
