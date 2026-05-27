"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { computeProgress, dayNumber } from "@/lib/progress";
import {
  generateShareCardBlob,
  SHARE_FORMATS,
  type ShareFormat,
} from "@/lib/share-card";
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
  // Track which format is currently being rendered so we can show a
  // spinner on just that button — the user can read the others while
  // a render is in flight.
  const [sharingFormat, setSharingFormat] = useState<ShareFormat | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

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
  // Normalize both inputs to start-of-day UTC before subtracting. Without
  // this, `uc.startDate` (a full timestamp) is hours ahead of the same
  // day's `checkinDate` (`@db.Date`, midnight UTC), so a same-day check-in
  // yields idx = -1 and gets dropped — leaving every cell uncoloured even
  // when the user has completed days.
  const startMs = startOfUtcDayMs(uc.startDate);
  for (const c of checkins) {
    const idx = Math.floor(
      (startOfUtcDayMs(c.checkinDate) - startMs) / (24 * 60 * 60 * 1000),
    );
    if (idx >= 0 && idx < totalDays) statusByDayIdx.set(idx, c.status);
  }

  // Capture nullable fields into consts so their narrowed types survive
  // into the onShare closure below — TypeScript drops null narrowing on
  // free variables once you cross a function boundary.
  const challengeTitle = challenge.title;
  const challengeDailyTask = challenge.dailyTask;
  const shareText = `I'm on Day ${today} of ${challengeTitle} on Vital30. ${stats.activeDays} active days so far. Join me — https://vital30.com/download`;

  async function onShare(format: ShareFormat) {
    if (sharingFormat !== null) return;
    setSharingFormat(format);
    setShareNote(null);
    try {
      // Build the same per-day status array the on-screen calendar uses,
      // so the PNG mirrors what the user is looking at.
      const daysStatus = Array.from({ length: totalDays }, (_, i) =>
        statusByDayIdx.get(i),
      );
      const blob = await generateShareCardBlob(
        {
          challengeTitle,
          dailyTask: challengeDailyTask,
          totalDays,
          currentDay: today,
          activeDays: stats.activeDays,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          completionRate: stats.completionRate,
          daysStatus,
        },
        format,
      );
      const file = new File(
        [blob],
        `vital30-progress-${format}.png`,
        { type: "image/png" },
      );

      // Preferred path on phones: native share sheet WITH the image
      // attached. Works on iOS Safari 15+ and Android Chrome — both
      // require canShare({files}) to gate the call, otherwise iOS
      // throws on share() with an unsupported payload.
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.canShare?.({ files: [file] })) {
        await nav.share({
          title: "My Vital30 progress",
          text: shareText,
          files: [file],
        });
        return;
      }

      // Desktop fallback: trigger a PNG download + copy the share text
      // to clipboard so the user can paste it into a tweet / post.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (nav?.clipboard) {
        try {
          await nav.clipboard.writeText(shareText);
        } catch {
          // Clipboard can throw on permission-denied; the PNG still
          // downloaded so the share is recoverable.
        }
      }
      setShareNote(
        `${SHARE_FORMATS[format].label} card downloaded. Share text copied — paste into your post.`,
      );
    } catch (e) {
      // User-cancelled native share is an AbortError — silent.
      if ((e as Error).name === "AbortError") return;
      setShareNote("Could not generate share card. Try again.");
    } finally {
      setSharingFormat(null);
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

        {uc.status === "ACTIVE" ? (
          <div className="mt-8">
            <Link
              href={`/my-challenges/${id}/checkin`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Check in today
            </Link>
          </div>
        ) : null}

        {/* Share-to-social card. Picker → user taps the format that
            matches the surface they'll post to. Each button generates a
            differently-sized PNG and hands it to the native share sheet
            (or downloads it on desktop). */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink sm:text-lg">
                Share your progress
              </h2>
              <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                Pick a size for the social surface you&apos;re posting to.
                We&apos;ll open your share sheet on phones, or download
                the PNG on desktop.
              </p>
            </div>
            <ShareIcon />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(Object.keys(SHARE_FORMATS) as ShareFormat[]).map((fmt) => {
              const spec = SHARE_FORMATS[fmt];
              const busy = sharingFormat === fmt;
              const disabled = sharingFormat !== null;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onShare(fmt)}
                  disabled={disabled}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-surface-soft p-4 text-left transition-all hover:border-brand-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-surface-soft disabled:hover:shadow-none"
                >
                  <FormatThumb format={fmt} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink group-hover:text-brand-700">
                      {spec.label}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
                      {spec.w} × {spec.h}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {spec.hint}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    {busy ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
                        Generating…
                      </>
                    ) : (
                      <>Generate →</>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {shareNote ? (
            <p
              className="mt-3 text-xs text-ink-muted sm:text-sm"
              role="status"
            >
              {shareNote}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

/**
 * Tiny visual showing the format's aspect ratio — a brand-green
 * rectangle proportioned to each format so the user can scan the
 * picker and pick the shape that matches the surface they want to
 * post to without reading dimensions.
 */
function FormatThumb({ format }: { format: ShareFormat }) {
  const dims: Record<ShareFormat, { w: number; h: number }> = {
    square: { w: 36, h: 36 },
    portrait: { w: 32, h: 40 },
    story: { w: 24, h: 42 },
  };
  const { w, h } = dims[format];
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center"
      style={{ width: 44, height: 44 }}
    >
      <div
        className="rounded-md bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm ring-1 ring-inset ring-white/20"
        style={{ width: w, height: h }}
      />
    </div>
  );
}

/**
 * Share glyph used in the share-card header. Tinted brand circle with
 * an upload-arrow inside — same visual language as the iOS / Android
 * share sheet so users associate the surface with sharing.
 */
function ShareIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-50 text-brand-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </span>
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

/**
 * Floor a Date (or ISO string) to midnight UTC. Lets us compare
 * `uc.startDate` (timestamp) against `checkin.checkinDate` (Prisma
 * @db.Date, already midnight UTC) by whole days.
 */
function startOfUtcDayMs(d: Date | string): number {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
}
