/// Pure helpers for deciding which celebration to show after a successful
/// daily check-in. Kept UI-free so the rules can be unit-tested and remain
/// the single source of truth for both routing and the milestone modal.
class CheckinCelebration {
  const CheckinCelebration._();

  /// Total days in a Vital30 challenge.
  static const int totalDays = 30;

  /// Streak lengths (in consecutive completed days) that earn the
  /// celebratory milestone modal on top of the day-complete screen.
  static const Set<int> milestoneStreaks = {7, 14, 21};

  /// True when [streak] hits a celebrated milestone. Used to decide whether
  /// to pop the [StreakMilestoneModal] after a day-complete view.
  static bool isStreakMilestone(int streak) =>
      milestoneStreaks.contains(streak);

  /// True when a successful check-in on [dayN] (1-indexed) finishes the
  /// 30-day challenge. The check-in flow uses this to route to the
  /// challenge-complete screen instead of the day-complete screen.
  static bool isFinalDay(int dayN) => dayN >= totalDays;
}
