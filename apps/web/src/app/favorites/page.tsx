"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { FavoriteEntry } from "@/lib/web-types";

export default function FavoritesPage() {
  return (
    <AuthGuard>
      <FavoritesInner />
    </AuthGuard>
  );
}

function FavoritesInner() {
  const [items, setItems] = useState<FavoriteEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<FavoriteEntry[]>("/favorites");
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(challengeId: string) {
    if (!items) return;
    setItems(items.filter((f) => f.challengeId !== challengeId));
    try {
      await apiClient(`/favorites/${challengeId}`, { method: "DELETE" });
    } catch {
      // re-fetch on failure
      const list = await apiClient<FavoriteEntry[]>("/favorites");
      setItems(list);
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Saved challenges
        </h1>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {items === null ? (
          <div className="mt-8 h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No saved challenges
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Tap the heart on any challenge to save it for later.
            </p>
            <ButtonLink href="/challenges" size="md" className="mt-6">
              Browse challenges
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex-1">
                  <Link
                    href={`/challenges/${f.challenge.slug}`}
                    className="text-lg font-semibold text-ink hover:text-brand-700"
                  >
                    {f.challenge.title}
                  </Link>
                  <p className="mt-1 text-sm text-ink-muted">
                    {f.challenge.shortDescription}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {f.challenge.durationDays} days ·{" "}
                    {f.challenge.difficulty.toLowerCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(f.challengeId)}
                  className="text-xs font-semibold text-ink-muted hover:text-rose-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
