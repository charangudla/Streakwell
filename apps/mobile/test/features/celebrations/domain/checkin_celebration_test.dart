import 'package:flutter_test/flutter_test.dart';
import 'package:vital30/features/celebrations/domain/checkin_celebration.dart';

void main() {
  group('CheckinCelebration.isStreakMilestone', () {
    test('returns true for the celebrated streak lengths', () {
      expect(CheckinCelebration.isStreakMilestone(7), isTrue);
      expect(CheckinCelebration.isStreakMilestone(14), isTrue);
      expect(CheckinCelebration.isStreakMilestone(21), isTrue);
    });

    test('returns false for streaks adjacent to a milestone', () {
      expect(CheckinCelebration.isStreakMilestone(6), isFalse);
      expect(CheckinCelebration.isStreakMilestone(8), isFalse);
      expect(CheckinCelebration.isStreakMilestone(13), isFalse);
      expect(CheckinCelebration.isStreakMilestone(15), isFalse);
      expect(CheckinCelebration.isStreakMilestone(22), isFalse);
    });

    test('returns false for zero, negative, and challenge-completion streaks',
        () {
      expect(CheckinCelebration.isStreakMilestone(0), isFalse);
      expect(CheckinCelebration.isStreakMilestone(-1), isFalse);
      expect(CheckinCelebration.isStreakMilestone(30), isFalse);
    });
  });

  group('CheckinCelebration.isFinalDay', () {
    test('returns false on every day before day 30', () {
      expect(CheckinCelebration.isFinalDay(1), isFalse);
      expect(CheckinCelebration.isFinalDay(7), isFalse);
      expect(CheckinCelebration.isFinalDay(29), isFalse);
    });

    test('returns true on day 30 and any later day', () {
      expect(CheckinCelebration.isFinalDay(30), isTrue);
      expect(CheckinCelebration.isFinalDay(31), isTrue);
    });
  });
}
