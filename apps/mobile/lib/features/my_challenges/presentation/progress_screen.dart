import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart' show SharePlus, ShareParams;

import '../../challenges/presentation/challenges_provider.dart';
import '../presentation/my_challenges_provider.dart';
import '../../../core/utils/progress_calculator.dart';
import '../../../core/network/mock_data.dart';
import '../../../core/network/api_service.dart';

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({
    super.key,
    required this.userChallengeId,
  });

  final String userChallengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(userChallengeId));

    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Streak Analytics'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: myChallengesAsync.when(
        data: (myChallenges) {
          final uc = myChallenges.firstWhere(
            (item) => item.id == userChallengeId,
            orElse: () => UserChallenge(
              id: '',
              userId: '',
              challengeId: '',
              status: 'ACTIVE',
              startDate: DateTime.now(),
              progressPercent: 0.0,
            ),
          );

          if (uc.id.isEmpty) {
            return const Center(child: Text('Challenge progress logs not found.'));
          }

          final challenge = challengesAsync.maybeWhen(
            data: (chals) => chals.firstWhere((c) => c.id == uc.challengeId),
            orElse: () => const Challenge(
              id: '',
              title: 'Habit Blueprint',
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

          return checkinsAsync.when(
            data: (checkins) {
              final stats = ProgressCalculator.calculate(checkins);
              final currentDay = (uc.progressPercent / 100 * 30).toInt().clamp(1, 30);

              // Map calendar relative days (1 to 30)
              final Map<int, String> dayStatuses = {};
              for (final ck in checkins) {
                final dayDiff = DateTime(ck.checkinDate.year, ck.checkinDate.month, ck.checkinDate.day)
                        .difference(DateTime(uc.startDate.year, uc.startDate.month, uc.startDate.day))
                        .inDays +
                    1;
                if (dayDiff >= 1 && dayDiff <= 30) {
                  dayStatuses[dayDiff] = ck.status;
                }
              }

              return SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title Card
                    Text(
                      challenge.title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF12211B),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '30-Day streak progress tracker and grid compliance metrics.',
                      style: textTheme.bodyMedium?.copyWith(color: const Color(0xFF647067)),
                    ),
                    const SizedBox(height: 24),

                    // Grid stats cards
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatBox(context, 'Current Streak', '${stats.currentStreak} Days 🔥', const Color(0xFF10B981)),
                        _buildStatBox(context, 'Best Streak', '${stats.bestStreak} Days 🏆', const Color(0xFFF59E0B)),
                        _buildStatBox(context, 'Completed Tasks', '${stats.completedCount} / 30 🎯', const Color(0xFF3B82F6)),
                        _buildStatBox(context, 'Compliance Rate', '${stats.completionPercentage.toInt()}% 📈', const Color(0xFF8B5CF6)),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Streak calendar title
                    Text(
                      '30-Day Progress Grid',
                      style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 12),

                    // Interactive 30-Day Calendar Grid
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE1E8E4)),
                      ),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 6,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 1,
                        ),
                        itemCount: 30,
                        itemBuilder: (context, index) {
                          final dayNum = index + 1;
                          final status = dayStatuses[dayNum];

                          return _buildCalendarDay(context, dayNum, status);
                        },
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Detailed compliance summaries
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildComplianceIndicator(context, const Color(0xFF10B981), 'Completed', '${stats.completedCount}'),
                        _buildComplianceIndicator(context, const Color(0xFFEF4444), 'Missed', '${stats.missedCount}'),
                        _buildComplianceIndicator(context, const Color(0xFFF59E0B), 'Skipped', '${stats.skippedCount}'),
                      ],
                    ),
                    const SizedBox(height: 36),

                    // Share Progress button
                    FilledButton.icon(
                      onPressed: () {
                        final shareText = ProgressCalculator.generateShareText(
                          challengeName: challenge.title,
                          currentDay: currentDay,
                          completedDays: stats.completedCount,
                        );

                        // Trigger share sheet
                        SharePlus.instance.share(ShareParams(text: shareText));

                        // Log share event
                        ref.read(apiServiceProvider).createShareEvent(
                          'DAILY_PROGRESS',
                          'platform_share',
                          {
                            'challengeId': challenge.id,
                            'challengeTitle': challenge.title,
                            'day': currentDay,
                            'completedDays': stats.completedCount,
                          },
                        );
                      },
                      icon: const Icon(Icons.share, size: 18),
                      label: const Text('Share Progress to Socials'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(52),
                      ),
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
              child: Text('Error loading calendar check-ins: $err'),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF10B981)),
        ),
        error: (err, _) => Center(
          child: Text('Error loading dashboard: $err'),
        ),
      ),
    );
  }

  Widget _buildStatBox(BuildContext context, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        border: Border.all(color: color.withValues(alpha: 0.12)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarDay(BuildContext context, int dayNum, String? status) {
    Color bgColor = Colors.white;
    Color borderColor = const Color(0xFFE2E8F0);
    Widget content = Text(
      '$dayNum',
      style: const TextStyle(
        fontWeight: FontWeight.w700,
        color: Color(0xFF64748B),
        fontSize: 12,
      ),
    );

    if (status == 'COMPLETED') {
      bgColor = const Color(0xFFD1FAE5);
      borderColor = const Color(0xFF10B981);
      content = const Icon(Icons.check, color: Color(0xFF047857), size: 16);
    } else if (status == 'MISSED') {
      bgColor = const Color(0xFFFEE2E2);
      borderColor = const Color(0xFFEF4444);
      content = const Icon(Icons.close, color: Color(0xFFB91C1C), size: 16);
    } else if (status == 'SKIPPED') {
      bgColor = const Color(0xFFFEF3C7);
      borderColor = const Color(0xFFF59E0B);
      content = const Icon(Icons.remove, color: Color(0xFFB45309), size: 16);
    }

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor, width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(child: content),
    );
  }

  Widget _buildComplianceIndicator(BuildContext context, Color color, String label, String count) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            border: Border.all(color: color, width: 1.5),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: Color(0xFF64748B),
          ),
        ),
        Text(
          count,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 13,
            color: Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }
}
