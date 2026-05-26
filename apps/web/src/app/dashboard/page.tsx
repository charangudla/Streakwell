"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
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

  const [active, setActive] = useState<UserChallenge[] | null>(null);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ucs, all] = await Promise.all([
          apiClient<UserChallenge[]>("/user-challenges"),
          apiClient<Challenge[]>("/challenges"),
        ]);
        if (cancelled) return;
        const byId: Record<string, Challenge> = {};
        for (const c of all) byId[c.id] = c;
        setActive(ucs);
        setChallenges(byId);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeList = (active ?? []).filter((u) => u.status === "ACTIVE");

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Good day, {firstName}.
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          {activeList.length === 0
            ? "Ready to pick your first challenge?"
            : `${activeList.length} active challenge${activeList.length === 1 ? "" : "s"}. Tap one to check in.`}
        </p>

        {err ? <Banner message={err} /> : null}

        {active === null ? (
          <CardsSkeleton />
        ) : activeList.length === 0 ? (
          <EmptyDashboard />
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {activeList.map((uc) => {
              const c = challenges[uc.challengeId];
              if (!c) return null;
              const day = dayNumber(uc.startDate, c.durationDays);
              return (
                <Link
                  key={uc.id}
                  href={`/my-challenges/${uc.id}/checkin`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    Day {day} of {c.durationDays}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink group-hover:text-brand-700">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{c.dailyTask}</p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, uc.progressPercent))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-brand-700">
                    Check in today →
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/challenges"
            title="Browse challenges"
            body="Find a new 30-day challenge to start."
          />
          <QuickLink
            href="/my-challenges"
            title="My challenges"
            body="See active + completed challenges and history."
          />
          <QuickLink
            href="/profile"
            title="Profile"
            body="Update your name or delete your account."
          />
        </div>
      </Container>
    </section>
  );
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-slate-200 bg-surface-soft p-5 transition-colors hover:border-brand-300 hover:bg-white"
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink-muted">{body}</p>
    </Link>
  );
}

function EmptyDashboard() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
      <p className="text-lg font-semibold text-ink">
        No active challenges yet
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Pick something simple and start small.
      </p>
      <ButtonLink href="/challenges" size="md" className="mt-6">
        Browse challenges
      </ButtonLink>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  );
}

function Banner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
    >
      {message}
    </div>
  );
}
