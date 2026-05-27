import { IsIn } from 'class-validator';

export class RespondToInviteDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: 'ACCEPTED' | 'DECLINED';
}
