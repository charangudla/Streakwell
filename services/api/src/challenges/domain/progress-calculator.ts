export type DailyCompletion = {
  completedOn: Date;
};

export type ChallengeProgress = {
  completedDays: number;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateChallengeProgress(
  completions: DailyCompletion[],
  totalDays = 30,
  today = new Date(),
): ChallengeProgress {
  const uniqueDayKeys = new Set(
    completions.map((completion) => toUtcDateKey(completion.completedOn)),
  );
  const sortedDayKeys = Array.from(uniqueDayKeys).sort();
  const longestStreak = calculateLongestStreak(sortedDayKeys);
  const currentStreak = calculateCurrentStreak(uniqueDayKeys, today);
  const completedDays = uniqueDayKeys.size;

  return {
    completedDays,
    totalDays,
    currentStreak,
    longestStreak,
    completionRate: totalDays === 0 ? 0 : completedDays / totalDays,
  };
}

function calculateLongestStreak(sortedDayKeys: string[]): number {
  let longest = 0;
  let current = 0;
  let previousDay: Date | null = null;

  for (const dayKey of sortedDayKeys) {
    const day = new Date(`${dayKey}T00:00:00.000Z`);

    if (!previousDay || daysBetween(previousDay, day) === 1) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previousDay = day;
  }

  return longest;
}

function calculateCurrentStreak(dayKeys: Set<string>, today: Date): number {
  let streak = 0;
  let cursor = startOfUtcDay(today);

  while (dayKeys.has(toUtcDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }

  return streak;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) /
      MS_PER_DAY,
  );
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toUtcDateKey(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}
