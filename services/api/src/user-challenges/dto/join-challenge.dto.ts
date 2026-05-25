import { IsUUID } from 'class-validator';

export class JoinChallengeDto {
  @IsUUID()
  challengeId!: string;
}
