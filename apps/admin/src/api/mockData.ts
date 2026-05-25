import type { UserRole } from '../routing/AuthProvider';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationDays: number;
  difficulty: 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD';
  dailyTask: string;
  benefits: string[];
  safetyNote?: string;
  isPopular: boolean;
  isRecommended: boolean;
  isActive: boolean;
  categoryId: string;
  createdAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface MockUserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startDate: string;
  endDate?: string;
  progressPercent: number;
  createdAt: string;
}

export interface MockDailyCheckin {
  id: string;
  userChallengeId: string;
  checkinDate: string;
  status: 'COMPLETED' | 'MISSED' | 'SKIPPED';
  notes?: string;
  createdAt: string;
}

export interface MockShareEvent {
  id: string;
  userId: string;
  type: 'CHALLENGE_INVITE' | 'DAILY_PROGRESS' | 'COMPLETION';
  platform?: string;
  payload?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  createdAt: string;
}

export interface ShareEventWithDetails extends MockShareEvent {
  userName: string;
  userEmail: string;
}

// 6 Core Categories seeded in database
export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Diet & Nutrition', slug: 'diet-nutrition', description: 'Fuel your body with wholesome, nutrient-dense foods.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'cat-2', name: 'Fitness & Movement', slug: 'fitness-movement', description: 'Strengthen your heart and body through daily exercise.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'cat-3', name: 'Mental Wellness', slug: 'mental-wellness', description: 'Calm your mind, improve focus, and develop resilience.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'cat-4', name: 'Sleep & Recovery', slug: 'sleep-recovery', description: 'Optimize your rest periods to promote cell repair.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'cat-5', name: 'Break Bad Habits', slug: 'break-bad-habits', description: 'Overcome self-limiting habits and mindless scrolling.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'cat-6', name: 'Family Wellness', slug: 'family-wellness', description: 'Connect with loved ones and establish group habits.', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
];

