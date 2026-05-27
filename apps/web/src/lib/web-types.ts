// Types mirroring the NestJS responses for authenticated endpoints.

export type UserChallenge = {
  id: string;
  userId: string;
  challengeId: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  startDate: string;
  endDate: string | null;
  progressPercent: number;
  /**
   * The user's check-in status for TODAY (UTC date), or null when
   * today hasn't been logged yet. Used by the dashboard to colour-code
   * each active-challenge card by whether action is still needed.
   */
  todayCheckinStatus: "COMPLETED" | "MISSED" | "SKIPPED" | null;
  /** Embedded so PRIVATE custom challenges render without a second fetch. */
  challenge: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    dailyTask: string;
    durationDays: number;
    difficulty: "BEGINNER" | "EASY" | "MEDIUM" | "HARD";
    categoryId: string;
    visibility: "PRIVATE" | "PUBLIC";
    createdById: string | null;
  };
};

export type ChallengeJoiner = {
  userChallengeId: string;
  userId: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  joinedAt: string;
  endDate: string | null;
  activeDays: number;
  progressPercent: number;
  isCreator: boolean;
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

export type ChallengeVisibility = "PRIVATE" | "PUBLIC";

export type CustomChallenge = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  dailyTask: string;
  durationDays: number;
  difficulty: "BEGINNER" | "EASY" | "MEDIUM" | "HARD";
  categoryId: string;
  createdById: string | null;
  visibility: ChallengeVisibility;
  inviteToken: string | null;
  isActive: boolean;
  createdAt: string;
  inviteCount?: number;
  joinedCount?: number;
};

export type ChallengeInviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export type ChallengeInvite = {
  id: string;
  challengeId: string;
  invitedById: string;
  invitedEmail: string;
  invitedUserId: string | null;
  status: ChallengeInviteStatus;
  createdAt: string;
  respondedAt: string | null;
};

export type IncomingInvite = ChallengeInvite & {
  challenge: {
    id: string;
    title: string;
    shortDescription: string;
    dailyTask: string;
    durationDays: number;
    inviteToken: string | null;
  };
  invitedBy: { id: string; name: string };
};

// =========================================================================
// Per-challenge community chat
// =========================================================================

export type ChatPresetTone =
  | "success"
  | "milestone"
  | "support"
  | "neutral"
  | "humor"
  | "encourage";

export type ChatPreset = {
  code: string;
  text: string;
  tone: ChatPresetTone;
};

export type ChatReactionEmoji = {
  code: string;
  char: string;
  label: string;
};

export type ChatMessageKind = "PRESET" | "CELEBRATION";

export type ChatMessage = {
  id: string;
  kind: ChatMessageKind;
  /** Catalog code for PRESET; null for CELEBRATION. */
  presetCode: string | null;
  /** Rendered body for CELEBRATION; null for PRESET. */
  body: string | null;
  /** UTC date the celebration represents; null for PRESET. */
  scheduledDate: string | null;
  createdAt: string;
  /** Null for CELEBRATION (system) or for a user who deleted their account. */
  user: { id: string; name: string } | null;
  reactions: {
    counts: Record<string, number>;
    /** Whether the VIEWER is currently reacting with each emoji. */
    mine: Record<string, boolean>;
  };
};

export type ChatPoll = {
  completed: number;
  missed: number;
  skipped: number;
  pending: number;
  total: number;
  yourStatus: CheckinStatus | null;
};

export type ChatChannel = {
  presets: ChatPreset[];
  emoji: ChatReactionEmoji[];
  poll: ChatPoll;
  messages: ChatMessage[];
};

export type ToggleReactionResult = {
  added: boolean;
  counts: Record<string, number>;
  mine: Record<string, boolean>;
};
