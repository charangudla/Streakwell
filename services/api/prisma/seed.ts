import { PrismaClient, UserRole } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { categoriesData, challengesData } from './catalog-data';

const prisma = new PrismaClient();

// Minimal Better Auth instance for the seed: same DB, no email side effects.
// Production wiring lives in src/auth/auth.ts.
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
    // Same reason as src/auth/auth.ts — let Prisma's @default(uuid()) fire.
    database: {
      generateId: false,
    },
  },
});

// ⚠️ DESTRUCTIVE — local development only. This wipes EVERY table (including
// users) and recreates a known super admin. NEVER run this against production.
// To load/refresh the catalog on a live DB without touching user data, use the
// non-destructive `seed-catalog.ts` (compiled to dist-seed/seed-catalog.js).
async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records in correct order to prevent foreign key errors
  console.log('🧹 Cleaning existing database records...');
  await prisma.dailyCheckin.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.shareEvent.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.challengeCategory.deleteMany();
  // Better Auth-owned tables cascade off User, but order them defensively.
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appInfo.deleteMany();

  // 2. Create SUPER_ADMIN User via Better Auth so the password lands in the
  // Account table with the algorithm Better Auth verifies against.
  console.log('👤 Seeding super admin user...');
  const adminEmail = 'superadmin@challenge.charangudla.com';
  await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: 'Vital30AdminSecured!',
      name: 'Vital30 Super Admin',
    },
  });
  const superAdmin = await prisma.user.update({
    where: { email: adminEmail },
    data: { role: UserRole.SUPER_ADMIN, emailVerified: true },
  });
  console.log(`✅ Super admin created: ${superAdmin.email}`);

  // 3. Create challenge categories (catalog data shared with seed-catalog.ts).
  console.log('🗂️ Seeding challenge categories...');
  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const createdCategory = await prisma.challengeCategory.create({
      data: cat,
    });
    categoriesMap[cat.slug] = createdCategory.id;
  }
  console.log('✅ Challenge categories seeded successfully.');

  // 4. Seed challenges (7 per category = 42 challenges total).
  console.log(`🏆 Creating database records for ${challengesData.length} challenges...`);
  for (const chal of challengesData) {
    const categoryId = categoriesMap[chal.categoryIdKey];
    if (!categoryId) {
      throw new Error(`Category ID not found for key: ${chal.categoryIdKey}`);
    }

    await prisma.challenge.create({
      data: {
        title: chal.title,
        slug: chal.slug,
        shortDescription: chal.shortDescription,
        description: chal.description,
        durationDays: chal.durationDays,
        difficulty: chal.difficulty,
        dailyTask: chal.dailyTask,
        benefits: chal.benefits,
        safetyNote: chal.safetyNote,
        isPopular: chal.isPopular,
        isRecommended: chal.isRecommended,
        categoryId: categoryId,
      },
    });
  }

  console.log('✅ Seeding completed successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
