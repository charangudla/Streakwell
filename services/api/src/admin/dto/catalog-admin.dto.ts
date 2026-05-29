import { ChallengeDifficulty } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateChallengeDto {
  @IsString() @MinLength(2) @MaxLength(120) title!: string;
  @IsString() @MinLength(2) @MaxLength(140) slug!: string;
  @IsString() @MinLength(2) @MaxLength(300) shortDescription!: string;
  @IsString() @MinLength(2) description!: string;
  @IsString() @MinLength(2) @MaxLength(300) dailyTask!: string;
  @IsInt() @Min(1) @Max(365) durationDays!: number;
  @IsEnum(ChallengeDifficulty) difficulty!: ChallengeDifficulty;
  @IsUUID() categoryId!: string;

  @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  benefits!: string[];

  @IsOptional() @IsString() @MaxLength(500) safetyNote?: string;
  @IsOptional() @IsBoolean() isPopular?: boolean;
  @IsOptional() @IsBoolean() isRecommended?: boolean;
}

export class UpdateChallengeDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(140) slug?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(300) shortDescription?: string;
  @IsOptional() @IsString() @MinLength(2) description?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(300) dailyTask?: string;
  @IsOptional() @IsInt() @Min(1) @Max(365) durationDays?: number;
  @IsOptional() @IsEnum(ChallengeDifficulty) difficulty?: ChallengeDifficulty;
  @IsOptional() @IsUUID() categoryId?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  benefits?: string[];

  @IsOptional() @IsString() @MaxLength(500) safetyNote?: string;
  @IsOptional() @IsBoolean() isPopular?: boolean;
  @IsOptional() @IsBoolean() isRecommended?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateCategoryDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsString() @MinLength(2) @MaxLength(80) slug!: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
}
