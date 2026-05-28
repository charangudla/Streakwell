"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { BackLink } from "@/components/BackLink";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { CustomChallenge } from "@/lib/web-types";

export default function MyCreatedChallengesPage() {
  return (
    <AuthGuard>
      <Inner />
    </AuthGuard>
  );
}

function Inner() {
  const [items, setItems] = useState<CustomChallenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<CustomChallenge[]>(
          "/custom-challenges/mine",
        );
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-4xl">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Challenges you created
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Manage invites, share links, and visibility.
            </p>
          </div>
          <ButtonLink href="/create-challenge" size="md">
            Create new
          </ButtonLink>
        </div>

        {err ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {items === null ? (
          <div className="mt-8 h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No custom challenges yet
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Make a 14-day no-soda challenge with your friends, a 30-day
              walking challenge with your family, anything.
            </p>
            <ButtonLink href="/create-challenge" size="md" className="mt-6">
              Create your first
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((c) => (
              <li
                key={c.id}
                className={`rounded-2xl border bg-white p-5 ${c.isActive ? "border-slate-200" : "border-slate-200 opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/my-created-challenges/${c.id}`}
                        className="text-lg font-semibold text-ink hover:text-brand-700"
                      >
                        {c.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.visibility === "PUBLIC" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-ink-muted"}`}
                      >
                        {c.visibility.toLowerCase()}
                      </span>
                      {!c.isActive ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          deleted
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {c.shortDescription}
                    </p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {c.durationDays} days · {c.joinedCount ?? 0} joined ·{" "}
                      {c.inviteCount ?? 0} invited
                    </p>
                  </div>
                  <Link
                    href={`/my-created-challenges/${c.id}`}
                    className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Manage →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
