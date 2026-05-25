import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/utils/share_text.dart';

void main() {
  test('buildChallengeShareText generates safe share copy', () {
    expect(
      buildChallengeShareText(
        challengeTitle: 'Hydration Reset',
        completedDays: 7,
        totalDays: 30,
      ),
      'I completed 7 of 30 days in Hydration Reset on Vital30.',
    );
  });
}
