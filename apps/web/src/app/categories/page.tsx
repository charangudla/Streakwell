import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { fetchCategories, fetchChallenges } from "@/lib/api";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse Vital30 challenges by category — diet, fitness, mental wellness, sleep, breaking bad habits, and family wellness.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const [categories, allChallenges] = await Promise.all([
    fetchCategories(),
    fetchChallenges(),
  ]);

  const withCounts = categories.map((cat) => ({
    ...cat,
    count: allChallenges.filter((c) => c.categoryId === cat.id).length,
  }));

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 via-white to-white py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Browse by category
          </h1>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            Pick a focus area. Every category has multiple 30-day challenges
            at different difficulty levels.
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {withCounts.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
              >
                <div>
                  <h2 className="text-xl font-semibold text-ink group-hover:text-brand-700">
                    {cat.name}
                  </h2>
                  {cat.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
                <p className="mt-6 text-sm font-medium text-brand-700">
                  {cat.count} {cat.count === 1 ? "challenge" : "challenges"} →
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
