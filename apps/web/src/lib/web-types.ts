// Types mirroring the NestJS responses for authenticated endpoints.

export type UserChallenge = {
  id: string;
  userId: string;
  challengeId: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startDate: string;
  endDate: string | null;
  progressPercent: number;
};

export type CheckinStatus = "COMPLETED" | "MISSED" | "SKIPPED";

export type DailyCheckin = {
  id: string;
  userChallengeId: string;
  checkinDate: string;
  status: CheckinStatus;
  notes: string | null;
};

export type AppNotification = {
  id: string;
  type:
    | "STREAK_MILESTONE"
    | "CHALLENGE_COMPLETE"
    | "REMINDER"
    | "REFERRAL_JOIN"
    | "SYSTEM"
    | "ACHIEVEMENT";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type AchievementKind =
  | "FIRST_CHECKIN"
  | "SEVEN_DAY_STREAK"
  | "TWENTY_ONE_DAY_STREAK"
  | "CHALLENGE_COMPLETED"
  | "THREE_CHALLENGES_COMPLETED";

export type Achievement = {
  id: string;
  userId: string;
  kind: AchievementKind;
  data: Record<string, unknown> | null;
  earnedAt: string;
};

export type FavoriteEntry = {
  id: string;
  userId: string;
  challengeId: string;
  createdAt: string;
  challenge: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    difficulty: "BEGINNER" | "EASY" | "MEDIUM" | "HARD";
    durationDays: number;
    categoryId: string;
  };
};

export type ReferralInfo = {
  code: string;
  referredCount: number;
  shareText: string;
};
