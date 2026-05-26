"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { dayNumber } from "@/lib/progress";
import type { Challenge } from "@/lib/types";
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
  const [byId, setById] = useState<Record<string, Challenge>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, all] = await Promise.all([
          apiClient<UserChallenge[]>("/user-challenges"),
          apiClient<Challenge[]>("/challenges"),
        ]);
        if (cancelled) return;
        setUcs(list);
        const map: Record<string, Challenge> = {};
        for (const c of all) map[c.id] = c;
        setById(map);
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
                byId={byId}
                primary="checkin"
              />
            ) : null}
            {completed.length > 0 ? (
              <Group
                heading="Completed"
                items={completed}
                byId={byId}
                primary="progress"
              />
            ) : null}
            {abandoned.length > 0 ? (
              <Group
                heading="Abandoned"
                items={abandoned}
                byId={byId}
                primary="progress"
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
  byId: Record<string, Challenge>;
  primary: "checkin" | "progress";
};

function Group({ heading, items, byId, primary }: GroupProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((uc) => {
          const c = byId[uc.challengeId];
          if (!c) return null;
          const day = dayNumber(uc.startDate, c.durationDays);
          const primaryHref =
            primary === "checkin"
              ? `/my-challenges/${uc.id}/checkin`
              : `/my-challenges/${uc.id}/progress`;
          return (
            <article
              key={uc.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {uc.status === "ACTIVE"
                  ? `Day ${day} of ${c.durationDays}`
                  : uc.status === "COMPLETED"
                    ? "Completed"
                    : "Abandoned"}
              </p>
              <h3 className="mt-1 text-lg font-bold text-ink">{c.title}</h3>
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
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={primaryHref}
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  {primary === "checkin" ? "Check in today" : "View progress"} →
                </Link>
                <Link
                  href={`/my-challenges/${uc.id}/progress`}
                  className="text-ink-muted hover:text-ink"
                >
                  Progress
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
