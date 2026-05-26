import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import { PhoneMockup } from "@/components/PhoneMockup";
import { Testimonials } from "@/components/Testimonials";
import { fetchChallenges } from "@/lib/api";
import { APP_NAME, APP_TAGLINE, HEALTH_DISCLAIMER } from "@/lib/constants";
import { FALLBACK_POPULAR_CHALLENGES } from "@/lib/fallback-challenges";

const HOW_IT_WORKS = [
  {
    title: "Choose a challenge",
    body: "Pick from short, focused 30-day challenges across diet, movement, sleep, and mind.",
  },
  {
    title: "Check in daily",
    body: "Tap one button each day. Missed a day? Recovery matters — pick it back up tomorrow.",
  },
  {
    title: "Track your progress",
    body: "Watch your active days climb. The goal is consistency, not perfection.",
  },
  {
    title: "Share your status",
    body: "Celebrate streaks with friends and invite them into a challenge.",
  },
];

const WHY_VITAL30 = [
  "Simple 30-day structure",
  "Recovery-friendly progress",
  "Wellness-focused challenges",
  "Easy sharing with friends and family",
  "Designed for all ages",
];

export default async function HomePage() {
  const all = await fetchChallenges();
  const popular = all.filter((c) => c.isPopular).slice(0, 6);
  const displayed = popular.length > 0 ? popular : FALLBACK_POPULAR_CHALLENGES;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <Container className="py-20 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              30-day wellness challenges
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {APP_NAME}
              <span className="mt-2 block text-brand-600">{APP_TAGLINE}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Join simple 30-day wellness challenges, check in daily, track
              your progress, and share your status with friends and family.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/download" size="lg">
                Download the app
              </ButtonLink>
              <ButtonLink href="/challenges" size="lg" variant="secondary">
                Browse challenges
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-base text-ink-muted sm:text-lg">
              Four simple steps. No subscriptions, no shame, no surprises.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, idx) => (
              <li
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500 text-base font-semibold text-white">
                  {idx + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-surface-soft py-20 sm:py-24">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Popular challenges
              </h2>
              <p className="mt-3 text-base text-ink-muted sm:text-lg">
                Start with something proven. These are the most-joined
                challenges across Vital30.
              </p>
            </div>
            <Link
              href="/challenges"
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              See all challenges →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((challenge) => (
              <ChallengeCard key={challenge.slug} challenge={challenge} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Why Vital30
              </h2>
              <p className="mt-4 text-base text-ink-muted sm:text-lg">
                Big wellness apps overwhelm. Vital30 keeps it small, kind, and
                consistent so the habit actually sticks.
              </p>
              <ul className="mt-8 space-y-3">
                {WHY_VITAL30.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand-100 text-brand-700"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-base text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <PhoneMockup />
          </div>
        </Container>
      </section>

      <Testimonials />

      <section className="bg-surface-soft py-12">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-ink-muted sm:p-8">
            <p className="font-semibold text-ink">Health disclaimer</p>
            <p className="mt-2">{HEALTH_DISCLAIMER}</p>
            <Link
              href="/health-disclaimer"
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Read the full disclaimer →
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="rounded-3xl bg-ink px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to start your first 30 days?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Download Vital30 on iPhone or Android and join a challenge in
              under a minute.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/download" size="lg">
                Get the app
              </ButtonLink>
              <ButtonLink
                href="/challenges"
                size="lg"
                variant="secondary"
                className="bg-transparent text-white ring-white/20 hover:bg-white/10"
              >
                Browse challenges first
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
