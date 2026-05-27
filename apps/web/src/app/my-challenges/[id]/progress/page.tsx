"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { computeProgress, dayNumber } from "@/lib/progress";
import type { Challenge } from "@/lib/types";
import type { DailyCheckin, UserChallenge } from "@/lib/web-types";

type PageProps = { params: Promise<{ id: string }> };

export default function ProgressPage(props: PageProps) {
  return (
    <AuthGuard>
      <ProgressInner {...props} />
    </AuthGuard>
  );
}

function ProgressInner({ params }: PageProps) {
  const { id } = use(params);
  const [uc, setUc] = useState<UserChallenge | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ucs = await apiClient<UserChallenge[]>("/user-challenges");
        if (cancelled) return;
        const found = ucs.find((u) => u.id === id);
        if (!found) {
          setErr("Challenge not found.");
          return;
        }
        setUc(found);
        const [c, cks] = await Promise.all([
          apiClient<Challenge>(`/challenges/${found.challengeId}`),
          apiClient<DailyCheckin[]>(`/checkins/challenge/${id}`),
        ]);
        if (cancelled) return;
        setChallenge(c);
        setCheckins(cks);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const stats = useMemo(
    () =>
      computeProgress(checkins, challenge?.durationDays ?? 30),
    [checkins, challenge],
  );

  if (err) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-rose-700">{err}</p>
        <Link
          href="/my-challenges"
          className="mt-4 inline-block text-sm font-semibold text-brand-700"
        >
          ← Back to my challenges
        </Link>
      </Container>
    );
  }
  if (!uc || !challenge) {
    return (
      <Container className="py-16">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </Container>
    );
  }

  const totalDays = challenge.durationDays;
  const today = dayNumber(uc.startDate, totalDays);
  const statusByDayIdx = new Map<
    number,
    "COMPLETED" | "MISSED" | "SKIPPED"
  >();
  for (const c of checkins) {
    const idx = Math.floor(
      (new Date(c.checkinDate).getTime() - new Date(uc.startDate).getTime()) /
        (24 * 60 * 60 * 1000),
    );
    if (idx >= 0 && idx < totalDays) statusByDayIdx.set(idx, c.status);
  }

  const shareText = `I'm on Day ${today} of ${challenge.title} on Vital30. ${stats.activeDays} active days so far. Join me — https://vital30.com/download`;

  function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "My Vital30 progress",
          text: shareText,
          url: "https://vital30.com",
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert("Share text copied to clipboard.");
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-3xl">
        <Link
          href="/my-challenges"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← My challenges
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {challenge.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Day {today} of {totalDays} · {uc.status.toLowerCase()}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Stat label="Active days" value={`${stats.activeDays} / ${totalDays}`} />
          <Stat label="Current streak" value={`${stats.currentStreak} days`} />
          <Stat label="Longest streak" value={`${stats.longestStreak} days`} />
          <Stat
            label="Completion"
            value={`${Math.round(stats.completionRate * 100)}%`}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-ink">
            {totalDays}-day calendar
          </p>
          <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-10 sm:gap-2.5">
            {Array.from({ length: totalDays }).map((_, i) => {
              const s = statusByDayIdx.get(i);
              const dayNum = i + 1;
              const isToday = dayNum === today && uc.status === "ACTIVE";
              return (
                <DayCell
                  key={i}
                  day={dayNum}
                  status={s}
                  isToday={isToday}
                />
              );
            })}
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-200" />
              Missed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-200" />
              Skipped
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 ring-1 ring-inset ring-slate-200" />
              Upcoming
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-streak" />
              Today
            </span>
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {uc.status === "ACTIVE" ? (
            <Link
              href={`/my-challenges/${id}/checkin`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Check in today
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Share progress
          </button>
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

/**
 * Single day in the 30-day calendar grid. Renders the day number inside
 * a square coloured by status. Today gets a streak-coloured dot below
 * the cell so the user can spot "you are here" at a glance — same
 * convention the mobile ThirtyDayGrid widget uses.
 */
function DayCell({
  day,
  status,
  isToday,
}: {
  day: number;
  status: "COMPLETED" | "MISSED" | "SKIPPED" | undefined;
  isToday: boolean;
}) {
  let bg = "bg-slate-100";
  let fg = "text-ink-muted";
  let border = "ring-1 ring-inset ring-slate-200";
  if (status === "COMPLETED") {
    bg = "bg-brand-500";
    fg = "text-white";
    border = "";
  } else if (status === "MISSED") {
    bg = "bg-rose-200";
    fg = "text-rose-900";
    border = "";
  } else if (status === "SKIPPED") {
    bg = "bg-slate-200";
    fg = "text-ink-muted";
    border = "";
  }
  if (isToday) {
    border = `ring-2 ring-streak ${status ? "" : ""}`;
  }
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`flex aspect-square w-full items-center justify-center rounded-lg font-mono text-xs font-semibold sm:text-sm ${bg} ${fg} ${border}`}
        title={`Day ${day}${status ? ` · ${status.toLowerCase()}` : ""}${isToday ? " (today)" : ""}`}
      >
        {day}
      </div>
      {isToday ? (
        <span
          aria-hidden="true"
          className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-streak"
        />
      ) : null}
    </div>
  );
}
