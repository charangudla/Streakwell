import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  /**
   * Length-bounded here, format-validated in the service so we can
   * return rich error reasons (too_short, reserved, etc).
   */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  username?: string;

  /**
   * Plain string — format-validated in the service against E.164.
   * Pass an empty string ("") to CLEAR the phone (e.g. user removes
   * their number from profile). null is harder to pin down in URL
   * encoded / form bodies; empty string is the standard "clear" signal.
   */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
