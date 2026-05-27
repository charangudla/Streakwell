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

  console.log('');
  console.log('✅ Done. Sign in with:');
  console.log(`   email:    ${TEST_EMAIL}`);
  console.log(`   password: ${TEST_PASSWORD}`);
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
