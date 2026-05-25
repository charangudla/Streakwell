import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/mock_data.dart';
import '../../../core/theme/v_categories.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/widgets/cat_tile.dart';
import '../../../core/widgets/screen_header.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../../core/widgets/v_progress_bar.dart';
import '../../../core/widgets/v_stat.dart';
import '../../challenges/presentation/challenges_provider.dart';
import 'my_challenges_provider.dart';

class MyChallengesScreen extends ConsumerWidget {
  const MyChallengesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myAsync = ref.watch(myChallengesNotifierProvider);

    return SafeArea(
      bottom: false,
      child: myAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Vital30Colors.primary),
        ),
        error: (e, _) => Center(child: Text('Error: $e', style: Vital30Text.body)),
        data: (list) {
          final active = list.where((u) => u.status == 'ACTIVE').toList();
          final completed = list.where((u) => u.status == 'COMPLETED').toList();
          final dueCount = active.length;

          return ListView(
            padding: const EdgeInsets.only(top: 14, bottom: 140),
            children: [
              ScreenHeader(
                title: 'My progress',
                subtitle: active.isEmpty
                    ? 'No active challenges yet. Browse to start one.'
                    : '${active.length} active ${active.length == 1 ? "challenge" : "challenges"}. ${dueCount > 0 ? "$dueCount check-in waiting." : ""}',
              ),
              const SizedBox(height: 16),
              if (dueCount > 0)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
                  child: _DueReminderStrip(),
                ),
              const SizedBox(height: 20),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
                child: _SectionLabel(label: 'Active'),
              ),
              const SizedBox(height: 12),
              for (final uc in active)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                      Vital30Space.screenH, 0, Vital30Space.screenH, 12),
                  child: _ActiveCard(uc: uc),
                ),
              if (active.isEmpty) const _EmptyActive(),
              if (completed.isNotEmpty) ...[
                const SizedBox(height: 18),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
                  child: _SectionLabel(label: 'Completed'),
                ),
                const SizedBox(height: 12),
                for (final uc in completed)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                        Vital30Space.screenH, 0, Vital30Space.screenH, 10),
                    child: _CompletedCard(uc: uc),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Text(
            label,
            style: Vital30Text.h3.copyWith(fontSize: 16),
          ),
        ),
      ],
    );
  }
}

class _DueReminderStrip extends StatelessWidget {
  const _DueReminderStrip();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Vital30Colors.ink,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Vital30Colors.accent.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Icon(
              Icons.notifications_active_outlined,
              size: 16,
              color: Vital30Colors.accent,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Check-ins waiting today',
              style: Vital30Text.body.copyWith(
                color: Vital30Colors.surface,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Icon(Icons.chevron_right,
              color: Colors.white60, size: 18),
        ],
      ),
    );
  }
}

class _ActiveCard extends ConsumerWidget {
  const _ActiveCard({required this.uc});
  final UserChallenge uc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(uc.id));

    final challenge = challengesAsync.maybeWhen(
      data: (l) => l.firstWhere(
        (c) => c.id == uc.challengeId,
        orElse: () => l.first,
      ),
      orElse: () => null,
    );
    final cat = challenge == null
        ? Vital30Category.diet
        : Vital30Categories.fromCategoryId(challenge.categoryId);
    final catStyle = Vital30Categories.of(cat);

    final today = DateTime.now();
    final dueToday = checkinsAsync.maybeWhen(
      data: (cks) {
        return !cks.any((c) =>
            c.checkinDate.year == today.year &&
            c.checkinDate.month == today.month &&
            c.checkinDate.day == today.day);
      },
      orElse: () => true,
    );

    final stats = checkinsAsync.maybeWhen(
      data: ProgressCalculator.calculate,
      orElse: () => const ProgressStats(
        completedCount: 0,
        missedCount: 0,
        skippedCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        completionPercentage: 0,
      ),
    );

    final dayN =
        (today.difference(uc.startDate.toLocal()).inDays + 1).clamp(1, 30);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
        boxShadow: Vital30Shadow.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CatTile(category: cat, size: 42, radius: 11),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      catStyle.short.toUpperCase(),
                      style: TextStyle(
                        color: catStyle.ink,
                        fontWeight: FontWeight.w700,
                        fontSize: 10.5,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      challenge?.title ?? 'Challenge',
                      style: Vital30Text.title.copyWith(fontSize: 15),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Text(
                'Day $dayN/30',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Vital30Colors.muted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          VProgressBar(progress: stats.completedCount / 30),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Row(
                  children: [
                    VStat(label: 'Active', value: '${stats.completedCount}'),
                    const SizedBox(width: 14),
                    VStat(
                      label: 'Streak',
                      value: '${stats.currentStreak}',
                      icon: Icons.local_fire_department_outlined,
                      iconColor: Vital30Colors.accent,
                    ),
                    if (stats.missedCount > 0) ...[
                      const SizedBox(width: 14),
                      VStat(
                        label: 'Missed',
                        value: '${stats.missedCount}',
                        color: Vital30Colors.berry,
                      ),
                    ],
                  ],
                ),
              ),
              if (dueToday)
                VButton(
                  label: 'Check in',
                  size: VButtonSize.sm,
                  onPressed: () => context.push('/checkin/${uc.id}'),
                )
              else
                VButton(
                  label: 'View',
                  size: VButtonSize.sm,
                  kind: VButtonKind.secondary,
                  onPressed: () => context.push('/progress/${uc.id}'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompletedCard extends ConsumerWidget {
  const _CompletedCard({required this.uc});
  final UserChallenge uc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final challenge = challengesAsync.maybeWhen(
      data: (l) => l.firstWhere(
        (c) => c.id == uc.challengeId,
        orElse: () => l.first,
      ),
      orElse: () => null,
    );
    final cat = challenge == null
        ? Vital30Category.diet
        : Vital30Categories.fromCategoryId(challenge.categoryId);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairline, style: BorderStyle.solid),
      ),
      child: Row(
        children: [
          CatTile(category: cat, size: 36, radius: 10),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  challenge?.title ?? 'Challenge',
                  style: Vital30Text.title.copyWith(fontSize: 14.5),
                ),
                const SizedBox(height: 2),
                Text(
                  '30 of 30 active days',
                  style: Vital30Text.caption.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
          const VPill(
            label: 'Complete',
            tone: VPillTone.primary,
            size: VPillSize.sm,
          ),
        ],
      ),
    );
  }
}

class _EmptyActive extends StatelessWidget {
  const _EmptyActive();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Vital30Space.screenH),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(Vital30Radius.lg),
          border: Border.all(color: Vital30Colors.hairline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Vital30Colors.primaryTint,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome,
                  color: Vital30Colors.primaryDeep, size: 22),
            ),
            const SizedBox(height: 14),
            Text('Nothing active yet.', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'Pick a challenge from the Challenges tab to get started.',
              style: Vital30Text.body,
            ),
          ],
        ),
      ),
    );
  }
}
