import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Gender, PrimaryGoal, UnitPreference } from '@prisma/client';

// Evaluated once at module load — fine for an upper bound on birth year.
const CURRENT_YEAR = new Date().getUTCFullYear();

/**
 * Personal details + onboarding signals. Every field is optional —
 * the welcome flow lets the user fill any subset (or skip entirely),
 * and the profile page edits them piecemeal. Sensible bounds keep
 * garbage out (a 900cm height, a 5000-minute day) without being
 * precious about it.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  /**
   * Year of birth (data-minimised — we never store the full DOB). 0
   * clears it. Structural bounds here; the 13+ rule is enforced in the
   * service via the shared age policy so there's one source of truth.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(CURRENT_YEAR)
  birthYear?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(280)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsEnum(UnitPreference)
  unitPreference?: UnitPreference;

  @IsOptional()
  @IsEnum(PrimaryGoal)
  primaryGoal?: PrimaryGoal;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  interestCategoryIds?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  dailyMinutes?: number;

  /**
   * When true, stamps onboardingCompletedAt = now so the welcome flow
   * stops redirecting. The flow sends this on both "finish" and
   * "skip all" — skipping is a valid completion, we just don't keep
   * nagging.
   */
  @IsOptional()
  @IsBoolean()
  markOnboardingComplete?: boolean;
}
