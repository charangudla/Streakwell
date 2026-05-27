import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ChallengeVisibility } from '@prisma/client';

export class UpdateCustomChallengeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(3, 80)
  title?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(10, 300)
  shortDescription?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(3, 200)
  dailyTask?: string;

  @IsOptional()
  @IsEnum(ChallengeVisibility)
  visibility?: ChallengeVisibility;
}
