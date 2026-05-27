"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { dayNumber } from "@/lib/progress";
import type { UserChallenge } from "@/lib/web-types";

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

  const active = (ucs ?? []).filter((u) => u.status === "ACTIVE");
  const completed = (ucs ?? []).filter((u) => u.status === "COMPLETED");
  const abandoned = (ucs ?? []).filter((u) => u.status === "ABANDONED");

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
