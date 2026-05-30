import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/network/mock_data.dart';
import '../../../core/routing/main_navigation_shell.dart';
import '../../../core/theme/v_categories.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/cat_tile.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import 'challenges_provider.dart';

class ChallengeDetailScreen extends ConsumerWidget {
  const ChallengeDetailScreen({super.key, required this.challengeId});
  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);

    return Scaffold(
      body: challengesAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Vital30Colors.primary),
        ),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (list) {
          final challenge = list.firstWhere(
            (c) => c.id == challengeId,
            orElse: () => const Challenge(
              id: '',
              title: 'Unknown',
              slug: 'unknown',
              shortDescription: '',
              description: '',
              durationDays: 30,
              difficulty: 'EASY',
              categoryId: '',
              dailyTask: '',
              benefits: [],
              safetyNote: '',
            ),
          );
          if (challenge.id.isEmpty) {
            return const Center(child: Text('Challenge not found'));
          }

          final cat = Vital30Categories.fromCategoryId(challenge.categoryId);
          final alreadyJoined = myChallengesAsync.maybeWhen(
            data: (uc) => uc.any(
                (u) => u.challengeId == challengeId && u.status == 'ACTIVE'),
            orElse: () => false,
          );

          return Stack(
            children: [
              ListView(
                padding: const EdgeInsets.only(bottom: 140),
                children: [
                  _Hero(challenge: challenge, cat: cat),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
                    child: Text(challenge.description,
                        style: Vital30Text.body.copyWith(fontSize: 15)),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 20, 22, 0),
                    child: _DailyTaskCard(task: challenge.dailyTask),
                  ),
                  if (challenge.benefits.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 24, 22, 0),
                      child: _Benefits(benefits: challenge.benefits),
                    ),
                  if (challenge.safetyNote.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
                      child: _SafetyNote(note: challenge.safetyNote),
                    ),
                ],
              ),
              // Sticky CTA
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: EdgeInsets.fromLTRB(
                    20,
                    14,
                    20,
                    MediaQuery.of(context).padding.bottom + 16,
                  ),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0x00F4F1E8), Vital30Colors.surface],
                      stops: [0.0, 0.3],
                    ),
                  ),
                  child: Row(
                    children: [
                      VButton(
                        label: '',
                        kind: VButtonKind.secondary,
                        size: VButtonSize.lg,
                        icon: Icons.ios_share,
                        onPressed: () => SharePlus.instance.share(ShareParams(
                            text:
                                "I'm starting ${challenge.title} on Vital30. Join me!")),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: VButton(
                          label: alreadyJoined
                              ? 'Already joined'
                              : 'Join challenge',
                          fullWidth: true,
                          onPressed: alreadyJoined
                              ? null
                              : () async {
                                  final ok = await ref
                                      .read(
                                          myChallengesNotifierProvider.notifier)
                                      .join(challenge.id);
                                  if (ok && context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content:
                                            Text('Joined ${challenge.title}'),
                                      ),
                                    );
                                    ref
                                        .read(
                                            mainNavigationTabProvider.notifier)
                                        .state = 2;
                                    context.pop();
                                  }
                                },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Floating glass back/share
              Positioned(
                top: MediaQuery.of(context).padding.top + 8,
                left: 20,
                right: 20,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    VIconButton(
                      icon: Icons.arrow_back_ios_new,
                      iconSize: 16,
                      background: Colors.white.withValues(alpha: 0.7),
                      borderColor: Colors.transparent,
                      onPressed: () => context.pop(),
                    ),
                    VIconButton(
                      icon: Icons.ios_share,
                      iconSize: 16,
                      background: Colors.white.withValues(alpha: 0.7),
                      borderColor: Colors.transparent,
                      onPressed: () => SharePlus.instance.share(ShareParams(
                          text: "I'm starting ${challenge.title} on Vital30!")),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.challenge, required this.cat});
  final Challenge challenge;
  final Vital30Category cat;

  @override
  Widget build(BuildContext context) {
    final style = Vital30Categories.of(cat);
    final difficulty = _readableDifficulty(challenge.difficulty);

    return ClipRect(
      child: Container(
        color: style.tint,
        padding: EdgeInsets.fromLTRB(
          22,
          MediaQuery.of(context).padding.top + 66,
          22,
          28,
        ),
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            Positioned(
              right: -30,
              top: 30,
              child: Text(
                '30',
                style: GoogleFonts.instrumentSerif(
                  fontStyle: FontStyle.italic,
                  fontSize: 280,
                  fontWeight: FontWeight.w400,
                  color: style.ink.withValues(alpha: 0.10),
                  height: 0.85,
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CatTile(category: cat, size: 56, radius: 14),
                const SizedBox(height: 16),
                Text(
                  style.label.toUpperCase(),
                  style: Vital30Text.eyebrow.copyWith(
                    color: style.ink,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(challenge.title, style: Vital30Text.h1),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    VPill(
                      label: difficulty,
                      tone: VPillTone.dark,
                      size: VPillSize.sm,
                    ),
                    VPill(
                      label: '${challenge.durationDays} days',
                      tone: VPillTone.outline,
                      size: VPillSize.sm,
                      backgroundOverride: Colors.white.withValues(alpha: 0.4),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _readableDifficulty(String d) {
    switch (d.toUpperCase()) {
      case 'EASY':
        return 'Beginner';
      case 'MEDIUM':
        return 'Moderate';
      case 'HARD':
        return 'Hard';
      default:
        return d;
    }
  }
}

class _DailyTaskCard extends StatelessWidget {
  const _DailyTaskCard({required this.task});
  final String task;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('DAILY TASK', style: Vital30Text.label.copyWith(fontSize: 11)),
          const SizedBox(height: 6),
          Text(
            task.isEmpty ? 'Complete one small action today.' : task,
            style: Vital30Text.title.copyWith(
              fontSize: 15.5,
              fontWeight: FontWeight.w600,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _Benefits extends StatelessWidget {
  const _Benefits({required this.benefits});
  final List<String> benefits;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "WHAT YOU'LL NOTICE",
          style: Vital30Text.label.copyWith(fontSize: 13, letterSpacing: 1),
        ),
        const SizedBox(height: 12),
        for (final b in benefits) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: const BoxDecoration(
                  color: Vital30Colors.primaryTint,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check,
                    size: 14, color: Vital30Colors.primaryDeep),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  b,
                  style: Vital30Text.title.copyWith(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _SafetyNote extends StatelessWidget {
  const _SafetyNote({required this.note});
  final String note;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Vital30Colors.skyTint,
        borderRadius: BorderRadius.circular(Vital30Radius.md),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: Vital30Colors.sky.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              'i',
              style: GoogleFonts.instrumentSerif(
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w800,
                fontSize: 14,
                color: Vital30Colors.sky,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Vital30 provides general wellness guidance only. $note',
              style: Vital30Text.body.copyWith(
                fontSize: 12,
                color: Vital30Colors.skyDeep,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
