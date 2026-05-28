/* eslint-disable no-console */
/**
 * ============================================================================
 *  Vital30 — milestone test-user seed
 * ============================================================================
 *  Creates a single, well-known test account with FOUR challenges parked at
 *  the four milestone boundaries so you can:
 *    • see today's progress card / share image at each celebration tier
 *      (Week 1, Week 2, Week 3, Challenge complete)
 *    • tap any PAST cell on the calendar to test the edit-decision flow
 *      (every challenge has 7+ completed days behind "today")
 *
 *  Login credentials are printed at the end. Re-running the script wipes
 *  this user's data and re-seeds — idempotent and destructive in equal
 *  measure, by design.
 *
 *  Run from the API directory:
 *      npm run seed:tester
 *
 *  Or directly:
 *      ts-node prisma/seed-tester.ts
 *
 *  Prerequisite: the main seed (`npm run prisma:seed`) must have run first
 *  so the catalog has 30-day challenges this script can pick from.
 * ============================================================================
 */
import {
  ChatMessageKind,
  CheckinStatus,
  FriendshipStatus,
  PrismaClient,
  UserChallengeStatus,
} from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const prisma = new PrismaClient();

// Minimal Better Auth instance — same shape as prisma/seed.ts so the
// password hash lands in the Account table with the algorithm the
// production server verifies against.
const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'seed_only_placeholder_secret_replace_in_real_env',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});

const TEST_EMAIL = 'milestone-tester@vital30.com';
const TEST_PASSWORD = 'TesterVital30!';
const TEST_NAME = 'Milestone Tester';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Companion test users for the chat + friends features. All share the
 * same password as the primary milestone tester (TesterVital30!) so
 * a manual test can rotate between them quickly. They join the same
 * "community shared" challenge as the milestone tester so they all
 * appear in each other's Members sheet.
 *
 * Friendships are seeded against the primary tester so opening the
 * Members sheet as `milestone-tester@vital30.com` shows ALL FOUR
 * friend-button states in a single screen:
 *   alice    ACCEPTED         → "✓ Friend"
 *   bob      pending_received → "Accept ✓"  (he sent you a request)
 *   charlie  pending_sent     → "Pending"   (you sent him a request)
 *   diana    none             → "+ Add friend"
 */
interface CompanionSpec {
  email: string;
  password: string;
  name: string;
  /** Instagram-style handle (lowercase, unique). */
  username: string;
  /** Sample E.164 phone — uses 555-0xxx prefix (US fictional range). */
  phone: string;
  /** Today's check-in status on the shared challenge. null = not in yet. */
  todayStatus: CheckinStatus | null;
  /** Friendship state relative to the primary tester. */
  friendshipWithTester:
    | { kind: 'ACCEPTED' }
    | { kind: 'PENDING_FROM_THEM' } // they sent the tester a request
    | { kind: 'PENDING_FROM_TESTER' } // the tester sent them a request
    | { kind: 'NONE' };
}

const COMPANIONS: CompanionSpec[] = [
  {
    email: 'alice@vital30.com',
    password: TEST_PASSWORD,
    name: 'Alice Companion',
    username: 'alice',
    phone: '+15550100001',
    todayStatus: CheckinStatus.COMPLETED,
    friendshipWithTester: { kind: 'ACCEPTED' },
  },
  {
    email: 'bob@vital30.com',
    password: TEST_PASSWORD,
    name: 'Bob Companion',
    username: 'bob',
    phone: '+15550100002',
    todayStatus: CheckinStatus.MISSED,
    friendshipWithTester: { kind: 'PENDING_FROM_THEM' },
  },
  {
    email: 'charlie@vital30.com',
    password: TEST_PASSWORD,
    name: 'Charlie Companion',
    username: 'charlie',
    phone: '+15550100003',
    todayStatus: null,
    friendshipWithTester: { kind: 'PENDING_FROM_TESTER' },
  },
  {
    email: 'diana@vital30.com',
    password: TEST_PASSWORD,
    name: 'Diana Companion',
    username: 'diana',
    phone: '+15550100004',
    todayStatus: CheckinStatus.SKIPPED,
    friendshipWithTester: { kind: 'NONE' },
  },
];

/**
 * A handful of preset chat messages from different companions so the
 * shared channel isn't empty on first load. Order = chronological
 * insertion; reactions reference each by index.
 */
