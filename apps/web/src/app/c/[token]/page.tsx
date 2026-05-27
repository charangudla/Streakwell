"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import type { Challenge } from "@/lib/types";
import type { UserChallenge } from "@/lib/web-types";

type PageProps = { params: Promise<{ token: string }> };

export default function ShareLandingPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The /api/proxy path also fronts anonymous endpoints, but we
        // hit the /api/proxy/challenges/by-token route directly so the
        // page works whether the visitor is signed in or not.
        const c = await apiClient<Challenge>(
          `/challenges/by-token/${token}`,
        );
        if (!cancelled) setChallenge(c);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function join() {
    if (joining || !challenge) return;
    setJoining(true);
    setErr(null);
    try {
      const uc = await apiClient<UserChallenge>("/user-challenges", {
        method: "POST",
        body: { challengeId: challenge.id, inviteToken: token },
      });
      router.replace(`/my-challenges/${uc.id}/checkin`);
    } catch (e) {
      setErr((e as Error).message);
      setJoining(false);
    }
  }

  if (err) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-rose-700">{err}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-semibold text-brand-700"
        >
          Go to vital30.com →
        </Link>
      </Container>
    );
  }
  if (!challenge) {
    return (
      <Container className="py-16">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </Container>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-2xl">
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            You&rsquo;re invited
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {challenge.title}
          </h1>
          <p className="mt-4 text-base text-brand-100">
            {challenge.shortDescription}
          </p>
          <ul className="mt-6 space-y-1 text-sm text-brand-100">
            <li>
              <span className="font-semibold text-white">Duration:</span>{" "}
              {challenge.durationDays} days
            </li>
            <li>
              <span className="font-semibold text-white">Daily task:</span>{" "}
              {challenge.dailyTask}
            </li>
          </ul>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {isPending ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          ) : session?.user ? (
            <>
              <p className="text-sm text-ink-muted">
                Signed in as{" "}
                <span className="font-semibold text-ink">
                  {session.user.email}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={join}
                disabled={joining}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {joining ? "Joining…" : "Join challenge"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink">
                Create a free account to join. We&rsquo;ll bring you straight
                back here.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/register?next=${encodeURIComponent(`/c/${token}`)}`}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white hover:bg-brand-600"
                >
                  Sign up free
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(`/c/${token}`)}`}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-white px-6 text-base font-semibold text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
