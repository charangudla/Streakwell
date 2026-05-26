import type { Metadata } from "next";
import Link from "next/link";
import { ChallengesBrowser } from "@/components/ChallengesBrowser";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import { fetchCategories, fetchChallenges } from "@/lib/api";
import { FALLBACK_POPULAR_CHALLENGES } from "@/lib/fallback-challenges";

export const metadata: Metadata = {
  title: "Browse challenges",
  description:
    "Explore Vital30's 30-day wellness challenges across diet, fitness, sleep, mental wellness, and more. Search by name or filter by category and difficulty.",
  alternates: { canonical: "/challenges" },
};

export default async function ChallengesPage() {
  const [allChallenges, categories] = await Promise.all([
    fetchChallenges(),
    fetchCategories(),
  ]);

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
                  <ChallengeCard key={challenge.slug} challenge={challenge} />
                ))}
              </div>
            </>
          ) : (
            <ChallengesBrowser
              challenges={allChallenges}
              categories={categories}
            />
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
