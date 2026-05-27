"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { SITE_URL } from "@/lib/constants";
import type {
  ChallengeInvite,
  ChallengeJoiner,
  CustomChallenge,
} from "@/lib/web-types";

type PageProps = { params: Promise<{ id: string }> };

export default function ManagePage(props: PageProps) {
  return (
    <AuthGuard>
      <Inner {...props} />
    </AuthGuard>
  );
}

function Inner({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [challenge, setChallenge] = useState<CustomChallenge | null>(null);
  const [invites, setInvites] = useState<ChallengeInvite[]>([]);
  const [joiners, setJoiners] = useState<ChallengeJoiner[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const [list, inv, j] = await Promise.all([
        apiClient<CustomChallenge[]>("/custom-challenges/mine"),
        apiClient<ChallengeInvite[]>(`/custom-challenges/${id}/invites`),
        apiClient<ChallengeJoiner[]>(`/custom-challenges/${id}/joiners`),
      ]);
      const found = list.find((c) => c.id === id);
      if (!found) {
        setErr("Challenge not found.");
        return;
      }
      setChallenge(found);
      setInvites(inv);
      setJoiners(j);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (inviting) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await apiClient(`/custom-challenges/${id}/invites`, {
        method: "POST",
        body: { email: inviteEmail.trim() },
      });
      setInviteMsg(`Invited ${inviteEmail.trim()}.`);
      setInviteEmail("");
      await refresh();
    } catch (e) {
      if (e instanceof ApiClientError) setInviteMsg(e.bodyMessage);
      else setInviteMsg((e as Error).message);
    } finally {
      setInviting(false);
    }
  }

  async function toggleVisibility() {
    if (!challenge || busy) return;
    const next = challenge.visibility === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    setBusy(true);
    try {
      const updated = await apiClient<CustomChallenge>(
        `/custom-challenges/${id}`,
        { method: "PATCH", body: { visibility: next } },
      );
      setChallenge(updated);
    } finally {
      setBusy(false);
    }
  }

  async function softDelete() {
    if (!challenge || busy) return;
    if (
      !window.confirm(
        "Delete this challenge? Active participants will keep their progress, but no new people can join.",
      )
    )
      return;
    setBusy(true);
    try {
      await apiClient(`/custom-challenges/${id}`, { method: "DELETE" });
      router.replace("/my-created-challenges");
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-rose-700">{err}</p>
        <Link
          href="/my-created-challenges"
          className="mt-4 inline-block text-sm font-semibold text-brand-700"
        >
          ← Back
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

  const shareUrl = `${SITE_URL}/c/${challenge.inviteToken ?? ""}`;

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-3xl">
        <Link
          href="/my-created-challenges"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← All your challenges
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {challenge.title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {challenge.durationDays} days ·{" "}
              {challenge.visibility.toLowerCase()} · {challenge.difficulty.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Shareable link
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-ink">
              {shareUrl}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setInviteMsg("Link copied to clipboard.");
                setTimeout(() => setInviteMsg(null), 1800);
              }}
              className="inline-flex h-9 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-ink hover:bg-slate-200"
            >
              Copy
            </button>
            {typeof navigator !== "undefined" && navigator.share ? (
              <button
                type="button"
                onClick={() => {
                  navigator
                    .share({
                      title: challenge.title,
                      text: `Join my "${challenge.title}" challenge on Vital30:`,
                      url: shareUrl,
                    })
                    .catch(() => {});
                }}
                className="inline-flex h-9 items-center rounded-full bg-brand-500 px-3 text-xs font-semibold text-white hover:bg-brand-600"
              >
                Share
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Anyone with this link can join — even if the challenge is private.
          </p>
        </div>

        <form
          onSubmit={sendInvite}
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Invite by email
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              disabled={inviting}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {inviting ? "Sending…" : "Send invite"}
            </button>
          </div>
          {inviteMsg ? (
            <p className="mt-2 text-sm text-ink-muted">{inviteMsg}</p>
          ) : null}
          <p className="mt-2 text-xs text-ink-muted">
            We&rsquo;ll email them the share link. If they already have a
            Vital30 account, the invite also appears in their inbox.
          </p>
        </form>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Invites ({invites.length})
          </p>
          {invites.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">
              No invites yet. Add someone above or share the link.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {invites.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 py-3 text-sm"
                >
                  <span className="font-medium text-ink">{i.invitedEmail}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${i.status === "ACCEPTED" ? "bg-brand-50 text-brand-700" : i.status === "DECLINED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-ink-muted"}`}
                  >
                    {i.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Participants ({joiners.length})
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            People who joined — including via the share link, even if you
            didn&rsquo;t invite them by email.
          </p>
          {joiners.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              No one has joined yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {joiners.map((j) => (
                <li
                  key={j.userChallengeId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {j.name}{" "}
                      {j.isCreator ? (
                        <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          creator
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {j.activeDays} active day{j.activeDays === 1 ? "" : "s"} ·{" "}
                      {j.progressPercent.toFixed(0)}% · joined{" "}
                      {new Date(j.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${j.status === "COMPLETED" ? "bg-brand-50 text-brand-700" : j.status === "ABANDONED" ? "bg-slate-100 text-ink-muted" : "bg-streak/10 text-amber-700"}`}
                  >
                    {j.status.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={busy}
            className="inline-flex h-11 items-center rounded-full bg-slate-100 px-5 text-sm font-semibold text-ink hover:bg-slate-200 disabled:opacity-50"
          >
            {challenge.visibility === "PRIVATE"
              ? "Make public"
              : "Make private"}
          </button>
          <button
            type="button"
            onClick={softDelete}
            disabled={busy}
            className="inline-flex h-11 items-center rounded-full bg-rose-50 px-5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            Delete challenge
          </button>
        </div>
      </Container>
    </section>
  );
}
