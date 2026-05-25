import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/routing/main_navigation_shell.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../../../core/network/mock_data.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);

    final textTheme = Theme.of(context).textTheme;

    final userName = authState.user?.name ?? 'Wellness Explorer';

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Vital30',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -0.5),
        ),
        actions: [
          IconButton(
            tooltip: 'My Profile',
            onPressed: () => ref.read(mainNavigationTabProvider.notifier).state = 3,
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(challengesProvider);
            ref.read(myChallengesNotifierProvider.notifier).load();
          },
          color: const Color(0xFF10B981),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Welcome greeting
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome,',
                          style: textTheme.bodyLarge?.copyWith(
                            color: const Color(0xFF8A9A92),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          userName,
                          style: textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF12211B),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.wb_sunny_outlined,
                      color: Color(0xFF10B981),
                      size: 24,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Active Habits Checkin Reminder Widget
              myChallengesAsync.when(
                data: (myChallenges) {
                  final active = myChallenges.where((uc) => uc.status == 'ACTIVE').toList();
                  if (active.isEmpty) {
                    return _buildEmptyActiveCard(context, ref);
                  }

                  final activeUc = active.first;
                  return Consumer(
                    builder: (context, ref, _) {
                      final checkinsAsync = ref.watch(checkinsProvider(activeUc.id));

                      return checkinsAsync.when(
                        data: (checkins) {
                          final today = DateTime.now();
                          final checkedInToday = checkins.any((c) =>
                              c.checkinDate.year == today.year &&
                              c.checkinDate.month == today.month &&
                              c.checkinDate.day == today.day);

                          if (checkedInToday) {
                            return _buildCompletedReminderCard(context, activeUc);
                          }

                          return _buildCheckinReminderCard(context, activeUc);
                        },
                        loading: () => const SizedBox(height: 100),
                        error: (_, __) => _buildCheckinReminderCard(context, activeUc),
                      );
                    },
                  );
                },
                loading: () => const SizedBox(height: 100),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 28),

              // Recommended Challenges section
              _buildSectionTitle(context, 'Recommended Blueprint'),
              const SizedBox(height: 12),
              challengesAsync.when(
                data: (list) {
                  final recommended = list.where((c) => c.isRecommended).toList();
                  if (recommended.isEmpty) return const SizedBox.shrink();

                  return _buildChallengesHorizontalList(context, recommended);
                },
                loading: () => const SizedBox(height: 140, child: Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 28),

              // Popular Challenges section
              _buildSectionTitle(context, 'Popular Challenges'),
              const SizedBox(height: 12),
              challengesAsync.when(
                data: (list) {
                  final popular = list.where((c) => c.isPopular).toList();
                  if (popular.isEmpty) return const SizedBox.shrink();

                  return _buildChallengesHorizontalList(context, popular);
                },
                loading: () => const SizedBox(height: 140, child: Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w800,
            color: const Color(0xFF12211B),
          ),
    );
  }

  Widget _buildEmptyActiveCard(BuildContext context, WidgetRef ref) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.explore_outlined, color: Color(0xFF10B981), size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  'Start Your Habit Loop',
                  style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'No active wellness habit selected. Browse starter challenges in our wellness pillars to begin your 30-day transformation.',
              style: textTheme.bodyMedium?.copyWith(color: const Color(0xFF647067), height: 1.4),
            ),
            const SizedBox(height: 18),
            FilledButton.icon(
              onPressed: () => ref.read(mainNavigationTabProvider.notifier).state = 1,
              icon: const Icon(Icons.arrow_forward, size: 16),
              label: const Text('Browse Blueprints'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckinReminderCard(BuildContext context, UserChallenge uc) {
    final textTheme = Theme.of(context).textTheme;

    return Consumer(builder: (context, ref, _) {
      final challengesAsync = ref.watch(challengesProvider);

      final title = challengesAsync.maybeWhen(
        data: (list) => list.firstWhere((c) => c.id == uc.challengeId).title,
        orElse: () => 'Active Challenge',
      );

      return Card(
        color: const Color(0xFFECFDF5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFA7F3D0), width: 1.2),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.alarm, color: Color(0xFF047857), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Daily Action Reminder',
                    style: textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF065F46),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Ready to log today’s milestone for "$title"? Consistently checking in grows your streak.',
                style: textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFF065F46),
                  height: 1.4,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => context.push('/checkin/${uc.id}'),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                ),
                child: const Text('Log Check-in Today'),
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildCompletedReminderCard(BuildContext context, UserChallenge uc) {
    final textTheme = Theme.of(context).textTheme;

    return Consumer(builder: (context, ref, _) {
      final challengesAsync = ref.watch(challengesProvider);

      final title = challengesAsync.maybeWhen(
        data: (list) => list.firstWhere((c) => c.id == uc.challengeId).title,
        orElse: () => 'Active Challenge',
      );

      return Card(
        color: const Color(0xFFF0FDF4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFBBF7D0), width: 1.2),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Color(0xFF15803D), size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Milestone Saved!',
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF166534),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'You successfully logged today’s task for "$title". See you tomorrow!',
                      style: const TextStyle(
                        color: Color(0xFF166534),
                        fontSize: 13,
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    });
  }

  Widget _buildChallengesHorizontalList(BuildContext context, List<Challenge> challenges) {
    return SizedBox(
      height: 130,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: challenges.length,
        itemBuilder: (context, index) {
          final chal = challenges[index];

          return Container(
            width: 250,
            margin: const EdgeInsets.only(right: 12),
            child: Card(
              child: InkWell(
                onTap: () => context.push('/challenge/${chal.id}'),
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        chal.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: Color(0xFF12211B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        chal.shortDescription,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF647067),
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
