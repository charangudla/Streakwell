import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/features/challenges/domain/progress_calculator.dart';

void main() {
  test('calculateChallengeProgress counts unique completed days', () {
    final progress = calculateChallengeProgress(
      completions: [
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 1, 12)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 2, 12)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 2, 18)),
      ],
      today: DateTime.utc(2026, 5, 2, 20),
    );

    expect(progress.completedDays, 2);
    expect(progress.completionRate, closeTo(2 / 30, 0.001));
  });

  test('calculateChallengeProgress calculates current and longest streaks', () {
    final progress = calculateChallengeProgress(
      completions: [
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 1)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 2)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 4)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 5)),
        DailyCompletion(completedOn: DateTime.utc(2026, 5, 6)),
      ],
      today: DateTime.utc(2026, 5, 6),
    );

    expect(progress.currentStreak, 3);
    expect(progress.longestStreak, 3);
  });
}
