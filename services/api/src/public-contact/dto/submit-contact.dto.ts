import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Public contact-form submission DTO. Validated by the global
 * ValidationPipe (whitelist + forbidNonWhitelisted), so any unexpected
 * field is rejected at the controller boundary.
 */
export class SubmitContactDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 100, { message: 'Name must be 1-100 characters.' })
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email is invalid.' })
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(10, 2000, { message: 'Message must be 10-2000 characters.' })
  message!: string;

  /**
   * Honeypot. Real users never see or fill this field. Bots that crawl
   * the form's HTML do. If it's non-empty we silently 204 the request so
   * the bot thinks it succeeded.
   */
  @IsOptional()
  @IsString()
  website?: string;
}
