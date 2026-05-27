import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { FriendRequestDto } from './dto/friend-request.dto';
import { RespondFriendDto } from './dto/respond-friend.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  /**
   * Send a friend request. Throttled — same 20/hour budget as
   * challenge invites since both fire emails/notifications and could
   * be weaponised similarly. Auto-promotes to ACCEPTED if the other
   * party already has a PENDING request to you.
   */
  @Post('request')
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  request(
    @Session() session: UserSession<Auth>,
    @Body() dto: FriendRequestDto,
  ) {
    return this.friends.request(session.user.id, dto.recipientId);
  }

  /** Recipient-only — accept or decline a pending request. */
  @Post(':id/respond')
  respond(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondFriendDto,
  ) {
    return this.friends.respond(session.user.id, id, dto.decision);
  }

  /**
   * All my friendships split into three buckets:
   *   accepted — current friends
   *   incoming — requests waiting on my response
   *   outgoing — requests I sent that haven't been answered
   * DECLINED rows are filtered server-side — the requester shouldn't
   * be reminded of a rejection and the recipient moved on.
   */
  @Get()
  list(@Session() session: UserSession<Auth>) {
    return this.friends.list(session.user.id);
  }

  /** Either party can unfriend; deletes the row. */
  @Delete(':id')
  unfriend(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.friends.unfriend(session.user.id, id);
  }
}
