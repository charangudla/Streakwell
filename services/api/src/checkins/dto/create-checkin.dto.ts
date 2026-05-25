import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CheckinStatus } from '@prisma/client';

export class CreateCheckinDto {
  @IsUUID()
  userChallengeId!: string;

  @IsEnum(CheckinStatus)
  status!: CheckinStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
