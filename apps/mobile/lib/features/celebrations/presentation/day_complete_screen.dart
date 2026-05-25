import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/network/mock_data.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/widgets/v_button.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../domain/checkin_celebration.dart';
import 'streak_milestone_modal.dart';

class DayCompleteScreen extends ConsumerStatefulWidget {
  const DayCompleteScreen({super.key, required this.userChallengeId});
  final String userChallengeId;

  @override
  ConsumerState<DayCompleteScreen> createState() => _DayCompleteScreenState();
}

class _DayCompleteScreenState extends ConsumerState<DayCompleteScreen> {
  Timer? _autoDismiss;
  bool _milestoneHandled = false;

  @override
  void initState() {
    super.initState();
    // 4.5s gives users time to actually read the celebration; the Continue
    // button is right there if they want to dismiss sooner.
    _autoDismiss = Timer(const Duration(milliseconds: 4500), () {
      if (mounted) _finish();
    });
  }

  @override
  void dispose() {
    _autoDismiss?.cancel();
    super.dispose();
  }

  void _finish() {
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  void _maybeShowStreakMilestone(int currentStreak) {
    if (_milestoneHandled) return;
    if (!CheckinCelebration.isStreakMilestone(currentStreak)) return;
    _milestoneHandled = true;
    _autoDismiss?.cancel();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      StreakMilestoneModal.show(
        context,
        streakDays: currentStreak,
        totalDays: CheckinCelebration.totalDays,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(widget.userChallengeId));

    final uc = myAsync.maybeWhen(
      data: (list) => list.firstWhere(
        (u) => u.id == widget.userChallengeId,
        orElse: () => UserChallenge(
          id: '',
          userId: '',
          challengeId: '',
          status: 'ACTIVE',
          startDate: DateTime.now(),
          progressPercent: 0,
        ),
      ),
      orElse: () => null,
    );
    final challenge = challengesAsync.maybeWhen(
      data: (cs) {
        if (uc == null) return null;
        return cs.firstWhere(
          (c) => c.id == uc.challengeId,
          orElse: () => cs.first,
        );
      },
      orElse: () => null,
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

    if (checkinsAsync.hasValue) {
      _maybeShowStreakMilestone(stats.currentStreak);
    }

    final dayN = uc == null
        ? 1
        : (DateTime.now().difference(uc.startDate.toLocal()).inDays + 1)
            .clamp(1, 30);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.3),
            radius: 1.1,
            colors: [
              Vital30Colors.primaryTint,
              Vital30Colors.surface,
            ],
            stops: [0.0, 0.7],
          ),
        ),
        child: Stack(
          children: [
            // Concentric rings
            Positioned(
              top: 220,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 380,
                  height: 380,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Vital30Colors.primary.withValues(alpha: 0.1),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 270,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Vital30Colors.primary.withValues(alpha: 0.18),
                    ),
                  ),
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                child: Column(
                  children: [
                    Text(
                      'DAY COMPLETE',
                      style: Vital30Text.eyebrow.copyWith(
                        color: Vital30Colors.primary,
                        letterSpacing: 1.8,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 34),
                    Container(
                      width: 148,
                      height: 148,
                      decoration: BoxDecoration(
                        color: Vital30Colors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Vital30Colors.primary.withValues(alpha: 0.55),
                            offset: const Offset(0, 24),
                            blurRadius: 50,
                            spreadRadius: -12,
                          ),
                          BoxShadow(
                            color: Vital30Colors.primary.withValues(alpha: 0.10),
                            spreadRadius: 14,
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.check,
                        size: 80,
                        color: Vital30Colors.onPrimary,
                      ),
                    ),
                    const SizedBox(height: 30),
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: Vital30Text.h1.copyWith(
                          fontSize: 38,
                          letterSpacing: -1.2,
                        ),
                        children: [
                          const TextSpan(text: 'Day '),
                          TextSpan(
                            text: dayN.toString().padLeft(2, '0'),
                            style: Vital30Text.serifAccent(
                              size: 38,
                              color: Vital30Colors.primary,
                            ),
                          ),
                          const TextSpan(text: ' done.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Text(
                        challenge?.title ?? 'Quiet wins.',
                        textAlign: TextAlign.center,
                        style: Vital30Text.body.copyWith(fontSize: 14.5),
                      ),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Expanded(
                          child: _CelebStat(
                            icon: Icons.check,
                            iconBg: Vital30Colors.primaryTint,
                            iconColor: Vital30Colors.primaryDeep,
                            delta: '+1',
                            label: 'Active day',
                            value: '${stats.completedCount} of 30',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _CelebStat(
                            icon: Icons.local_fire_department_outlined,
                            iconBg: Vital30Colors.accentTint,
                            iconColor: Vital30Colors.accentDeep,
                            delta: '+1',
                            label: 'Streak',
                            value: '${stats.currentStreak} days',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    VButton(
                      label: 'Continue',
                      fullWidth: true,
                      onPressed: () {
                        _autoDismiss?.cancel();
                        _finish();
                      },
                    ),
                    const SizedBox(height: 4),
                    TextButton.icon(
                      onPressed: () {
                        _autoDismiss?.cancel();
                        SharePlus.instance.share(ShareParams(
                          text:
                              'Day $dayN of 30 — ${challenge?.title ?? 'Vital30'}. '
                              '${stats.completedCount} active days, ${stats.currentStreak}-day streak. #Vital30',
                        ));
                      },
                      icon: const Icon(Icons.ios_share,
                          size: 16, color: Vital30Colors.inkSoft),
                      label: Text(
                        'Share this win',
                        style: Vital30Text.body.copyWith(
                          color: Vital30Colors.inkSoft,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    SizedBox(
                      height: MediaQuery.of(context).padding.bottom,
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
}

class _CelebStat extends StatelessWidget {
  const _CelebStat({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.delta,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String delta;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Icon(icon, size: 15, color: iconColor),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(),
                    style: Vital30Text.label.copyWith(fontSize: 10)),
                const SizedBox(height: 2),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      delta,
                      style: Vital30Text.body.copyWith(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Vital30Colors.primary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      value,
                      style: Vital30Text.numberSmall,
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
