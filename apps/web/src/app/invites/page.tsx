"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { IncomingInvite } from "@/lib/web-types";

export default function InvitesPage() {
  return (
    <AuthGuard>
      <Inner />
    </AuthGuard>
  );
}

function Inner() {
  const router = useRouter();
  const [items, setItems] = useState<IncomingInvite[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const list = await apiClient<IncomingInvite[]>("/invites");
      setItems(list);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function respond(
    inv: IncomingInvite,
    decision: "ACCEPTED" | "DECLINED",
  ) {
    if (busyId) return;
    setBusyId(inv.id);
    try {
      const res = await apiClient<{
        status: "ACCEPTED" | "DECLINED";
        userChallengeId?: string;
      }>(`/invites/${inv.id}/respond`, {
        method: "POST",
        body: { decision },
      });
      if (res.status === "ACCEPTED" && res.userChallengeId) {
        // Land on the progress page so the user sees what they just
        // joined — Day 1, empty calendar, daily task — and can opt
        // into today's check-in via the modal from there.
        router.push(`/my-challenges/${res.userChallengeId}/progress`);
        return;
      }
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <BackLink />
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Challenge invites
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Friends who&rsquo;ve added you to their custom challenges.
        </p>

        {err ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {items === null ? (
          <div className="mt-8 h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">No invites yet</p>
            <p className="mt-2 text-sm text-ink-muted">
              When a friend invites you to a custom challenge, it&rsquo;ll
              appear here.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((inv) => {
              const pending = inv.status === "PENDING";
              return (
                <li
                  key={inv.id}
                  className={`rounded-2xl border p-5 ${pending ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white opacity-80"}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {inv.invitedBy.name} invited you
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-ink">
                    {inv.challenge.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {inv.challenge.shortDescription}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {inv.challenge.durationDays} days · daily task:{" "}
                    {inv.challenge.dailyTask}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {pending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => respond(inv, "ACCEPTED")}
                          disabled={busyId === inv.id}
                          className="inline-flex h-10 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                          {busyId === inv.id ? "Joining…" : "Accept & join"}
                        </button>
                        <button
                          type="button"
                          onClick={() => respond(inv, "DECLINED")}
                          disabled={busyId === inv.id}
                          className="inline-flex h-10 items-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-ink hover:bg-slate-200 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-ink-muted">
                        {inv.status === "ACCEPTED" ? "Accepted." : "Declined."}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
