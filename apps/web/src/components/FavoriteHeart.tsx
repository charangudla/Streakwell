"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { FavoriteEntry } from "@/lib/web-types";

type Props = {
  challengeId: string;
  size?: number;
};

/**
 * Heart toggle overlay for challenge cards. Renders nothing if the user
 * is not signed in (so unauthed visitors don't see a button they can't
 * use). When signed in, fetches the favorites list once on mount to
 * determine initial filled/unfilled state, then optimistically toggles
 * via POST /favorites or DELETE /favorites/:challengeId.
 *
 * We share `loaded` state across multiple instances via a module-level
 * cache so a page full of cards only hits /favorites once.
 */
let cachedFavoriteIds: Set<string> | null = null;
let cachedPromise: Promise<Set<string>> | null = null;

async function loadFavorites(): Promise<Set<string>> {
  if (cachedFavoriteIds) return cachedFavoriteIds;
  if (cachedPromise) return cachedPromise;
  cachedPromise = apiClient<FavoriteEntry[]>("/favorites")
    .then((list) => {
      cachedFavoriteIds = new Set(list.map((f) => f.challengeId));
      return cachedFavoriteIds;
    })
    .catch(() => {
      cachedFavoriteIds = new Set();
      return cachedFavoriteIds;
    });
  return cachedPromise;
}

export function FavoriteHeart({ challengeId, size = 36 }: Props) {
  const { data: session } = useSession();
  const [isFav, setIsFav] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    void loadFavorites().then((set) => {
      if (!cancelled) setIsFav(set.has(challengeId));
    });
    return () => {
      cancelled = true;
    };
  }, [session, challengeId]);

  if (!session?.user) return null;
  if (isFav === null) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="block rounded-full bg-white/80"
      />
    );
  }

  async function onToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFav;
    setIsFav(next);
    if (cachedFavoriteIds) {
      if (next) cachedFavoriteIds.add(challengeId);
      else cachedFavoriteIds.delete(challengeId);
    }
    try {
      if (next) {
        await apiClient("/favorites", {
          method: "POST",
          body: { challengeId },
        });
      } else {
        await apiClient(`/favorites/${challengeId}`, { method: "DELETE" });
      }
    } catch {
      // Rollback
      setIsFav(!next);
      if (cachedFavoriteIds) {
        if (!next) cachedFavoriteIds.add(challengeId);
        else cachedFavoriteIds.delete(challengeId);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-110"
    >
      <span aria-hidden="true">{isFav ? "❤️" : "🤍"}</span>
    </button>
  );
}
