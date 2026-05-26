import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { JsonLd } from "@/components/JsonLd";
import { fetchChallengeBySlug, fetchChallenges } from "@/lib/api";
import { APP_NAME, HEALTH_DISCLAIMER, SITE_URL } from "@/lib/constants";
import type { Challenge } from "@/lib/types";

const DIFFICULTY_LABEL: Record<Challenge["difficulty"], string> = {
  BEGINNER: "Beginner",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const all = await fetchChallenges();
  return all.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await fetchChallengeBySlug(slug);
  if (!challenge) {
    return { title: "Challenge not found" };
  }
  return {
    title: challenge.title,
    description: challenge.shortDescription,
    alternates: { canonical: `/challenges/${challenge.slug}` },
    openGraph: {
      title: `${challenge.title} · ${APP_NAME}`,
      description: challenge.shortDescription,
      url: `/challenges/${challenge.slug}`,
    },
  };
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const challenge = await fetchChallengeBySlug(slug);
  if (!challenge) notFound();

  const benefits = Array.isArray(challenge.benefits)
    ? challenge.benefits
    : [];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: challenge.title,
    description: challenge.shortDescription,
    url: `${SITE_URL}/challenges/${challenge.slug}`,
    image: `${SITE_URL}/challenges/${challenge.slug}/opengraph-image`,
    author: { "@type": "Organization", name: APP_NAME },
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    },
    articleSection: challenge.category?.name,
    keywords: [
      "wellness challenge",
      "30 days",
      challenge.title,
      challenge.category?.name,
    ]
      .filter(Boolean)
      .join(", "),
  };

  return (
    <>
      <JsonLd data={articleLd} />
      <section className="bg-gradient-to-b from-brand-50 via-white to-white pb-12 pt-12 sm:pt-16">
        <Container>
          <Link
            href="/challenges"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ← All challenges
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {challenge.category ? (
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-brand-700">
                    {challenge.category.name}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-ink-muted">
                  {DIFFICULTY_LABEL[challenge.difficulty]}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-ink-muted">
                  {challenge.durationDays} days
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
                {challenge.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-ink-muted">
                {challenge.shortDescription}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-ink">
                Join this challenge in the Vital30 app
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Create a free account, check in daily, and track your active
                days for 30 days.
              </p>
              <ButtonLink
                href="/download"
                size="md"
                className="mt-4 w-full"
              >
                Get the app
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-ink">About this challenge</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-muted">
              {challenge.description}
            </p>

            <h2 className="mt-10 text-2xl font-bold text-ink">Daily task</h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              {challenge.dailyTask}
            </p>

            {benefits.length > 0 ? (
              <>
                <h2 className="mt-10 text-2xl font-bold text-ink">Benefits</h2>
                <ul className="mt-4 space-y-2">
                  {benefits.map((benefit, idx) => (
                    <li
                      key={`${benefit}-${idx}`}
                      className="flex items-start gap-3 text-base text-ink"
                    >
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
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {challenge.safetyNote ? (
              <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-sm font-semibold text-amber-900">
                  Safety note
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  {challenge.safetyNote}
                </p>
              </div>
            ) : null}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-surface-soft p-6 text-sm leading-relaxed text-ink-muted">
              <p className="font-semibold text-ink">Health disclaimer</p>
              <p className="mt-2">{HEALTH_DISCLAIMER}</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
