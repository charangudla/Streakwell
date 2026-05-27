import { IsUUID } from 'class-validator';

/**
 * Invite-by-userId payload. Separate DTO from InviteToChallengeDto so
 * the email and user-id paths stay independent — different validation
 * rules, different downstream lookups.
 */
export class InviteUserDto {
  @IsUUID()
  userId!: string;
}
