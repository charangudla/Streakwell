import { IsUUID } from 'class-validator';

export class FriendRequestDto {
  @IsUUID()
  recipientId!: string;
}
