import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/features/celebrations/presentation/streak_milestone_modal.dart';

void main() {
  group('SlidingWeekStrip.windowFor', () {
    test('centres a 7-cell window on currentDay when there is room', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 14, totalDays: 30),
        [11, 12, 13, 14, 15, 16, 17],
      );
    });

    test('clamps to the left edge near the start of the challenge', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 1, totalDays: 30),
        [1, 2, 3, 4, 5, 6, 7],
      );
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 2, totalDays: 30),
        [1, 2, 3, 4, 5, 6, 7],
      );
    });

    test('clamps to the right edge near the end of the challenge', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 30, totalDays: 30),
        [24, 25, 26, 27, 28, 29, 30],
      );
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 28, totalDays: 30),
        [24, 25, 26, 27, 28, 29, 30],
      );
    });

    test('handles each streak milestone (7, 14, 21) with a 30-day total', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 7, totalDays: 30),
        [4, 5, 6, 7, 8, 9, 10],
      );
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 14, totalDays: 30),
        [11, 12, 13, 14, 15, 16, 17],
      );
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 21, totalDays: 30),
        [18, 19, 20, 21, 22, 23, 24],
      );
    });

    test('shrinks gracefully when totalDays is less than the window', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 2, totalDays: 4),
        [1, 2, 3, 4],
      );
    });

    test('returns an empty list when totalDays is non-positive', () {
      expect(
        SlidingWeekStripWindow.windowFor(currentDay: 5, totalDays: 0),
        isEmpty,
      );
    });
  });
}
