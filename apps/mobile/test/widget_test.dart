import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vital30/app.dart';

void main() {
  testWidgets('app starts and shows the welcome screen', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: Vital30App(),
      ),
    );
    await tester.pump();
    await tester.pump(); // Allow router redirection loop to complete

    // Verify Welcome Screen details
    expect(find.text('Vital30'), findsWidgets);
    expect(find.text('Build lifelong habits in 30 days'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);
    expect(find.text('I already have an account'), findsOneWidget);
  });
}
