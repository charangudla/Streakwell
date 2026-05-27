"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/lib/web-types";

interface Props {
  /** User to look up. Pass null/undefined to NOT mount the modal. */
  userId: string;
  onClose: () => void;
  /**
   * Action buttons rendered at the bottom of the modal. Customised
   * per caller — pending-request rows want Accept / Decline / Block;
   * accepted-friend rows want Unfriend / Block. The friends inbox
   * passes its existing handlers down.
   */
  actions?: React.ReactNode;
  /**
   * When true, hide the friend-tier sections even if the API
   * returns them. Used for pending-request previews where the
   * viewer hasn't accepted yet — we keep the surface minimal.
   * Defaults to false; the API gate already prevents leaking
   * full-tier fields to non-friends, so this is purely cosmetic.
   */
  forceMinimal?: boolean;
}

/**
 * Profile preview modal — single component that adapts based on the
 * viewer ↔ target friendship.
 *
 *   Pending request OR not friends   → minimal "is this a real person
 *                                       I want to friend?" preview
 *                                       (name, joined date, two
 *                                       challenge counts).
 *   Accepted friend OR self          → full preview (adds shared
 *                                       challenge count + achievements
 *                                       count).
 *
 * The API gates the friend-only fields at the source; this component
 * just renders what came back. `forceMinimal` lets the friends inbox
 * tell us "I know they're not friends — don't render the friend
 * tier even if the server happens to return them" (for self-views
 * mainly).
 */
export function UserProfileModal({
  userId,
  onClose,
  actions,
  forceMinimal = false,
}: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient<UserProfile>(`/users/${userId}/profile`);
        if (!cancelled) setProfile(res);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Esc-to-close + body-scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const showFullTier =
    !forceMinimal && profile?.isFriend === true && !profile?.isSelf;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              Couldn&rsquo;t load this profile.
            </p>
          ) : profile === null ? (
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-44 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 flex-none place-items-center rounded-full bg-brand-700 text-lg font-bold text-white">
                  {initialsFrom(profile.name)}
                </span>
                <div className="min-w-0">
                  <h2
                    id="profile-modal-title"
                    className="text-xl font-bold text-ink"
                  >
                    {profile.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Vital30 member since{" "}
                    {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Preview tier — always visible. Two compact tiles so
                  the eye can scan engagement at a glance. */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <StatPill
                  label="Active"
                  value={profile.activeChallengeCount}
                />
                <StatPill
                  label="Completed"
                  value={profile.completedChallengeCount}
                />
              </div>

              {/* Full tier — friends + self only. */}
              {showFullTier ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <StatPill
                    label="Shared"
                    value={profile.sharedChallengeCount ?? 0}
                    hint="Challenges you both joined"
                  />
                  <StatPill
                    label="Achievements"
                    value={profile.achievementsCount ?? 0}
                    hint="Badges they've earned"
                  />
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-surface-soft px-4 py-3 text-xs text-ink-muted">
                  Accept this request to see {profile.name.split(" ")[0]}
                  &rsquo;s shared challenges, achievements, and more.
                </p>
              )}

              {actions ? (
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  {actions}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xl font-semibold text-ink">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "·";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