// Highlight challenges matching seed list
export const mockChallenges: Challenge[] = [
  {
    id: 'ch-1',
    title: 'No Refined Sugar',
    slug: 'no-refined-sugar',
    shortDescription: 'Cut out all processed sugars and artificial sweeteners.',
    description: 'Remove refined sugars from your meals and drinks. Focus on getting clean, sustained energy.',
    durationDays: 30,
    difficulty: 'MEDIUM',
    dailyTask: 'Check labels and consume 0 grams of added or refined sugars today.',
    benefits: ['Reduced inflammation', 'Stabilized insulin', 'Fewer sweet cravings'],
    safetyNote: 'If you have type 1 or type 2 diabetes, consult your doctor before modifying sugar intake.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-1',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-2',
    title: 'Hydration Hero',
    slug: 'hydration-hero',
    shortDescription: 'Drink 3 liters of pure water every day.',
    description: 'Proper hydration is vital for every cell in your body. Carry a water bottle and track your intake.',
    durationDays: 30,
    difficulty: 'BEGINNER',
    dailyTask: 'Drink a minimum of 3 liters (approx. 100 oz) of water.',
    benefits: ['Clearer skin texture', 'Boosted physical performance', 'Reduced headaches'],
    safetyNote: 'Individuals with congestive heart failure or kidney disease should adjust fluid goals with their physician.',
    isPopular: true,
    isRecommended: false,
    isActive: true,
    categoryId: 'cat-1',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-3',
    title: 'Daily 10k Steps',
    slug: 'daily-10k-steps',
    shortDescription: 'Walk at least 10,000 steps every single day.',
    description: 'Combat sedentary modern life. Increase non-exercise activity thermogenesis (NEAT) by logging 10,000 steps.',
    durationDays: 30,
    difficulty: 'EASY',
    dailyTask: 'Walk a total of 10,000 steps.',
    benefits: ['Strengthened cardiovascular system', 'Increased daily calorie burn', 'Better joint health'],
    safetyNote: 'Wear supportive athletic shoes to avoid foot pain or blisters.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-2',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-4',
    title: 'Morning Mobility Stretch',
    slug: 'morning-mobility-stretch',
    shortDescription: 'Spend 15 minutes stretching your muscles upon waking.',
    description: 'Start your morning with fluidity. Loosen tight hips, hamstrings, and shoulders with a dynamic mobility sequence.',
    durationDays: 30,
    difficulty: 'BEGINNER',
    dailyTask: 'Complete 15 minutes of full-body dynamic stretching.',
    benefits: ['Increased range of joint motion', 'Stimulated blood flow', 'Alleviated muscular stiffness'],
    safetyNote: 'Perform gentle, slow stretches; never bounce or force a joint.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-2',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-5',
    title: 'Daily Gratitude Journal',
    slug: 'daily-gratitude-journal',
    shortDescription: 'Write down three unique things you are grateful for.',
    description: 'Shift your mindset toward abundance. Every morning or evening, write down three specific, detailed things that brought you joy.',
    durationDays: 30,
    difficulty: 'BEGINNER',
    dailyTask: 'Write 3 unique gratitude points in a journal.',
    benefits: ['Rewires brain to focus on positives', 'Decreases anxiety and self-doubt'],
    safetyNote: 'Focus on authentic, small details rather than broad generalizations.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-3',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-6',
    title: 'Mindful Meditation',
    slug: 'mindful-meditation',
    shortDescription: 'Meditate quietly for 10 minutes.',
    description: 'Cultivate presence. Sit in a comfortable position, close your eyes, and focus strictly on your breathing.',
    durationDays: 30,
    difficulty: 'MEDIUM',
    dailyTask: 'Sit in silent or guided meditation for 10 minutes today.',
    benefits: ['Enriched emotional regulation', 'Better attention span and focus'],
    safetyNote: 'If sitting upright is painful, it is acceptable to lie down, provided you remain awake.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-3',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'ch-7',
    title: 'Early Bird Bedtime',
    slug: 'early-bird-bedtime',
    shortDescription: 'Be in bed with lights out by 10:30 PM.',
    description: 'Sync with your natural circadian rhythm. Prepare your body for rest and aim to fall asleep by 10:30 PM.',
    durationDays: 30,
    difficulty: 'MEDIUM',
    dailyTask: 'Turn off all room lights and lie in bed by 10:30 PM.',
    benefits: ['Optimized release of growth hormone', 'Waking up refreshed without alarms'],
    safetyNote: 'If you work night shifts, adjust your target time to maintain a consistent 8-hour sleep block.',
    isPopular: true,
    isRecommended: true,
    isActive: true,
    categoryId: 'cat-4',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
];

// Seed other challenges as minimal items to satisfy "at least 40 starter challenges" requirements
for (let i = 8; i <= 40; i++) {
  const catIndex = (i % 6) + 1;
  const difficulties: Array<'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD'> = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD'];
  mockChallenges.push({
    id: `ch-${i}`,
    title: `Starter Challenge #${i}`,
    slug: `starter-challenge-${i}`,
    shortDescription: `Brief guidelines for starter challenge #${i}`,
    description: `A detailed description outlining wellness strategies for starter challenge #${i}. Perform daily tasks to secure streaks.`,
    durationDays: 30,
    difficulty: difficulties[i % 4],
    dailyTask: `Complete the routine assigned for day #${i}`,
    benefits: ['General physical wellness', 'Established structural habit'],
    safetyNote: 'Always execute physical activities under controlled paces and consult professional specialists if unsure.',
    isPopular: i % 7 === 0,
    isRecommended: i % 8 === 0,
    isActive: true,
    categoryId: `cat-${catIndex}`,
    createdAt: '2026-05-20T00:00:00.000Z',
  });
}

// Mock User listings
export const mockUsers: MockUser[] = [
  { id: 'usr-1', email: 'alice.jones@gmail.com', name: 'Alice Jones', role: 'USER', isActive: true, createdAt: '2026-05-21T08:12:00.000Z' },
  { id: 'usr-2', email: 'bob.smith@hotmail.com', name: 'Bob Smith', role: 'USER', isActive: true, createdAt: '2026-05-21T10:14:00.000Z' },
  { id: 'usr-3', email: 'charlie.brown@yahoo.com', name: 'Charlie Brown', role: 'USER', isActive: true, createdAt: '2026-05-22T07:15:00.000Z' },
  { id: 'usr-4', email: 'diana.prince@outlook.com', name: 'Diana Prince', role: 'USER', isActive: false, createdAt: '2026-05-22T14:32:00.000Z' },
  { id: 'usr-5', email: 'evan.wright@icloud.com', name: 'Evan Wright', role: 'USER', isActive: true, createdAt: '2026-05-23T11:45:00.000Z' },
  { id: 'usr-6', email: 'superadmin@vital30.com', name: 'Vital30 Super Admin', role: 'SUPER_ADMIN', isActive: true, createdAt: '2026-05-20T00:00:00.000Z' },
];

// Mock User Joined Challenges
export const mockUserChallenges: MockUserChallenge[] = [
  { id: 'uc-1', userId: 'usr-1', challengeId: 'ch-1', status: 'ACTIVE', startDate: '2026-05-21T00:00:00.000Z', progressPercent: 40, createdAt: '2026-05-21T08:30:00.000Z' },
  { id: 'uc-2', userId: 'usr-1', challengeId: 'ch-3', status: 'COMPLETED', startDate: '2026-04-20T00:00:00.000Z', endDate: '2026-05-20T00:00:00.000Z', progressPercent: 100, createdAt: '2026-04-20T09:12:00.000Z' },
  { id: 'uc-3', userId: 'usr-2', challengeId: 'ch-1', status: 'ACTIVE', startDate: '2026-05-22T00:00:00.000Z', progressPercent: 30, createdAt: '2026-05-22T10:15:00.000Z' },
  { id: 'uc-4', userId: 'usr-2', challengeId: 'ch-2', status: 'ABANDONED', startDate: '2026-05-21T00:00:00.000Z', progressPercent: 10, createdAt: '2026-05-21T10:20:00.000Z' },
  { id: 'uc-5', userId: 'usr-3', challengeId: 'ch-5', status: 'ACTIVE', startDate: '2026-05-23T00:00:00.000Z', progressPercent: 20, createdAt: '2026-05-23T08:00:00.000Z' },
  { id: 'uc-6', userId: 'usr-5', challengeId: 'ch-7', status: 'ACTIVE', startDate: '2026-05-24T00:00:00.000Z', progressPercent: 10, createdAt: '2026-05-24T12:00:00.000Z' },
];

// Mock checkins per joined challenge
export const mockDailyCheckins: MockDailyCheckin[] = [
  // User challenge 1 checkins
  { id: 'ck-1', userChallengeId: 'uc-1', checkinDate: '2026-05-21', status: 'COMPLETED', notes: 'Feeling full of natural energy!', createdAt: '2026-05-21T20:00:00.000Z' },
  { id: 'ck-2', userChallengeId: 'uc-1', checkinDate: '2026-05-22', status: 'COMPLETED', notes: 'Almost ate a cookie, stayed strong!', createdAt: '2026-05-22T19:30:00.000Z' },
  { id: 'ck-3', userChallengeId: 'uc-1', checkinDate: '2026-05-23', status: 'SKIPPED', notes: 'Family reunion - skip allowed', createdAt: '2026-05-23T21:10:00.000Z' },
  { id: 'ck-4', userChallengeId: 'uc-1', checkinDate: '2026-05-24', status: 'COMPLETED', notes: 'No cravings today!', createdAt: '2026-05-24T18:00:00.000Z' },

  // User challenge 3 checkins
  { id: 'ck-5', userChallengeId: 'uc-3', checkinDate: '2026-05-22', status: 'COMPLETED', notes: 'Tough but worth it', createdAt: '2026-05-22T21:00:00.000Z' },
  { id: 'ck-6', userChallengeId: 'uc-3', checkinDate: '2026-05-23', status: 'MISSED', createdAt: '2026-05-23T23:59:59.000Z' },
  { id: 'ck-7', userChallengeId: 'uc-3', checkinDate: '2026-05-24', status: 'COMPLETED', notes: 'Back on track.', createdAt: '2026-05-24T20:15:00.000Z' },
];

// Mock Viral Share Events
export const mockShareEvents: MockShareEvent[] = [
  { id: 'se-1', userId: 'usr-1', type: 'DAILY_PROGRESS', platform: 'Twitter', payload: { challengeTitle: 'No Refined Sugar', day: 4 }, createdAt: '2026-05-24T18:15:00.000Z' },
  { id: 'se-2', userId: 'usr-1', type: 'COMPLETION', platform: 'Facebook', payload: { challengeTitle: 'Daily 10k Steps' }, createdAt: '2026-05-20T17:30:00.000Z' },
  { id: 'se-3', userId: 'usr-2', type: 'CHALLENGE_INVITE', platform: 'WhatsApp', payload: { inviteLink: 'http://vital30.com/join/ch-1' }, createdAt: '2026-05-22T11:00:00.000Z' },
  { id: 'se-4', userId: 'usr-3', type: 'DAILY_PROGRESS', platform: 'Instagram', payload: { challengeTitle: 'Daily Gratitude Journal', day: 2 }, createdAt: '2026-05-24T19:00:00.000Z' },
];
