import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import type { Auth } from '../auth/auth';
import { ChallengeChatService } from './challenge-chat.service';
import { PostMessageDto } from './dto/post-message.dto';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@Controller()
export class ChallengeChatController {
  constructor(private readonly chat: ChallengeChatService) {}

  /**
   * Full channel snapshot: catalogs (presets + emoji), today's live
   * poll, and the last 100 messages with reactions. One round-trip on
   * mount so the chat panel renders without an N+1 fetch storm.
   */
  @Get('challenges/:id/chat')
  getChannel(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) challengeId: string,
  ) {
    return this.chat.getChannel(session.user.id, challengeId);
  }

  /**
   * Members of this challenge's chat (everyone who joined, any
   * status). Joiners only. Used by the chat panel's Members sheet
   * — the inviter UX needs the userIds so it can call the
   * invite-by-user endpoint without exposing emails.
   */
  @Get('challenges/:id/members')
  getMembers(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) challengeId: string,
  ) {
    return this.chat.getMembers(session.user.id, challengeId);
  }

  /**
   * Post a preset message. Throttled to 12/min/user so a misbehaving
   * client (or someone spam-clicking) can't flood the channel.
   */
  @Post('challenges/:id/chat')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  postMessage(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) challengeId: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.chat.postMessage(
      session.user.id,
      challengeId,
      dto.presetCode,
    );
  }

  /**
   * Toggle a reaction on a message. POST is idempotent + toggling: a
   * second call with the same emoji removes the user's reaction.
   * Throttled to 60/min — generous because rapid taps on multiple
   * emojis are expected; the toggle nature keeps it self-limiting.
   */
  @Post('chat-messages/:id/reactions')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  toggleReaction(
    @Session() session: UserSession<Auth>,
    @Param('id', new ParseUUIDPipe()) messageId: string,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.chat.toggleReaction(
      session.user.id,
      messageId,
      dto.emoji,
    );
  }
}
