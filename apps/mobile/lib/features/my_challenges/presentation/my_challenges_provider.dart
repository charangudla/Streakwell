import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_service.dart';
import '../../../core/network/mock_data.dart';
import '../../auth/presentation/auth_provider.dart';

class MyChallengesNotifier extends StateNotifier<AsyncValue<List<UserChallenge>>> {
  MyChallengesNotifier(this._apiService, this._userId, this._ref) : super(const AsyncValue.loading()) {
    if (_userId.isNotEmpty) {
      load();
    } else {
      state = const AsyncValue.data([]);
    }
  }

  final ApiService _apiService;
  final String _userId;
  final Ref _ref;

  Future<void> load() async {
    if (_userId.isEmpty) return;
    try {
      final list = await _apiService.getUserChallenges(_userId);
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> join(String challengeId) async {
    if (_userId.isEmpty) return false;
    try {
      await _apiService.joinChallenge(challengeId, _userId);
      await load();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> checkin(String userChallengeId, String status, String? notes) async {
    try {
      await _apiService.checkin(userChallengeId, status, notes);
      await load();
      // Force refresh calendar checkins
      _ref.invalidate(checkinsProvider(userChallengeId));
      return true;
    } catch (_) {
      return false;
    }
  }
}

final myChallengesNotifierProvider = StateNotifierProvider<MyChallengesNotifier, AsyncValue<List<UserChallenge>>>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final authState = ref.watch(authProvider);
  final userId = authState.user?.id ?? '';
  return MyChallengesNotifier(apiService, userId, ref);
});

final checkinsProvider = FutureProvider.family<List<DailyCheckin>, String>((ref, userChallengeId) async {
  return ref.watch(apiServiceProvider).getDailyCheckins(userChallengeId);
});
