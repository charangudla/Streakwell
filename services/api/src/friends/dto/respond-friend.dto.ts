import { IsIn } from 'class-validator';

export class RespondFriendDto {
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: 'ACCEPTED' | 'DECLINED';
}
