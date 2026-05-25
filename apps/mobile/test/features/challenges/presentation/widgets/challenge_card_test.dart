import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/theme/app_theme.dart';
import 'package:vital30/features/challenges/presentation/widgets/challenge_card.dart';

void main() {
  testWidgets('ChallengeCard renders challenge details', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(
          body: ChallengeCard(
            title: 'Hydration Reset',
            subtitle: 'Build a simple daily water habit.',
            durationDays: 30,
          ),
        ),
      ),
    );

    expect(find.text('Hydration Reset'), findsOneWidget);
    expect(find.text('Build a simple daily water habit.'), findsOneWidget);
    expect(find.text('30 days'), findsOneWidget);
  });
}
