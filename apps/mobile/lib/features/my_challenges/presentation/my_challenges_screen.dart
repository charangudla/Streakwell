import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/network/mock_data.dart';

class MyChallengesScreen extends ConsumerWidget {
  const MyChallengesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'My Streaks',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -0.5),
          ),
          bottom: const TabBar(
            indicatorColor: Color(0xFF10B981),
            labelColor: Color(0xFF10B981),
            unselectedLabelColor: Color(0xFF64748B),
            labelStyle: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            tabs: [
              Tab(text: 'Active Blueprints'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: myChallengesAsync.when(
          data: (myChallenges) {
            final active = myChallenges.where((uc) => uc.status == 'ACTIVE').toList();
            final completed = myChallenges.where((uc) => uc.status == 'COMPLETED').toList();

            return TabBarView(
              children: [
                _buildActiveTab(context, ref, active),
                _buildCompletedTab(context, ref, completed),
              ],
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: Color(0xFF10B981)),
          ),
          error: (err, _) => Center(
            child: Text('Error loading my habits: $err'),
          ),
        ),
      ),
    );
  }

  Widget _buildActiveTab(BuildContext context, WidgetRef ref, List<UserChallenge> list) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.stars_outlined, size: 56, color: Color(0xFF8A9A92)),
            const SizedBox(height: 16),
            const Text(
              'No active wellness habits',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Join a habit blueprint from Explore to begin.',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20.0),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final uc = list[index];
        return _buildChallengeActiveCard(context, ref, uc);
      },
    );
  }

  Widget _buildCompletedTab(BuildContext context, WidgetRef ref, List<UserChallenge> list) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.emoji_events_outlined, size: 56, color: Color(0xFF8A9A92)),
            const SizedBox(height: 16),
            const Text(
              'No completed streaks yet',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Complete all 30 days of a habit blueprint to show it here.',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20.0),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final uc = list[index];
        return Consumer(builder: (context, ref, _) {
          final challengesAsync = ref.watch(challengesProvider);
          final title = challengesAsync.maybeWhen(
            data: (chals) => chals.firstWhere((c) => c.id == uc.challengeId).title,
            orElse: () => 'Habit Blueprint',
          );

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  const Icon(Icons.stars, color: Color(0xFFF59E0B), size: 36),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: Color(0xFF1E293B)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '30 Days 100% Completed!',
                          style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        });
      },
    );
  }

  Widget _buildChallengeActiveCard(BuildContext context, WidgetRef ref, UserChallenge uc) {
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(uc.id));

    final title = challengesAsync.maybeWhen(
      data: (chals) => chals.firstWhere((c) => c.id == uc.challengeId).title,
      orElse: () => 'Habit Blueprint',
    );

    final textTheme = Theme.of(context).textTheme;

    return Card(
      key: ValueKey(uc.id), // For automated testing lookup
      margin: const EdgeInsets.only(bottom: 20),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: title and day number
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                  ),
                ),
                Text(
                  'Day ${(uc.progressPercent / 100 * 30).toInt().clamp(1, 30)} of 30',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Progress bar
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: uc.progressPercent / 100,
                      backgroundColor: const Color(0xFFE1E8E4),
                      color: const Color(0xFF10B981),
                      minHeight: 8,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${uc.progressPercent.toInt()}%',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    color: Color(0xFF475569),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Streak and compliance row
            checkinsAsync.when(
              data: (checkins) {
                final stats = ProgressCalculator.calculate(checkins);

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildStatCol('Active Days', '${stats.completedCount}'),
                    _buildStatCol('Streak', '${stats.currentStreak} 🔥'),
                    _buildStatCol('Missed Days', '${stats.missedCount}'),
                  ],
                );
              },
              loading: () => const SizedBox(height: 40),
              error: (_, __) => const SizedBox(height: 40),
            ),
            const SizedBox(height: 24),

            // Action row: Check-in & Progress buttons
            checkinsAsync.when(
              data: (checkins) {
                final today = DateTime.now();
                final checkedInToday = checkins.any((c) =>
                    c.checkinDate.year == today.year &&
                    c.checkinDate.month == today.month &&
                    c.checkinDate.day == today.day);

                return Row(
                  children: [
                    if (!checkedInToday) ...[
                      Expanded(
                        child: FilledButton(
                          onPressed: () => context.push('/checkin/${uc.id}'),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            minimumSize: const Size.fromHeight(48),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Check in Today'),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.push('/progress/${uc.id}'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          foregroundColor: const Color(0xFF334155),
                        ),
                        child: const Text('View Progress'),
                      ),
                    ),
                  ],
                );
              },
              loading: () => const SizedBox(height: 48),
              error: (_, __) => const SizedBox(height: 48),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCol(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            color: Color(0xFF8A9A92),
            fontWeight: FontWeight.w800,
            fontSize: 10,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF1E293B),
            fontWeight: FontWeight.w900,
            fontSize: 15,
          ),
        ),
      ],
    );
  }
}
