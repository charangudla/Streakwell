import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

/// Server-backed favorites for the current user. Stored as the full
/// `FavoriteEntry` list (which embeds the joined Challenge fields) so
/// the `/favorites` screen can render without a second fetch.
final favoritesProvider =
    AsyncNotifierProvider<FavoritesNotifier, List<FavoriteEntry>>(
  FavoritesNotifier.new,
);

class FavoritesNotifier extends AsyncNotifier<List<FavoriteEntry>> {
  @override
  Future<List<FavoriteEntry>> build() {
    return ref.read(apiServiceProvider).getFavorites();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getFavorites(),
    );
  }

  bool contains(String challengeId) {
    return (state.valueOrNull ?? const <FavoriteEntry>[])
        .any((f) => f.challengeId == challengeId);
  }

  /// Optimistic toggle. Returns the new isFavorited state, or null if the
  /// request failed (in which case state is reverted and the UI should
  /// surface an error if it wants to).
  Future<bool?> toggle(FavoriteEntry candidate) async {
    final api = ref.read(apiServiceProvider);
    final current = state.valueOrNull ?? const <FavoriteEntry>[];
    final isCurrentlyFavorited =
        current.any((f) => f.challengeId == candidate.challengeId);

    if (isCurrentlyFavorited) {
      state = AsyncValue.data(
        current.where((f) => f.challengeId != candidate.challengeId).toList(),
      );
      try {
        await api.removeFavorite(candidate.challengeId);
        return false;
      } catch (_) {
        state = AsyncValue.data(current);
        return null;
      }
    } else {
      state = AsyncValue.data([candidate, ...current]);
      try {
        await api.addFavorite(candidate.challengeId);
        return true;
      } catch (_) {
        state = AsyncValue.data(current);
        return null;
      }
    }
  }
}

/// Convenience selector — emits true when `challengeId` is in the current
/// favorites list. Watching this from a list cell is cheap (Riverpod only
/// notifies when this exact bool changes).
final isFavoritedProvider = Provider.family<bool, String>((ref, challengeId) {
  final favs = ref.watch(favoritesProvider).valueOrNull ?? const <FavoriteEntry>[];
  return favs.any((f) => f.challengeId == challengeId);
});
