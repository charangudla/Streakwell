"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type {
  ProfileAchievement,
  ProfileChallengeSummary,
  UserProfile,
} from "@/lib/web-types";

type PageProps = { params: Promise<{ id: string }> };

export default function UserProfilePage(props: PageProps) {
  return (
    <AuthGuard>
      <UserProfileInner {...props} />
    </AuthGuard>
  );
}

/**
 * Full profile surface for a Vital30 user — addressable at /users/[id].
 *
 *   Friend view  →  full data: stats row, active + completed challenges
 *                   with progress bars, shared-with-you list, badges
 *                   earned, Unfriend / Block actions at the bottom.
 *   Non-friend   →  minimal preview (name + join date + active/completed
 *                   counts) + Add-friend / Block actions, plus a hint
 *                   about what unlocks once they accept.
 *   Self view    →  full data (everyone counts as their own friend on
 *                   the server) + an Edit profile link.
 *
 * The friend gate is enforced server-side — full-tier lists arrive
 * only when isFriend === true on the response, so a client that
 * monkeys with the type doesn't see anything extra.
 */
function UserProfileInner({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/friends");
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await apiClient<UserProfile>(`/users/${id}/profile`);
      setProfile(res);
      setErr(null);
    } catch (e) {
      setErr(friendlyApiError(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFriend() {
    if (busy || !profile) return;
    setBusy(true);
    setActionErr(null);
    try {
      await apiClient("/friends/request", {
        method: "POST",
        body: { recipientId: profile.id },
      });
      await load();
    } catch (e) {
      setActionErr(friendlyApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function unfriend() {
    if (busy || !profile) return;
    if (typeof window !== "undefined" && !window.confirm("Remove this friend?")) {
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      // We don't have the friendshipId on this surface; the friends
      // list endpoint is the authoritative source — fetch + match.
      const { accepted } = await apiClient<{
        accepted: Array<{ friendshipId: string; user: { id: string } }>;
      }>("/friends");
      const match = accepted.find((a) => a.user.id === profile.id);
      if (!match) {
        setActionErr("This friendship wasn't found.");
        return;
      }
      await apiClient(`/friends/${match.friendshipId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setActionErr(friendlyApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (busy || !profile) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Block this user? They won't be able to send you friend requests.",
      )
    ) {
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      await apiClient("/friends/block", {
        method: "POST",
        body: { userId: profile.id },
      });
      router.push("/friends");
    } catch (e) {
      setActionErr(friendlyApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (err) {
    return (
      <section className="py-10">
        <Container className="max-w-2xl text-center">
          <p className="text-sm text-rose-700">{err}</p>
          <button
            type="button"
            onClick={goBack}
            className="mt-4 text-sm font-semibold text-brand-700"
          >
            ← Back
          </button>
        </Container>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="py-10">
        <Container className="max-w-2xl">
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        </Container>
      </section>
    );
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

        {/* Header card */}
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center sm:flex-row sm:gap-5 sm:text-left">
          <span className="grid h-20 w-20 flex-none place-items-center rounded-full bg-brand-700 text-2xl font-bold text-white">
            {initialsFrom(profile.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ink">{profile.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Vital30 member since{" "}
              {formatMonth(profile.joinedAt)}
            </p>
            {profile.isFriend && !profile.isSelf ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                ✓ Friends
              </span>
            ) : null}
          </div>
        </div>

        {/* Stats row — always visible */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Active" value={profile.activeChallengeCount} />
          <StatTile
            label="Completed"
            value={profile.completedChallengeCount}
          />
          {profile.isFriend ? (
            <>
              <StatTile
                label="Shared"
                value={profile.sharedChallengeCount ?? 0}
              />
              <StatTile
                label="Badges"
                value={profile.achievementsCount ?? 0}
              />
            </>
          ) : null}
        </div>

        {actionErr ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {actionErr}
          </p>
        ) : null}

        {/* Non-friend hint */}
        {!profile.isFriend ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-6 text-center">
            <p className="text-sm font-semibold text-ink">
              Want to see {profile.name.split(" ")[0]}&rsquo;s challenges
              and badges?
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Send a friend request — once they accept, you&rsquo;ll see
              what they&rsquo;re working on and the achievements
              they&rsquo;ve earned.
            </p>
            <button
              type="button"
              onClick={addFriend}
              disabled={busy}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              + Add friend
            </button>
          </div>
        ) : null}

        {/* Friend-only sections */}
        {profile.isFriend && profile.activeChallenges ? (
          <SectionHeader
            title="Active challenges"
            count={profile.activeChallenges.length}
          />
        ) : null}
        {profile.isFriend && profile.activeChallenges ? (
          profile.activeChallenges.length === 0 ? (
            <EmptyHint>Nothing in progress right now.</EmptyHint>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {profile.activeChallenges.map((c) => (
                <li key={c.challengeId}>
                  <ChallengeProgressCard summary={c} />
                </li>
              ))}
            </ul>
          )
        ) : null}

        {profile.isFriend && profile.sharedChallenges ? (
          <SectionHeader
            title="Challenges you share"
            count={profile.sharedChallenges.length}
            hint="You're both on these"
          />
        ) : null}
        {profile.isFriend && profile.sharedChallenges ? (
          profile.sharedChallenges.length === 0 ? (
            <EmptyHint>Nothing in common yet — join one together.</EmptyHint>
          ) : (
            <ul className="mt-3 space-y-2">
              {profile.sharedChallenges.map((c) => (
                <li
                  key={c.challengeId}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                    ✓
                  </span>
                  <p className="text-sm font-semibold text-ink">{c.title}</p>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {profile.isFriend && profile.completedChallenges ? (
          <SectionHeader
            title="Completed challenges"
            count={profile.completedChallenges.length}
          />
        ) : null}
        {profile.isFriend && profile.completedChallenges ? (
          profile.completedChallenges.length === 0 ? (
            <EmptyHint>No finished challenges yet.</EmptyHint>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {profile.completedChallenges.map((c) => (
                <li
                  key={c.challengeId}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <p className="text-sm font-bold text-ink">{c.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Finished {formatMonth(c.endDate ?? c.startDate)}
                  </p>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {profile.isFriend && profile.achievements ? (
          <SectionHeader
            title="Achievements earned"
            count={profile.achievements.length}
          />
        ) : null}
        {profile.isFriend && profile.achievements ? (
          profile.achievements.length === 0 ? (
            <EmptyHint>No badges yet — they&rsquo;re just getting started.</EmptyHint>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.achievements.map((a) => (
                <AchievementChip key={a.kind} achievement={a} />
              ))}
            </ul>
          )
        ) : null}

        {/* Footer actions — friend-only */}
        {profile.isFriend && !profile.isSelf ? (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <p className="text-xs text-ink-muted">
              Manage your relationship with {profile.name.split(" ")[0]}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={block}
                disabled={busy}
                className="rounded-full px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Block
              </button>
              <button
                type="button"
                onClick={unfriend}
                disabled={busy}
                className="rounded-full px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-slate-100 disabled:opacity-50"
              >
                Unfriend
              </button>
            </div>
          </div>
        ) : null}

        {profile.isSelf ? (
          <div className="mt-10 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs text-ink-muted">
              This is how your profile looks to friends.
            </p>
            <ButtonLink href="/profile" size="md" className="mt-3">
              Edit your profile
            </ButtonLink>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

// =========================================================================
// Sub-components
// =========================================================================

function SectionHeader({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="mt-8 flex items-baseline justify-between gap-3">
      <h2 className="text-base font-bold text-ink sm:text-lg">
        {title}{" "}
        <span className="text-sm font-normal text-ink-muted">· {count}</span>
      </h2>
      {hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-surface-soft px-4 py-3 text-xs text-ink-muted">
      {children}
    </p>
  );
}

function ChallengeProgressCard({
  summary,
}: {
  summary: ProfileChallengeSummary;
}) {
  const day = computeDayNumber(summary.startDate, summary.durationDays);
  const pct = Math.min(100, Math.max(0, summary.progressPercent));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Day {day} of {summary.durationDays}
      </p>
      <h3 className="mt-1 truncate text-base font-bold text-ink">
        {summary.title}
      </h3>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {Math.round(pct)}% complete
      </p>
    </div>
  );
}

function AchievementChip({ achievement }: { achievement: ProfileAchievement }) {
  // Friendly labels per kind. New AchievementKind values would fall
  // through to the raw enum string — visible but not pretty, which is
  // what we want as a "we forgot to update this" signal.
  const labels: Record<string, { label: string; glyph: string }> = {
    FIRST_CHECKIN: { label: "First check-in", glyph: "✓" },
    SEVEN_DAY_STREAK: { label: "7-day streak", glyph: "🔥" },
    TWENTY_ONE_DAY_STREAK: { label: "21-day streak", glyph: "💪" },
    CHALLENGE_COMPLETED: { label: "Challenge complete", glyph: "🏆" },
    THREE_CHALLENGES_COMPLETED: {
      label: "3 challenges done",
      glyph: "⭐",
    },
  };
  const meta = labels[achievement.kind] ?? {
    label: achievement.kind,
    glyph: "✦",
  };
  return (
    <li className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </li>
  );
}

// =========================================================================
// Helpers
// =========================================================================

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "·";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function computeDayNumber(start: string, totalDays: number): number {
  const startMs = new Date(start).getTime();
  const todayMs = Date.now();
  const diff = Math.floor((todayMs - startMs) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(totalDays, diff + 1));
}

function friendlyApiError(e: unknown): string {
  const err = e as { status?: number; message?: string };
  if (err.status === 401) return "Your session expired. Please sign in again.";
  if (err.status === 403) return "You don't have access to this profile.";
  if (err.status === 404)
    return "Profile not found — the user may have deleted their account.";
  if (err.status && err.status >= 500)
    return "The server hit an error. Try again shortly.";
  return err.message ?? "Something went wrong.";
}
