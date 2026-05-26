import type { DailyCheckin } from "./web-types";

export type ProgressStats = {
  /** How many days COMPLETED (the "active days" headline metric). */
  activeDays: number;
  missedDays: number;
  skippedDays: number;
  /** Consecutive COMPLETED days ending today. Broken by MISSED. */
  currentStreak: number;
  longestStreak: number;
  /** 0..1 fraction. */
  completionRate: number;
};

/**
 * Pure progress calculator — mirrors the server-side
 * `services/api/src/challenges/domain/progress-calculator.ts` so the web
 * and the API agree on the numbers. We don't import the server module
 * because that would drag in @prisma/client.
 */
export function computeProgress(
  checkins: DailyCheckin[],
  totalDays = 30,
  today: Date = new Date(),
): ProgressStats {
  let activeDays = 0;
  let missedDays = 0;
  let skippedDays = 0;

  const completedDayKeys = new Set<string>();
  for (const c of checkins) {
    if (c.status === "COMPLETED") {
      activeDays += 1;
      completedDayKeys.add(utcKey(new Date(c.checkinDate)));
    } else if (c.status === "MISSED") missedDays += 1;
    else if (c.status === "SKIPPED") skippedDays += 1;
  }

  const sortedKeys = Array.from(completedDayKeys).sort();
  const longestStreak = longestRun(sortedKeys);
  const currentStreak = currentRunFrom(completedDayKeys, today);

  return {
    activeDays,
    missedDays,
    skippedDays,
    currentStreak,
    longestStreak,
    completionRate: totalDays === 0 ? 0 : activeDays / totalDays,
  };
}

function utcKey(d: Date): string {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

function longestRun(sortedKeys: string[]): number {
  let longest = 0;
  let current = 0;
  let previous: Date | null = null;
  for (const k of sortedKeys) {
    const d = new Date(`${k}T00:00:00.000Z`);
    if (!previous || daysBetween(previous, d) === 1) current += 1;
    else current = 1;
    longest = Math.max(longest, current);
    previous = d;
  }
  return longest;
}

function currentRunFrom(keys: Set<string>, today: Date): number {
  let streak = 0;
  let cursor = startOfUtcDay(today);
  while (keys.has(utcKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (startOfUtcDay(b).getTime() - startOfUtcDay(a).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** 1-indexed day number based on startDate. Clamped to [1, totalDays]. */
export function dayNumber(
  startDate: string | Date,
  totalDays = 30,
  today: Date = new Date(),
): number {
  const start = startOfUtcDay(new Date(startDate));
  const now = startOfUtcDay(today);
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  return Math.max(1, Math.min(totalDays, diff + 1));
}
