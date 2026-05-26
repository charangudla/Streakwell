import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/Button";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchChallenges,
} from "@/lib/api";
import { APP_NAME } from "@/lib/constants";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const cats = await fetchCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} challenges`,
    description:
      category.description ??
      `Browse Vital30's ${category.name} 30-day wellness challenges.`,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: `${category.name} challenges · ${APP_NAME}`,
      description:
        category.description ??
        `Browse Vital30's ${category.name} 30-day wellness challenges.`,
      url: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, allChallenges] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchChallenges(),
  ]);
  if (!category) notFound();

  const challenges = allChallenges.filter((c) => c.categoryId === category.id);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container className="max-w-3xl">
          <Link
            href="/challenges"
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ← All challenges
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              {category.description}
            </p>
          ) : null}
          <p className="mt-3 text-sm font-medium text-ink-muted">
            {challenges.length} {challenges.length === 1 ? "challenge" : "challenges"}{" "}
            available
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          {challenges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
              <p className="text-lg font-semibold text-ink">
                No challenges in this category yet
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Check back soon — we&rsquo;re always adding more.
              </p>
              <ButtonLink href="/challenges" size="md" className="mt-6">
                Browse all challenges
              </ButtonLink>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
