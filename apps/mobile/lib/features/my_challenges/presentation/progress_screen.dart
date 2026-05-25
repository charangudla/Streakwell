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
import '../../../core/widgets/progress_ring.dart';
import '../../../core/widgets/thirty_day_grid.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../../core/widgets/v_stat.dart';
import '../../challenges/presentation/challenges_provider.dart';
import 'my_challenges_provider.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key, required this.userChallengeId});
  final String userChallengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(userChallengeId));

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: myAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: Vital30Colors.primary),
          ),
          error: (e, _) => Center(child: Text('$e', style: Vital30Text.body)),
          data: (list) {
            final uc = list.firstWhere(
              (u) => u.id == userChallengeId,
              orElse: () => UserChallenge(
                id: '',
                userId: '',
                challengeId: '',
                status: 'ACTIVE',
                startDate: DateTime.now(),
                progressPercent: 0,
              ),
            );
            if (uc.id.isEmpty) {
              return const Center(child: Text('Challenge not found'));
            }
            final challenge = challengesAsync.maybeWhen(
              data: (cs) => cs.firstWhere(
                (c) => c.id == uc.challengeId,
                orElse: () => cs.first,
              ),
              orElse: () => null,
            );
            final cat = challenge == null
                ? Vital30Category.diet
                : Vital30Categories.fromCategoryId(challenge.categoryId);
            final catStyle = Vital30Categories.of(cat);

            return checkinsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Vital30Colors.primary),
              ),
              error: (e, _) => Center(child: Text('$e')),
              data: (checkins) {
                final stats = ProgressCalculator.calculate(checkins);
                final dayN = DateTime.now()
                        .difference(uc.startDate.toLocal())
                        .inDays +
                    1;
                final dayClamped = dayN.clamp(1, 30);
                final pct = stats.completedCount / 30;
                final days = _buildDayStates(uc.startDate, checkins, dayClamped);

                return ListView(
                  padding: const EdgeInsets.only(bottom: 140),
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
                          Text(
                            'Progress',
                            style: Vital30Text.body.copyWith(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: Vital30Colors.inkSoft,
                            ),
                          ),
                          const Spacer(),
                          VIconButton(
                            icon: Icons.ios_share,
                            iconSize: 16,
                            onPressed: () =>
                                context.push('/share/$userChallengeId'),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            catStyle.label.toUpperCase(),
                            style: Vital30Text.eyebrow.copyWith(
                              color: catStyle.ink,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            challenge?.title ?? 'Challenge',
                            style: Vital30Text.h2.copyWith(fontSize: 24),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                      child: _HeroRingCard(
                        pct: pct,
                        activeDays: stats.completedCount,
                        dayN: dayClamped,
                        streak: stats.currentStreak,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: Row(
                        children: [
                          Expanded(
                            child: VStatCard(
                              label: 'Active',
                              value: '${stats.completedCount}',
                              color: Vital30Colors.primary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: VStatCard(
                              label: 'Streak',
                              value: '${stats.currentStreak}',
                              color: Vital30Colors.accent,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: VStatCard(
                              label: 'Best',
                              value: '${stats.bestStreak}',
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: VStatCard(
                              label: 'Missed',
                              value: '${stats.missedCount}',
                              color: Vital30Colors.berry,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: _MapCard(days: days),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                      child: _EncouragementCard(
                        activeDays: stats.completedCount,
                        dayN: dayClamped,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                      child: VButton(
                        label: 'Share progress',
                        fullWidth: true,
                        icon: Icons.ios_share,
                        onPressed: () =>
                            context.push('/share/$userChallengeId'),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }

  List<DayState> _buildDayStates(
      DateTime start, List<DailyCheckin> checkins, int todayDay) {
    final byKey = <String, String>{};
    for (final c in checkins) {
      final d = c.checkinDate.toLocal();
      byKey['${d.year}-${d.month}-${d.day}'] = c.status;
    }
    final out = <DayState>[];
    for (var i = 0; i < 30; i++) {
      final d = start.add(Duration(days: i));
      final key = '${d.year}-${d.month}-${d.day}';
      final status = byKey[key];
      final isToday = i + 1 == todayDay;
      if (isToday && status == null) {
        out.add(DayState.today);
      } else if (status == 'COMPLETED') {
        out.add(DayState.done);
      } else if (status == 'MISSED') {
        out.add(DayState.missed);
      } else if (status == 'SKIPPED') {
        out.add(DayState.skipped);
      } else if (i + 1 < todayDay) {
        out.add(DayState.missed);
      } else {
        out.add(DayState.upcoming);
      }
    }
    return out;
  }
}

class _HeroRingCard extends StatelessWidget {
  const _HeroRingCard({
    required this.pct,
    required this.activeDays,
    required this.dayN,
    required this.streak,
  });
  final double pct;
  final int activeDays;
  final int dayN;
  final int streak;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ProgressRing(
            progress: pct,
            size: 104,
            stroke: 9,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Vital30Colors.ink,
                      letterSpacing: -1,
                      height: 1,
                    ),
                    children: [
                      TextSpan(text: '$activeDays'),
                      const TextSpan(
                        text: '/30',
                        style: TextStyle(
                          fontSize: 14,
                          color: Vital30Colors.muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'ACTIVE',
                  style: Vital30Text.label.copyWith(fontSize: 10),
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Day $dayN of 30',
                  style: Vital30Text.caption.copyWith(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "You're building real consistency.",
                  style: Vital30Text.title.copyWith(
                    fontSize: 18,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    VPill(
                      label: '${(pct * 100).round()}% complete',
                      tone: VPillTone.primary,
                      size: VPillSize.sm,
                    ),
                    VPill(
                      label: '$streak streak',
                      tone: VPillTone.accent,
                      size: VPillSize.sm,
                      icon: Icons.local_fire_department_outlined,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MapCard extends StatelessWidget {
  const _MapCard({required this.days});
  final List<DayState> days;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('30-day map',
                style: Vital30Text.body.copyWith(
                  fontWeight: FontWeight.w700,
                  color: Vital30Colors.inkSoft,
                  fontSize: 13,
                )),
            Wrap(
              spacing: 10,
              children: const [
                _Legend(color: Vital30Colors.primary, label: 'Done'),
                _Legend(color: Vital30Colors.berryTint, label: 'Missed'),
                _Legend(color: Vital30Colors.card, label: 'Skip', dashed: true),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Vital30Colors.card,
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
            border: Border.all(color: Vital30Colors.hairlineSoft),
          ),
          child: ThirtyDayGrid(days: days),
        ),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label, this.dashed = false});
  final Color color;
  final String label;
  final bool dashed;
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
            border: dashed
                ? Border.all(color: Vital30Colors.hairline)
                : null,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: Vital30Text.caption.copyWith(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _EncouragementCard extends StatelessWidget {
  const _EncouragementCard({required this.activeDays, required this.dayN});
  final int activeDays;
  final int dayN;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Vital30Colors.primaryTint,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: const BoxDecoration(
              color: Vital30Colors.primary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.auto_awesome,
                size: 14, color: Vital30Colors.onPrimary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: Vital30Text.body.copyWith(
                  fontSize: 13.5,
                  height: 1.5,
                  color: Vital30Colors.primaryDeep,
                ),
                children: [
                  const TextSpan(text: 'You completed '),
                  TextSpan(
                    text: '$activeDays of $dayN days so far',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const TextSpan(text: '. Great consistency. Progress counts.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
