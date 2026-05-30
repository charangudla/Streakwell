import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vital30/app.dart';
import 'package:vital30/core/storage/preferences_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Stub flutter_secure_storage so checkAuth() resolves cleanly during boot.
  setUp(() {
    const channel =
        MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async => null);
  });

  testWidgets('app boots and lands on the welcome screen', (tester) async {
    // The router redirects first-launch users (onboarding_seen=false) to
    // /onboarding. Simulate a returning user so we exercise the welcome path.
    SharedPreferences.setMockInitialValues({'onboarding_seen': true});
    final prefs = PreferencesStorage(await SharedPreferences.getInstance());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          preferencesStorageProvider.overrideWithValue(prefs),
        ],
        child: const Vital30App(),
      ),
    );
    // Splash has an infinite-loop dot animation, so we can't pumpAndSettle.
    // Pump frames so auth init finishes and the router redirects to /welcome.
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 50));
    }

    expect(find.text('Get started'), findsOneWidget);
    expect(find.text('I already have an account'), findsOneWidget);
  });

  testWidgets('first-launch users land on the onboarding carousel',
      (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = PreferencesStorage(await SharedPreferences.getInstance());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          preferencesStorageProvider.overrideWithValue(prefs),
        ],
        child: const Vital30App(),
      ),
    );
    for (var i = 0; i < 20; i++) {
      await tester.pump(const Duration(milliseconds: 50));
    }

    // The first onboarding slide is the "Categories" pitch.
    expect(find.text('CATEGORIES'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
  });
}
