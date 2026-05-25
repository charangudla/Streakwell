import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vital30/core/storage/preferences_storage.dart';
import 'package:vital30/features/onboarding/application/onboarding_provider.dart';

ProviderContainer _containerWith(PreferencesStorage prefs) {
  final container = ProviderContainer(overrides: [
    preferencesStorageProvider.overrideWithValue(prefs),
  ]);
  addTearDown(container.dispose);
  return container;
}

void main() {
  group('OnboardingNotifier', () {
    test('initial state is false when prefs say onboarding has not been seen',
        () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = PreferencesStorage(await SharedPreferences.getInstance());
      final container = _containerWith(prefs);

      expect(container.read(onboardingProvider), isFalse);
    });

    test('initial state is true when prefs already record onboarding as seen',
        () async {
      SharedPreferences.setMockInitialValues({'onboarding_seen': true});
      final prefs = PreferencesStorage(await SharedPreferences.getInstance());
      final container = _containerWith(prefs);

      expect(container.read(onboardingProvider), isTrue);
    });

    test('markSeen() flips the state and persists across notifiers', () async {
      SharedPreferences.setMockInitialValues({});
      final sharedPrefs = await SharedPreferences.getInstance();
      final prefs = PreferencesStorage(sharedPrefs);
      final container = _containerWith(prefs);

      await container.read(onboardingProvider.notifier).markSeen();
      expect(container.read(onboardingProvider), isTrue);
      expect(prefs.getOnboardingSeen(), isTrue);

      // A fresh notifier built against the same storage should see it.
      final container2 = _containerWith(prefs);
      expect(container2.read(onboardingProvider), isTrue);
    });

    test('markSeen() is idempotent and safe to call when already seen',
        () async {
      SharedPreferences.setMockInitialValues({'onboarding_seen': true});
      final prefs = PreferencesStorage(await SharedPreferences.getInstance());
      final container = _containerWith(prefs);

      await container.read(onboardingProvider.notifier).markSeen();
      expect(container.read(onboardingProvider), isTrue);
    });
  });
}
