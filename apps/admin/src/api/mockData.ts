import type { UserRole } from '../routing/AuthProvider';

/* ------------------------------------------------------------------ *
 * Types — aligned with the real backend `/admin/*` response shapes.
 * Mock fallbacks below satisfy these so TypeScript stays consistent
 * whether the API is reachable or not.
 * ------------------------------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  challengeCount: number;
}

export type Difficulty = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD';
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  durationDays: number;
  difficulty: Difficulty;
  isActive: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  visibility: Visibility;
  isCustom: boolean;
  createdAt: string;
  categoryId: string | null;
  categoryName: string | null;
  joinedCount: number;
  // Detail-only fields (present on create/update responses, optional in list)
  description?: string;
  dailyTask?: string;
  benefits?: string[];
  safetyNote?: string;
}

/** Body for POST /admin/challenges and (partially) PATCH /admin/challenges/:id. */
export interface ChallengeInput {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  dailyTask: string;
  durationDays: number;
  difficulty: Difficulty;
  categoryId: string;
  benefits: string[];
  safetyNote?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  isActive?: boolean;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  challengeCount: number;
}

export interface UsersListResponse {
  total: number;
  skip: number;
  take: number;
  users: MockUser[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  gender: string | null;
  birthYear: number | null;
  heightCm: number | null;
  weightKg: number | null;
  unitPreference: string | null;
  primaryGoal: string | null;
  interestCategoryIds: string[];
  dailyMinutes: number | null;
  onboardingCompletedAt: string | null;
  referralCode: string | null;
}

export interface JoinedChallenge {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startDate: string;
  endDate: string | null;
  challengeTitle: string;
  durationDays: number;
  checkinsCount: number;
}

export interface CreatedChallengeSummary {
  id: string;
  title: string;
  visibility: Visibility;
  isActive: boolean;
  createdAt: string;
}

export interface UserDetailResponse {
  user: UserProfile;
  joinedChallenges: JoinedChallenge[];
  createdChallenges: CreatedChallengeSummary[];
  friendCount: number;
  chatMessageCount: number;
}

export interface DashboardStats {
  totalUsers: number;
  suspendedUsers: number;
  catalogChallenges: number;
  customChallenges: number;
  activeUserChallenges: number;
  completedUserChallenges: number;
  totalCheckins: number;
  contactTotal: number;
  contactUnresolved: number;
}

export interface CheckinRow {
  id: string;
  checkinDate: string;
  status: 'COMPLETED' | 'MISSED' | 'SKIPPED';
  notes: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  challengeTitle: string;
}

export interface CheckinsResponse {
  total: number;
  skip: number;
  take: number;
  checkins: CheckinRow[];
}

export interface ShareEventRow {
  id: string;
  type: string;
  platform: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface ShareEventsResponse {
  total: number;
  skip: number;
  take: number;
  events: ShareEventRow[];
}

export interface CustomChallengeRow {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  dailyTask: string;
  visibility: Visibility;
  isActive: boolean;
  createdAt: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  joinedCount: number;
  inviteCount: number;
}

export interface ChatMessageRow {
  id: string;
  kind: 'PRESET' | 'CELEBRATION';
  presetCode: string | null;
  body: string | null;
  createdAt: string;
  challengeId: string;
  challengeTitle: string;
  userId: string;
  userName: string;
}

export interface ChatMessagesResponse {
  total: number;
  skip: number;
  take: number;
  messages: ChatMessageRow[];
}

export interface FriendshipRow {
  id: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  requesterId: string;
  requesterName: string;
  recipientId: string;
  recipientName: string;
}

export interface FriendshipsResponse {
  total: number;
  skip: number;
  take: number;
  friendships: FriendshipRow[];
}

export interface ContactSubmissionRow {
  id: string;
  name: string;
  email: string;
  message: string;
  ipAddress: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ContactSubmissionsResponse {
  total: number;
  skip: number;
  take: number;
  submissions: ContactSubmissionRow[];
}

/* ------------------------------------------------------------------ *
 * Mock fallbacks. Used only when the API is unreachable so the app
 * still renders during local dev without a backend.
 * ------------------------------------------------------------------ */

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Diet & Nutrition', slug: 'diet-nutrition', description: 'Fuel your body with wholesome, nutrient-dense foods.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 8 },
  { id: 'cat-2', name: 'Fitness & Movement', slug: 'fitness-movement', description: 'Strengthen your heart and body through daily exercise.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 9 },
  { id: 'cat-3', name: 'Mental Wellness', slug: 'mental-wellness', description: 'Calm your mind, improve focus, and develop resilience.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 7 },
  { id: 'cat-4', name: 'Sleep & Recovery', slug: 'sleep-recovery', description: 'Optimize your rest periods to promote cell repair.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 5 },
  { id: 'cat-5', name: 'Break Bad Habits', slug: 'break-bad-habits', description: 'Overcome self-limiting habits and mindless scrolling.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 6 },
  { id: 'cat-6', name: 'Family Wellness', slug: 'family-wellness', description: 'Connect with loved ones and establish group habits.', createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 5 },
];

function mockChallenge(
  partial: Partial<Challenge> & Pick<Challenge, 'id' | 'title' | 'slug' | 'categoryId'>,
): Challenge {
  const category = mockCategories.find((c) => c.id === partial.categoryId);
  return {
    shortDescription: 'A structured 30-day wellness challenge.',
    durationDays: 30,
    difficulty: 'MEDIUM',
    isActive: true,
    isPopular: false,
    isRecommended: false,
    visibility: 'PUBLIC',
    isCustom: false,
    createdAt: '2026-05-20T00:00:00.000Z',
    categoryName: category?.name ?? null,
    joinedCount: 0,
    description: 'Detailed description of the challenge and how to succeed.',
    dailyTask: 'Complete the assigned daily task.',
    benefits: ['Improved wellness', 'Built consistency'],
    ...partial,
  };
}

export const mockChallenges: Challenge[] = [
  mockChallenge({ id: 'ch-1', title: 'No Refined Sugar', slug: 'no-refined-sugar', categoryId: 'cat-1', shortDescription: 'Cut out all processed sugars and artificial sweeteners.', isPopular: true, isRecommended: true, joinedCount: 42 }),
  mockChallenge({ id: 'ch-2', title: 'Hydration Hero', slug: 'hydration-hero', categoryId: 'cat-1', difficulty: 'BEGINNER', shortDescription: 'Drink 3 liters of pure water every day.', isPopular: true, joinedCount: 30 }),
  mockChallenge({ id: 'ch-3', title: 'Daily 10k Steps', slug: 'daily-10k-steps', categoryId: 'cat-2', difficulty: 'EASY', shortDescription: 'Walk at least 10,000 steps every single day.', isPopular: true, isRecommended: true, joinedCount: 55 }),
  mockChallenge({ id: 'ch-4', title: 'Morning Mobility Stretch', slug: 'morning-mobility-stretch', categoryId: 'cat-2', difficulty: 'BEGINNER', shortDescription: 'Spend 15 minutes stretching your muscles upon waking.', joinedCount: 18 }),
  mockChallenge({ id: 'ch-5', title: 'Daily Gratitude Journal', slug: 'daily-gratitude-journal', categoryId: 'cat-3', difficulty: 'BEGINNER', shortDescription: 'Write down three unique things you are grateful for.', isRecommended: true, joinedCount: 22 }),
  mockChallenge({ id: 'ch-6', title: 'Mindful Meditation', slug: 'mindful-meditation', categoryId: 'cat-3', shortDescription: 'Meditate quietly for 10 minutes.', joinedCount: 14 }),
  mockChallenge({ id: 'ch-7', title: 'Early Bird Bedtime', slug: 'early-bird-bedtime', categoryId: 'cat-4', shortDescription: 'Be in bed with lights out by 10:30 PM.', isRecommended: true, joinedCount: 11 }),
];

export const mockUsers: MockUser[] = [
  { id: 'usr-1', name: 'Alice Jones', email: 'alice.jones@gmail.com', username: 'alicej', role: 'USER', isActive: true, emailVerified: true, createdAt: '2026-05-21T08:12:00.000Z', challengeCount: 2 },
  { id: 'usr-2', name: 'Bob Smith', email: 'bob.smith@hotmail.com', username: 'bobsmith', role: 'USER', isActive: true, emailVerified: true, createdAt: '2026-05-21T10:14:00.000Z', challengeCount: 2 },
  { id: 'usr-3', name: 'Charlie Brown', email: 'charlie.brown@yahoo.com', username: null, role: 'USER', isActive: true, emailVerified: false, createdAt: '2026-05-22T07:15:00.000Z', challengeCount: 1 },
  { id: 'usr-4', name: 'Diana Prince', email: 'diana.prince@outlook.com', username: 'wonder', role: 'USER', isActive: false, emailVerified: true, createdAt: '2026-05-22T14:32:00.000Z', challengeCount: 0 },
  { id: 'usr-5', name: 'Evan Wright', email: 'evan.wright@icloud.com', username: null, role: 'USER', isActive: true, emailVerified: true, createdAt: '2026-05-23T11:45:00.000Z', challengeCount: 1 },
  { id: 'usr-6', name: 'Vital30 Super Admin', email: 'superadmin@challenge.charangudla.com', username: 'superadmin', role: 'SUPER_ADMIN', isActive: true, emailVerified: true, createdAt: '2026-05-20T00:00:00.000Z', challengeCount: 0 },
];

export const mockUserProfiles: Record<string, UserProfile> = mockUsers.reduce(
  (acc, u) => {
    acc[u.id] = {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      username: u.username,
      phone: null,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      gender: null,
      birthYear: null,
      heightCm: null,
      weightKg: null,
      unitPreference: 'METRIC',
      primaryGoal: null,
      interestCategoryIds: [],
      dailyMinutes: null,
      onboardingCompletedAt: u.createdAt,
      referralCode: u.id.toUpperCase().replace('-', ''),
    };
    return acc;
  },
  {} as Record<string, UserProfile>,
);

export const mockJoinedChallenges: Record<string, JoinedChallenge[]> = {
  'usr-1': [
    { id: 'uc-1', status: 'ACTIVE', startDate: '2026-05-21T00:00:00.000Z', endDate: null, challengeTitle: 'No Refined Sugar', durationDays: 30, checkinsCount: 3 },
    { id: 'uc-2', status: 'COMPLETED', startDate: '2026-04-20T00:00:00.000Z', endDate: '2026-05-20T00:00:00.000Z', challengeTitle: 'Daily 10k Steps', durationDays: 30, checkinsCount: 30 },
  ],
  'usr-2': [
    { id: 'uc-3', status: 'ACTIVE', startDate: '2026-05-22T00:00:00.000Z', endDate: null, challengeTitle: 'No Refined Sugar', durationDays: 30, checkinsCount: 2 },
  ],
};

export const mockCheckins: CheckinRow[] = [
  { id: 'ck-1', checkinDate: '2026-05-21', status: 'COMPLETED', notes: 'Feeling full of natural energy!', createdAt: '2026-05-21T20:00:00.000Z', userId: 'usr-1', userName: 'Alice Jones', userEmail: 'alice.jones@gmail.com', challengeTitle: 'No Refined Sugar' },
  { id: 'ck-2', checkinDate: '2026-05-22', status: 'COMPLETED', notes: 'Almost ate a cookie, stayed strong!', createdAt: '2026-05-22T19:30:00.000Z', userId: 'usr-1', userName: 'Alice Jones', userEmail: 'alice.jones@gmail.com', challengeTitle: 'No Refined Sugar' },
  { id: 'ck-3', checkinDate: '2026-05-23', status: 'SKIPPED', notes: 'Family reunion - skip allowed', createdAt: '2026-05-23T21:10:00.000Z', userId: 'usr-1', userName: 'Alice Jones', userEmail: 'alice.jones@gmail.com', challengeTitle: 'No Refined Sugar' },
  { id: 'ck-5', checkinDate: '2026-05-22', status: 'COMPLETED', notes: 'Tough but worth it', createdAt: '2026-05-22T21:00:00.000Z', userId: 'usr-2', userName: 'Bob Smith', userEmail: 'bob.smith@hotmail.com', challengeTitle: 'No Refined Sugar' },
  { id: 'ck-6', checkinDate: '2026-05-23', status: 'MISSED', notes: null, createdAt: '2026-05-23T23:59:59.000Z', userId: 'usr-2', userName: 'Bob Smith', userEmail: 'bob.smith@hotmail.com', challengeTitle: 'No Refined Sugar' },
];

export const mockShareEvents: ShareEventRow[] = [
  { id: 'se-1', type: 'DAILY_PROGRESS', platform: 'Twitter', createdAt: '2026-05-24T18:15:00.000Z', userId: 'usr-1', userName: 'Alice Jones', userEmail: 'alice.jones@gmail.com' },
  { id: 'se-2', type: 'COMPLETION', platform: 'Facebook', createdAt: '2026-05-20T17:30:00.000Z', userId: 'usr-1', userName: 'Alice Jones', userEmail: 'alice.jones@gmail.com' },
  { id: 'se-3', type: 'CHALLENGE_INVITE', platform: 'WhatsApp', createdAt: '2026-05-22T11:00:00.000Z', userId: 'usr-2', userName: 'Bob Smith', userEmail: 'bob.smith@hotmail.com' },
  { id: 'se-4', type: 'DAILY_PROGRESS', platform: 'Instagram', createdAt: '2026-05-24T19:00:00.000Z', userId: 'usr-3', userName: 'Charlie Brown', userEmail: 'charlie.brown@yahoo.com' },
];

export const mockCustomChallenges: CustomChallengeRow[] = [
  { id: 'cc-1', title: '21-Day No Soda', slug: 'no-soda-abc', shortDescription: 'My personal soda-free streak.', description: 'Cutting out all sodas for 21 days straight.', dailyTask: 'Drink zero soda today.', visibility: 'INVITE_ONLY', isActive: true, createdAt: '2026-05-24T09:00:00.000Z', creatorId: 'usr-1', creatorName: 'Alice Jones', creatorEmail: 'alice.jones@gmail.com', joinedCount: 4, inviteCount: 6 },
  { id: 'cc-2', title: 'Family Walk Club', slug: 'family-walk-xyz', shortDescription: 'Evening walks with the family.', description: 'A nightly 20-minute walk together.', dailyTask: 'Take an evening walk.', visibility: 'PRIVATE', isActive: true, createdAt: '2026-05-23T18:00:00.000Z', creatorId: 'usr-2', creatorName: 'Bob Smith', creatorEmail: 'bob.smith@hotmail.com', joinedCount: 3, inviteCount: 3 },
];

export const mockChatMessages: ChatMessageRow[] = [
  { id: 'cm-1', kind: 'PRESET', presetCode: 'KEEP_GOING', body: null, createdAt: '2026-05-24T12:00:00.000Z', challengeId: 'cc-1', challengeTitle: '21-Day No Soda', userId: 'usr-1', userName: 'Alice Jones' },
  { id: 'cm-2', kind: 'CELEBRATION', presetCode: null, body: 'Crushed day 5!', createdAt: '2026-05-24T13:30:00.000Z', challengeId: 'cc-1', challengeTitle: '21-Day No Soda', userId: 'usr-2', userName: 'Bob Smith' },
];

export const mockFriendships: FriendshipRow[] = [
  { id: 'fr-1', status: 'ACCEPTED', createdAt: '2026-05-22T09:00:00.000Z', respondedAt: '2026-05-22T10:00:00.000Z', requesterId: 'usr-1', requesterName: 'Alice Jones', recipientId: 'usr-2', recipientName: 'Bob Smith' },
  { id: 'fr-2', status: 'PENDING', createdAt: '2026-05-24T09:00:00.000Z', respondedAt: null, requesterId: 'usr-3', requesterName: 'Charlie Brown', recipientId: 'usr-1', recipientName: 'Alice Jones' },
];

export const mockContactSubmissions: ContactSubmissionRow[] = [
  { id: 'cs-1', name: 'Grace Hopper', email: 'grace@example.com', message: 'Love the app! Any plans for an Android widget?', ipAddress: '203.0.113.5', resolvedAt: null, createdAt: '2026-05-25T11:00:00.000Z' },
  { id: 'cs-2', name: 'Alan Turing', email: 'alan@example.com', message: 'I was charged twice for premium.', ipAddress: '203.0.113.9', resolvedAt: '2026-05-24T15:00:00.000Z', createdAt: '2026-05-24T08:00:00.000Z' },
];
