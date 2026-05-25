import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../../core/network/mock_data.dart';
import '../../../core/routing/main_navigation_shell.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import 'challenges_provider.dart';

class ChallengeDetailScreen extends ConsumerWidget {
  const ChallengeDetailScreen({
    super.key,
    required this.challengeId,
  });

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);

    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Habit Blueprint'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: challengesAsync.when(
        data: (challenges) {
          final challenge = challenges.firstWhere(
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

          final categoryName = categoriesAsync.when(
            data: (cats) => cats.firstWhere((cat) => cat.id == challenge.categoryId).name,
            loading: () => 'Loading...',
            error: (_, __) => 'Wellness Category',
          );

          final alreadyJoined = myChallengesAsync.maybeWhen(
            data: (list) => list.any((uc) => uc.challengeId == challengeId && uc.status == 'ACTIVE'),
            orElse: () => false,
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category Header Tag
                Text(
                  categoryName.toUpperCase(),
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 8),

                // Challenge Title
                Text(
                  challenge.title,
                  style: textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF12211B),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 16),

                // Difficulty and Duration row
                Row(
                  children: [
                    _buildMetaChip(
                      context,
                      icon: Icons.offline_bolt_outlined,
                      label: challenge.difficulty,
                      color: const Color(0xFF10B981),
                    ),
                    const SizedBox(width: 12),
                    _buildMetaChip(
                      context,
                      icon: Icons.calendar_today_outlined,
                      label: '${challenge.durationDays} Days Duration',
                      color: const Color(0xFF3B82F6),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Description
                Text(
                  'About this Blueprint',
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  challenge.description,
                  style: const TextStyle(
                    color: Color(0xFF4D5D55),
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 24),

                // Daily Physical Task card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [const Color(0xFF10B981).withValues(alpha: 0.06), const Color(0xFF059669).withValues(alpha: 0.02)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.stars, color: Color(0xFF10B981), size: 20),
                          const SizedBox(width: 8),
                          Text(
                            "Today's Daily Action",
                            style: textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F5132),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        challenge.dailyTask,
                        style: const TextStyle(
                          color: Color(0xFF1E293B),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Benefits Bullet Points
                if (challenge.benefits.isNotEmpty) ...[
                  Text(
                    'Key Physiological Benefits',
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  ...challenge.benefits.map((benefit) => Padding(
                        padding: const EdgeInsets.only(bottom: 10.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                benefit,
                                style: const TextStyle(
                                  color: Color(0xFF334155),
                                  fontSize: 14,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 24),
                ],

                // Safety Note Warning Box
                if (challenge.safetyNote.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706), size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Safety Guidelines',
                                style: TextStyle(
                                  color: Color(0xFF92400E),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                challenge.safetyNote,
                                style: const TextStyle(
                                  color: Color(0xFFB45309),
                                  fontSize: 12,
                                  height: 1.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 36),
                ],

                // General Medical Disclaimer Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.privacy_tip_outlined,
                        color: Color(0xFF64748B),
                        size: 18,
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Vital30 is a general wellness habit platform, not a medical device. This blueprint is for habit-building and motivation, and is not a substitute for professional medical advice, diagnosis, or clinical support.',
                          style: TextStyle(
                            fontSize: 11,
                            color: Color(0xFF64748B),
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Action Floating Rows
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: FilledButton(
                        onPressed: alreadyJoined
                            ? null
                            : () async {
                                final success = await ref
                                    .read(myChallengesNotifierProvider.notifier)
                                    .join(challenge.id);
                                if (success && context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Successfully joined ${challenge.title}!'),
                                      backgroundColor: const Color(0xFF10B981),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                  // Switch to My Challenges tab
                                  ref.read(mainNavigationTabProvider.notifier).state = 2;
                                  context.pop();
                                }
                              },
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                        ),
                        child: Text(alreadyJoined ? 'Active Challenge' : 'Join Challenge'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: () {
                          final shareText = "I'm starting the ${challenge.title} on Vital30. Join me and build better habits!";
                          SharePlus.instance.share(ShareParams(text: shareText));
                        },
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          foregroundColor: const Color(0xFF334155),
                        ),
                        child: const Icon(Icons.share_outlined),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF10B981)),
        ),
        error: (err, _) => Center(
          child: Text('Error loading blueprint detail: $err'),
        ),
      ),
    );
  }

  Widget _buildMetaChip(BuildContext context, {required IconData icon, required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
