import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/network/mock_data.dart';
import '../../../core/routing/main_navigation_shell.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/challenge_card.dart';
import '../../../core/widgets/progress_ring.dart';
import '../../../core/widgets/v_button.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../../../core/widgets/v_pill.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../challenges/presentation/challenges_provider.dart';
import '../../friends/application/friends_provider.dart';
import '../../my_challenges/presentation/my_challenges_provider.dart';
import '../../notifications/application/notifications_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final challengesAsync = ref.watch(challengesProvider);
    final myChallengesAsync = ref.watch(myChallengesNotifierProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);
    final incomingFriends = ref.watch(incomingFriendCountProvider);

    final firstName =
        (auth.user?.name ?? 'there').split(' ').first;
    final greeting = _greeting();

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(challengesProvider);
            await ref.read(myChallengesNotifierProvider.notifier).load();
          },
          color: Vital30Colors.primary,
          child: ListView(
            padding: const EdgeInsets.only(top: 6, bottom: 120),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(greeting, style: Vital30Text.caption),
                          const SizedBox(height: 2),
                          RichText(
                            text: TextSpan(
                              style: Vital30Text.h2.copyWith(fontSize: 24),
                              children: [
                                TextSpan(text: firstName),
                                TextSpan(
                                  text: ' — ',
                                  style: Vital30Text.serifAccent(
                                    size: 24,
                                    color: Vital30Colors.ink,
                                  ),
                                ),
                                TextSpan(
                                  text:
                                      'Day ${_currentDay(myChallengesAsync)}',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    VIconButton(
                      icon: Icons.group_outlined,
                      iconSize: 20,
                      onPressed: () => context.push('/friends').then((_) =>
                          ref.invalidate(incomingFriendCountProvider)),
                      badge: incomingFriends.maybeWhen(
                        data: (n) => n > 0,
                        orElse: () => false,
                      ),
                    ),
                    const SizedBox(width: 8),
                    VIconButton(
                      icon: Icons.forum_outlined,
                      iconSize: 20,
                      onPressed: () => context.push('/chat'),
                    ),
                    const SizedBox(width: 8),
                    VIconButton(
                      icon: Icons.notifications_outlined,
                      iconSize: 20,
                      onPressed: () => context
                          .push('/notifications')
                          .then((_) => ref
                              .read(notificationsProvider.notifier)
                              .refresh()),
                      badge: unreadCount > 0,
                    ),
                    const SizedBox(width: 8),
                    _Avatar(initials: _initials(auth.user?.name)),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: RichText(
                  text: TextSpan(
                    style: Vital30Text.serifAccent(
                      size: 14,
                      color: Vital30Colors.inkSoft,
                      h: 1.4,
                    ),
                    children: [
                      const TextSpan(text: 'Small steps count. '),
                      TextSpan(
                        text: "Complete today's check-in.",
                        style: Vital30Text.serifAccent(
                          size: 14,
                          color: Vital30Colors.primary,
                          weight: FontWeight.w600,
                          h: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: myChallengesAsync.when(
                  data: (list) {
                    final active =
                        list.where((u) => u.status == 'ACTIVE').toList();
                    if (active.isEmpty) {
                      return const _EmptyActiveCard();
                    }
                    return _HeroCheckinCard(uc: active.first);
                  },
                  loading: () => const _SkeletonHero(),
                  error: (_, __) => const _EmptyActiveCard(),
                ),
              ),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _StatRow(uc: myChallengesAsync),
              ),
              const SizedBox(height: 24),
              _SectionHeader(
                title: 'Recommended for you',
                onSeeAll: () =>
                    ref.read(mainNavigationTabProvider.notifier).state = 1,
              ),
              const SizedBox(height: 12),
              challengesAsync.when(
                data: (list) {
                  final rec = list.where((c) => c.isRecommended).take(6).toList();
                  if (rec.isEmpty) return const SizedBox.shrink();
                  return SizedBox(
                    height: 198,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: rec.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, i) {
                        final c = rec[i];
                        return ChallengeCard(
                          challenge: c,
                          variant: ChallengeCardVariant.heroHorizontal,
                          badge: 'Recommended',
                          onTap: () => context.push('/challenge/${c.id}'),
                        );
                      },
                    ),
                  );
                },
                loading: () => const SizedBox(
                  height: 198,
                  child: Center(
                    child: CircularProgressIndicator(
                      color: Vital30Colors.primary,
                    ),
                  ),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 26),
              _SectionHeader(
                title: 'Popular this week',
                onSeeAll: () =>
                    ref.read(mainNavigationTabProvider.notifier).state = 1,
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: challengesAsync.when(
                  data: (list) {
                    final pop = list.where((c) => c.isPopular).take(3).toList();
                    if (pop.isEmpty) return const SizedBox.shrink();
                    return Column(
                      children: [
                        for (var c in pop) ...[
                          ChallengeCard(
                            challenge: c,
                            badge: 'Popular',
                            onTap: () => context.push('/challenge/${c.id}'),
                          ),
                          const SizedBox(height: 10),
                        ],
                      ],
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Vital30Colors.primary,
                      ),
                    ),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  static String _initials(String? name) {
    if (name == null || name.trim().isEmpty) return 'V';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  static int _currentDay(AsyncValue<List<UserChallenge>> uc) {
    return uc.maybeWhen(
      data: (list) {
        if (list.isEmpty) return 1;
        final active = list.where((u) => u.status == 'ACTIVE').toList();
        if (active.isEmpty) return 1;
        final days = DateTime.now()
                .difference(active.first.startDate.toLocal())
                .inDays +
            1;
        return days.clamp(1, 30);
      },
      orElse: () => 1,
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.initials});
  final String initials;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: const BoxDecoration(
        color: Vital30Colors.primaryDeep,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: const TextStyle(
          color: Vital30Colors.onPrimary,
          fontWeight: FontWeight.w800,
          fontSize: 14,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.onSeeAll});
  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(child: Text(title, style: Vital30Text.h3)),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: Text(
                'See all',
                style: Vital30Text.body.copyWith(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: Vital30Colors.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroCheckinCard extends ConsumerWidget {
  const _HeroCheckinCard({required this.uc});
  final UserChallenge uc;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final challengesAsync = ref.watch(challengesProvider);
    final checkinsAsync = ref.watch(checkinsProvider(uc.id));

    final challenge = challengesAsync.maybeWhen(
      data: (list) => list.firstWhere(
        (c) => c.id == uc.challengeId,
        orElse: () => list.first,
      ),
      orElse: () => null,
    );

    final today = DateTime.now();
    final completedToday = checkinsAsync.maybeWhen(
      data: (list) => list.any(
        (c) =>
            c.status == 'COMPLETED' &&
            c.checkinDate.year == today.year &&
            c.checkinDate.month == today.month &&
            c.checkinDate.day == today.day,
      ),
      orElse: () => false,
    );

    final activeDays = checkinsAsync.maybeWhen(
      data: (list) => list.where((c) => c.status == 'COMPLETED').length,
      orElse: () => 0,
    );
    final streak = _computeStreak(checkinsAsync);
    final dayN = today.difference(uc.startDate.toLocal()).inDays + 1;
    final dayClamped = dayN.clamp(1, 30);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Vital30Colors.ink,
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
        boxShadow: const [
          BoxShadow(
            color: Color(0x660B7B6D),
            offset: Offset(0, 18),
            blurRadius: 40,
            spreadRadius: -16,
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned(
            right: -30,
            top: -30,
            child: Container(
              width: 200,
              height: 200,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x4DD87B2E),
                    Color(0x000B7B6D),
                  ],
                  stops: [0.0, 0.7],
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  VPill(
                    label: completedToday ? 'Done today' : 'Check-in due',
                    tone: VPillTone.accent,
                    size: VPillSize.sm,
                    backgroundOverride: const Color(0x33D87B2E),
                    foregroundOverride: const Color(0xFFF0A04B),
                  ),
                  const SizedBox(width: 6),
                  VPill(
                    label: 'Day $dayClamped of 30',
                    size: VPillSize.sm,
                    backgroundOverride: const Color(0x1AFFFFFF),
                    foregroundOverride:
                        Colors.white.withValues(alpha: 0.7),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                challenge?.title ?? 'Your daily challenge',
                style: Vital30Text.h2.copyWith(
                  fontSize: 21,
                  color: Vital30Colors.surface,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                challenge?.dailyTask ?? 'Stay consistent today.',
                style: Vital30Text.body.copyWith(
                  fontSize: 13,
                  color: Colors.white.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  ProgressRing(
                    progress: activeDays / 30,
                    size: 54,
                    stroke: 5,
                    color: Vital30Colors.accent,
                    trackColor: Colors.white.withValues(alpha: 0.12),
                    child: Text(
                      '$activeDays/30',
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Vital30Colors.surface,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'STREAK',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.55),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(
                            Icons.local_fire_department_outlined,
                            color: Vital30Colors.accent,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$streak day${streak == 1 ? '' : 's'}',
                            style: const TextStyle(
                              color: Vital30Colors.surface,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Spacer(),
                  if (!completedToday)
                    VButton(
                      label: 'Check in',
                      kind: VButtonKind.secondary,
                      size: VButtonSize.md,
                      onPressed: () => context.push('/checkin/${uc.id}'),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  int _computeStreak(AsyncValue<List<DailyCheckin>> async) {
    final checkins = async.maybeWhen(data: (l) => l, orElse: () => null);
    if (checkins == null) return 0;
    final sorted = [...checkins]
      ..sort((a, b) => b.checkinDate.compareTo(a.checkinDate));
    var streak = 0;
    var expectedDay = DateTime.now();
    for (final c in sorted) {
      final cd = DateTime(
          c.checkinDate.year, c.checkinDate.month, c.checkinDate.day);
      final ed = DateTime(expectedDay.year, expectedDay.month, expectedDay.day);
      final diff = ed.difference(cd).inDays;
      if (c.status != 'COMPLETED') break;
      if (diff > 1) break;
      streak += 1;
      expectedDay = cd.subtract(const Duration(days: 1));
    }
    return streak;
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.uc});
  final AsyncValue<List<UserChallenge>> uc;

  @override
  Widget build(BuildContext context) {
    return uc.maybeWhen(
      data: (list) {
        final active = list.where((u) => u.status == 'ACTIVE').length;
        final due = active; // single hero card represents the due one
        return Row(
          children: [
            Expanded(child: _StatCardRow(label: 'Active', value: '$active', sub: 'challenges')),
            const SizedBox(width: 10),
            Expanded(child: _StatCardRow(label: 'Due today', value: '$due', sub: 'check-in')),
          ],
        );
      },
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _StatCardRow extends StatelessWidget {
  const _StatCardRow({required this.label, required this.value, required this.sub});
  final String label, value, sub;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.lg),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label.toUpperCase(), style: Vital30Text.label),
                const SizedBox(height: 2),
                Text(sub, style: Vital30Text.body.copyWith(fontSize: 13)),
              ],
            ),
          ),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -1,
              color: Vital30Colors.ink,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyActiveCard extends StatelessWidget {
  const _EmptyActiveCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Vital30Colors.card,
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
        border: Border.all(color: Vital30Colors.hairlineSoft),
      ),
      child: Consumer(builder: (context, ref, _) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const VPill(label: 'Get started', tone: VPillTone.primary),
            const SizedBox(height: 10),
            Text(
              'Pick your first 30-day challenge.',
              style: Vital30Text.h3.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 6),
            Text(
              'Active days matter more than perfect streaks. We track both, you just show up.',
              style: Vital30Text.body,
            ),
            const SizedBox(height: 16),
            VButton(
              label: 'Browse challenges',
              fullWidth: true,
              size: VButtonSize.md,
              icon: Icons.arrow_forward,
              onPressed: () =>
                  ref.read(mainNavigationTabProvider.notifier).state = 1,
            ),
          ],
        );
      }),
    );
  }
}

class _SkeletonHero extends StatelessWidget {
  const _SkeletonHero();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Vital30Colors.surfaceAlt,
        borderRadius: BorderRadius.circular(Vital30Radius.xl),
      ),
    );
  }
}