interface SeedChatPost {
  /** Index into COMPANIONS, OR the literal "TESTER" for the primary. */
  authorIdx: number | 'TESTER';
  presetCode: string;
  /** How many minutes ago to backdate this message. */
  minutesAgo: number;
  /** Reactions: list of (reactor, emoji) tuples. */
  reactions: Array<{ reactor: number | 'TESTER'; emoji: string }>;
}

const CHAT_SCRIPT: SeedChatPost[] = [
  {
    authorIdx: 0, // Alice
    presetCode: 'DONE_TODAY',
    minutesAgo: 240,
    reactions: [
      { reactor: 'TESTER', emoji: 'fire' },
      { reactor: 1, emoji: 'muscle' },
    ],
  },
  {
    authorIdx: 1, // Bob
    presetCode: 'MISSED_TODAY',
    minutesAgo: 180,
    reactions: [
      { reactor: 0, emoji: 'praying' },
      { reactor: 3, emoji: 'praying' },
      { reactor: 'TESTER', emoji: 'love' },
    ],
  },
  {
    authorIdx: 3, // Diana
    presetCode: 'KEEP_GOING',
    minutesAgo: 90,
    reactions: [{ reactor: 0, emoji: 'celebrate' }],
  },
  {
    authorIdx: 2, // Charlie
    presetCode: 'NEED_MOTIVATION',
    minutesAgo: 30,
    reactions: [
      { reactor: 'TESTER', emoji: 'muscle' },
      { reactor: 0, emoji: 'muscle' },
    ],
  },
  {
    authorIdx: 0, // Alice
    presetCode: 'BURNED_IT',
    minutesAgo: 10,
    reactions: [
      { reactor: 'TESTER', emoji: 'fire' },
      { reactor: 1, emoji: 'fire' },
      { reactor: 3, emoji: 'celebrate' },
    ],
  },
  {
    authorIdx: 'TESTER',
    presetCode: 'GRATEFUL',
    minutesAgo: 4,
    reactions: [
      { reactor: 0, emoji: 'love' },
      { reactor: 3, emoji: 'love' },
    ],
  },
];

/**
 * Three flavours of seed entry, all 30-day plans:
 *
 *   kind === 'active'    — today === plan.day, days 1..day are COMPLETED,
 *                          status stays ACTIVE so the cells are editable.
 *                          Used for the week-milestone celebration tests.
 *   kind === 'completed' — challenge finished `endedDaysAgo` days ago. We
 *                          stamp endDate = today - endedDaysAgo, startDate =
 *                          endDate - 29 days, and write 30 COMPLETED cells.
 *                          Lands under /my-challenges → Completed →
 *                          monthly bucket matching endDate's month.
 *   kind === 'abandoned' — user gave up `endedDaysAgo` days ago after
 *                          completing the first `completedBefore` days of a
 *                          full 30-day plan. startDate is 29 days before
 *                          endDate (so the calendar shows the unfilled
 *                          tail). Lands under Abandoned → monthly bucket.
 */
type ActivePlan = {
  kind: 'active';
  day: number;
  /**
   * How many days of check-ins to write. Defaults to `day` so today
   * is checked in (the milestone-celebration tests need this). Set
   * BELOW `day` to leave today unchecked — useful for testing the
   * dashboard's "Check in today" color variant.
   */
  completedDays?: number;
  expectation: string;
};
type CompletedPlan = {
  kind: 'completed';
  endedDaysAgo: number;
  expectation: string;
};
type AbandonedPlan = {
  kind: 'abandoned';
  endedDaysAgo: number;
  completedBefore: number;
  expectation: string;
};
type SeedPlan = ActivePlan | CompletedPlan | AbandonedPlan;

