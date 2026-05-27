"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActiveChallengeCard } from "@/components/ActiveChallengeCard";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { ChallengeCard } from "@/components/ChallengeCard";
import { Container } from "@/components/Container";
import {
  CarouselCard,
  HorizontalCardRow,
} from "@/components/HorizontalCardRow";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { dayNumber } from "@/lib/progress";
import type { Challenge } from "@/lib/types";
import type { UserChallenge } from "@/lib/web-types";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}

function DashboardInner() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";
  const greeting = useGreeting();

  const [ucs, setUcs] = useState<UserChallenge[] | null>(null);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uc, all] = await Promise.all([
          apiClient<UserChallenge[]>("/user-challenges"),
          apiClient<Challenge[]>("/challenges"),
        ]);
        if (cancelled) return;
        setUcs(uc);
        setChallenges(all);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeList = useMemo(
    () => (ucs ?? []).filter((u) => u.status === "ACTIVE"),
    [ucs],
  );
  const recommended = useMemo(
    () => (challenges ?? []).filter((c) => c.isRecommended).slice(0, 6),
    [challenges],
  );
  const popular = useMemo(
    () => (challenges ?? []).filter((c) => c.isPopular).slice(0, 3),
    [challenges],
  );

  const firstActive = activeList[0] ?? null;
  const currentDay = firstActive
    ? dayNumber(firstActive.startDate, firstActive.challenge.durationDays)
    : 1;

  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-5xl">
        {/* Greeting row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {greeting}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {firstName}
              {firstActive ? (
                <>
                  {" "}
                  <span className="text-ink-muted">—</span>{" "}
                  <span className="text-brand-700">Day {currentDay}</span>
                </>
              ) : null}
            </h1>
          </div>
        </div>

        {/* Motivation line */}
        <p className="mt-3 text-sm text-ink-muted sm:text-base">
          Small steps count.{" "}
          <span className="font-semibold text-brand-700">
            {firstActive
              ? "Complete today's check-in."
              : "Pick a challenge to begin."}
          </span>
        </p>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {/* Active-challenge area — layout swaps based on how many the
            user is currently working on:
              1 active  → one full-width HeroCheckinCard (gradient)
              2 active  → two HeroCheckinCards side by side (each half)
              3 active  → 2x2 grid: 3 ActiveChallengeCards + "Add another"
              4 active  → 2x2 grid of 4 cards + "Add more challenges →"
              5+ active → first 4 + "See all N active challenges →"
            All card variants surface today's check-in status via colour
            so the user can scan and immediately spot the cards that
            still need attention. */}
        <div className="mt-6">
          {ucs === null ? (
            <HeroSkeleton />
          ) : activeList.length === 0 ? (
            <EmptyHero />
          ) : activeList.length === 1 ? (
            <HeroCheckinCard uc={activeList[0]} dayNumber={currentDay} />
          ) : activeList.length === 2 ? (
            // 2-up grid at every viewport — matches the user's mockup
            // ("divide the big card in the homepage into two"). At
            // phone width each card is ~170px; HeroCheckinCard's
            // compact variant + line-clamp-2 on the daily-task line
            // handles that gracefully.
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {activeList.map((uc) => (
                <HeroCheckinCard
                  key={uc.id}
                  uc={uc}
                  dayNumber={dayNumber(uc.startDate, uc.challenge.durationDays)}
                  compact
                />
              ))}
            </div>
          ) : activeList.length === 3 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {activeList.map((uc) => (
                <ActiveChallengeCard key={uc.id} uc={uc} />
              ))}
              <AddAnotherTile />
            </div>
          ) : (
            // 4+ active — show first 4 in a 2x2 grid, then a CTA below
            // that tells the user there's more or invites them to add.
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {activeList.slice(0, 4).map((uc) => (
                  <ActiveChallengeCard key={uc.id} uc={uc} />
                ))}
              </div>
              <AddMoreCta extraCount={activeList.length - 4} />
            </>
          )}
        </div>

        {/* Stat row: counts of active / completed challenges + an
            average-progress KPI. Active + Completed are tappable —
            anchored deep-links into the matching section of
            /my-challenges. Avg progress is a derived number with no
            list to drill into, so it stays a plain tile. */}
        {activeList.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            <Stat
              label="Active"
              value={String(activeList.length)}
              subtitle={
                activeList.length === 1 ? "challenge" : "challenges"
              }
              href="/my-challenges#active"
            />
            <Stat
              label="Avg progress"
              value={`${Math.round(
                activeList.reduce((a, u) => a + u.progressPercent, 0) /
                  Math.max(1, activeList.length),
              )}%`}
            />
            <Stat
              label="Completed"
              value={String(
                (ucs ?? []).filter((u) => u.status === "COMPLETED").length,
              )}
              href="/my-challenges#completed"
            />
          </div>
        ) : null}

        {/* "Your other active challenges" section used to live here —
            removed because the new count-based layout above already
            shows ALL active challenges (up to 4 in the grid, plus a
            "See all N" CTA when there are more). One surface for
            active work instead of two competing ones. */}

        {/* Recommended for you — horizontal swipe carousel on phone +
            tablet (mirrors the mobile app's home screen), grid on
            desktop. The outer wrapper bleeds to the viewport edges so
            cards can swipe past the page padding for that native feel. */}
        {recommended.length > 0 ? (
          <section className="mt-10">
            <SectionHeader
              title="Recommended for you"
              seeAllHref="/challenges"
            />
            <HorizontalCardRow>
              {recommended.map((c) => (
                <CarouselCard key={c.id}>
                  <ChallengeCard challenge={c} />
                </CarouselCard>
              ))}
            </HorizontalCardRow>
          </section>
        ) : null}

        {/* Popular this week — same horizontal swipe pattern. The
            mobile app stacks Popular vertically; on web we use the
            carousel for both so the home page feels app-consistent. */}
        {popular.length > 0 ? (
          <section className="mt-10">
            <SectionHeader title="Popular this week" seeAllHref="/challenges" />
            <HorizontalCardRow>
              {popular.map((c) => (
                <CarouselCard key={c.id}>
                  <ChallengeCard challenge={c} />
                </CarouselCard>
              ))}
            </HorizontalCardRow>
          </section>
        ) : null}

        {/* Browse + My-challenges quick-link cards used to live here.
            Removed: the top header already links to /challenges, the
            "Your challenges" carousel above links to /my-challenges via
            its "See all →", and the bottom tab bar puts both within
            one tap on phone. The cards were redundant duplication that
            stretched the page out for no extra utility. */}
      </Container>
    </section>
  );
}

