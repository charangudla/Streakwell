import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/friends_provider.dart';

/// Friends inbox — four sections in priority order, matching the web:
///   1. Pending requests — most actionable (Accept / Decline / Block).
///   2. Friends          — current friends (tap to open profile; Unfriend / Block).
///   3. Sent             — outgoing requests awaiting a response (Cancel).
///   4. Blocked          — users you've blocked (Unblock).
/// DECLINED rows are filtered server-side, so they never appear here.
class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key});

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen> {
  /// friendshipId or userId currently mid-action — disables that row's
  /// buttons so a double-tap can't fire two mutations.
  String? _busyId;

  Future<void> _run(String busyId, Future<void> Function() action) async {
    if (_busyId != null) return;
    setState(() => _busyId = busyId);
    try {
      await action();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_friendlyError(e))),
      );
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  Future<bool> _confirm(String title, String message, String confirmLabel) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: Vital30Text.h3),
        content: Text(message, style: Vital30Text.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Cancel',
                style: Vital30Text.body.copyWith(color: Vital30Colors.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(confirmLabel,
                style: Vital30Text.body.copyWith(
                  color: Vital30Colors.berry,
                  fontWeight: FontWeight.w800,
                )),
          ),
        ],
      ),
    );
    return ok ?? false;
  }

  void _openProfile(String userId) {
    context
        .push('/users/$userId')
        .then((_) => ref.read(friendsProvider.notifier).refresh());
  }

  @override
  Widget build(BuildContext context) {
    final friends = ref.watch(friendsProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  VIconButton(
                    icon: Icons.arrow_back_ios_new,
                    iconSize: 16,
                    onPressed: () => context.pop(),
                  ),
                  const SizedBox(width: 14),
                  Text('Challenge friends',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: friends.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _ErrorState(
                  onRetry: () => ref.read(friendsProvider.notifier).refresh(),
                ),
                data: (data) {
                  if (data.isEmpty) return const _EmptyState();
                  return RefreshIndicator(
                    color: Vital30Colors.primary,
                    onRefresh: () =>
                        ref.read(friendsProvider.notifier).refresh(),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 8, Vital30Space.screenH, 32),
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 4),
                          child: Text(
                            'Connect with people you meet in challenge chats. '
                            'Once you’re friends, you can invite each other to '
                            'your custom challenges.',
                            style: Vital30Text.body.copyWith(fontSize: 13),
                          ),
                        ),
                        if (data.incoming.isNotEmpty) ...[
                          _SectionLabel(
                              'Pending requests', data.incoming.length,
                              tone: _SectionTone.action),
                          for (final fr in data.incoming)
                            _IncomingRow(
                              entry: fr,
                              busy: _isBusy(fr),
                              onView: () => _openProfile(fr.user.id),
                              onAccept: () => _respond(fr, 'ACCEPTED'),
                              onDecline: () => _respond(fr, 'DECLINED'),
                              onBlock: () => _block(fr.user.id, fr.user.name),
                            ),
                          const SizedBox(height: 18),
                        ],
                        if (data.accepted.isNotEmpty) ...[
                          _SectionLabel('Friends', data.accepted.length),
                          for (final fr in data.accepted)
                            _AcceptedRow(
                              entry: fr,
                              busy: _isBusy(fr),
                              onView: () => _openProfile(fr.user.id),
                              onUnfriend: () => _unfriend(fr),
                              onBlock: () => _block(fr.user.id, fr.user.name),
                            ),
                          const SizedBox(height: 18),
                        ],
                        if (data.outgoing.isNotEmpty) ...[
                          _SectionLabel('Sent', data.outgoing.length),
                          for (final fr in data.outgoing)
                            _OutgoingRow(
                              entry: fr,
                              busy: _isBusy(fr),
                              onCancel: () => _cancel(fr),
                            ),
                          const SizedBox(height: 18),
                        ],
                        if (data.blocked.isNotEmpty) ...[
                          _SectionLabel('Blocked', data.blocked.length),
                          for (final fr in data.blocked)
                            _BlockedRow(
                              entry: fr,
                              busy: _isBusy(fr),
                              onUnblock: () => _unblock(fr),
                            ),
                        ],
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _isBusy(FriendSummary fr) =>
      _busyId == fr.friendshipId || _busyId == fr.user.id;

  Future<void> _respond(FriendSummary fr, String decision) {
    return _run(fr.friendshipId,
        () => ref.read(friendsProvider.notifier).respond(fr.friendshipId, decision));
  }

  Future<void> _unfriend(FriendSummary fr) async {
    if (!await _confirm('Remove friend',
        'Remove ${fr.user.name} from your friends?', 'Remove')) {
      return;
    }
    await _run(fr.friendshipId,
        () => ref.read(friendsProvider.notifier).unfriend(fr.friendshipId));
  }

  Future<void> _cancel(FriendSummary fr) {
    return _run(fr.friendshipId,
        () => ref.read(friendsProvider.notifier).unfriend(fr.friendshipId));
  }

  Future<void> _block(String userId, String name) async {
    if (!await _confirm('Block $name',
        "They won't be able to send you friend requests.", 'Block')) {
      return;
    }
    await _run(
        userId, () => ref.read(friendsProvider.notifier).block(userId));
  }

  Future<void> _unblock(FriendSummary fr) {
    return _run(fr.friendshipId,
        () => ref.read(friendsProvider.notifier).unblock(fr.friendshipId));
  }
}

String _friendlyError(Object e) {
  final s = e.toString();
  if (s.contains('already friends')) return 'You are already friends.';
  if (s.contains('pending')) return 'A request is already pending.';
  return 'Something went wrong. Please try again.';
}

// ===========================================================================
// Section header
// ===========================================================================

enum _SectionTone { normal, action }

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.title, this.count, {this.tone = _SectionTone.normal});
  final String title;
  final int count;
  final _SectionTone tone;

  @override
  Widget build(BuildContext context) {
    final color = tone == _SectionTone.action
        ? Vital30Colors.primaryDeep
        : Vital30Colors.muted;
    return Padding(
      padding: const EdgeInsets.only(top: 14, bottom: 8, left: 2),
      child: Row(
        children: [
          Text(title.toUpperCase(),
              style: Vital30Text.label.copyWith(color: color)),
          const SizedBox(width: 6),
          Text('· $count', style: Vital30Text.label.copyWith(color: color)),
        ],
      ),
    );
  }
}

