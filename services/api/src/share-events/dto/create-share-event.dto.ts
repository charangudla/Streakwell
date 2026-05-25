import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ShareType } from '@prisma/client';

export class CreateShareEventDto {
  @IsEnum(ShareType)
  type!: ShareType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string | null;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}
