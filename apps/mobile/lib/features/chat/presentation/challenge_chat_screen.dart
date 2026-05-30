import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../friends/application/friends_provider.dart';
import '../application/chat_provider.dart';

/// Full-screen community chat for a single challenge. Mirrors the web
/// `ChallengeChat`: a closed catalog of preset status updates (no free
/// text), six toggle-able reactions, a live participation poll, and a
/// Members sheet that reuses the Phase-1 friend actions.
///
/// Bubble sides are deliberately *opposite* WhatsApp — your own posts sit
/// on the LEFT (solid brand bubble), everyone else's on the RIGHT
/// (tone-tinted, with avatar + name) — matching the web layout.
class ChallengeChatScreen extends ConsumerStatefulWidget {
  const ChallengeChatScreen({super.key, required this.challengeId});

  final String challengeId;

  @override
  ConsumerState<ChallengeChatScreen> createState() =>
      _ChallengeChatScreenState();
}

class _ChallengeChatScreenState extends ConsumerState<ChallengeChatScreen> {
  bool _showPicker = false;
  bool _posting = false;

  String get _cid => widget.challengeId;

  Future<void> _post(String presetCode) async {
    if (_posting) return;
    setState(() => _posting = true);
    try {
      await ref.read(chatChannelProvider(_cid).notifier).post(presetCode);
      if (mounted) setState(() => _showPicker = false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_friendlyChatError(e))));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  Future<void> _react(String messageId, String code) async {
    try {
      await ref
          .read(chatChannelProvider(_cid).notifier)
          .toggleReaction(messageId, code);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update reaction.')),
      );
    }
  }

  void _openMembers() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _MembersSheet(challengeId: _cid),
    );
  }

  @override
  Widget build(BuildContext context) {
    final channelAsync = ref.watch(chatChannelProvider(_cid));
    final myId = ref.watch(authProvider).user?.id ?? '';
    final title = ref.watch(challengesProvider).maybeWhen(
          data: (l) {
            for (final c in l) {
              if (c.id == _cid) return c.title;
            }
            return 'Community chat';
          },
          orElse: () => 'Community chat',
        );

    return Scaffold(
      backgroundColor: Vital30Colors.surface,
      body: SafeArea(
        child: Column(
          children: [
            _TopHeader(
              title: title,
              onBack: () =>
                  context.canPop() ? context.pop() : context.go('/chat'),
            ),
            Expanded(
              child: channelAsync.when(
                loading: () => const Center(
                  child:
                      CircularProgressIndicator(color: Vital30Colors.primary),
                ),
                error: (_, __) => _ErrorState(
                  onRetry: () =>
                      ref.read(chatChannelProvider(_cid).notifier).refresh(),
                ),
                data: (channel) {
                  // CELEBRATION cards are written server-side but not shown
                  // in the thread (web parity). Wire order is newest-first,
                  // so a reversed ListView pins the newest at the bottom.
                  final display =
                      channel.messages.where((m) => !m.isCelebration).toList();
                  return Column(
                    children: [
                      _ChannelBar(poll: channel.poll, onMembers: _openMembers),
                      Expanded(
                        child: display.isEmpty
                            ? const _EmptyThread()
                            : ListView.builder(
                                reverse: true,
                                padding: const EdgeInsets.fromLTRB(
                                    Vital30Space.screenH,
                                    14,
                                    Vital30Space.screenH,
                                    14),
                                itemCount: display.length,
                                itemBuilder: (_, i) {
                                  final m = display[i];
                                  return _MessageRow(
                                    message: m,
                                    channel: channel,
                                    isOwn: m.user?.id == myId,
                                    onReact: (code) => _react(m.id, code),
                                  );
                                },
                              ),
                      ),
                      _PostBar(
                        presets: channel.presets,
                        open: _showPicker,
                        posting: _posting,
                        onToggle: () =>
                            setState(() => _showPicker = !_showPicker),
                        onPick: _post,
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// Headers
// ===========================================================================

class _TopHeader extends StatelessWidget {
  const _TopHeader({required this.title, required this.onBack});
  final String title;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      child: Row(
        children: [
          VIconButton(
            icon: Icons.arrow_back_ios_new,
            iconSize: 16,
            onPressed: onBack,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              title,
              style: Vital30Text.h3.copyWith(fontSize: 16),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChannelBar extends StatelessWidget {
  const _ChannelBar({required this.poll, required this.onMembers});
  final ChatPoll poll;
  final VoidCallback onMembers;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(
          Vital30Space.screenH, 10, Vital30Space.screenH, 10),
      decoration: const BoxDecoration(
        color: Vital30Colors.card,
        border: Border(
          top: BorderSide(color: Vital30Colors.hairlineSoft),
          bottom: BorderSide(color: Vital30Colors.hairlineSoft),
        ),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Community',
                  style: Vital30Text.title.copyWith(fontSize: 14)),
              const SizedBox(height: 1),
              Text(
                '${poll.total} ${poll.total == 1 ? "member" : "members"}',
                style: Vital30Text.caption.copyWith(fontSize: 11.5),
              ),
            ],
          ),
          const SizedBox(width: 12),
          if (poll.total > 0)
            Expanded(child: _SummaryDots(poll: poll))
          else
            const Spacer(),
          const SizedBox(width: 8),
          Material(
            color: Vital30Colors.surfaceAlt,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(999),
              side: const BorderSide(color: Vital30Colors.hairline),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(999),
              onTap: onMembers,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                child: Row(
                  children: [
                    const Icon(Icons.group_outlined,
                        size: 15, color: Vital30Colors.inkSoft),
                    const SizedBox(width: 5),
                    Text('Members',
                        style: Vital30Text.body.copyWith(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Vital30Colors.inkSoft,
                        )),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Today's participation at a glance — a colour-coded dot + count for each
/// non-empty bucket. Mirrors the web SummaryDots.
class _SummaryDots extends StatelessWidget {
  const _SummaryDots({required this.poll});
  final ChatPoll poll;

  @override
  Widget build(BuildContext context) {
    final dots = <Widget>[
      if (poll.completed > 0)
        _Dot(color: Vital30Colors.primary, count: poll.completed),
      if (poll.missed > 0) _Dot(color: Vital30Colors.berry, count: poll.missed),
      if (poll.skipped > 0)
        _Dot(color: Vital30Colors.mutedSoft, count: poll.skipped),
      if (poll.pending > 0)
        _Dot(color: Vital30Colors.accent, count: poll.pending),
    ];
    return Wrap(
      spacing: 10,
      runSpacing: 4,
      children: dots,
    );
  }
}

class _Dot extends StatelessWidget {
  const _Dot({required this.color, required this.count});
  final Color color;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text('$count',
            style: Vital30Text.caption.copyWith(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Vital30Colors.inkSoft,
            )),
      ],
    );
  }
}

// ===========================================================================
// Message bubbles + reactions
// ===========================================================================

class _MessageRow extends StatelessWidget {
  const _MessageRow({
    required this.message,
    required this.channel,
    required this.isOwn,
    required this.onReact,
  });

  final ChatMessage message;
  final ChatChannel channel;
  final bool isOwn;
  final ValueChanged<String> onReact;

  @override
  Widget build(BuildContext context) {
    final text = channel.presetText(message.presetCode);
    final tone = channel.presetTone(message.presetCode);
    final maxW = MediaQuery.of(context).size.width * 0.80;

    final bubble = Container(
      constraints: BoxConstraints(maxWidth: maxW),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
      decoration: BoxDecoration(
        color: isOwn ? Vital30Colors.primary : _otherBubbleColor(tone),
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isOwn ? 4 : 16),
          bottomRight: Radius.circular(isOwn ? 16 : 4),
        ),
        border: isOwn ? null : Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isOwn) ...[
            Row(
              children: [
                _MiniAvatar(name: message.user?.name ?? 'Member'),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    message.user?.name ?? 'Vital30 member',
                    style: Vital30Text.caption.copyWith(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: Vital30Colors.inkSoft,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],
          Text(
            text,
            style: Vital30Text.body.copyWith(
              fontSize: 14,
              height: 1.3,
              fontWeight: FontWeight.w600,
              color: isOwn ? Vital30Colors.onPrimary : Vital30Colors.ink,
            ),
          ),
        ],
      ),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment:
            isOwn ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          bubble,
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              _relativeTime(message.createdAt),
              style: Vital30Text.caption.copyWith(fontSize: 10.5),
            ),
          ),
          const SizedBox(height: 5),
          _ReactionRow(
            message: message,
            emoji: channel.emoji,
            onReact: onReact,
            alignEnd: !isOwn,
          ),
        ],
      ),
    );
  }
}

class _ReactionRow extends StatelessWidget {
  const _ReactionRow({
    required this.message,
    required this.emoji,
    required this.onReact,
    required this.alignEnd,
  });

  final ChatMessage message;
  final List<ChatReactionEmoji> emoji;
  final ValueChanged<String> onReact;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 5,
      runSpacing: 5,
      alignment: alignEnd ? WrapAlignment.end : WrapAlignment.start,
      children: [
        for (final e in emoji)
          _ReactionChip(
            char: e.char,
            count: message.reactions.countFor(e.code),
            mine: message.reactions.mineFor(e.code),
            onTap: () => onReact(e.code),
          ),
      ],
    );
  }
}

class _ReactionChip extends StatelessWidget {
  const _ReactionChip({
    required this.char,
    required this.count,
    required this.mine,
    required this.onTap,
  });

  final String char;
  final int count;
  final bool mine;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = mine ? Vital30Colors.primaryTint : Vital30Colors.card;
    final border = mine ? Vital30Colors.primarySoft : Vital30Colors.hairline;
    return Material(
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(char, style: const TextStyle(fontSize: 13)),
              if (count > 0) ...[
                const SizedBox(width: 4),
                Text('$count',
                    style: Vital30Text.caption.copyWith(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: mine
                          ? Vital30Colors.primaryDeep
                          : Vital30Colors.muted,
                    )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniAvatar extends StatelessWidget {
  const _MiniAvatar({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: const BoxDecoration(
        color: Vital30Colors.primaryDeep,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        _initials(name),
        style: const TextStyle(
          color: Vital30Colors.onPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 9,
        ),
      ),
    );
  }
}

// ===========================================================================
// Post bar + preset picker
// ===========================================================================

class _PostBar extends StatelessWidget {
  const _PostBar({
    required this.presets,
    required this.open,
    required this.posting,
    required this.onToggle,
    required this.onPick,
  });

  final List<ChatPreset> presets;
  final bool open;
  final bool posting;
  final VoidCallback onToggle;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Vital30Colors.card,
        border: Border(top: BorderSide(color: Vital30Colors.hairlineSoft)),
      ),
      padding: EdgeInsets.fromLTRB(
        Vital30Space.screenH,
        10,
        Vital30Space.screenH,
        10 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (open) ...[
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 220),
              child: SingleChildScrollView(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final p in presets)
                      _PresetChip(
                        preset: p,
                        disabled: posting,
                        onTap: () => onPick(p.code),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
          Material(
            color: open ? Vital30Colors.surfaceAlt : Vital30Colors.primary,
            borderRadius: BorderRadius.circular(Vital30Radius.md),
            child: InkWell(
              borderRadius: BorderRadius.circular(Vital30Radius.md),
              onTap: posting ? null : onToggle,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 13),
                alignment: Alignment.center,
                child: posting
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 15,
                            height: 15,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Vital30Colors.primary,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text('Sending…',
                              style: Vital30Text.body.copyWith(
                                fontWeight: FontWeight.w800,
                                color: Vital30Colors.inkSoft,
                              )),
                        ],
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(open ? Icons.close : Icons.add,
                              size: 18,
                              color: open
                                  ? Vital30Colors.inkSoft
                                  : Vital30Colors.onPrimary),
                          const SizedBox(width: 8),
                          Text(
                            open ? 'Close' : 'Post a status update',
                            style: Vital30Text.body.copyWith(
                              fontWeight: FontWeight.w800,
                              color: open
                                  ? Vital30Colors.inkSoft
                                  : Vital30Colors.onPrimary,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  const _PresetChip({
    required this.preset,
    required this.disabled,
    required this.onTap,
  });

  final ChatPreset preset;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = _otherBubbleColor(preset.tone);
    return Opacity(
      opacity: disabled ? 0.5 : 1,
      child: Material(
        color: bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: const BorderSide(color: Vital30Colors.hairline),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: disabled ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            child: Text(
              preset.text,
              style: Vital30Text.body.copyWith(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Vital30Colors.ink,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
// Members sheet
// ===========================================================================

class _MembersSheet extends ConsumerStatefulWidget {
  const _MembersSheet({required this.challengeId});
  final String challengeId;

  @override
  ConsumerState<_MembersSheet> createState() => _MembersSheetState();
}

class _MembersSheetState extends ConsumerState<_MembersSheet> {
  String? _busyUserId;

  Future<void> _friendAction(ChatMember m) async {
    if (_busyUserId != null) return;
    setState(() => _busyUserId = m.userId);
    try {
      final api = ref.read(apiServiceProvider);
      if (m.friendship == 'none') {
        await api.sendFriendRequest(m.userId);
      } else if (m.friendship == 'pending_received' && m.friendshipId != null) {
        await api.respondToFriendRequest(m.friendshipId!, 'ACCEPTED');
      } else {
        return; // pending_sent / accepted / blocked_by_me — no-op
      }
      ref.invalidate(chatMembersProvider(widget.challengeId));
      ref.invalidate(friendsProvider);
      ref.invalidate(incomingFriendCountProvider);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_friendlyChatError(e))));
    } finally {
      if (mounted) setState(() => _busyUserId = null);
    }
  }

  void _openInvite(ChatMember m) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _InvitePicker(memberUserId: m.userId, memberName: m.name),
    );
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(chatMembersProvider(widget.challengeId));
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Vital30Colors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Vital30Colors.hairline,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
                child: Row(
                  children: [
                    Text('Members',
                        style: Vital30Text.h3.copyWith(fontSize: 17)),
                    const Spacer(),
                    membersAsync.maybeWhen(
                      data: (m) => Text('${m.length}',
                          style: Vital30Text.caption.copyWith(
                              fontSize: 13, fontWeight: FontWeight.w700)),
                      orElse: () => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: membersAsync.when(
                  loading: () => const Center(
                    child:
                        CircularProgressIndicator(color: Vital30Colors.primary),
                  ),
                  error: (_, __) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('Could not load members.',
                          style: Vital30Text.body),
                    ),
                  ),
                  data: (members) => ListView.separated(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
                    itemCount: members.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _MemberRow(
                      member: members[i],
                      busy: _busyUserId == members[i].userId,
                      onFriend: () => _friendAction(members[i]),
                      onInvite: () => _openInvite(members[i]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({
    required this.member,
    required this.busy,
    required this.onFriend,
    required this.onInvite,
  });

  final ChatMember member;
  final bool busy;
  final VoidCallback onFriend;
  final VoidCallback onInvite;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _MemberAvatar(name: member.name),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            member.name,
                            style: Vital30Text.title.copyWith(fontSize: 14),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (member.isYou) ...[
                          const SizedBox(width: 6),
                          Text('(you)',
                              style: Vital30Text.caption.copyWith(
                                  fontSize: 11.5, color: Vital30Colors.muted)),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    _StatusPill(status: member.todayCheckinStatus),
                  ],
                ),
              ),
            ],
          ),
          if (!member.isYou) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _MemberPill(
                  label: 'Invite',
                  onTap: onInvite,
                  busy: false,
                ),
                const SizedBox(width: 8),
                _FriendButton(
                  state: member.friendship,
                  busy: busy,
                  onTap: onFriend,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _FriendButton extends StatelessWidget {
  const _FriendButton({
    required this.state,
    required this.busy,
    required this.onTap,
  });

  final String state;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (label, enabled, filled) = switch (state) {
      'none' => ('Add friend', true, true),
      'pending_received' => ('Accept', true, true),
      'pending_sent' => ('Pending', false, false),
      'accepted' => ('Friends', false, false),
      'blocked_by_me' => ('Blocked', false, false),
      _ => ('Add friend', true, true),
    };
    return _MemberPill(
      label: label,
      onTap: enabled ? onTap : null,
      busy: busy,
      filled: filled && enabled,
    );
  }
}

class _MemberPill extends StatelessWidget {
  const _MemberPill({
    required this.label,
    required this.onTap,
    required this.busy,
    this.filled = false,
  });

  final String label;
  final VoidCallback? onTap;
  final bool busy;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    final bg = filled ? Vital30Colors.primary : Vital30Colors.card;
    final fg = disabled
        ? Vital30Colors.muted
        : filled
            ? Vital30Colors.onPrimary
            : Vital30Colors.inkSoft;
    final border = filled ? Vital30Colors.primary : Vital30Colors.hairline;
    return Material(
      color: disabled && !filled ? Vital30Colors.surfaceAlt : bg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: disabled ? Vital30Colors.hairline : border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: busy ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            busy ? '…' : label,
            style: Vital30Text.body.copyWith(
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
              color: busy ? Vital30Colors.muted : fg,
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});
  final String? status;

  @override
  Widget build(BuildContext context) {
    final (label, fg, bg) = switch (status) {
      'COMPLETED' => (
          'Done today',
          Vital30Colors.primaryDeep,
          Vital30Colors.primaryTint
        ),
      'MISSED' => ('Missed', Vital30Colors.berryDeep, Vital30Colors.berryTint),
      'SKIPPED' => ('Skipped', Vital30Colors.muted, Vital30Colors.surfaceAlt),
      _ => ('Not in yet', Vital30Colors.accentDeep, Vital30Colors.accentTint),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Vital30Text.caption.copyWith(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: fg,
        ),
      ),
    );
  }
}

class _MemberAvatar extends StatelessWidget {
  const _MemberAvatar({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 38,
      height: 38,
      decoration: const BoxDecoration(
        color: Vital30Colors.primaryDeep,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        _initials(name),
        style: const TextStyle(
          color: Vital30Colors.onPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 13,
        ),
      ),
    );
  }
}

// ===========================================================================
// Invite picker — invite a member to one of *your* custom challenges
// ===========================================================================

class _InvitePicker extends ConsumerStatefulWidget {
  const _InvitePicker({required this.memberUserId, required this.memberName});
  final String memberUserId;
  final String memberName;

  @override
  ConsumerState<_InvitePicker> createState() => _InvitePickerState();
}

class _InvitePickerState extends ConsumerState<_InvitePicker> {
  late Future<List<CustomChallenge>> _future;
  String? _busyChallengeId;

  @override
  void initState() {
    super.initState();
    _future = ref.read(apiServiceProvider).getMyCreatedChallenges();
  }

  Future<void> _invite(CustomChallenge c) async {
    if (_busyChallengeId != null) return;
    setState(() => _busyChallengeId = c.id);
    try {
      await ref
          .read(apiServiceProvider)
          .inviteUserToChallenge(c.id, widget.memberUserId);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Invited ${widget.memberName} to ${c.title}.')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyChallengeId = null);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_friendlyChatError(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.5,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Vital30Colors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Vital30Colors.hairline,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Invite ${widget.memberName}',
                        style: Vital30Text.h3.copyWith(fontSize: 17)),
                    const SizedBox(height: 2),
                    Text('Pick one of your custom challenges',
                        style: Vital30Text.caption.copyWith(fontSize: 12)),
                  ],
                ),
              ),
              Expanded(
                child: FutureBuilder<List<CustomChallenge>>(
                  future: _future,
                  builder: (context, snap) {
                    if (snap.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: CircularProgressIndicator(
                            color: Vital30Colors.primary),
                      );
                    }
                    if (snap.hasError) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Text('Could not load your challenges.',
                              style: Vital30Text.body),
                        ),
                      );
                    }
                    final mine = snap.data ?? const <CustomChallenge>[];
                    if (mine.isEmpty) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.add_circle_outline,
                                  size: 44, color: Vital30Colors.inkSoft),
                              const SizedBox(height: 12),
                              Text("You haven't created any challenges yet.",
                                  style: Vital30Text.body,
                                  textAlign: TextAlign.center),
                              const SizedBox(height: 6),
                              Text(
                                'Create a custom challenge first, then invite '
                                'friends to join you.',
                                style: Vital30Text.caption,
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                    return ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                      itemCount: mine.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final c = mine[i];
                        return _InviteChallengeRow(
                          challenge: c,
                          busy: _busyChallengeId == c.id,
                          onInvite: () => _invite(c),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InviteChallengeRow extends StatelessWidget {
  const _InviteChallengeRow({
    required this.challenge,
    required this.busy,
    required this.onInvite,
  });

  final CustomChallenge challenge;
  final bool busy;
  final VoidCallback onInvite;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  challenge.title,
                  style: Vital30Text.title.copyWith(fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text('${challenge.durationDays}-day challenge',
                    style: Vital30Text.caption.copyWith(fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _MemberPill(
            label: 'Invite',
            onTap: onInvite,
            busy: busy,
            filled: true,
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// Empty / error states
// ===========================================================================

class _EmptyThread extends StatelessWidget {
  const _EmptyThread();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.forum_outlined,
                size: 52, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('No updates yet', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'Be the first to post a status update and cheer on the group.',
              style: Vital30Text.body,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                size: 48, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('Could not load the chat.',
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// Helpers
// ===========================================================================

/// Maps a preset/message tone to the OTHER-bubble (and preset-chip) tint.
Color _otherBubbleColor(String tone) {
  switch (tone) {
    case 'success':
      return Vital30Colors.primaryTint;
    case 'milestone':
    case 'humor':
      return Vital30Colors.accentTint;
    case 'support':
      return Vital30Colors.berryTint;
    case 'encourage':
      return Vital30Colors.skyTint;
    case 'neutral':
    default:
      return Vital30Colors.card;
  }
}

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty || parts.first.isEmpty) return '·';
  if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
  return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
      .toUpperCase();
}

String _relativeTime(DateTime at) {
  final now = DateTime.now();
  final diff = now.difference(at.toLocal());
  if (diff.inSeconds < 60) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  final local = at.toLocal();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${months[local.month - 1]} ${local.day}';
}

String _friendlyChatError(Object e) {
  if (e is DioException) {
    final code = e.response?.statusCode;
    if (code == 401) return 'Please sign in again.';
    if (code == 403) return "You're not a member of this challenge.";
    if (code == 404) return 'This challenge could not be found.';
    if (code == 429) return 'Slow down a moment, then try again.';
    if (code != null && code >= 500) {
      return 'Server error. Please try again shortly.';
    }
  }
  return 'Something went wrong. Please try again.';
}