// Active plans hit the milestone celebration banners:
//   day === 7   → "1 week strong!"
//   day === 14  → "2 weeks strong!"
//   day === 21  → "3 weeks strong!"
// Completed plans span FIVE different months so the new Completed
// "Month YYYY" bucketing on /my-challenges has visible structure
// (today's month + 4 calendar months back, crossing the year boundary).
// Abandoned plans live in two different months with different
// completion percentages so the progress bars vary.
const PLANS: SeedPlan[] = [
  // ── Active milestone tests ────────────────────────────────────────────
  {
    kind: 'active',
    day: 7,
    expectation:
      'Week 1 milestone — banner: "1 week strong!" · 7 completed cells · 23 upcoming',
  },
  {
    kind: 'active',
    day: 14,
    expectation:
      'Week 2 milestone — banner: "2 weeks strong!" · 14 completed · 16 upcoming',
  },
  {
    kind: 'active',
    day: 21,
    expectation:
      'Week 3 milestone — banner: "3 weeks strong!" · 21 completed · 9 upcoming',
  },
  {
    kind: 'active',
    day: 4,
    completedDays: 3,
    expectation:
      'Day 4 active, today NOT yet checked in — dashboard card shows the brand-green "Check in today →" variant with the pulsing amber dot (the other 3 actives are in the "done" calmer green variant for contrast)',
  },

  // ── Completed across five buckets ─────────────────────────────────────
  {
    kind: 'completed',
    endedDaysAgo: 0,
    expectation:
      'Completed TODAY — current-month bucket — share card shows "Challenge complete!"',
  },
  {
    kind: 'completed',
    endedDaysAgo: 35,
    expectation: 'Completed ~5 weeks ago — last-month bucket',
  },
  {
    kind: 'completed',
    endedDaysAgo: 70,
    expectation: 'Completed ~10 weeks ago — two-months-back bucket',
  },
  {
    kind: 'completed',
    endedDaysAgo: 100,
    expectation: 'Completed ~14 weeks ago — three-months-back bucket',
  },
  {
    kind: 'completed',
    endedDaysAgo: 150,
    expectation:
      'Completed ~5 months ago — crosses the year boundary into the previous year bucket',
  },

  // ── Abandoned across two buckets ──────────────────────────────────────
  {
    kind: 'abandoned',
    endedDaysAgo: 40,
    completedBefore: 12,
    expectation:
      'Abandoned ~1 month ago after 12/30 days — Abandoned section, last-month bucket',
  },
  {
    kind: 'abandoned',
    endedDaysAgo: 125,
    completedBefore: 3,
    expectation:
      'Abandoned ~4 months ago after only 3/30 days — early-quit example',
  },
];

