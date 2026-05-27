import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class JoinChallengeDto {
  @IsUUID()
  challengeId!: string;

  /**
   * Required to join a PRIVATE custom challenge unless the user is the
   * creator or has an accepted invite. Carried in the shareable URL
   * `/c/<token>`; mobile + web copy it onto the join call.
   */
  @IsOptional()
  @IsString()
  @Length(8, 64)
  inviteToken?: string;
}
