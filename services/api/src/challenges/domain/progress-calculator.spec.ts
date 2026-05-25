import { calculateChallengeProgress } from './progress-calculator';

describe('calculateChallengeProgress', () => {
  it('calculates completed days and completion rate', () => {
    const progress = calculateChallengeProgress(
      [
        { completedOn: new Date('2026-05-01T12:00:00.000Z') },
        { completedOn: new Date('2026-05-02T12:00:00.000Z') },
        { completedOn: new Date('2026-05-02T18:00:00.000Z') },
      ],
      30,
      new Date('2026-05-02T20:00:00.000Z'),
    );

    expect(progress.completedDays).toBe(2);
    expect(progress.completionRate).toBeCloseTo(2 / 30);
  });

  it('calculates current and longest streaks from unique UTC days', () => {
    const progress = calculateChallengeProgress(
      [
        { completedOn: new Date('2026-05-01T12:00:00.000Z') },
        { completedOn: new Date('2026-05-02T12:00:00.000Z') },
        { completedOn: new Date('2026-05-04T12:00:00.000Z') },
        { completedOn: new Date('2026-05-05T12:00:00.000Z') },
        { completedOn: new Date('2026-05-06T12:00:00.000Z') },
      ],
      30,
      new Date('2026-05-06T20:00:00.000Z'),
    );

    expect(progress.currentStreak).toBe(3);
    expect(progress.longestStreak).toBe(3);
  });
});