// ===========================================================================
// Avatar + rows
// ===========================================================================

class _Avatar extends StatelessWidget {
  const _Avatar({required this.name, this.blocked = false});
  final String name;
  final bool blocked;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts.first.isEmpty) return '·';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: blocked ? Vital30Colors.mutedSoft : Vital30Colors.primaryDeep,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        blocked ? '✕' : _initials,
        style: const TextStyle(
          color: Vital30Colors.onPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _RowShell extends StatelessWidget {
  const _RowShell({
    required this.child,
    this.background = Vital30Colors.card,
    this.border = Vital30Colors.hairlineSoft,
  });
  final Widget child;
  final Color background;
  final Color border;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
        border: Border.all(color: border),
      ),
      child: child,
    );
  }
}

class _PillButton extends StatelessWidget {
  const _PillButton({
    required this.label,
    required this.onPressed,
    required this.busy,
    this.filled = false,
    this.danger = false,
  });
  final String label;
  final VoidCallback onPressed;
  final bool busy;
  final bool filled;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final fg = filled
        ? Colors.white
        : danger
            ? Vital30Colors.berry
            : Vital30Colors.inkSoft;
    final bg = filled ? Vital30Colors.primary : Vital30Colors.card;
    final border = filled
        ? Vital30Colors.primary
        : danger
            ? Vital30Colors.berryTint
            : Vital30Colors.hairline;
    return Material(
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(color: border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: busy ? null : onPressed,
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

class _IncomingRow extends StatelessWidget {
  const _IncomingRow({
    required this.entry,
    required this.busy,
    required this.onView,
    required this.onAccept,
    required this.onDecline,
    required this.onBlock,
  });
  final FriendSummary entry;
  final bool busy;
  final VoidCallback onView;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onBlock;

  @override
  Widget build(BuildContext context) {
    return _RowShell(
      background: Vital30Colors.primaryTint,
      border: Vital30Colors.primarySoft,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: onView,
            child: Row(
              children: [
                _Avatar(name: entry.user.name),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.user.name,
                          style: Vital30Text.title.copyWith(fontSize: 14)),
                      const SizedBox(height: 2),
                      Text('Tap to review profile',
                          style: Vital30Text.caption.copyWith(fontSize: 12)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right,
                    size: 18, color: Vital30Colors.muted),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.end,
            children: [
              _PillButton(
                  label: 'Block', onPressed: onBlock, busy: busy, danger: true),
              _PillButton(
                  label: 'Decline', onPressed: onDecline, busy: busy),
              _PillButton(
                  label: 'Accept',
                  onPressed: onAccept,
                  busy: busy,
                  filled: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _AcceptedRow extends StatelessWidget {
  const _AcceptedRow({
    required this.entry,
    required this.busy,
    required this.onView,
    required this.onUnfriend,
    required this.onBlock,
  });
  final FriendSummary entry;
  final bool busy;
  final VoidCallback onView;
  final VoidCallback onUnfriend;
  final VoidCallback onBlock;

  @override
  Widget build(BuildContext context) {
    final since = entry.respondedAt ?? entry.createdAt;
    return _RowShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: onView,
            child: Row(
              children: [
                _Avatar(name: entry.user.name),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(entry.user.name,
                          style: Vital30Text.title.copyWith(fontSize: 14)),
                      const SizedBox(height: 2),
                      Text('Friends since ${_formatDate(since)}',
                          style: Vital30Text.caption.copyWith(fontSize: 12)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right,
                    size: 18, color: Vital30Colors.muted),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _PillButton(label: 'Unfriend', onPressed: onUnfriend, busy: busy),
              const SizedBox(width: 8),
              _PillButton(
                  label: 'Block', onPressed: onBlock, busy: busy, danger: true),
            ],
          ),
        ],
      ),
    );
  }
}

class _OutgoingRow extends StatelessWidget {
  const _OutgoingRow({
    required this.entry,
    required this.busy,
    required this.onCancel,
  });
  final FriendSummary entry;
  final bool busy;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return _RowShell(
      background: Vital30Colors.surfaceAlt,
      child: Row(
        children: [
          _Avatar(name: entry.user.name),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.user.name,
                    style: Vital30Text.title.copyWith(fontSize: 14)),
                const SizedBox(height: 2),
                Text('Waiting for response',
                    style: Vital30Text.caption.copyWith(fontSize: 12)),
              ],
            ),
          ),
          _PillButton(label: 'Cancel', onPressed: onCancel, busy: busy),
        ],
      ),
    );
  }
}

class _BlockedRow extends StatelessWidget {
  const _BlockedRow({
    required this.entry,
    required this.busy,
    required this.onUnblock,
  });
  final FriendSummary entry;
  final bool busy;
  final VoidCallback onUnblock;

  @override
  Widget build(BuildContext context) {
    return _RowShell(
      background: Vital30Colors.berryTint,
      border: Vital30Colors.berryTint,
      child: Row(
        children: [
          _Avatar(name: entry.user.name, blocked: true),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.user.name,
                    style: Vital30Text.title.copyWith(fontSize: 14)),
                const SizedBox(height: 2),
                Text("Blocked — they can't send you requests",
                    style: Vital30Text.caption.copyWith(fontSize: 12)),
              ],
            ),
          ),
          _PillButton(label: 'Unblock', onPressed: onUnblock, busy: busy),
        ],
      ),
    );
  }
}

// ===========================================================================
// Empty + error states
// ===========================================================================

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.group_outlined,
                size: 56, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('No friends yet', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'When you connect with people in challenge chats, they’ll show '
              'up here. Once you’re friends, you can invite each other to '
              'your custom challenges.',
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
            Text('Could not load your friends.',
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

String _formatDate(DateTime d) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  final local = d.toLocal();
  return '${months[local.month - 1]} ${local.day}, ${local.year}';
}
