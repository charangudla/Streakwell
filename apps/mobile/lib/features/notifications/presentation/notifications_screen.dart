import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';

enum NotificationKind { reminder, milestone, friend, system }

class NotificationItem {
  const NotificationItem({
    required this.kind,
    required this.title,
    required this.body,
    required this.time,
    this.unread = false,
  });
  final NotificationKind kind;
  final String title;
  final String body;
  final String time;
  final bool unread;
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final today = const [
      NotificationItem(
        kind: NotificationKind.reminder,
        title: 'Time to check in',
        body: "Day 5 of 30 Days No Added Sugar — won't take a minute.",
        time: '2h',
        unread: true,
      ),
      NotificationItem(
        kind: NotificationKind.friend,
        title: 'Priya joined your challenge',
        body: 'She started 30 Days No Added Sugar with your invite code.',
        time: '4h',
        unread: true,
      ),
    ];
    final earlier = const [
      NotificationItem(
        kind: NotificationKind.milestone,
        title: 'One week strong',
        body: 'Seven days of consistency. Keep going.',
        time: 'Yesterday',
      ),
      NotificationItem(
        kind: NotificationKind.system,
        title: 'New challenges available',
        body: 'Three new Mental Wellness challenges just landed.',
        time: '2 days ago',
      ),
    ];

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
                    onPressed: () {},
                    child: Text(
                      'Mark all read',
                      style: Vital30Text.body.copyWith(
                        color: Vital30Colors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(
                    Vital30Space.screenH, 16, Vital30Space.screenH, 24),
                children: [
                  _GroupLabel('Today'),
                  for (final n in today) _NotificationRow(item: n),
                  const SizedBox(height: 18),
                  _GroupLabel('Earlier'),
                  for (final n in earlier) _NotificationRow(item: n),
                ],
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
  const _NotificationRow({required this.item});
  final NotificationItem item;

  IconData get _icon {
    switch (item.kind) {
      case NotificationKind.reminder:
        return Icons.notifications_active_outlined;
      case NotificationKind.milestone:
        return Icons.local_fire_department_outlined;
      case NotificationKind.friend:
        return Icons.person_outline;
      case NotificationKind.system:
        return Icons.auto_awesome;
    }
  }

  Color get _bg {
    switch (item.kind) {
      case NotificationKind.reminder:
        return Vital30Colors.primaryTint;
      case NotificationKind.milestone:
        return Vital30Colors.accentTint;
      case NotificationKind.friend:
        return Vital30Colors.skyTint;
      case NotificationKind.system:
        return Vital30Colors.surfaceAlt;
    }
  }

  Color get _fg {
    switch (item.kind) {
      case NotificationKind.reminder:
        return Vital30Colors.primaryDeep;
      case NotificationKind.milestone:
        return Vital30Colors.accentDeep;
      case NotificationKind.friend:
        return Vital30Colors.skyDeep;
      case NotificationKind.system:
        return Vital30Colors.inkSoft;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
                    Text(item.time,
                        style: Vital30Text.caption.copyWith(fontSize: 11.5)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(item.body, style: Vital30Text.body.copyWith(fontSize: 13)),
              ],
            ),
          ),
          if (item.unread)
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
    );
  }
}
