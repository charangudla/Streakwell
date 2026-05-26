import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    final hasUnread =
        (notifications.valueOrNull ?? const <AppNotification>[])
            .any((n) => n.isUnread);

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
                  const Spacer(),
                  Text('Notifications',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                  const Spacer(),
                  TextButton(
                    onPressed: hasUnread
                        ? () => ref
                            .read(notificationsProvider.notifier)
                            .markAllRead()
                        : null,
                    child: Text(
                      'Mark all read',
                      style: Vital30Text.body.copyWith(
                        color: hasUnread
                            ? Vital30Colors.primary
                            : Vital30Colors.inkSoft,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: notifications.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (err, _) => _ErrorState(
                  message: 'Could not load notifications.',
                  onRetry: () =>
                      ref.read(notificationsProvider.notifier).refresh(),
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return const _EmptyState();
                  }
                  final now = DateTime.now();
                  final today = items
                      .where((n) =>
                          n.createdAt.isAfter(now.subtract(const Duration(hours: 24))))
                      .toList();
                  final earlier =
                      items.where((n) => !today.contains(n)).toList();
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(notificationsProvider.notifier).refresh(),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 16, Vital30Space.screenH, 24),
                      children: [
                        if (today.isNotEmpty) ...[
                          const _GroupLabel('Today'),
                          for (final n in today)
                            _NotificationRow(
                              item: n,
                              onTap: () => ref
                                  .read(notificationsProvider.notifier)
                                  .markRead(n.id),
                            ),
                          const SizedBox(height: 18),
                        ],
                        if (earlier.isNotEmpty) ...[
                          const _GroupLabel('Earlier'),
                          for (final n in earlier)
                            _NotificationRow(
                              item: n,
                              onTap: () => ref
                                  .read(notificationsProvider.notifier)
                                  .markRead(n.id),
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
}

class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.label);
  final String label;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(label.toUpperCase(), style: Vital30Text.label),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.item, required this.onTap});
  final AppNotification item;
  final VoidCallback onTap;

  IconData get _icon {
    switch (item.type) {
      case 'REMINDER':
        return Icons.notifications_active_outlined;
      case 'STREAK_MILESTONE':
      case 'ACHIEVEMENT':
        return Icons.local_fire_department_outlined;
      case 'REFERRAL_JOIN':
        return Icons.person_outline;
      case 'CHALLENGE_COMPLETE':
        return Icons.celebration_outlined;
      default:
        return Icons.auto_awesome;
    }
  }

  Color get _bg {
    switch (item.type) {
      case 'REMINDER':
        return Vital30Colors.primaryTint;
      case 'STREAK_MILESTONE':
      case 'ACHIEVEMENT':
        return Vital30Colors.accentTint;
      case 'REFERRAL_JOIN':
        return Vital30Colors.skyTint;
      default:
        return Vital30Colors.surfaceAlt;
    }
  }

  Color get _fg {
    switch (item.type) {
      case 'REMINDER':
        return Vital30Colors.primaryDeep;
      case 'STREAK_MILESTONE':
      case 'ACHIEVEMENT':
        return Vital30Colors.accentDeep;
      case 'REFERRAL_JOIN':
        return Vital30Colors.skyDeep;
      default:
        return Vital30Colors.inkSoft;
    }
  }

  String get _relative {
    final diff = DateTime.now().difference(item.createdAt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${(diff.inDays / 7).floor()}w';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Vital30Colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Vital30Colors.hairlineSoft),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(color: _bg, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Icon(_icon, size: 16, color: _fg),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: Vital30Text.title.copyWith(fontSize: 14),
                        ),
                      ),
                      Text(_relative,
                          style: Vital30Text.caption
                              .copyWith(fontSize: 11.5)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(item.body,
                      style: Vital30Text.body.copyWith(fontSize: 13)),
                ],
              ),
            ),
            if (item.isUnread)
              Container(
                margin: const EdgeInsets.only(left: 8, top: 4),
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Vital30Colors.accent,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

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
            const Icon(Icons.notifications_none,
                size: 56, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('No notifications yet', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'When you hit a streak, complete a challenge, or a friend joins with your code, you’ll see it here.',
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
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
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
            Text(message,
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
