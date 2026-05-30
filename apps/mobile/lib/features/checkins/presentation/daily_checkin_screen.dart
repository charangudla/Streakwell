import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/mock_data.dart';
import '../../../core/theme/v_categories.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/progress_ring.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../celebrations/domain/checkin_celebration.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';

class DailyCheckinScreen extends ConsumerStatefulWidget {
  const DailyCheckinScreen({super.key, required this.userChallengeId});
  final String userChallengeId;

  @override
  ConsumerState<DailyCheckinScreen> createState() => _DailyCheckinScreenState();
}

class _DailyCheckinScreenState extends ConsumerState<DailyCheckinScreen> {
  bool _submitting = false;

  Future<void> _checkin(String status, int dayN) async {
    setState(() => _submitting = true);
    final ok = await ref
        .read(myChallengesNotifierProvider.notifier)
        .checkin(widget.userChallengeId, status, null);

    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      if (status == 'COMPLETED') {
        final route = CheckinCelebration.isFinalDay(dayN)
            ? '/complete/${widget.userChallengeId}'
            : '/celebrate/${widget.userChallengeId}';
        context.pushReplacement(route);
      } else if (status == 'MISSED') {
        await showDialog(
          context: context,
          barrierColor: Colors.black.withValues(alpha: 0.55),
          builder: (_) =>
              _MissedFeedbackDialog(userChallengeId: widget.userChallengeId),
        );
        if (mounted) context.pop();
      } else {
        context.pop();
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save check-in. Try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final myAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);

    return Scaffold(
      body: myAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Vital30Colors.primary),
        ),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          final uc = list.firstWhere(
            (u) => u.id == widget.userChallengeId,
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
          final dayN =
              (DateTime.now().difference(uc.startDate.toLocal()).inDays + 1)
                  .clamp(1, 30);

          return SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      VIconButton(
                        icon: Icons.close,
                        iconSize: 16,
                        onPressed: () => context.pop(),
                      ),
                      Text(
                        'DAY $dayN OF 30',
                        style: Vital30Text.eyebrow.copyWith(
                          fontWeight: FontWeight.w700,
                          color: Vital30Colors.muted,
                        ),
                      ),
                      const SizedBox(width: 38),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 10, 22, 0),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: VPill(
                      label: catStyle.label,
                      tone: VPillTone.neutral,
                      size: VPillSize.sm,
                      icon: catStyle.glyph,
                      backgroundOverride: catStyle.tint,
                      foregroundOverride: catStyle.ink,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 12, 22, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        challenge?.title ?? 'Today',
                        style: Vital30Text.body.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Vital30Colors.muted,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Did you finish today?',
                        style: Vital30Text.h1,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "One tap. We won't make a big deal either way — but consistency adds up.",
                        style: Vital30Text.body,
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Center(
                  child: ProgressRing(
                    progress: dayN / 30,
                    size: 156,
                    stroke: 10,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          dayN.toString().padLeft(2, '0'),
                          style: Vital30Text.numberHero,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'OF 30',
                          style: Vital30Text.label.copyWith(
                            fontSize: 10.5,
                            letterSpacing: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
                  child: Column(
                    children: [
                      VButton(
                        label: _submitting ? 'Saving…' : 'Yes, completed',
                        fullWidth: true,
                        icon: Icons.check,
                        onPressed: _submitting
                            ? null
                            : () => _checkin('COMPLETED', dayN),
                      ),
                      const SizedBox(height: 9),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 54,
                              child: OutlinedButton(
                                onPressed: _submitting
                                    ? null
                                    : () => _checkin('MISSED', dayN),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Vital30Colors.berry,
                                  side: const BorderSide(
                                      color: Vital30Colors.berryTint),
                                  shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(Vital30Radius.lg),
                                  ),
                                ),
                                child: const Text('No, missed today'),
                              ),
                            ),
                          ),
                          const SizedBox(width: 9),
                          SizedBox(
                            height: 54,
                            width: 110,
                            child: OutlinedButton(
                              onPressed: _submitting
                                  ? null
                                  : () => _checkin('SKIPPED', dayN),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Vital30Colors.muted,
                                shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(Vital30Radius.lg),
                                ),
                              ),
                              child: const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4),
                                child: Text('Skip'),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MissedFeedbackDialog extends ConsumerWidget {
  const _MissedFeedbackDialog({required this.userChallengeId});
  final String userChallengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Dialog(
      backgroundColor: Vital30Colors.surface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 40),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                gradient: RadialGradient(
                  colors: [Vital30Colors.accentTint, Vital30Colors.surface],
                ),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Container(
                width: 54,
                height: 54,
                decoration: const BoxDecoration(
                  color: Vital30Colors.accentTint,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  '·5·',
                  style: Vital30Text.serifAccent(
                    size: 32,
                    color: Vital30Colors.accentDeep,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              "THAT'S OKAY",
              style: Vital30Text.eyebrow.copyWith(
                color: Vital30Colors.accent,
                letterSpacing: 1.4,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 8),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: Vital30Text.h2.copyWith(fontSize: 24, height: 1.18),
                children: [
                  const TextSpan(text: 'Recovery '),
                  TextSpan(
                    text: 'matters',
                    style: Vital30Text.serifAccent(
                      size: 24,
                      color: Vital30Colors.primary,
                    ),
                  ),
                  const TextSpan(text: '. Come back tomorrow.'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Your streak may break, but your active days are still counting. Progress over perfection.',
              textAlign: TextAlign.center,
              style: Vital30Text.body.copyWith(color: Vital30Colors.inkSoft),
            ),
            const SizedBox(height: 18),
            VButton(
              label: 'See my progress',
              fullWidth: true,
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/progress/$userChallengeId');
              },
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}
