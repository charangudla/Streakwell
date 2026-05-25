class DailyCompletion {
  const DailyCompletion({required this.completedOn});

  final DateTime completedOn;
}

class ChallengeProgress {
  const ChallengeProgress({
    required this.completedDays,
    required this.totalDays,
    required this.currentStreak,
    required this.longestStreak,
    required this.completionRate,
  });

  final int completedDays;
  final int totalDays;
  final int currentStreak;
  final int longestStreak;
  final double completionRate;
}

ChallengeProgress calculateChallengeProgress({
  required List<DailyCompletion> completions,
  int totalDays = 30,
  DateTime? today,
}) {
  final uniqueDayKeys = completions
      .map((completion) => _toUtcDayKey(completion.completedOn))
      .toSet();
  final sortedDayKeys = uniqueDayKeys.toList()..sort();
  final completedDays = uniqueDayKeys.length;

  return ChallengeProgress(
    completedDays: completedDays,
    totalDays: totalDays,
    currentStreak: _calculateCurrentStreak(
      uniqueDayKeys,
      today ?? DateTime.now().toUtc(),
    ),
    longestStreak: _calculateLongestStreak(sortedDayKeys),
    completionRate: totalDays == 0 ? 0 : completedDays / totalDays,
  );
}

int _calculateLongestStreak(List<String> sortedDayKeys) {
  var longest = 0;
  var current = 0;
  DateTime? previousDay;

  for (final dayKey in sortedDayKeys) {
    final day = DateTime.parse('${dayKey}T00:00:00.000Z');

    if (previousDay == null || day.difference(previousDay).inDays == 1) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }
    previousDay = day;
  }

  return longest;
}

int _calculateCurrentStreak(Set<String> dayKeys, DateTime today) {
  var streak = 0;
  var cursor = _startOfUtcDay(today);

  while (dayKeys.contains(_toUtcDayKey(cursor))) {
    streak += 1;
    cursor = cursor.subtract(const Duration(days: 1));
  }

  return streak;
}

String _toUtcDayKey(DateTime date) {
  return _startOfUtcDay(date).toIso8601String().substring(0, 10);
}

DateTime _startOfUtcDay(DateTime date) {
  final utc = date.toUtc();
  return DateTime.utc(utc.year, utc.month, utc.day);
}
