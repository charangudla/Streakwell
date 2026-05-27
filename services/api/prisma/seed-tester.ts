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
import { CheckinStatus, PrismaClient, UserChallengeStatus } from '@prisma/client';
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

interface MilestonePlan {
  /** 1-based "today" day for this challenge. */
  day: number;
  /** Why this entry exists — printed to console for orientation. */
  expectation: string;
}

// One challenge per celebration tier. Days chosen so the share card's
// milestone detector fires the matching banner:
//
//    day === 7   → "1 week strong!"
//    day === 14  → "2 weeks strong!"
//    day === 21  → "3 weeks strong!"
//    day === 30  → "Challenge complete!" (latestCompletedDay === totalDays)
//
// All four challenges remain status=ACTIVE so the calendar cells stay
// editable for testing the change-decision flow. (The checkin service
// would auto-flip the 30-day one to COMPLETED if /checkins were POSTed,
// but we write directly via Prisma so the status stays put.)
const PLANS: MilestonePlan[] = [
  {
    day: 7,
    expectation:
      'Week 1 milestone — banner: "1 week strong!" · 7 completed cells · 23 upcoming',
  },
  {
    day: 14,
    expectation:
      'Week 2 milestone — banner: "2 weeks strong!" · 14 completed cells · 16 upcoming',
  },
  {
    day: 21,
    expectation:
      'Week 3 milestone — banner: "3 weeks strong!" · 21 completed cells · 9 upcoming',
  },
  {
    day: 30,
    expectation:
      'Month milestone — banner: "Challenge complete!" · all 30 cells filled',
  },
];

async function main() {
  console.log('🌱 Seeding milestone test user…');

  // ─────────────────────────────────────────────────────────────────────
  // 1. Wipe + recreate the test user.
  //    User has onDelete: Cascade on UserChallenge, Account, Session, etc.
  //    so this clears every trace of the previous run in one statement.
  // ─────────────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });
  if (existing) {
    console.log(`  · removing existing test user ${TEST_EMAIL}`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  console.log('  · creating test user via Better Auth signUpEmail');
  await auth.api.signUpEmail({
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
    },
  });
  const user = await prisma.user.update({
    where: { email: TEST_EMAIL },
    data: { emailVerified: true },
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. Pick 4 distinct 30-day ACTIVE PUBLIC challenges.
  //    We sort by createdAt so the picks are stable across runs against
  //    the same DB. Distinct categories make the dashboard view more
  //    varied, but if the catalog only has 30-day challenges in one
  //    category we still pick from that.
  // ─────────────────────────────────────────────────────────────────────
  const allCandidates = await prisma.challenge.findMany({
    where: {
      durationDays: 30,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, categoryId: true },
  });
  if (allCandidates.length < PLANS.length) {
    throw new Error(
      `Need at least ${PLANS.length} 30-day challenges in the catalog; found ${allCandidates.length}. ` +
        'Run `npm run prisma:seed` first to populate the catalog.',
    );
  }

  const seenCategories = new Set<string>();
  const picked: Array<{ id: string; title: string }> = [];
  for (const c of allCandidates) {
    if (picked.length === PLANS.length) break;
    if (seenCategories.has(c.categoryId)) continue;
    seenCategories.add(c.categoryId);
    picked.push({ id: c.id, title: c.title });
  }
  // Fall back to non-distinct picks if the catalog doesn't have enough
  // distinct categories with 30-day plans.
  while (picked.length < PLANS.length) {
    const next = allCandidates[picked.length];
    picked.push({ id: next.id, title: next.title });
  }

  // ─────────────────────────────────────────────────────────────────────
  // 3. Create each UserChallenge + backfill its check-ins so the dayN
  //    math lands exactly on the milestone.
  // ─────────────────────────────────────────────────────────────────────
  const todayUtc = startOfUtcDay(new Date());

  for (let i = 0; i < PLANS.length; i += 1) {
    const plan = PLANS[i];
    const challenge = picked[i];

    // startDate so that today === plan.day:
    //   dayNumber = floor((todayUtcMs - startUtcMs) / DAY_MS) + 1
    //   plan.day   = floor(N) + 1, so N = plan.day - 1
    //   startDate  = todayUtc - (plan.day - 1) * DAY_MS
    const startDate = new Date(todayUtc.getTime() - (plan.day - 1) * DAY_MS);

    // No progressPercent column — the API derives it at read time from
    // completedDays / durationDays. So the dashboard / carousel bars
    // will look right as soon as the user opens the page.
    const uc = await prisma.userChallenge.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        status: UserChallengeStatus.ACTIVE,
        startDate,
      },
    });

    // Backfill check-ins for days 1..plan.day, all COMPLETED so each
    // milestone is "freshly hit" (latestCompletedDay === plan.day).
    const rows = Array.from({ length: plan.day }, (_, dayIdx) => ({
      userChallengeId: uc.id,
      checkinDate: new Date(startDate.getTime() + dayIdx * DAY_MS),
      status: CheckinStatus.COMPLETED,
    }));
    await prisma.dailyCheckin.createMany({ data: rows });

    console.log(
      `  ✓ Day ${plan.day.toString().padStart(2, ' ')} · ${challenge.title}`,
    );
    console.log(`      ${plan.expectation}`);
  }

  console.log('');
  console.log('✅ Done. Sign in with:');
  console.log(`   email:    ${TEST_EMAIL}`);
  console.log(`   password: ${TEST_PASSWORD}`);
  console.log('');
  console.log('Where to look:');
  console.log('   /dashboard         → carousel of all four challenges');
  console.log('   /challenges        → "Your challenges" carousel at top');
  console.log('   /my-challenges     → grid of all four under Active');
  console.log(
    '   /my-challenges/[id]/progress → calendar + share card (one per challenge)',
  );
  console.log('');
  console.log('What to test:');
  console.log(
    '   • Open each progress page → tap "Share your progress" → see the milestone banner',
  );
  console.log(
    '   • Tap any past calendar cell → modal opens in edit mode with the current pick highlighted',
  );
  console.log(
    '   • Pick a different status, tap Done → calendar cell colour changes immediately',
  );
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

main()
  .catch((err) => {
    console.error('💥 Test-user seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
