"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChallengeCard } from "./ChallengeCard";
import { CarouselCard, HorizontalCardRow } from "./HorizontalCardRow";
import { Select, type SelectOption } from "./Select";
import type { Category, Challenge } from "@/lib/types";

type DifficultyFilter = Challenge["difficulty"] | "ALL";

/**
 * How many cards to preview per category lane before users have to
 * click "More" to see the rest. Mirrors the mobile app's category
 * carousel pattern — a peek of the lane, not the whole catalog.
 */
const CAROUSEL_PREVIEW_COUNT = 8;

type Props = {
  challenges: Challenge[];
  categories: Category[];
};

const DIFFICULTY_OPTIONS: SelectOption<DifficultyFilter>[] = [
  { value: "ALL", label: "All levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export function ChallengesBrowser({ challenges, categories }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("ALL");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");

  // Compose the dropdown options once per render. "All categories" is
  // prepended so users can clear the filter without hitting the
  // separate "Clear filters" link below.
  const categoryOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: "ALL", label: "All categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

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
        {/* Search gets ~1.5x the width of each filter so the input feels
            primary; selects get equal slots wide enough that their
            dropdown menus (which match button width) show long category
            names without wrapping. Was `[1fr_auto_auto]` when the
            selects were native — `auto` collapsed our custom Select
            buttons to chevron+label width, which made the open menu
            unusably narrow. */}
        <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr] sm:items-end">
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
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-category"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Category
            </label>
            <Select
              id="filter-category"
              value={categoryId}
              options={categoryOptions}
              onChange={setCategoryId}
              aria-label="Filter by category"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-difficulty"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Difficulty
            </label>
            <Select<DifficultyFilter>
              id="filter-difficulty"
              value={difficulty}
              options={DIFFICULTY_OPTIONS}
              onChange={setDifficulty}
              aria-label="Filter by difficulty"
            />
          </div>
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
          <div className="space-y-12 sm:space-y-16">
            {groupedByCategory.map(({ category, items }) => {
              const preview = items.slice(0, CAROUSEL_PREVIEW_COUNT);
              const hasMore = items.length > CAROUSEL_PREVIEW_COUNT;
              return (
                <section
                  key={category.id}
                  id={category.slug}
                  aria-labelledby={`heading-${category.slug}`}
                >
                  <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-0">
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
                      <p className="mt-2 text-xs font-medium text-ink-muted sm:text-sm">
                        {items.length}{" "}
                        {items.length === 1 ? "challenge" : "challenges"}
                      </p>
                    </div>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="flex-none text-sm font-semibold text-brand-700 hover:text-brand-800"
                    >
                      {hasMore
                        ? `More (${items.length}) →`
                        : "View all →"}
                    </Link>
                  </div>
                  {/* Horizontal swipe carousel on phone + tablet (mirrors
                      the mobile app's category lanes), grid on desktop.
                      Capped at CAROUSEL_PREVIEW_COUNT so each lane is a
                      peek — the "More" link goes to the full category
                      page for the rest. */}
                  <HorizontalCardRow>
                    {preview.map((challenge) => (
                      <CarouselCard key={challenge.id}>
                        <ChallengeCard challenge={challenge} />
                      </CarouselCard>
                    ))}
                  </HorizontalCardRow>
                </section>
              );
            })}
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
