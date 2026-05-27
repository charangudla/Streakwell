"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { Select, type SelectOption } from "@/components/Select";
import { apiClient } from "@/lib/api-client";
import { dayNumber } from "@/lib/progress";
import type { UserChallenge } from "@/lib/web-types";

const ALL = "ALL";

const MONTH_OPTIONS: SelectOption<string>[] = [
  { value: ALL, label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/** The date that "bucket" a UserChallenge — endDate when present, else startDate. */
function refDate(uc: UserChallenge): Date {
  return new Date(uc.endDate ?? uc.startDate);
}

export default function MyChallengesPage() {
  return (
    <AuthGuard>
      <MyChallengesInner />
    </AuthGuard>
  );
}

function MyChallengesInner() {
  const [ucs, setUcs] = useState<UserChallenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Year/month filters. Default ALL = no filter — Year gets pre-loaded
  // options from whatever years appear in the user's data so we never
  // offer an empty year.
  const [year, setYear] = useState<string>(ALL);
  const [month, setMonth] = useState<string>(ALL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<UserChallenge[]>("/user-challenges");
        if (cancelled) return;
        setUcs(list);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Years actually present in the data — newest first so the dropdown
  // matches the order of the buckets below. Showing only-present years
  // avoids "April 2099" type dead options.
  const yearOptions = useMemo<SelectOption<string>[]>(() => {
    const years = new Set<number>();
    for (const uc of ucs ?? []) {
      years.add(refDate(uc).getUTCFullYear());
    }
    const sorted = Array.from(years).sort((a, b) => b - a);
    return [
      { value: ALL, label: "All years" },
      ...sorted.map((y) => ({ value: String(y), label: String(y) })),
    ];
  }, [ucs]);

  // Apply filters before the status split so each section's
  // count/empty-state reflects the user's pick.
  const filteredUcs = useMemo(() => {
    if (!ucs) return null;
    if (year === ALL && month === ALL) return ucs;
    const wantYear = year === ALL ? null : Number(year);
    const wantMonth = month === ALL ? null : Number(month);
    return ucs.filter((uc) => {
      const d = refDate(uc);
      if (wantYear !== null && d.getUTCFullYear() !== wantYear) return false;
      // getUTCMonth is 0-indexed; our MONTH_OPTIONS values are 1-indexed.
      if (wantMonth !== null && d.getUTCMonth() + 1 !== wantMonth) {
        return false;
      }
      return true;
    });
  }, [ucs, year, month]);

  const filterActive = year !== ALL || month !== ALL;
  const active = (filteredUcs ?? []).filter((u) => u.status === "ACTIVE");
  const completed = (filteredUcs ?? []).filter(
    (u) => u.status === "COMPLETED",
  );
  const abandoned = (filteredUcs ?? []).filter(
    (u) => u.status === "ABANDONED",
  );
  const noMatches =
    filterActive &&
    active.length === 0 &&
    completed.length === 0 &&
    abandoned.length === 0;

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          My challenges
        </h1>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {/* Year + month filter card. Hidden when the user has no
            challenges yet — the empty-state CTA below covers that
            scenario more usefully than dead dropdowns. */}
        {ucs && ucs.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-year"
                  className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
                >
                  Year
                </label>
                <Select
                  id="filter-year"
                  value={year}
                  options={yearOptions}
                  onChange={setYear}
                  aria-label="Filter by year"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filter-month"
                  className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
                >
                  Month
                </label>
                <Select
                  id="filter-month"
                  value={month}
                  options={MONTH_OPTIONS}
                  onChange={setMonth}
                  aria-label="Filter by month"
                />
              </div>
            </div>
            {filterActive ? (
              <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {(filteredUcs ?? []).length}
                  </span>{" "}
                  of {ucs.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setYear(ALL);
                    setMonth(ALL);
                  }}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {ucs === null ? (
          <div className="mt-8 h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ) : ucs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No challenges yet
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Pick one to get started.
            </p>
            <ButtonLink href="/challenges" size="md" className="mt-6">
              Browse challenges
            </ButtonLink>
          </div>
        ) : noMatches ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No challenges match those filters
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Try a different month or year, or clear filters to see
              everything.
            </p>
            <button
              type="button"
              onClick={() => {
                setYear(ALL);
                setMonth(ALL);
              }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {active.length > 0 ? (
              <Group
                heading="Active"
                items={active}
                primary="checkin"
                // Active is usually short (1–4 at a time) — flat sort
                // by start date is enough; bucketing would feel like
                // overkill for so few cards.
              />
            ) : null}
            {completed.length > 0 ? (
              <Group
                heading="Completed"
                items={completed}
                primary="progress"
                bucketByMonth
              />
            ) : null}
            {abandoned.length > 0 ? (
              <Group
                heading="Abandoned"
                items={abandoned}
                primary="progress"
                bucketByMonth
              />
            ) : null}
          </div>
        )}
      </Container>
    </section>
  );
}

type GroupProps = {
  heading: string;
  items: UserChallenge[];
  primary: "checkin" | "progress";
  /**
   * When true, sub-group items by month/year of endDate (Completed)
   * or startDate fallback (Abandoned/Active) so a long history reads
   * as "May 2026 · April 2026 · …" instead of a flat scrolling list.
   * Off for Active — short list, no need to bucket.
   */
  bucketByMonth?: boolean;
};

function Group({ heading, items, primary, bucketByMonth }: GroupProps) {
  // Lowercase the heading to derive the URL hash so dashboard tiles can
  // deep-link straight to "Active" / "Completed" / "Abandoned" via
  // /my-challenges#active etc. Adding scroll-mt so the hash-target lands
  // BELOW the sticky header rather than tucked behind it.
  const anchorId = heading.toLowerCase();

  // For the flat-grid case, sort newest-first by whichever date is
  // most relevant: endDate when present (Completed / Abandoned),
  // startDate otherwise (Active). Makes "most recent thing I did"
  // the top-left card.
  const sortedFlat = useMemo(
    () =>
      [...items].sort((a, b) => {
        const da = new Date(a.endDate ?? a.startDate).getTime();
        const db = new Date(b.endDate ?? b.startDate).getTime();
        return db - da;
      }),
    [items],
  );

  // For the bucketed case (Completed / Abandoned), group by
  // YYYY-MM key so sort is lexicographic + still in calendar order.
  const buckets = useMemo(() => {
    if (!bucketByMonth) return null;
    const map = new Map<string, UserChallenge[]>();
    for (const uc of items) {
      const ref = new Date(uc.endDate ?? uc.startDate);
      const key = `${ref.getUTCFullYear()}-${String(
        ref.getUTCMonth() + 1,
      ).padStart(2, "0")}`;
      const arr = map.get(key) ?? [];
      arr.push(uc);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => {
        // Sort inside the bucket newest-first by the same date.
        const sorted = [...list].sort((a, b) => {
          const da = new Date(a.endDate ?? a.startDate).getTime();
          const db = new Date(b.endDate ?? b.startDate).getTime();
          return db - da;
        });
        const [year, month] = key.split("-").map(Number);
        // First-of-month at UTC noon to dodge tz edge cases when
        // formatting (some locales would shift Dec 1 → Nov 30).
        const label = new Date(Date.UTC(year, month - 1, 1, 12)).toLocaleString(
          "en-US",
          { month: "long", year: "numeric", timeZone: "UTC" },
        );
        return { key, label, items: sorted };
      });
  }, [items, bucketByMonth]);

  return (
    <section id={anchorId} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-ink">{heading}</h2>

      {buckets ? (
        <div className="mt-4 space-y-8">
          {buckets.map((bucket) => (
            <div key={bucket.key}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                {bucket.label}
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {bucket.items.map((uc) => (
                  <ChallengeRow key={uc.id} uc={uc} primary={primary} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {sortedFlat.map((uc) => (
            <ChallengeRow key={uc.id} uc={uc} primary={primary} />
          ))}
        </div>
      )}
    </section>
  );
}

function ChallengeRow({
  uc,
  primary,
}: {
  uc: UserChallenge;
  primary: "checkin" | "progress";
}) {
  const c = uc.challenge;
  const day = dayNumber(uc.startDate, c.durationDays);
  // Every card → progress page. From there the user opens the
  // check-in modal (for ACTIVE) or just reviews the calendar (for
  // COMPLETED / ABANDONED). One destination keeps the mental model
  // simple — "tap any challenge to see how it's going" — and means
  // we can make the whole card clickable.
  const href = `/my-challenges/${uc.id}/progress`;
  const cta = primary === "checkin" ? "Check in today →" : "View progress →";
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {uc.status === "ACTIVE"
          ? `Day ${day} of ${c.durationDays}`
          : uc.status === "COMPLETED"
            ? "Completed"
            : "Abandoned"}
      </p>
      <h3 className="mt-1 text-lg font-bold text-ink group-hover:text-brand-700">
        {c.title}
      </h3>
      <p className="mt-1 text-sm text-ink-muted line-clamp-2">
        {c.shortDescription}
      </p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{
            width: `${Math.min(100, Math.max(0, uc.progressPercent))}%`,
          }}
        />
      </div>
      <p className="mt-4 text-sm font-semibold text-brand-700">{cta}</p>
    </Link>
  );
}
