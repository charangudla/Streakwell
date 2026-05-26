import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/models.dart';
import '../../../core/theme/v_colors.dart';
import '../../../core/theme/v_spacing.dart';
import '../../../core/theme/v_typography.dart';
import '../../../core/widgets/challenge_card.dart';
import '../../../core/widgets/v_icon_button.dart';
import '../application/favorites_provider.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favs = ref.watch(favoritesProvider);

    return Scaffold(
      body: SafeArea(
        child: Column(
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
                  const SizedBox(width: 14),
                  Text('Saved challenges',
                      style: Vital30Text.h3.copyWith(fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: favs.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (_, __) => _ErrorState(
                  onRetry: () =>
                      ref.read(favoritesProvider.notifier).refresh(),
                ),
                data: (items) {
                  if (items.isEmpty) return const _EmptyState();
                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(favoritesProvider.notifier).refresh(),
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(
                          Vital30Space.screenH, 16, Vital30Space.screenH, 32),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final f = items[i];
                        // Reconstruct a Challenge from the embedded fields so
                        // ChallengeCard renders the same as on Home/Browse.
                        final c = Challenge(
                          id: f.challengeId,
                          title: f.title,
                          slug: '',
                          shortDescription: f.shortDescription,
                          description: '',
                          durationDays: f.durationDays,
                          difficulty: f.difficulty,
                          categoryId: '',
                          dailyTask: '',
                          benefits: const [],
                          safetyNote: '',
                        );
                        return ChallengeCard(
                          challenge: c,
                          onTap: () => context.push('/challenge/${c.id}'),
                          showJoin: false,
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.favorite_border,
                size: 56, color: Vital30Colors.inkSoft),
            const SizedBox(height: 12),
            Text('No favorites yet', style: Vital30Text.h3),
            const SizedBox(height: 6),
            Text(
              'Tap the heart on any challenge to save it for later.',
              style: Vital30Text.body,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Could not load favorites.',
                style: Vital30Text.body, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}
