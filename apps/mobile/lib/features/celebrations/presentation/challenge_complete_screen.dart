import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/network/mock_data.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';

class ChallengeCompleteScreen extends ConsumerWidget {
  const ChallengeCompleteScreen({super.key, required this.userChallengeId});
  final String userChallengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(userChallengeId));

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Vital30Colors.ink,
              Vital30Colors.ink,
              Color(0xFF143331),
            ],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              right: -50,
              top: 80,
              child: Text(
                '30',
                style: GoogleFonts.instrumentSerif(
                  fontStyle: FontStyle.italic,
                  fontSize: 380,
                  fontWeight: FontWeight.w400,
                  color: Vital30Colors.primary.withValues(alpha: 0.2),
                  height: 0.85,
                ),
              ),
            ),
            SafeArea(
              bottom: false,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 140),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        VIconButton(
                          icon: Icons.close,
                          iconSize: 16,
                          background:
                              Colors.white.withValues(alpha: 0.10),
                          borderColor: Colors.transparent,
                          iconColor: Vital30Colors.surface,
                          onPressed: () => context.go('/home'),
                        ),
                      ],
                    ),
                  ),
                  myAsync.when(
                    loading: () => const SizedBox.shrink(),
                    error: (e, _) => Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('$e',
                          style: const TextStyle(color: Vital30Colors.surface)),
                    ),
                    data: (list) {
                      final uc = list.firstWhere(
                        (u) => u.id == userChallengeId,
                        orElse: () => UserChallenge(
                          id: '',
                          userId: '',
                          challengeId: '',
                          status: 'COMPLETED',
                          startDate: DateTime.now()
                              .subtract(const Duration(days: 30)),
                          progressPercent: 100,
                        ),
                      );
                      final challenge = challengesAsync.maybeWhen(
                        data: (cs) => cs.firstWhere(
                          (c) => c.id == uc.challengeId,
                          orElse: () => cs.first,
                        ),
                        orElse: () => null,
                      );
                      final stats = checkinsAsync.maybeWhen(
                        data: ProgressCalculator.calculate,
                        orElse: () => const ProgressStats(
                          completedCount: 27,
                          missedCount: 2,
                          skippedCount: 1,
                          currentStreak: 6,
                          bestStreak: 11,
                          completionPercentage: 90,
                        ),
                      );
                      final days = checkinsAsync.maybeWhen(
                        data: (cks) => _buildDayStates(uc.startDate, cks),
                        orElse: () => List<_DayState>.filled(30, _DayState.done),
                      );

                      return Column(
                        children: [
                          Padding(
                            padding:
                                const EdgeInsets.fromLTRB(24, 14, 24, 0),
                            child: Column(
                              children: [
                                Text(
                                  'CHALLENGE COMPLETE',
                                  style: Vital30Text.eyebrow.copyWith(
                                    color: Vital30Colors.accent,
                                    letterSpacing: 1.8,
                                    fontSize: 11,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                RichText(
                                  textAlign: TextAlign.center,
                                  text: TextSpan(
                                    style: Vital30Text.display.copyWith(
                                      fontSize: 44,
                                      color: Vital30Colors.surface,
                                      letterSpacing: -1.4,
                                      height: 1,
                                    ),
                                    children: [
                                      const TextSpan(text: 'You finished\n'),
                                      TextSpan(
                                        text: '30 days',
                                        style: Vital30Text.serifAccent(
                                          size: 44,
                                          color: Vital30Colors.primary,
                                        ),
                                      ),
                                      const TextSpan(text: '.'),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Text(
                                  '${challenge?.title ?? "Your challenge"}. ${stats.completedCount} active days. New baseline, locked in.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color:
                                        Vital30Colors.surface.withValues(alpha: 0.7),
                                    fontSize: 14,
                                    height: 1.55,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding:
                                const EdgeInsets.fromLTRB(24, 28, 24, 0),
                            child: _HeroStats(stats: stats),
                          ),
                          Padding(
                            padding:
                                const EdgeInsets.fromLTRB(24, 18, 24, 0),
                            child: _DarkMap(days: days),
                          ),
                          Padding(
                            padding:
                                const EdgeInsets.fromLTRB(24, 24, 24, 0),
                            child: _WhatsNextCallout(),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: EdgeInsets.fromLTRB(
                  20,
                  20,
                  20,
                  MediaQuery.of(context).padding.bottom + 18,
                ),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0x000B1410),
                      Color(0xE60B1410),
                      Vital30Colors.ink,
                    ],
                    stops: [0.0, 0.3, 1.0],
                  ),
                ),
                child: Column(
                  children: [
                    VButton(
                      label: 'Share your win',
                      fullWidth: true,
                      icon: Icons.ios_share,
                      onPressed: () => SharePlus.instance.share(ShareParams(
                          text:
                              '30 days done on Vital30! Building better habits, one day at a time. #Vital30')),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 54,
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => context.go('/challenges'),
                        style: OutlinedButton.styleFrom(
                          backgroundColor:
                              Colors.white.withValues(alpha: 0.08),
                          foregroundColor: Vital30Colors.surface,
                          side: BorderSide(
                            color: Colors.white.withValues(alpha: 0.14),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(Vital30Radius.lg),
                          ),
                        ),
                        child: const Text('Start a new challenge'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<_DayState> _buildDayStates(
      DateTime start, List<DailyCheckin> checkins) {
    final byKey = <String, String>{};
    for (final c in checkins) {
      final d = c.checkinDate.toLocal();
      byKey['${d.year}-${d.month}-${d.day}'] = c.status;
    }
    final out = <_DayState>[];
    for (var i = 0; i < 30; i++) {
      final d = start.add(Duration(days: i));
      final key = '${d.year}-${d.month}-${d.day}';
      final status = byKey[key];
      if (status == 'COMPLETED') {
        out.add(_DayState.done);
      } else if (status == 'MISSED') {
        out.add(_DayState.missed);
      } else if (status == 'SKIPPED') {
        out.add(_DayState.skipped);
      } else {
        out.add(_DayState.missed);
      }
    }
    return out;
  }
}

enum _DayState { done, missed, skipped }

class _HeroStats extends StatelessWidget {
  const _HeroStats({required this.stats});
  final ProgressStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _FinishStat(
              value: '${stats.completedCount}',
              label: 'Active days',
              sub: 'of 30',
            ),
          ),
          Container(
              width: 1, height: 42, color: Colors.white.withValues(alpha: 0.1)),
          Expanded(
            child: _FinishStat(
              value: '${stats.bestStreak}',
              label: 'Best streak',
              sub: 'days',
            ),
          ),
          Container(
              width: 1, height: 42, color: Colors.white.withValues(alpha: 0.1)),
          Expanded(
            child: _FinishStat(
              value: '${stats.completionPercentage.round()}',
              label: 'Complete',
              sub: 'percent',
              smaller: true,
            ),
          ),
        ],
      ),
    );
  }
}

class _FinishStat extends StatelessWidget {
  const _FinishStat({
    required this.value,
    required this.label,
    required this.sub,
    this.smaller = false,
  });
  final String value;
  final String label;
  final String sub;
  final bool smaller;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: Vital30Text.serifAccent(
            size: smaller ? 36 : 48,
            color: Vital30Colors.surface,
          ).copyWith(letterSpacing: -1.4),
        ),
        const SizedBox(height: 6),
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            color: Vital30Colors.accent,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          sub,
          style: TextStyle(
            fontSize: 10,
            color: Vital30Colors.surface.withValues(alpha: 0.45),
          ),
        ),
      ],
    );
  }
}

class _DarkMap extends StatelessWidget {
  const _DarkMap({required this.days});
  final List<_DayState> days;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'YOUR 30-DAY MAP',
          style: Vital30Text.label.copyWith(
            color: Vital30Colors.surface.withValues(alpha: 0.55),
            fontSize: 11,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(Vital30Radius.lg),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate:
                const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 10,
              mainAxisSpacing: 5,
              crossAxisSpacing: 5,
              childAspectRatio: 1,
            ),
            itemCount: 30,
            itemBuilder: (context, i) {
              final s = days[i];
              return Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: s == _DayState.done
                      ? Vital30Colors.primary
                      : s == _DayState.missed
                          ? Vital30Colors.berry.withValues(alpha: 0.3)
                          : Colors.transparent,
                  borderRadius: BorderRadius.circular(5),
                  border: s == _DayState.skipped
                      ? Border.all(
                          color: Colors.white.withValues(alpha: 0.18))
                      : (s == _DayState.missed
                          ? Border.all(
                              color: Vital30Colors.berry.withValues(alpha: 0.4))
                          : null),
                ),
                child: Text(
                  '${i + 1}',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: s == _DayState.done
                        ? Vital30Colors.onPrimary
                        : s == _DayState.missed
                            ? const Color(0xFFF2DBDE)
                            : Vital30Colors.surface.withValues(alpha: 0.5),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _WhatsNextCallout extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Vital30Colors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.accent.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: const BoxDecoration(
              color: Vital30Colors.accent,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.auto_awesome,
                size: 15, color: Vital30Colors.ink),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 13,
                  color: Vital30Colors.surface.withValues(alpha: 0.85),
                  height: 1.55,
                ),
                children: const [
                  TextSpan(
                    text: "What's next? ",
                    style: TextStyle(
                      color: Vital30Colors.accent,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  TextSpan(
                    text:
                        'Most people who finish one challenge start another within a week. Pick a new habit while this one is fresh.',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
