import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { FavoritesService } from './favorites.service';

class AddFavoriteDto {
  @IsUUID()
  challengeId!: string;
}

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@Session() session: UserSession<Auth>) {
    return this.favorites.list(session.user.id);
  }

  @Post()
  add(@Session() session: UserSession<Auth>, @Body() dto: AddFavoriteDto) {
    return this.favorites.add(session.user.id, dto.challengeId);
  }

  @Delete(':challengeId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Session() session: UserSession<Auth>,
    @Param('challengeId', new ParseUUIDPipe()) challengeId: string,
  ) {
    return this.favorites.remove(session.user.id, challengeId);
  }
}
