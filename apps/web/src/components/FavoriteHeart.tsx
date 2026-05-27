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
 * cache so a page full of cards only hits /favorites once. The cache is
 * keyed by userId so signing out then back in as a different user can't
 * leak the previous user's favorites into the new session.
 */
let cachedUserId: string | null = null;
let cachedFavoriteIds: Set<string> | null = null;
let cachedPromise: Promise<Set<string>> | null = null;

async function loadFavorites(userId: string): Promise<Set<string>> {
  if (cachedUserId === userId && cachedFavoriteIds) return cachedFavoriteIds;
  if (cachedUserId === userId && cachedPromise) return cachedPromise;
  cachedUserId = userId;
  cachedFavoriteIds = null;
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
    const userId = session?.user?.id;
    if (!userId) {
      // User signed out — discard cache so a different user signing in
      // doesn't see the previous user's favorites.
      cachedUserId = null;
      cachedFavoriteIds = null;
      cachedPromise = null;
      setIsFav(null);
      return;
    }
    let cancelled = false;
    void loadFavorites(userId).then((set) => {
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
