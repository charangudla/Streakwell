"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ChallengeChat } from "@/components/ChallengeChat";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { Challenge } from "@/lib/types";

type PageProps = { params: Promise<{ id: string }> };

export default function ChatWindowPage(props: PageProps) {
  return (
    <AuthGuard>
      <ChatWindowInner {...props} />
    </AuthGuard>
  );
}

/**
 * Full-page chat window for a single Challenge. Lives at /chat/[id]
 * (the [id] is the Challenge.id, not the UserChallenge.id — chat is
 * scoped to the challenge, not the per-user enrollment).
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │ ← Chats   Challenge title                   │  back-arrow header
 *   ├─────────────────────────────────────────────┤
 *   │                                             │
 *   │           <ChallengeChat fills here>        │  fills viewport
 *   │                                             │
 *   └─────────────────────────────────────────────┘
 *
 * Title bar fetches the Challenge so we can render its name; chat
 * component does its own fetch for messages. Two round-trips on
 * mount but they're both cheap and run in parallel.
 */
function ChatWindowInner({ params }: PageProps) {
  const { id } = use(params);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await apiClient<Challenge>(`/challenges/${id}`);
        if (!cancelled) setChallenge(c);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (err) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-rose-700">{err}</p>
        <Link
          href="/chat"
          className="mt-4 inline-block text-sm font-semibold text-brand-700"
        >
          ← Back to chats
        </Link>
      </Container>
    );
  }

  return (
    <section className="py-4 sm:py-6">
      <Container className="max-w-3xl">
        <div className="mb-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            ← Chats
          </Link>
          {/* No "View progress →" link here — that page is keyed on
              UserChallenge.id and we only have Challenge.id in this
              route. Adding one would need an extra /user-challenges
              fetch + a "find the matching UC" lookup. Skip for v1
              since the chat surface is intentionally separate. */}
        </div>
        {challenge ? (
          <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {challenge.title}
          </h1>
        ) : (
          <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
        )}

        {/* Chat fills the rest of the viewport. Subtract header + page
            padding + bottom-tab-bar safe area so the input bar sits
            comfortably above the mobile tab bar. */}
        <div className="mt-4 h-[calc(100vh-220px)] min-h-[480px] sm:h-[calc(100vh-200px)]">
          <ChallengeChat challengeId={id} />
        </div>
      </Container>
    </section>
  );
}