async function main() {
  console.log('🌱 Seeding milestone test user…');

  // ─────────────────────────────────────────────────────────────────────
  // 1. Wipe + recreate the primary test user AND all companions.
  //    User has onDelete: Cascade on UserChallenge, Account, Session,
  //    ChallengeChatMessage, ChatReaction, ChallengeFriendship etc.
  //    so deleting clears every trace of the previous run.
  // ─────────────────────────────────────────────────────────────────────
  const allEmails = [TEST_EMAIL, ...COMPANIONS.map((c) => c.email)];
  for (const email of allEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`  · removing existing user ${email}`);
      await prisma.user.delete({ where: { id: existing.id } });
    }
  }

  console.log('  · creating primary tester via Better Auth signUpEmail');
  await auth.api.signUpEmail({
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
    },
  });
  const user = await prisma.user.update({
    where: { email: TEST_EMAIL },
    data: {
      emailVerified: true,
      username: 'milestone_tester',
      phone: '+15550100000',
      // Onboarding data so the dashboard "Recommended for you" lane
      // shows personalised (goal-scored) results out of the box.
      // BUILD_FITNESS maps to the fitness-movement category in the
      // recommender. onboardingCompletedAt set so they're treated as
      // a finished-onboarding user.
      primaryGoal: 'BUILD_FITNESS',
      dailyMinutes: 30,
      onboardingCompletedAt: new Date(),
    },
  });

  // Create the 4 companions up front so their user IDs are available
  // when we wire friendships + chat messages below.
  const companions: Array<{
    spec: CompanionSpec;
    id: string;
  }> = [];
  for (const spec of COMPANIONS) {
    console.log(`  · creating companion ${spec.email}`);
    await auth.api.signUpEmail({
      body: { email: spec.email, password: spec.password, name: spec.name },
    });
    const created = await prisma.user.update({
      where: { email: spec.email },
      data: {
        emailVerified: true,
        username: spec.username,
        phone: spec.phone,
      },
    });
    companions.push({ spec, id: created.id });
  }

  // ─────────────────────────────────────────────────────────────────────
  // 2. Pick PLANS.length distinct 30-day PUBLIC challenges.
  //    Take the first N from the catalog (sorted by createdAt for
  //    stability). We don't bother trying to spread across categories
  //    here — with 10 picks across the ~6 categories, we'd run out of
  //    distinct categories anyway. Distinct challenge IDs is enough.
  // ─────────────────────────────────────────────────────────────────────
  const allCandidates = await prisma.challenge.findMany({
    where: {
      durationDays: 30,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true },
  });
  if (allCandidates.length < PLANS.length) {
    throw new Error(
      `Need at least ${PLANS.length} 30-day challenges in the catalog; found ${allCandidates.length}. ` +
        'Run `npm run prisma:seed` first to populate the catalog.',
    );
  }
  const picked = allCandidates.slice(0, PLANS.length);

  // ─────────────────────────────────────────────────────────────────────
  // 3. Create each UserChallenge + backfill its check-ins per the plan
  //    kind. Resolve(plan) hands back the four pieces we need: when the
  //    challenge ran, what status it's in now, and how many completed
  //    cells to write.
  // ─────────────────────────────────────────────────────────────────────
  const todayUtc = startOfUtcDay(new Date());

  for (let i = 0; i < PLANS.length; i += 1) {
    const plan = PLANS[i];
    const challenge = picked[i];
    const resolved = resolvePlan(plan, todayUtc);

    const uc = await prisma.userChallenge.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        status: resolved.status,
        startDate: resolved.startDate,
        endDate: resolved.endDate,
      },
    });

    if (resolved.completedDays > 0) {
      const rows = Array.from(
        { length: resolved.completedDays },
        (_, dayIdx) => ({
          userChallengeId: uc.id,
          checkinDate: new Date(
            resolved.startDate.getTime() + dayIdx * DAY_MS,
          ),
          status: CheckinStatus.COMPLETED,
        }),
      );
      await prisma.dailyCheckin.createMany({ data: rows });
    }

    const tag =
      plan.kind === 'active'
        ? `Active · Day ${plan.day.toString().padStart(2, ' ')}`
        : plan.kind === 'completed'
          ? `Completed · ended ${plan.endedDaysAgo.toString().padStart(3, ' ')} days ago`
          : `Abandoned · ended ${plan.endedDaysAgo.toString().padStart(3, ' ')} days ago`;
    console.log(`  ✓ ${tag} · ${challenge.title}`);
    console.log(`      ${plan.expectation}`);
  }

  // ─────────────────────────────────────────────────────────────────────
  // 4. Companion users: join the SHARED challenge (the Day-7 active
  //    one) so they appear in each other's Members sheet + chat poll.
  //    The shared challenge is the first 30-day active plan; PLANS[0]
  //    is the Day-7 milestone, so picked[0] is what tester joined for
  //    that. We piggyback on tester's UC.startDate so everyone is on
  //    the same calendar day.
  // ─────────────────────────────────────────────────────────────────────
  const sharedChallenge = picked[0];
  console.log('');
  console.log(`Seeding shared challenge "${sharedChallenge.title}" for community testing:`);
  for (const c of companions) {
    const sharedStart = new Date(todayUtc.getTime() - 6 * DAY_MS); // Day 7 today
    const uc = await prisma.userChallenge.create({
      data: {
        userId: c.id,
        challengeId: sharedChallenge.id,
        status: UserChallengeStatus.ACTIVE,
        startDate: sharedStart,
      },
    });
    // Each companion: 6 prior completed days (days 1-6) so progress
    // looks lived-in, plus today's row matching their todayStatus.
    const rows: Array<{
      userChallengeId: string;
      checkinDate: Date;
      status: CheckinStatus;
    }> = [];
    for (let i = 0; i < 6; i += 1) {
      rows.push({
        userChallengeId: uc.id,
        checkinDate: new Date(sharedStart.getTime() + i * DAY_MS),
        status: CheckinStatus.COMPLETED,
      });
    }
    if (c.spec.todayStatus) {
      rows.push({
        userChallengeId: uc.id,
        checkinDate: todayUtc,
        status: c.spec.todayStatus,
      });
    }
    await prisma.dailyCheckin.createMany({ data: rows });
    console.log(
      `   ✓ ${c.spec.name.padEnd(18)} today=${c.spec.todayStatus ?? 'NULL'}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // 5. Friendship rows — one per friend-button state so the tester
  //    sees all 4 states in the Members sheet on a single open.
  // ─────────────────────────────────────────────────────────────────────
  console.log('');
  console.log('Seeding friendships (relative to milestone-tester):');
  for (const c of companions) {
    const kind = c.spec.friendshipWithTester.kind;
    if (kind === 'NONE') {
      console.log(`   · ${c.spec.name.padEnd(18)} → none ("+ Add friend" available)`);
      continue;
    }
    if (kind === 'ACCEPTED') {
      // tester requested, companion accepted
      await prisma.challengeFriendship.create({
        data: {
          requesterId: user.id,
          recipientId: c.id,
          status: FriendshipStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });
      console.log(`   ✓ ${c.spec.name.padEnd(18)} → ACCEPTED ("✓ Friend")`);
    } else if (kind === 'PENDING_FROM_THEM') {
      await prisma.challengeFriendship.create({
        data: {
          requesterId: c.id,
          recipientId: user.id,
          status: FriendshipStatus.PENDING,
        },
      });
      console.log(`   ✓ ${c.spec.name.padEnd(18)} → PENDING from them ("Accept ✓")`);
    } else {
      await prisma.challengeFriendship.create({
        data: {
          requesterId: user.id,
          recipientId: c.id,
          status: FriendshipStatus.PENDING,
        },
      });
      console.log(`   ✓ ${c.spec.name.padEnd(18)} → PENDING from tester ("Pending")`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 6. Chat messages + reactions on the shared challenge so the
  //    /chat/[shared] window has a real-feeling thread on first
  //    open. Backdated via createdAt so the thread runs chronologically
  //    when sorted oldest→newest in the UI.
  // ─────────────────────────────────────────────────────────────────────
  console.log('');
  console.log('Seeding chat thread on shared challenge:');
  const now = new Date();
  for (const post of CHAT_SCRIPT) {
    const authorId =
      post.authorIdx === 'TESTER'
        ? user.id
        : companions[post.authorIdx].id;
    const created = new Date(now.getTime() - post.minutesAgo * 60_000);
    const msg = await prisma.challengeChatMessage.create({
      data: {
        challengeId: sharedChallenge.id,
        userId: authorId,
        kind: ChatMessageKind.PRESET,
        presetCode: post.presetCode,
        createdAt: created,
      },
    });
    for (const r of post.reactions) {
      const reactorId =
        r.reactor === 'TESTER' ? user.id : companions[r.reactor].id;
      // Skip if reactor === author (Prisma will accept it but it's
      // weird UX-wise — you don't react to your own messages).
      if (reactorId === authorId) continue;
      await prisma.chatReaction.create({
        data: {
          messageId: msg.id,
          userId: reactorId,
          emoji: r.emoji,
        },
      });
    }
    const authorName =
      post.authorIdx === 'TESTER'
        ? TEST_NAME
        : companions[post.authorIdx].spec.name;
    console.log(
      `   ✓ ${post.minutesAgo.toString().padStart(4, ' ')}m ago · ${authorName.padEnd(18)} · ${post.presetCode} (${post.reactions.length} reactions)`,
    );
  }

  console.log('');
  console.log('✅ Done. All accounts share the same password:');
  console.log(`   password: ${TEST_PASSWORD}`);
  console.log('');
  console.log('Primary (10 challenges, all 4 friend states visible in chat):');
  console.log(`   • ${TEST_EMAIL}   (${TEST_NAME})`);
  console.log('');
  console.log('Companions (joined the shared "Day 7" challenge so they appear in each other\'s Members + chat):');
  for (const c of COMPANIONS) {
    const fs = {
      ACCEPTED: 'already friends with tester',
      PENDING_FROM_THEM: 'has sent tester a friend request — Accept ✓ on members sheet, also on tester\'s /friends inbox',
      PENDING_FROM_TESTER: 'tester sent them a request — Accept ✓ visible when they log in',
      NONE: '"+ Add friend" available from tester (no relation yet)',
    }[c.friendshipWithTester.kind];
    console.log(`   • ${c.email.padEnd(28)} (${c.name})`);
    console.log(`        today: ${c.todayStatus ?? 'not in yet'}, friendship: ${fs}`);
  }
  console.log('');
  console.log('Where to look:');
  console.log(
    '   /dashboard         → 4 active in a 2x2 grid + "Add more challenges →" CTA',
  );
  console.log(
    '                     · 3 cards in the "done" green-tint variant (Day 7/14/21 checked in)',
  );
  console.log(
    '                     · 1 card in the "Check in today" bright variant w/ amber pulse (Day 4 unchecked)',
  );
  console.log(
    '                     · Stats tiles: Active 4 · Completed 5 — both tap into /my-challenges#...',
  );
  console.log(
    '   /challenges        → "Your challenges" carousel of the 4 active',
  );
  console.log(
    '   /my-challenges     → 4 under Active (Day 7 / 14 / 21 / 4) — flat grid',
  );
  console.log(
    '                     · 5 under Completed across 5 month buckets',
  );
  console.log('                     · 2 under Abandoned across 2 month buckets');
  console.log(
    '   /my-challenges/[id]/progress → calendar + share card (one per challenge)',
  );
  console.log('');
  console.log('What to test:');
  console.log(
    '   • Open each ACTIVE progress page → tap "Share your progress" → see the milestone banner',
  );
  console.log(
    '   • Tap a past calendar cell on an ACTIVE challenge → modal opens in edit mode',
  );
  console.log(
    '   • Pick a different status, tap Done → calendar cell colour changes immediately',
  );
  console.log(
    '   • Open Completed/Abandoned cards → see bucketing by "Month YYYY" subheading',
  );
  console.log(
    '   • On Completed Today\'s card → share card shows "Challenge complete!" milestone banner',
  );
  console.log('');
  console.log('   Community chat + friends (sign in as milestone-tester first):');
  console.log(
    '   • 💬 icon in header → /chat → tap the shared challenge → see seeded thread (6 messages, reactions live)',
  );
  console.log(
    '   • Chat header: "5 members" + summary chips (✓ ✗ ⌀ ◯) → tap "Members" → all 4 friend states visible',
  );
  console.log(
    '   • Tap "+ Add friend" on Diana → sign in as diana@vital30.com → /friends → Accept → log back in as tester to see "✓ Friend"',
  );
  console.log(
    '   • Tap "Accept ✓" on Bob in members sheet → friend request resolved without leaving chat',
  );
  console.log(
    '   • Tap "Invite" next to Alice (already friend) → pick one of your custom challenges → sign in as alice@vital30.com → /invites → accept',
  );
  console.log(
    '   • Sign in as charlie@vital30.com → /friends → see milestone-tester\'s incoming request → accept or decline',
  );
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

interface ResolvedPlan {
  startDate: Date;
  endDate: Date | null;
  status: UserChallengeStatus;
  /** Number of COMPLETED check-ins to write starting at startDate. */
  completedDays: number;
}

/**
 * Turn a SeedPlan into the four concrete pieces the create loop needs.
 * Math derivations:
 *
 *   active:    today === plan.day  ⇒  startDate = todayUtc - (day-1)*DAY
 *              status ACTIVE, all `day` cells COMPLETED.
 *
 *   completed: endDate = todayUtc - endedDaysAgo*DAY
 *              startDate = endDate - 29*DAY (30-day plan ends ON the
 *                          30th day so startDate is 29 days before)
 *              status COMPLETED, all 30 cells COMPLETED.
 *
 *   abandoned: endDate = todayUtc - endedDaysAgo*DAY (when they gave up)
 *              startDate = endDate - 29*DAY (full 30-day plan, didn't
 *                          finish — the abandoned tail stays unfilled)
 *              status ABANDONED, first `completedBefore` cells COMPLETED.
 */
function resolvePlan(plan: SeedPlan, todayUtc: Date): ResolvedPlan {
  if (plan.kind === 'active') {
    const startDate = new Date(
      todayUtc.getTime() - (plan.day - 1) * DAY_MS,
    );
    return {
      startDate,
      endDate: null,
      status: UserChallengeStatus.ACTIVE,
      completedDays: plan.completedDays ?? plan.day,
    };
  }
  if (plan.kind === 'completed') {
    const endDate = new Date(
      todayUtc.getTime() - plan.endedDaysAgo * DAY_MS,
    );
    const startDate = new Date(endDate.getTime() - 29 * DAY_MS);
    return {
      startDate,
      endDate,
      status: UserChallengeStatus.COMPLETED,
      completedDays: 30,
    };
  }
  // abandoned
  const endDate = new Date(todayUtc.getTime() - plan.endedDaysAgo * DAY_MS);
  const startDate = new Date(endDate.getTime() - 29 * DAY_MS);
  return {
    startDate,
    endDate,
    status: UserChallengeStatus.ABANDONED,
    completedDays: plan.completedBefore,
  };
}

main()
  .catch((err) => {
    console.error('💥 Test-user seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
