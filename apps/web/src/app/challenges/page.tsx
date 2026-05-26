import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import { fetchCategories, fetchChallenges } from "@/lib/api";
import { FALLBACK_POPULAR_CHALLENGES } from "@/lib/fallback-challenges";

export const metadata: Metadata = {
  title: "Browse challenges",
  description:
    "Explore Vital30's 30-day wellness challenges across diet, fitness, sleep, mental wellness, and more.",
  alternates: { canonical: "/challenges" },
};

export default async function ChallengesPage() {
  const [allChallenges, categories] = await Promise.all([
    fetchChallenges(),
    fetchCategories(),
  ]);

  const challengesByCategory = categories
    .map((category) => ({
      category,
      challenges: allChallenges.filter((c) => c.categoryId === category.id),
    }))
    .filter((g) => g.challenges.length > 0);

  const usingFallback = allChallenges.length === 0;

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Browse all challenges
            </h1>
            <p className="mt-4 text-base text-ink-muted sm:text-lg">
              Pick one challenge at a time. Small, consistent steps beat
              ambitious overhauls.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          {usingFallback ? (
            <>
              <p className="mb-6 text-sm text-ink-muted">
                Showing a preview of popular challenges. The full catalog
                appears once the Vital30 API is reachable.
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FALLBACK_POPULAR_CHALLENGES.map((challenge) => (
                  <ChallengeCard
                    key={challenge.slug}
                    challenge={challenge}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-16">
              {challengesByCategory.map(({ category, challenges }) => (
                <section
                  key={category.id}
                  id={category.slug}
                  aria-labelledby={`heading-${category.slug}`}
                >
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
                    <div>
                      <h2
                        id={`heading-${category.slug}`}
                        className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                      >
                        {category.name}
                      </h2>
                      {category.description ? (
                        <p className="mt-2 max-w-2xl text-base text-ink-muted">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-ink-muted">
                      {challenges.length}{" "}
                      {challenges.length === 1 ? "challenge" : "challenges"}
                    </span>
                  </div>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="mt-16 rounded-2xl border border-slate-200 bg-surface-soft p-6 text-center sm:p-8">
            <p className="text-base text-ink">
              Found one that fits? Join it in the Vital30 app.
            </p>
            <Link
              href="/download"
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Download Vital30 →
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
