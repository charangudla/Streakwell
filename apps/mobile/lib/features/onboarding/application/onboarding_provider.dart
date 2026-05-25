import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/preferences_storage.dart';

final onboardingProvider =
    StateNotifierProvider<OnboardingNotifier, bool>((ref) {
  return OnboardingNotifier(ref.watch(preferencesStorageProvider));
});

/// State is `true` once the user has completed (or skipped) onboarding.
/// The router watches this to decide whether first-launch users see the
/// carousel before the welcome screen.
class OnboardingNotifier extends StateNotifier<bool> {
  OnboardingNotifier(this._prefs) : super(_prefs.getOnboardingSeen());

  final PreferencesStorage _prefs;

  Future<void> markSeen() async {
    if (state) return;
    await _prefs.setOnboardingSeen(true);
    state = true;
  }
}
