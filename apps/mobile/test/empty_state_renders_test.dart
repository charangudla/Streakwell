// Renders the active-tab empty state for MyChallengesScreen.
// The screen depends on the auth + my-challenges providers, which in turn
// depend on flutter_secure_storage. We skip the provider chain entirely by
// driving the empty state directly with overrides.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/mock_data.dart';
import 'package:vital30/features/my_challenges/presentation/my_challenges_provider.dart';
import 'package:vital30/features/my_challenges/presentation/my_challenges_screen.dart';

void main() {
  testWidgets(
      'MyChallengesScreen renders empty state when active list is empty',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          myChallengesNotifierProvider.overrideWith(
            (ref) => _EmptyMyChallengesNotifier(),
          ),
          checkinsProvider.overrideWith(
            (ref, _) async => <DailyCheckin>[],
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(body: MyChallengesScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle(const Duration(milliseconds: 100));

    expect(find.text('Nothing active yet.'), findsOneWidget);
  });
}

class _EmptyMyChallengesNotifier
    extends StateNotifier<AsyncValue<List<UserChallenge>>>
    implements MyChallengesNotifier {
  _EmptyMyChallengesNotifier()
      : super(const AsyncValue.data(<UserChallenge>[]));

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
