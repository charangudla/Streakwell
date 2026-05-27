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
import { BlockUserDto } from './dto/block-user.dto';
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

  /**
   * Block a user — overwrites any existing PENDING / ACCEPTED /
   * DECLINED row with the viewer as the blocker. Blocked users are
   * server-blocked from sending friend requests in either direction.
   * Same 20/hour budget as friend requests so a malicious bulk-block
   * doesn't sidestep abuse limits.
   */
  @Post('block')
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  block(
    @Session() session: UserSession<Auth>,
    @Body() dto: BlockUserDto,
  ) {
    return this.friends.block(session.user.id, dto.userId);
  }

  /** Unblock — only the original blocker can call this. */
  @Post(':id/unblock')
  unblock(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.friends.unblock(session.user.id, id);
  }

  /**
   * Cheap badge counts. Used by the header Friends icon to render a
   * red bubble when incoming requests are waiting. Kept separate from
   * the full /friends payload so the header can poll-or-refetch
   * without pulling the entire list.
   */
  @Get('counts')
  counts(@Session() session: UserSession<Auth>) {
    return this.friends.counts(session.user.id);
  }
}
