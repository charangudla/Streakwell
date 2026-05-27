import type { Metadata } from "next";
import Link from "next/link";
import { ChallengesBrowser } from "@/components/ChallengesBrowser";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import { MyChallengesCarousel } from "@/components/MyChallengesCarousel";
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
      {/* Hero + content used to be `py-16 sm:py-20` + `py-12 sm:py-16` —
          112-144px of dead space between the hero text and the first
          content section. Trimmed both so the visual rhythm is hairline,
          not gulf: hero `pt-12 pb-8 sm:pt-16 sm:pb-10`, content
          `pt-6 pb-12 sm:pt-8 sm:pb-16`. Net gap ~14-18px, enough that
          the bg-gradient boundary still reads as a section divider. */}
      <section className="bg-gradient-to-b from-brand-50 via-white to-white pt-12 pb-8 sm:pt-16 sm:pb-10">
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

      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16">
        <Container>
          {/* "Your challenges" carousel. Client component — renders
              nothing for signed-out visitors or while the
              /user-challenges fetch is in flight, so SSR-cached HTML
              for anonymous visitors stays unchanged. */}
          <MyChallengesCarousel />

          {/* "Create your own" CTA. Lives here (not on /dashboard)
              because /challenges is where users come specifically to
              find or start a challenge — the home screen is for the
              one they're already doing. Authed users land on the
              create form; anonymous users get bounced to register with
              a redirect-back. */}
          <div className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-lg sm:mb-12 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
                  Build your own
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">
                  Don&apos;t see what you want?
                </h2>
                <p className="mt-2 max-w-xl text-sm text-brand-50 sm:text-base">
                  Create a custom 30-day challenge — pick the duration,
                  difficulty, and daily task. Invite friends by email or
                  share a join link.
                </p>
              </div>
              {/* Plain Link, not <ButtonLink variant="primary"/>, because
                  ButtonLink's variant classes (bg-brand-500 text-white)
                  fight with our white-on-brand override and Tailwind's
                  utility ordering — not className-string order — decides
                  which wins, so the override loses unreliably. Inlining
                  the styles avoids that battle. */}
              <Link
                href="/create-challenge"
                className="inline-flex h-11 flex-none items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create your own
              </Link>
            </div>
          </div>

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
