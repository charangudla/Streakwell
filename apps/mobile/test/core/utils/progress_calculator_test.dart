import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/core/network/mock_data.dart';
import 'package:vital30/core/utils/progress_calculator.dart';

void main() {
  group('ProgressCalculator Unit Tests', () {
    test('calculate returns zero stats on empty checkins', () {
      final stats = ProgressCalculator.calculate([]);

      expect(stats.completedCount, 0);
      expect(stats.missedCount, 0);
      expect(stats.skippedCount, 0);
      expect(stats.currentStreak, 0);
      expect(stats.bestStreak, 0);
      expect(stats.completionPercentage, 0.0);
    });

    test('calculate correctly counts completed, missed, and skipped checkins', () {
      final checkins = [
        DailyCheckin(
          id: '1',
          userChallengeId: 'uc-1',
          checkinDate: DateTime.now().subtract(const Duration(days: 3)),
          status: 'COMPLETED',
          createdAt: DateTime.now(),
        ),
        DailyCheckin(
          id: '2',
          userChallengeId: 'uc-1',
          checkinDate: DateTime.now().subtract(const Duration(days: 2)),
          status: 'MISSED',
          createdAt: DateTime.now(),
        ),
        DailyCheckin(
          id: '3',
          userChallengeId: 'uc-1',
          checkinDate: DateTime.now().subtract(const Duration(days: 1)),
          status: 'SKIPPED',
          createdAt: DateTime.now(),
        ),
      ];

      final stats = ProgressCalculator.calculate(checkins);

      expect(stats.completedCount, 1);
      expect(stats.missedCount, 1);
      expect(stats.skippedCount, 1);
    });

    test('calculate correctly computes streaks', () {
      final today = DateTime.now();
      final checkins = [
        DailyCheckin(
          id: '1',
          userChallengeId: 'uc-1',
          checkinDate: today.subtract(const Duration(days: 2)),
          status: 'COMPLETED',
          createdAt: today,
        ),
        DailyCheckin(
          id: '2',
          userChallengeId: 'uc-1',
          checkinDate: today.subtract(const Duration(days: 1)),
          status: 'COMPLETED',
          createdAt: today,
        ),
        DailyCheckin(
          id: '3',
          userChallengeId: 'uc-1',
          checkinDate: today,
          status: 'COMPLETED',
          createdAt: today,
        ),
      ];

      final stats = ProgressCalculator.calculate(checkins);

      expect(stats.currentStreak, 3);
      expect(stats.bestStreak, 3);
    });

    test('generateShareText generates standard motivative text', () {
      final text = ProgressCalculator.generateShareText(
        challengeName: 'No Refined Sugar',
        currentDay: 15,
        completedDays: 12,
      );

      expect(
        text,
        "I'm on Day 15 of the [No Refined Sugar] on Vital30. I completed 12 out of 30 active days. Join me and build better habits!",
      );
    });
  });
}
