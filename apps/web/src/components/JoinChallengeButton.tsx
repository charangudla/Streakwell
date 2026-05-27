"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { UserChallenge } from "@/lib/web-types";

type Props = {
  challengeId: string;
};

/**
 * Three states:
 * - Not signed in → primary CTA → /register with `next` back to this page
 * - Signed in, not joined → "Join challenge" button → POST /user-challenges
 * - Signed in, already joined → "Check in today →" link to the user-challenge
 */
export function JoinChallengeButton({ challengeId }: Props) {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [existing, setExisting] = useState<UserChallenge | null | undefined>(
    undefined,
  );
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setExisting(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<UserChallenge[]>("/user-challenges");
        if (cancelled) return;
        setExisting(
          list.find(
            (u) => u.challengeId === challengeId && u.status === "ACTIVE",
          ) ?? null,
        );
      } catch {
        if (!cancelled) setExisting(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, challengeId]);

  if (sessionLoading || existing === undefined) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-500/60 px-5 text-sm font-semibold text-white"
      >
        Loading…
      </button>
    );
  }

  if (!session?.user) {
    const next =
      typeof window !== "undefined"
        ? encodeURIComponent(window.location.pathname)
        : "";
    return (
      <div className="space-y-2">
        <Link
          href={`/register${next ? `?next=${next}` : ""}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Join this challenge — sign up free
        </Link>
        <p className="text-xs text-ink-muted">
          Already have an account?{" "}
          <Link
            href={`/login${next ? `?next=${next}` : ""}`}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (existing) {
    return (
      <Link
        href={`/my-challenges/${existing.id}/progress`}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Open challenge →
      </Link>
    );
  }

  async function onJoin() {
    if (joining) return;
    setJoining(true);
    setErr(null);
    try {
      const uc = await apiClient<UserChallenge>("/user-challenges", {
        method: "POST",
        body: { challengeId },
      });
      // Land on the progress page so the user sees what they just
      // joined and can opt into today's check-in via the modal.
      router.push(`/my-challenges/${uc.id}/progress`);
    } catch (e) {
      setErr((e as Error).message);
      setJoining(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onJoin}
        disabled={joining}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {joining ? "Joining…" : "Join challenge"}
      </button>
      {err ? (
        <p className="text-xs text-rose-700">{err}</p>
      ) : null}
    </div>
  );
}
