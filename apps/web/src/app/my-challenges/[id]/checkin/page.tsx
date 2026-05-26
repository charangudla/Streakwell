"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { dayNumber } from "@/lib/progress";
import type { Challenge } from "@/lib/types";
import type { CheckinStatus, UserChallenge } from "@/lib/web-types";

type PageProps = { params: Promise<{ id: string }> };

export default function CheckinPage(props: PageProps) {
  return (
    <AuthGuard>
      <CheckinInner {...props} />
    </AuthGuard>
  );
}

function CheckinInner({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [uc, setUc] = useState<UserChallenge | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<CheckinStatus | null>(null);
  const [success, setSuccess] = useState<CheckinStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiClient<UserChallenge[]>("/user-challenges");
        if (cancelled) return;
        const found = list.find((u) => u.id === id);
        if (!found) {
          setErr("Challenge not found in your list.");
          return;
        }
        setUc(found);
        const c = await apiClient<Challenge>(`/challenges/${found.challengeId}`);
        if (!cancelled) setChallenge(c);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function checkin(status: CheckinStatus) {
    if (submitting) return;
    setSubmitting(status);
    setErr(null);
    try {
      await apiClient("/checkins", {
        method: "POST",
        body: { userChallengeId: id, status },
      });
      setSuccess(status);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(null);
    }
  }

  if (err && !uc) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-rose-700">{err}</p>
      </Container>
    );
  }
  if (!uc || !challenge) {
    return (
      <Container className="py-16">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </Container>
    );
  }

  const day = dayNumber(uc.startDate, challenge.durationDays);

  if (success === "COMPLETED") {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto max-w-md rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
            Day {day} done
          </p>
          <h1 className="mt-3 text-4xl font-bold">Nice work.</h1>
          <p className="mt-4 text-base text-brand-100">
            One more day toward better habits. See you tomorrow.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => router.push(`/my-challenges/${id}/progress`)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              View progress
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex h-11 items-center justify-center rounded-full bg-transparent px-5 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </Container>
    );
  }

  if (success === "MISSED") {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <h1 className="text-3xl font-bold text-ink">That&rsquo;s okay.</h1>
          <p className="mt-3 text-base text-ink-muted">
            Recovery matters. Come back tomorrow.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Back to dashboard
          </button>
        </div>
      </Container>
    );
  }

  if (success === "SKIPPED") {
    return (
      <Container className="py-16 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-ink">Skipped today.</h1>
          <p className="mt-3 text-base text-ink-muted">
            Your streak is paused but your active days are safe.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Back to dashboard
          </button>
        </div>
      </Container>
    );
  }

  return (
    <section className="py-12">
      <Container className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Day {day} · {challenge.title}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
          Did you complete today&rsquo;s task?
        </h1>
        <p className="mt-3 text-base text-ink-muted">{challenge.dailyTask}</p>

        {err ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {err}
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => checkin("COMPLETED")}
            disabled={submitting !== null}
            className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-brand-500 px-5 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting === "COMPLETED" ? "Saving…" : "Yes, completed ✓"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => checkin("MISSED")}
              disabled={submitting !== null}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              {submitting === "MISSED" ? "Saving…" : "No, missed today"}
            </button>
            <button
              type="button"
              onClick={() => checkin("SKIPPED")}
              disabled={submitting !== null}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-muted transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {submitting === "SKIPPED" ? "Saving…" : "Skip"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-muted">
          Missing a day breaks your current streak — but never erases your
          active days.
        </p>
      </Container>
    </section>
  );
}
