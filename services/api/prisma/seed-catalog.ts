import { PrismaClient } from '@prisma/client';
import { categoriesData, challengesData } from './catalog-data';

const prisma = new PrismaClient();

/**
 * NON-DESTRUCTIVE catalog seed — safe to run against PRODUCTION.
 *
 * Unlike `seed.ts`, this script:
 *   - does NOT delete anything (no `deleteMany`),
 *   - does NOT create any user / super admin,
 *   - only UPSERTs the 6 categories and 42 challenges by their unique `slug`.
 *
 * Re-running is idempotent. Admin-managed flags (`isActive`, `isPopular`,
 * `isRecommended`) are applied on first insert but PRESERVED on update, so a
 * re-seed never silently re-activates a challenge an admin deactivated or
 * un-does curation done from the admin UI.
 *
 * Run in prod (from the repo root on the VPS):
 *   docker compose -f docker-compose.prod.yml exec -T api node dist-seed/seed-catalog.js
 */
async function main() {
  console.log('🌱 Upserting challenge catalog (non-destructive)...');

  // 1. Upsert categories by their unique slug, collecting ids for the FK below.
  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const category = await prisma.challengeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: cat,
    });
    categoriesMap[cat.slug] = category.id;
  }
  console.log(`✅ ${categoriesData.length} categories upserted.`);

  // 2. Upsert challenges by their unique slug. On UPDATE we refresh editorial
  //    content only; on CREATE we additionally apply the seed's curation flags.
  let created = 0;
  let updated = 0;
  for (const chal of challengesData) {
    const categoryId = categoriesMap[chal.categoryIdKey];
    if (!categoryId) {
      throw new Error(`Category ID not found for key: ${chal.categoryIdKey}`);
    }

    // Editorial content — safe to overwrite on every run.
    const content = {
      title: chal.title,
      shortDescription: chal.shortDescription,
      description: chal.description,
      durationDays: chal.durationDays,
      difficulty: chal.difficulty,
      dailyTask: chal.dailyTask,
      benefits: chal.benefits,
      safetyNote: chal.safetyNote,
      categoryId,
    };

    const existing = await prisma.challenge.findUnique({
      where: { slug: chal.slug },
      select: { id: true },
    });

    await prisma.challenge.upsert({
      where: { slug: chal.slug },
      // Leave isActive / isPopular / isRecommended untouched so admin curation
      // (e.g. a deactivation) survives a re-seed.
      update: content,
      // First insert: apply curation flags. isActive defaults true in schema.
      create: {
        slug: chal.slug,
        ...content,
        isPopular: chal.isPopular,
        isRecommended: chal.isRecommended,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }
  console.log(`✅ Challenges: ${created} created, ${updated} updated (${challengesData.length} total).`);
  console.log('🎉 Catalog seed complete — no users, check-ins, or sessions were touched.');
}

main()
  .catch((e) => {
    console.error('❌ Catalog seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
