"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActiveChallengeCard } from "./ActiveChallengeCard";
import { CarouselCard, HorizontalCardRow } from "./HorizontalCardRow";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { UserChallenge } from "@/lib/web-types";

/**
 * "Your challenges" carousel that lives at the top of /challenges.
 *
 * Lets a logged-in user jump straight to today's check-in for any
 * challenge they're already on, without having to scroll past the
 * catalog to find it. Mirrors the dashboard's active-challenge surface
 * but in horizontal-swipe form so it occupies one screen-row of space
 * on phone viewports.
 *
 * Renders nothing for signed-out users (the catalog below is the right
 * landing experience for them) and nothing while the user-challenges
 * request is in flight, so the page doesn't shimmer for visitors who
 * don't need this surface at all.
 */
export function MyChallengesCarousel() {
  const { data: session, isPending } = useSession();
  const [ucs, setUcs] = useState<UserChallenge[] | null>(null);

  useEffect(() => {
    if (isPending) return;
    // Signed-out: skip the fetch entirely. /user-challenges would just
    // 401 and noise up the network panel.
    if (!session?.user) {
      setUcs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiClient<UserChallenge[]>("/user-challenges");
        if (!cancelled) setUcs(rows);
      } catch {
        // Swallow — this surface is decoration, not a hard requirement.
        // The catalog below still works without it.
        if (!cancelled) setUcs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user]);

  // Loading or signed-out → render nothing so we don't reserve empty
  // space above the catalog.
  if (ucs === null) return null;
  const active = ucs.filter((u) => u.status === "ACTIVE");
  if (active.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-12" aria-labelledby="my-challenges-heading">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="my-challenges-heading"
            className="text-xl font-bold tracking-tight text-ink sm:text-2xl"
          >
            Your challenges
          </h2>
          <p className="mt-1 text-xs font-medium text-ink-muted sm:text-sm">
            Jump back to today&apos;s check-in.
          </p>
        </div>
        <Link
          href="/my-challenges"
          className="flex-none text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          See all →
        </Link>
      </div>
      <HorizontalCardRow>
        {active.map((uc) => (
          <CarouselCard key={uc.id}>
            <ActiveChallengeCard uc={uc} />
          </CarouselCard>
        ))}
      </HorizontalCardRow>
    </section>
  );
}
