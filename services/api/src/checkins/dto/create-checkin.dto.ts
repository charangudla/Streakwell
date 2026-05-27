import {
  IsDateString,
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

  /**
   * Optional ISO date (YYYY-MM-DD or full ISO timestamp). Defaults to
   * "today" UTC when omitted. Lets the web/mobile clients backfill or
   * correct a past day's entry from the progress calendar. The service
   * validates this date sits inside the challenge window and isn't in
   * the future before accepting the upsert.
   */
  @IsOptional()
  @IsDateString()
  checkinDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