/**
 * Big featured card for one of the user's active challenges. Used at
 * full width when there's 1 active, and in a 2-col grid for the
 * 2-active case so the "today's focus" gradient feel survives at
 * smaller widths.
 *
 * Gradient + CTA reflect today's check-in status so a glance tells
 * the user whether they still need to act:
 *   null      → brand-green gradient, "Check in today →"  (action)
 *   COMPLETED → deeper-green gradient, "✓ Day N done"     (settled)
 *   MISSED    → rose gradient, "Day N missed"             (informational)
 *   SKIPPED   → slate gradient, "Day N skipped"           (informational)
 */
function HeroCheckinCard({
  uc,
  dayNumber: day,
  compact = false,
}: {
  uc: UserChallenge;
  dayNumber: number;
  /** When true, scales type + padding down for the 2-up grid. */
  compact?: boolean;
}) {
  const c = uc.challenge;
  const pct = Math.min(100, Math.max(0, uc.progressPercent));
  const v = pickHeroVariant(uc.todayCheckinStatus);
  return (
    <Link
      href={`/my-challenges/${uc.id}/progress`}
      className={`group block h-full overflow-hidden rounded-3xl ${v.gradient} text-white shadow-lg transition-transform hover:-translate-y-0.5 ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${v.eyebrow}`}>
            Today · Day {day} of {c.durationDays}
          </p>
          <h2
            className={`mt-2 font-bold leading-tight ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
          >
            {c.title}
          </h2>
          <p
            className={`mt-2 max-w-xl text-white/85 ${compact ? "line-clamp-2 text-sm" : "text-sm sm:text-base"}`}
          >
            {c.dailyTask}
          </p>
        </div>
        <div
          className={`grid flex-none place-items-center rounded-full bg-white/15 ${compact ? "h-10 w-10 text-lg" : "h-12 w-12 text-2xl"}`}
          aria-hidden="true"
        >
          {v.glyph}
        </div>
      </div>
      <div className={compact ? "mt-4" : "mt-6"}>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full rounded-full ${v.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium text-white/85">
          <span>{pct.toFixed(0)}% complete</span>
          <span className="font-semibold text-white group-hover:translate-x-0.5">
            {v.cta(day)}
          </span>
        </div>
      </div>
    </Link>
  );
}

type HeroVariant = {
  gradient: string;
  eyebrow: string;
  bar: string;
  glyph: string;
  cta: (day: number) => string;
};

function pickHeroVariant(
  status: UserChallenge["todayCheckinStatus"],
): HeroVariant {
  if (status === null) {
    // AMBER, not brand-green — when nothing is checked in yet the
    // hero should read as "your turn, do this", not "you're done"
    // (which is what a green-tinted card historically signalled).
    // Glyph is an arrow, not a checkmark, for the same reason.
    return {
      gradient:
        "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600",
      eyebrow: "text-amber-50",
      bar: "bg-white",
      glyph: "→",
      cta: () => "Check in today →",
    };
  }
  if (status === "COMPLETED") {
    // Brand-green only AFTER a completed check-in — clear "done"
    // signal. Checkmark glyph reinforces it.
    return {
      gradient:
        "bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700",
      eyebrow: "text-brand-100",
      bar: "bg-white",
      glyph: "✓",
      cta: (day) => `Day ${day} done →`,
    };
  }
  if (status === "MISSED") {
    return {
      gradient:
        "bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700",
      eyebrow: "text-rose-100",
      bar: "bg-white/70",
      glyph: "·",
      cta: (day) => `Day ${day} missed →`,
    };
  }
  // SKIPPED
  return {
    gradient: "bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700",
    eyebrow: "text-slate-100",
    bar: "bg-white/70",
    glyph: "‖",
    cta: (day) => `Day ${day} skipped →`,
  };
}

/**
 * Fills the empty 4th slot of the 2x2 grid when the user has exactly 3
 * active challenges. Same card dimensions as ActiveChallengeCard so the
 * grid feels balanced; visually distinct (dashed border, brand tint on
 * hover) so it reads as "tap to add", not as a real challenge.
 */
function AddAnotherTile() {
  return (
    <Link
      href="/challenges"
      className="group flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-surface-soft p-5 text-center transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:bg-white hover:shadow-md"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-500 group-hover:text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <p className="mt-3 text-sm font-bold text-ink group-hover:text-brand-700">
        Add another challenge
      </p>
      <p className="mt-1 text-xs text-ink-muted">Browse challenges →</p>
    </Link>
  );
}

/**
 * CTA below the 2x2 grid when the user has 4+ active challenges.
 * Shows "Add more" by default; flips to "See all N active challenges"
 * when there's a 5th+ already that the grid is hiding so the user
 * understands "more exist, tap to view them".
 */
function AddMoreCta({ extraCount }: { extraCount: number }) {
  if (extraCount > 0) {
    return (
      <Link
        href="/my-challenges#active"
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
      >
        See all {extraCount + 4} active challenges →
      </Link>
    );
  }
  return (
    <Link
      href="/challenges"
      className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-surface-soft p-4 text-sm font-bold text-ink transition-colors hover:border-brand-400 hover:bg-white hover:text-brand-700"
    >
      <span className="text-lg leading-none">+</span>
      Add more challenges →
    </Link>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-surface-soft p-8 text-center sm:p-10">
      <h2 className="text-2xl font-bold text-ink">No active challenge yet</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Pick something simple — a 7-day walking habit, no soda for two weeks.
        Start small.
      </p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <ButtonLink href="/challenges" size="md">
          Browse challenges
        </ButtonLink>
        <ButtonLink href="/create-challenge" size="md" variant="secondary">
          Create your own
        </ButtonLink>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />;
}

function Stat({
  label,
  value,
  subtitle,
  href,
}: {
  label: string;
  value: string;
  subtitle?: string;
  /**
   * Optional destination. When set the tile renders as a Link with a
   * brand-tinted hover so the user reads it as tappable. Used for
   * Active / Completed counts so a tap drills straight into the
   * matching section of /my-challenges. Avg progress stays a plain
   * <div> since it's a derived number with no list to point at.
   */
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-5"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center sm:p-5">
      {inner}
    </div>
  );
}

function SectionHeader({
  title,
  seeAllHref,
}: {
  title: string;
  seeAllHref?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="text-xs font-semibold text-brand-700 hover:text-brand-800 sm:text-sm"
        >
          See all →
        </Link>
      ) : null}
    </div>
  );
}

function useGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

