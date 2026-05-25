import '../../core/network/mock_data.dart';

class ProgressStats {
  const ProgressStats({
    required this.completedCount,
    required this.missedCount,
    required this.skippedCount,
    required this.currentStreak,
    required this.bestStreak,
    required this.completionPercentage,
  });

  final int completedCount;
  final int missedCount;
  final int skippedCount;
  final int currentStreak;
  final int bestStreak;
  final double completionPercentage;
}

class ProgressCalculator {
  const ProgressCalculator._();

  static ProgressStats calculate(List<DailyCheckin> checkins) {
    if (checkins.isEmpty) {
      return const ProgressStats(
        completedCount: 0,
        missedCount: 0,
        skippedCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        completionPercentage: 0.0,
      );
    }

    int completed = 0;
    int missed = 0;
    int skipped = 0;

    // Sort checkins chronologically by checkinDate (ignoring time)
    final sortedCheckins = List<DailyCheckin>.from(checkins)
      ..sort((a, b) => a.checkinDate.compareTo(b.checkinDate));

    final Map<String, String> dateToStatus = {};
    for (final ck in sortedCheckins) {
      final key = '${ck.checkinDate.year}-${ck.checkinDate.month}-${ck.checkinDate.day}';
      dateToStatus[key] = ck.status;

      if (ck.status == 'COMPLETED') {
        completed++;
      } else if (ck.status == 'MISSED') {
        missed++;
      } else if (ck.status == 'SKIPPED') {
        skipped++;
      }
    }

    // Calculate streaks
    int current = 0;
    int best = 0;
    int tempStreak = 0;

    // Streaks are computed by checking consecutive days from the start of check-ins
    // Let's find consecutive COMPLETED days
    DateTime? prevDate;
    for (final ck in sortedCheckins) {
      if (ck.status == 'COMPLETED') {
        if (prevDate == null) {
          tempStreak = 1;
        } else {
          final diff = ck.checkinDate.difference(prevDate).inDays;
          // Ignore multiple checkins on same day or consecutive calendar days
          if (diff <= 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        prevDate = ck.checkinDate;
        if (tempStreak > best) {
          best = tempStreak;
        }
      } else if (ck.status == 'MISSED') {
        tempStreak = 0;
        prevDate = null;
      }
      // SKIPPED doesn't break nor advance the streak
    }

    // Compute current active streak (looking backwards from today)
    final today = DateTime.now();
    DateTime checkDay = DateTime(today.year, today.month, today.day);

    bool isCurrentBroken = false;
    while (!isCurrentBroken) {
      final key = '${checkDay.year}-${checkDay.month}-${checkDay.day}';
      final status = dateToStatus[key];

      if (status == 'COMPLETED') {
        current++;
        checkDay = checkDay.subtract(const Duration(days: 1));
      } else if (status == 'SKIPPED') {
        // Skip does not break the streak; just look at yesterday
        checkDay = checkDay.subtract(const Duration(days: 1));
      } else {
        // Either MISSED or no checkin logged
        // If checking for today, they might not have logged yet, so allow checking yesterday
        final isToday = checkDay.year == today.year &&
            checkDay.month == today.month &&
            checkDay.day == today.day;
        if (isToday) {
          checkDay = checkDay.subtract(const Duration(days: 1));
        } else {
          isCurrentBroken = true;
        }
      }

      // Safeguard loop limit
      if (current > 30) {
        break;
      }
    }

    if (best < current) {
      best = current;
    }

    final double completionPercent = (completed / 30.0 * 100.0).clamp(0.0, 100.0);

    return ProgressStats(
      completedCount: completed,
      missedCount: missed,
      skippedCount: skipped,
      currentStreak: current,
      bestStreak: best,
      completionPercentage: completionPercent,
    );
  }

  // Helper method to generate premium share messages
  static String generateShareText({
    required String challengeName,
    required int currentDay,
    required int completedDays,
  }) {
    return "I'm on Day $currentDay of the [$challengeName] on Vital30. I completed $completedDays out of 30 active days. Join me and build better habits!";
  }
}
