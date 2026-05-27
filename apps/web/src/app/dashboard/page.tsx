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

        {/* Hero check-in card */}
        <div className="mt-6">
          {ucs === null ? (
            <HeroSkeleton />
          ) : firstActive ? (
            <HeroCheckinCard uc={firstActive} dayNumber={currentDay} />
          ) : (
            <EmptyHero />
          )}
        </div>

        {/* Stat row: active days across active challenges */}
        {activeList.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            <Stat
              label="Active"
              value={String(activeList.length)}
              subtitle={
                activeList.length === 1 ? "challenge" : "challenges"
              }
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
            />
          </div>
        ) : null}

        {/* Your other active challenges — horizontal swipe carousel
            on phone + tablet (matches Recommended + Popular below and
            the mobile app's lane pattern), grid on desktop. Guard
            stays at `> 1` because the hero card above already shows
            the first active; with 0 or 1 active there's nothing
            "other" to surface. */}
        {activeList.length > 1 ? (
          <section className="mt-10">
            <SectionHeader
              title="Your other active challenges"
              seeAllHref="/my-challenges"
            />
            <HorizontalCardRow>
              {activeList.slice(1).map((uc) => (
                <CarouselCard key={uc.id}>
                  <ActiveChallengeCard uc={uc} />
                </CarouselCard>
              ))}
            </HorizontalCardRow>
          </section>
        ) : null}

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

/** Big featured card for the user's first active challenge. */
function HeroCheckinCard({
  uc,
  dayNumber: day,
}: {
  uc: UserChallenge;
  dayNumber: number;
}) {
  const c = uc.challenge;
  const pct = Math.min(100, Math.max(0, uc.progressPercent));
  return (
    <Link
      href={`/my-challenges/${uc.id}/progress`}
      className="group block overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">
            Today · Day {day} of {c.durationDays}
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            {c.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-brand-50 sm:text-base">
            {c.dailyTask}
          </p>
        </div>
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white/15 text-2xl">
          ✓
        </div>
      </div>
      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-streak"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-medium text-brand-100">
          <span>{pct.toFixed(0)}% complete</span>
          <span className="font-semibold text-white group-hover:translate-x-0.5">
            Check in today →
          </span>
        </div>
      </div>
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
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>
      ) : null}
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

