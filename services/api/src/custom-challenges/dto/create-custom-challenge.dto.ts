import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ChallengeVisibility } from '@prisma/client';

const DIFFICULTIES = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export class CreateCustomChallengeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 80)
  title!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(10, 300)
  shortDescription!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 200)
  dailyTask!: string;

  /** 1..365 days, inclusive. Most users pick 7/14/21/30/60/90. */
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays!: number;

  @IsIn(DIFFICULTIES)
  difficulty!: Difficulty;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsEnum(ChallengeVisibility)
  visibility?: ChallengeVisibility;
}
