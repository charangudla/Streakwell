import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/achievements_provider.dart';

class _BadgeMeta {
  const _BadgeMeta({
    required this.title,
    required this.description,
    required this.icon,
    required this.bg,
    required this.fg,
  });
  final String title;
  final String description;
  final IconData icon;
  final Color bg;
  final Color fg;
}

const _allBadges = <String, _BadgeMeta>{
  'FIRST_CHECKIN': _BadgeMeta(
    title: 'First check-in',
    description: 'You took the first step — the hardest one.',
    icon: Icons.flag_outlined,
    bg: Vital30Colors.skyTint,
    fg: Vital30Colors.skyDeep,
  ),
  'SEVEN_DAY_STREAK': _BadgeMeta(
    title: '7-day streak',
    description: 'A full week of consistency. The habit is taking root.',
    icon: Icons.local_fire_department_outlined,
    bg: Vital30Colors.accentTint,
    fg: Vital30Colors.accentDeep,
  ),
  'TWENTY_ONE_DAY_STREAK': _BadgeMeta(
    title: '21-day streak',
    description: 'Three weeks straight. You are well on your way to 30.',
    icon: Icons.bolt_outlined,
    bg: Vital30Colors.accentTint,
    fg: Vital30Colors.accentDeep,
  ),
  'CHALLENGE_COMPLETED': _BadgeMeta(
    title: 'Challenge complete',
    description: '30 days done. Take a breath and pick the next one.',
    icon: Icons.celebration_outlined,
    bg: Vital30Colors.primaryTint,
    fg: Vital30Colors.primaryDeep,
  ),
  'THREE_CHALLENGES_COMPLETED': _BadgeMeta(
    title: 'Three challenges done',
    description: 'You have built three habits with Vital30. Compounding.',
    icon: Icons.workspace_premium_outlined,
    bg: Vital30Colors.primaryTint,
    fg: Vital30Colors.primaryDeep,
  ),
};

class AchievementsScreen extends ConsumerWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final achievements = ref.watch(achievementsProvider);

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
                  Text('Achievements',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: achievements.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (_, __) => _ErrorView(
                  onRetry: () =>
                      ref.read(achievementsProvider.notifier).refresh(),
                ),
                data: (items) {
                  final earnedByKind = {for (final a in items) a.kind: a};
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(achievementsProvider.notifier).refresh(),
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 16, Vital30Space.screenH, 32),
                      children: [
                        _SummaryCard(earned: items.length, total: _allBadges.length),
                        const SizedBox(height: 18),
                        for (final entry in _allBadges.entries)
                          _BadgeTile(
                            meta: entry.value,
                            earned: earnedByKind[entry.key],
                          ),
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

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.earned, required this.total});
  final int earned;
  final int total;

  @override
  Widget build(BuildContext context) {
    final progress = total == 0 ? 0.0 : earned / total;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Vital30Colors.ink,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('YOU\'VE EARNED',
              style: Vital30Text.label
                  .copyWith(color: Vital30Colors.surface.withValues(alpha: 0.6))),
          const SizedBox(height: 6),
          Text('$earned of $total badges',
              style: Vital30Text.h2
                  .copyWith(color: Vital30Colors.surface, fontSize: 24)),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: Vital30Colors.surface.withValues(alpha: 0.15),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Vital30Colors.accent),
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.meta, this.earned});
  final _BadgeMeta meta;
  final AchievementEntry? earned;

  @override
  Widget build(BuildContext context) {
    final isEarned = earned != null;
    final dim = isEarned ? 1.0 : 0.4;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Opacity(
            opacity: dim,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: meta.bg, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Icon(meta.icon, color: meta.fg, size: 20),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Opacity(
              opacity: dim,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(meta.title, style: Vital30Text.title.copyWith(fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(meta.description,
                      style: Vital30Text.body.copyWith(fontSize: 13)),
                  if (isEarned) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Earned ${DateFormat.yMMMd().format(earned!.earnedAt.toLocal())}',
                      style: Vital30Text.caption.copyWith(fontSize: 11.5),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (isEarned)
            const Padding(
              padding: EdgeInsets.only(left: 8, top: 2),
              child: Icon(Icons.check_circle,
                  color: Vital30Colors.primary, size: 20),
            )
          else
            const Padding(
              padding: EdgeInsets.only(left: 8, top: 2),
              child: Icon(Icons.lock_outline,
                  color: Vital30Colors.inkSoft, size: 18),
            ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Could not load achievements.',
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
