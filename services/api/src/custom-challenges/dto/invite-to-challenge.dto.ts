import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class InviteToChallengeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email is invalid.' })
  email!: string;
}
