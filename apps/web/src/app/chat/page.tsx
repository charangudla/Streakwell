"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { dayNumber } from "@/lib/progress";
import type { UserChallenge } from "@/lib/web-types";

export default function ChatInboxPage() {
  return (
    <AuthGuard>
      <ChatInboxInner />
    </AuthGuard>
  );
}

/**
 * Chat inbox — "your conversations" surface, modelled on the
 * Instagram DM thread list. One row per ACTIVE challenge the user has
 * joined; tap a row to open that challenge's full chat window.
 *
 * Completed and abandoned challenges still have chats (the API
 * doesn't gate on UC status) but we hide them from the inbox so it
 * stays a "what am I currently part of" view. Users can still reach
 * those channels by navigating directly via /chat/[id] if they
 * bookmarked one — we just don't surface them on entry.
 */
function ChatInboxInner() {
  const router = useRouter();
  const [ucs, setUcs] = useState<UserChallenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Back button — prefer history.back() so we land wherever the user
   * came from (dashboard, /my-challenges, a progress page, etc.).
   * Falls back to /dashboard for direct-URL entries or PWA cold starts
   * where there's no prior history entry.
   */
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<UserChallenge[]>("/user-challenges");
        if (!cancelled) setUcs(list);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(
    () =>
      (ucs ?? [])
        .filter((u) => u.status === "ACTIVE")
        // Active list is short; sort by startDate desc so the most-
        // recently-joined surfaces first — same convention used
        // throughout the app.
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        ),
    [ucs],
  );

  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-2xl">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Back
        </button>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Chats
          </h1>
          <p className="text-xs text-ink-muted">
            One channel per active challenge
          </p>
        </div>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {ucs === null ? (
          <div className="mt-6 space-y-2">
            {/* Skeleton rows */}
            <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
        ) : active.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No active challenges yet
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Each challenge you join has its own community chat. Pick one
              to get started.
            </p>
            <ButtonLink href="/challenges" size="md" className="mt-6">
              Browse challenges
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {active.map((uc) => (
              <li key={uc.id}>
                <InboxRow uc={uc} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function InboxRow({ uc }: { uc: UserChallenge }) {
  const c = uc.challenge;
  const day = dayNumber(uc.startDate, c.durationDays);
  const initials = c.title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  // Today-status pill — same colour language the dashboard cards use
  // so the inbox feels like a continuation of that view. Glance:
  //   not in yet → amber pulse (action)
  //   completed  → brand green (settled)
  //   missed     → rose
  //   skipped    → slate
  const status = uc.todayCheckinStatus;
  const pillCls =
    status === "COMPLETED"
      ? "bg-brand-50 text-brand-700"
      : status === "MISSED"
        ? "bg-rose-50 text-rose-700"
        : status === "SKIPPED"
          ? "bg-slate-100 text-ink-muted"
          : "bg-streak/15 text-streak";
  const pillText =
    status === "COMPLETED"
      ? `Day ${day} ✓`
      : status === "MISSED"
        ? `Day ${day} missed`
        : status === "SKIPPED"
          ? `Day ${day} skipped`
          : `Check in today`;

  return (
    <Link
      href={`/chat/${c.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
        {initials || "·"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-ink group-hover:text-brand-700">
          {c.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          Day {day} of {c.durationDays}
        </p>
      </div>
      <span
        className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold ${pillCls}`}
      >
        {pillText}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 flex-none text-ink-muted"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
