import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vital30/features/my_challenges/presentation/my_challenges_screen.dart';

void main() {
  testWidgets('MyChallengesScreen renders empty state when active list is empty', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: MyChallengesScreen(),
        ),
      ),
    );
    await tester.pump();

    expect(find.text('No active wellness habits'), findsOneWidget);
    expect(find.text('Join a habit blueprint from Explore to begin.'), findsOneWidget);
    expect(find.text('Browse Blueprints'), findsOneWidget);
  });
}
