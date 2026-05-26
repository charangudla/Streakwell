"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { Achievement, AchievementKind } from "@/lib/web-types";

export default function AchievementsPage() {
  return (
    <AuthGuard>
      <AchievementsInner />
    </AuthGuard>
  );
}

const META: Record<
  AchievementKind,
  { title: string; description: string; icon: string }
> = {
  FIRST_CHECKIN: {
    title: "First check-in",
    description: "You took the first step — the hardest one.",
    icon: "🚩",
  },
  SEVEN_DAY_STREAK: {
    title: "7-day streak",
    description: "A full week of consistency. The habit is taking root.",
    icon: "🔥",
  },
  TWENTY_ONE_DAY_STREAK: {
    title: "21-day streak",
    description: "Three weeks straight. You're well on your way to 30.",
    icon: "⚡",
  },
  CHALLENGE_COMPLETED: {
    title: "Challenge complete",
    description: "30 days done. Take a breath and pick the next one.",
    icon: "🎉",
  },
  THREE_CHALLENGES_COMPLETED: {
    title: "Three challenges done",
    description: "You have built three habits with Vital30. Compounding.",
    icon: "🏆",
  },
};
const ALL_KINDS: AchievementKind[] = [
  "FIRST_CHECKIN",
  "SEVEN_DAY_STREAK",
  "TWENTY_ONE_DAY_STREAK",
  "CHALLENGE_COMPLETED",
  "THREE_CHALLENGES_COMPLETED",
];

function AchievementsInner() {
  const [earned, setEarned] = useState<Achievement[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<Achievement[]>("/achievements");
        if (!cancelled) setEarned(list);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byKind = new Map((earned ?? []).map((a) => [a.kind, a]));
  const total = ALL_KINDS.length;
  const earnedCount = earned?.length ?? 0;
  const progress = total === 0 ? 0 : earnedCount / total;

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Achievements
        </h1>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl bg-ink p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            You&rsquo;ve earned
          </p>
          <p className="mt-1 text-3xl font-bold">
            {earnedCount} of {total} badges
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-streak"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {ALL_KINDS.map((kind) => {
            const meta = META[kind];
            const got = byKind.get(kind);
            const isEarned = !!got;
            return (
              <li
                key={kind}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${isEarned ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"}`}
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 flex-none place-items-center rounded-full bg-brand-50 text-2xl ring-1 ring-brand-100"
                >
                  {meta.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-ink">
                      {meta.title}
                    </p>
                    {isEarned ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        ✓ Earned
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink-muted">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {meta.description}
                  </p>
                  {got ? (
                    <p className="mt-1 text-xs text-ink-muted">
                      Earned{" "}
                      {new Date(got.earnedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
