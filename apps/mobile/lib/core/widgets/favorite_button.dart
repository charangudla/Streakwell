import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/challenges/application/favorites_provider.dart';
import '../network/models.dart';
import '../theme/v_colors.dart';

/// Small heart button that toggles the favorite state of a Challenge.
/// Reads `isFavoritedProvider(challengeId)` so each card only rebuilds
/// when its own favorite flag flips.
class FavoriteButton extends ConsumerWidget {
  const FavoriteButton({
    super.key,
    required this.challenge,
    this.size = 32,
  });

  final Challenge challenge;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFav = ref.watch(isFavoritedProvider(challenge.id));
    return Material(
      color: Vital30Colors.card,
      shape: const CircleBorder(
          side: BorderSide(color: Vital30Colors.hairlineSoft)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: () => _toggle(context, ref),
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(
            isFav ? Icons.favorite : Icons.favorite_border,
            size: size * 0.5,
            color: isFav
                ? Vital30Colors.berry
                : Vital30Colors.ink.withValues(alpha: 0.55),
          ),
        ),
      ),
    );
  }

  Future<void> _toggle(BuildContext context, WidgetRef ref) async {
    final candidate = FavoriteEntry(
      id: 'pending-${challenge.id}',
      challengeId: challenge.id,
      title: challenge.title,
      shortDescription: challenge.shortDescription,
      difficulty: challenge.difficulty,
      durationDays: challenge.durationDays,
    );
    final result =
        await ref.read(favoritesProvider.notifier).toggle(candidate);
    if (!context.mounted) return;
    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update favorites.')),
      );
    }
  }
}
