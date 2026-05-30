import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_service.dart';
import '../../../core/network/models.dart';

/// Mints (or fetches) the current user's referral code. The backend assigns
/// a code on signup; this is a safety net that also returns referredCount
/// and the canonical shareText.
final referralProvider = AsyncNotifierProvider<ReferralNotifier, ReferralInfo>(
  ReferralNotifier.new,
);

class ReferralNotifier extends AsyncNotifier<ReferralInfo> {
  @override
  Future<ReferralInfo> build() {
    return ref.read(apiServiceProvider).getMyReferral();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getMyReferral(),
    );
  }

  /// Returns null on success, or a user-facing error string on failure
  /// (e.g. "Code not found", "Already redeemed").
  Future<String?> redeem(String code) async {
    try {
      await ref.read(apiServiceProvider).redeemReferralCode(code);
      await refresh();
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['message'] is String) {
        return data['message'] as String;
      }
      return 'Could not redeem code. Please check it and try again.';
    } catch (_) {
      return 'Something went wrong. Try again.';
    }
  }
}
