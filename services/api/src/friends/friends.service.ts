import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export type FriendshipState =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  // Viewer has blocked this user. Returned to the blocker only; the
  // blocked party sees `none` so they don't get a signal that they
  // were blocked.
  | 'blocked_by_me';

export interface FriendshipForOther {
  friendshipId: string;
  state: Exclude<FriendshipState, 'none'>;
}

/**
 * Challenge-friends graph. Friendship is symmetric in meaning but
 * stored as a single row per pair — the row remembers who initiated
 * so the UX can show "pending sent" vs "pending received".
 *
 * Lookups for "is X my friend?" query BOTH directions via OR. Sending
 * a request when the OTHER party already requested you is treated as
 * "auto-accept" so the user never sees the bizarre state of two
 * pending rows pointing at each other.
 */
@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async request(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new BadRequestException("You can't friend yourself.");
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true },
    });
    if (!recipient) throw new NotFoundException('User not found.');

    // Look for an existing relationship in either direction.
    const existing = await this.prisma.challengeFriendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId },
          { requesterId: recipientId, recipientId: userId },
        ],
      },
    });

    if (existing) {
      // Blocked in either direction — refuse silently with a generic
      // "can't send" message so the blocker isn't outed to the blocked
      // party (and so the blocked party doesn't get a fishing signal
      // that their target exists).
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException("Couldn't send the request.");
      }
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends.');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        // If the OTHER party already requested us, "sending a request"
        // back is the most natural way to accept it. Auto-promote.
        if (existing.requesterId === recipientId) {
          const accepted = await this.prisma.challengeFriendship.update({
            where: { id: existing.id },
            data: {
              status: FriendshipStatus.ACCEPTED,
              respondedAt: new Date(),
            },
          });
          // Notify the original requester that we accepted.
          await this.notifyAccept(accepted.requesterId, userId);
          return accepted;
        }
        throw new ConflictException('A friend request is already pending.');
      }
      // DECLINED — let them try again. Wipe the old row so the unique
      // constraint doesn't trip + the recipient doesn't see a stale
      // record.
      await this.prisma.challengeFriendship.delete({
        where: { id: existing.id },
      });
    }

    const fr = await this.prisma.challengeFriendship.create({
      data: { requesterId: userId, recipientId },
    });

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    await this.notifications.emit({
      userId: recipientId,
      type: 'SYSTEM',
      title: 'New challenge friend request',
      body: `${requester?.name ?? 'Someone'} wants to be your challenge friend.`,
      data: { friendshipId: fr.id, requesterId: userId },
    });

    return fr;
  }

  async respond(
    userId: string,
    friendshipId: string,
    decision: 'ACCEPTED' | 'DECLINED',
  ) {
    const fr = await this.prisma.challengeFriendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr) throw new NotFoundException('Request not found.');
    if (fr.recipientId !== userId) {
      throw new ForbiddenException(
        "You can't respond to a request you didn't receive.",
      );
    }
    if (fr.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('This request was already answered.');
    }

    const updated = await this.prisma.challengeFriendship.update({
      where: { id: friendshipId },
      data: {
        status:
          decision === 'ACCEPTED'
            ? FriendshipStatus.ACCEPTED
            : FriendshipStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    if (decision === 'ACCEPTED') {
      await this.notifyAccept(fr.requesterId, userId);
    }
    return updated;
  }

  /**
   * Block a user. If a row already exists between the two parties
   * (PENDING / ACCEPTED / DECLINED), we overwrite it with BLOCKED and
   * point the requesterId at the blocker so we always know who did the
   * blocking from the row alone. Idempotent — re-blocking is a no-op.
   *
   * We do NOT fire a notification to the blocked party (defeats the
   * purpose of blocking) and we do NOT remove the chat membership —
   * blocked users still see each other in shared challenge chats per
   * the v1 scope. The block is solely about preventing friend
   * requests + outbound interactions through the friends graph.
   */
  async block(userId: string, targetId: string) {
    if (userId === targetId) {
      throw new BadRequestException("You can't block yourself.");
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found.');

    const existing = await this.prisma.challengeFriendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, recipientId: targetId },
          { requesterId: targetId, recipientId: userId },
        ],
      },
    });

    if (existing) {
      // Already blocked — no-op for idempotency. If the OTHER party
      // blocked us, we still overwrite (they'll see us in their list
      // too once both directions update? No — we delete theirs and
      // create ours so the row reflects who is the blocker).
      if (
        existing.status === FriendshipStatus.BLOCKED &&
        existing.requesterId === userId
      ) {
        return existing;
      }
      await this.prisma.challengeFriendship.delete({
        where: { id: existing.id },
      });
    }

    return this.prisma.challengeFriendship.create({
      data: {
        requesterId: userId,
        recipientId: targetId,
        status: FriendshipStatus.BLOCKED,
        respondedAt: new Date(),
      },
    });
  }

  /**
   * Unblock a previously-blocked user. Only the blocker (= the row's
   * requesterId) can call this — the blocked party shouldn't have
   * the ability to remove their own block server-side.
   */
  async unblock(userId: string, friendshipId: string) {
    const fr = await this.prisma.challengeFriendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr || fr.status !== FriendshipStatus.BLOCKED) {
      throw new NotFoundException('Block not found.');
    }
    if (fr.requesterId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.challengeFriendship.delete({
      where: { id: friendshipId },
    });
    return { ok: true };
  }

  /**
   * Cheap counts for the header badge — just the incoming-pending
   * count for now. Kept as a separate endpoint so the header can hit
   * it without paying for the full /friends payload.
   */
  async counts(userId: string) {
    const incoming = await this.prisma.challengeFriendship.count({
      where: {
        recipientId: userId,
        status: FriendshipStatus.PENDING,
      },
    });
    return { incoming };
  }

  async list(userId: string) {
    const rows = await this.prisma.challengeFriendship.findMany({
      where: {
        AND: [
          {
            OR: [{ requesterId: userId }, { recipientId: userId }],
          },
          // DECLINED rows aren't surfaced anywhere — the requester
          // shouldn't be reminded of a rejection and the recipient
          // moved on. Blocked rows where the OTHER party blocked
          // the viewer are also hidden — only the blocker sees
          // their own block.
          { status: { not: FriendshipStatus.DECLINED } },
        ],
      },
      include: {
        requester: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const accepted: Array<{
      friendshipId: string;
      user: { id: string; name: string };
      createdAt: Date;
      respondedAt: Date | null;
    }> = [];
    const incoming: typeof accepted = [];
    const outgoing: typeof accepted = [];
    const blocked: typeof accepted = [];

    for (const fr of rows) {
      const other =
        fr.requesterId === userId ? fr.recipient : fr.requester;
      const view = {
        friendshipId: fr.id,
        user: { id: other.id, name: other.name },
        createdAt: fr.createdAt,
        respondedAt: fr.respondedAt,
      };
      if (fr.status === FriendshipStatus.BLOCKED) {
        // Only the blocker (= requesterId) sees their own block. Hide
        // the row from the blocked party so they don't get a fishing
        // signal that they were blocked.
        if (fr.requesterId === userId) blocked.push(view);
      } else if (fr.status === FriendshipStatus.ACCEPTED) {
        accepted.push(view);
      } else if (fr.recipientId === userId) {
        incoming.push(view);
      } else {
        outgoing.push(view);
      }
    }
    return { accepted, incoming, outgoing, blocked };
  }

  async unfriend(userId: string, friendshipId: string) {
    const fr = await this.prisma.challengeFriendship.findUnique({
      where: { id: friendshipId },
    });
    if (!fr) throw new NotFoundException('Friendship not found.');
    if (fr.requesterId !== userId && fr.recipientId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.challengeFriendship.delete({
      where: { id: friendshipId },
    });
    return { ok: true };
  }

  /**
   * For a viewer + a list of other userIds, return the friendship
   * state with the viewer keyed by other userId. Used by the chat
   * Members sheet so each row can render the right action button
   * without N round-trips.
   */
  async statusByUser(
    viewerId: string,
    otherIds: string[],
  ): Promise<Map<string, FriendshipForOther>> {
    const map = new Map<string, FriendshipForOther>();
    if (otherIds.length === 0) return map;
    const rows = await this.prisma.challengeFriendship.findMany({
      where: {
        AND: [
          {
            OR: [
              { requesterId: viewerId, recipientId: { in: otherIds } },
              { requesterId: { in: otherIds }, recipientId: viewerId },
            ],
          },
          { status: { not: FriendshipStatus.DECLINED } },
        ],
      },
    });
    for (const fr of rows) {
      const otherId =
        fr.requesterId === viewerId ? fr.recipientId : fr.requesterId;
      let state: FriendshipForOther['state'];
      if (fr.status === FriendshipStatus.BLOCKED) {
        // Only the blocker sees the blocked state; the blocked party
        // sees 'none' so they can't fish for the fact they were
        // blocked.
        if (fr.requesterId !== viewerId) continue;
        state = 'blocked_by_me';
      } else if (fr.status === FriendshipStatus.ACCEPTED) {
        state = 'accepted';
      } else if (fr.requesterId === viewerId) {
        state = 'pending_sent';
      } else {
        state = 'pending_received';
      }
      map.set(otherId, { friendshipId: fr.id, state });
    }
    return map;
  }

  private async notifyAccept(requesterId: string, accepterId: string) {
    const accepter = await this.prisma.user.findUnique({
      where: { id: accepterId },
      select: { name: true },
    });
    await this.notifications.emit({
      userId: requesterId,
      type: 'SYSTEM',
      title: 'New challenge friend',
      body: `${accepter?.name ?? 'Someone'} accepted your friend request.`,
      data: { friendId: accepterId },
    });
  }
}

