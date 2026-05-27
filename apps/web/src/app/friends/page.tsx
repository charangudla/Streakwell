"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { FriendList, FriendListEntry } from "@/lib/web-types";

export default function FriendsPage() {
  return (
    <AuthGuard>
      <FriendsInner />
    </AuthGuard>
  );
}

/**
 * Friends inbox. Three sections in priority order:
 *
 *   1. Incoming requests   — most actionable, render at top with
 *                            Accept / Decline buttons.
 *   2. Accepted friends    — list of current friends; each row has
 *                            an Unfriend button. (Inviting them to
 *                            challenges happens from the chat
 *                            Members sheet — keeps the actions in
 *                            one place.)
 *   3. Outgoing requests   — what you've sent that hasn't been
 *                            answered yet; Cancel button per row.
 *
 * DECLINED rows are filtered server-side — neither party sees them.
 */
function FriendsInner() {
  const router = useRouter();
  const [data, setData] = useState<FriendList | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  /** Smart back — history if available, otherwise /dashboard. */
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await apiClient<FriendList>("/friends");
      // Defensive default for `blocked` — if the API hasn't been
      // restarted to include the new field, we still render the
      // other three sections instead of crashing on undefined.length.
      setData({ ...res, blocked: res.blocked ?? [] });
      setErr(null);
    } catch (e) {
      setErr(friendlyApiError(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(
    friendshipId: string,
    decision: "ACCEPTED" | "DECLINED",
  ) {
    if (busyId !== null) return;
    setBusyId(friendshipId);
    try {
      await apiClient(`/friends/${friendshipId}/respond`, {
        method: "POST",
        body: { decision },
      });
      await load();
    } catch (e) {
      setErr(friendlyApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function unfriend(friendshipId: string) {
    if (busyId !== null) return;
    // Guard with a quick confirm — unfriend is a one-way action on
    // this surface (re-adding is a friend-request round-trip).
    if (typeof window !== "undefined") {
      const ok = window.confirm("Remove this friend?");
      if (!ok) return;
    }
    setBusyId(friendshipId);
    try {
      await apiClient(`/friends/${friendshipId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setErr(friendlyApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function block(userId: string) {
    if (busyId !== null) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Block this user? They won't be able to send you friend requests.",
      );
      if (!ok) return;
    }
    setBusyId(userId);
    try {
      await apiClient("/friends/block", {
        method: "POST",
        body: { userId },
      });
      await load();
    } catch (e) {
      setErr(friendlyApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function unblock(friendshipId: string) {
    if (busyId !== null) return;
    setBusyId(friendshipId);
    try {
      await apiClient(`/friends/${friendshipId}/unblock`, {
        method: "POST",
      });
      await load();
    } catch (e) {
      setErr(friendlyApiError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="py-8 sm:py-10">
      <Container className="max-w-2xl">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Back
        </button>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Challenge friends
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Connect with people you meet in challenge chats. Once you&rsquo;re
          friends, you can invite each other to your custom challenges.
        </p>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {data === null ? (
          <div className="mt-6 space-y-2">
            <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
        ) : data.accepted.length === 0 &&
          data.incoming.length === 0 &&
          data.outgoing.length === 0 &&
          data.blocked.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No friends yet
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Open any challenge&rsquo;s chat, tap Members, and send a
              friend request to someone you want to challenge together.
            </p>
            <ButtonLink href="/chat" size="md" className="mt-6">
              Open chats
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {data.incoming.length > 0 ? (
              <Section
                title="Pending requests"
                count={data.incoming.length}
                tone="action"
              >
                {data.incoming.map((fr) => (
                  <IncomingRow
                    key={fr.friendshipId}
                    entry={fr}
                    busy={busyId === fr.friendshipId || busyId === fr.user.id}
                    onAccept={() => respond(fr.friendshipId, "ACCEPTED")}
                    onDecline={() => respond(fr.friendshipId, "DECLINED")}
                    onBlock={() => block(fr.user.id)}
                  />
                ))}
              </Section>
            ) : null}

            {data.accepted.length > 0 ? (
              <Section title="Friends" count={data.accepted.length}>
                {data.accepted.map((fr) => (
                  <AcceptedRow
                    key={fr.friendshipId}
                    entry={fr}
                    busy={busyId === fr.friendshipId || busyId === fr.user.id}
                    onUnfriend={() => unfriend(fr.friendshipId)}
                    onBlock={() => block(fr.user.id)}
                  />
                ))}
              </Section>
            ) : null}

            {data.outgoing.length > 0 ? (
              <Section title="Sent" count={data.outgoing.length}>
                {data.outgoing.map((fr) => (
                  <OutgoingRow
                    key={fr.friendshipId}
                    entry={fr}
                    busy={busyId === fr.friendshipId}
                    onCancel={() => unfriend(fr.friendshipId)}
                  />
                ))}
              </Section>
            ) : null}

            {data.blocked.length > 0 ? (
              <Section title="Blocked" count={data.blocked.length}>
                {data.blocked.map((fr) => (
                  <BlockedRow
                    key={fr.friendshipId}
                    entry={fr}
                    busy={busyId === fr.friendshipId}
                    onUnblock={() => unblock(fr.friendshipId)}
                  />
                ))}
              </Section>
            ) : null}
          </div>
        )}
      </Container>
    </section>
  );
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone?: "action";
  children: React.ReactNode;
}) {
  const headingClass =
    tone === "action" ? "text-brand-700" : "text-ink-muted";
  return (
    <section>
      <h2
        className={`text-xs font-bold uppercase tracking-wide ${headingClass}`}
      >
        {title} <span className="font-normal">· {count}</span>
      </h2>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">
      {initials || "·"}
    </span>
  );
}

function IncomingRow({
  entry,
  busy,
  onAccept,
  onDecline,
  onBlock,
}: {
  entry: FriendListEntry;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onBlock: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <Avatar name={entry.user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {entry.user.name}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Wants to be your challenge friend
        </p>
      </div>
      <div className="flex flex-none flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onBlock}
          disabled={busy}
          className="rounded-full bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
        >
          Block
        </button>
        <button
          type="button"
          onClick={onDecline}
          disabled={busy}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-muted ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {busy ? "…" : "Accept"}
        </button>
      </div>
    </li>
  );
}

function AcceptedRow({
  entry,
  busy,
  onUnfriend,
  onBlock,
}: {
  entry: FriendListEntry;
  busy: boolean;
  onUnfriend: () => void;
  onBlock: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Avatar name={entry.user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {entry.user.name}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Friends since{" "}
          {new Date(entry.respondedAt ?? entry.createdAt).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" },
          )}
        </p>
      </div>
      <div className="flex flex-none gap-1">
        <button
          type="button"
          onClick={onUnfriend}
          disabled={busy}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-slate-100 disabled:opacity-50"
        >
          Unfriend
        </button>
        <button
          type="button"
          onClick={onBlock}
          disabled={busy}
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          Block
        </button>
      </div>
    </li>
  );
}

function OutgoingRow({
  entry,
  busy,
  onCancel,
}: {
  entry: FriendListEntry;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-surface-soft p-4">
      <Avatar name={entry.user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {entry.user.name}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">Waiting for response</p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-slate-100 disabled:opacity-50"
      >
        Cancel
      </button>
    </li>
  );
}

function BlockedRow({
  entry,
  busy,
  onUnblock,
}: {
  entry: FriendListEntry;
  busy: boolean;
  onUnblock: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-slate-400 text-xs font-bold text-white">
        ✕
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {entry.user.name}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Blocked. They can&rsquo;t send you friend requests.
        </p>
      </div>
      <button
        type="button"
        onClick={onUnblock}
        disabled={busy}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
      >
        Unblock
      </button>
    </li>
  );
}


/**
 * Turn an apiClient error into a sentence the user can actually act
 * on. The raw `(e as Error).message` for a 404 NestJS response is
 * literally "Cannot GET /friends", which looked alarming + cryptic in
 * the UI. This wraps the common failure modes (auth lapse, server
 * not reachable, server not on the new code) in friendlier copy.
 */
function friendlyApiError(e: unknown): string {
  const err = e as { status?: number; message?: string };
  if (err.status === 401) {
    return "Your session expired. Please sign in again.";
  }
  if (err.status === 403) {
    return "You don't have access to this.";
  }
  if (err.status === 404) {
    return "We couldn't reach the server. Try reloading — if the issue persists, the API may need a restart.";
  }
  if (err.status && err.status >= 500) {
    return "The server hit an error. Please try again in a moment.";
  }
  return err.message ?? "Something went wrong.";
}
