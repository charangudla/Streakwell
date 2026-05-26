import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

final achievementsProvider =
    AsyncNotifierProvider<AchievementsNotifier, List<AchievementEntry>>(
  AchievementsNotifier.new,
);

class AchievementsNotifier extends AsyncNotifier<List<AchievementEntry>> {
  @override
  Future<List<AchievementEntry>> build() {
    return ref.read(apiServiceProvider).getAchievements();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getAchievements(),
    );
  }
}
