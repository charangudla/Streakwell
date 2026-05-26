"use client";

import { useMemo, useState } from "react";
import { ChallengeCard } from "./ChallengeCard";
import type { Category, Challenge } from "@/lib/types";

type Props = {
  challenges: Challenge[];
  categories: Category[];
};

const DIFFICULTIES: Array<{
  value: Challenge["difficulty"] | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export function ChallengesBrowser({ challenges, categories }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [difficulty, setDifficulty] =
    useState<Challenge["difficulty"] | "ALL">("ALL");

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return challenges.filter((c) => {
      if (categoryId !== "ALL" && c.categoryId !== categoryId) return false;
      if (difficulty !== "ALL" && c.difficulty !== difficulty) return false;
      if (!trimmed) return true;
      return (
        c.title.toLowerCase().includes(trimmed) ||
        c.shortDescription.toLowerCase().includes(trimmed) ||
        c.dailyTask.toLowerCase().includes(trimmed)
      );
    });
  }, [challenges, categoryId, difficulty, query]);

  const groupedByCategory = useMemo(() => {
    if (categoryId !== "ALL") return null;
    return categories
      .map((category) => ({
        category,
        items: filtered.filter((c) => c.categoryId === category.id),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered, categories, categoryId]);

  const hasActiveFilters =
    query.trim() !== "" || categoryId !== "ALL" || difficulty !== "ALL";

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Search
            </span>
            <input
              type="search"
              placeholder="e.g. walking, sugar, sleep"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Category
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Difficulty
            </span>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  e.target.value as Challenge["difficulty"] | "ALL",
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasActiveFilters ? (
          <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
            <span>
              Showing <span className="font-semibold text-ink">{filtered.length}</span>{" "}
              of {challenges.length} challenges
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategoryId("ALL");
                setDifficulty("ALL");
              }}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-10">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No challenges match those filters
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Try a broader search or clear the filters to see everything.
            </p>
          </div>
        ) : groupedByCategory ? (
          <div className="space-y-16">
            {groupedByCategory.map(({ category, items }) => (
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
                    {items.length}{" "}
                    {items.length === 1 ? "challenge" : "challenges"}
                  </span>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
