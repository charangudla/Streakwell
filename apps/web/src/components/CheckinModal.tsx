"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { CheckinStatus } from "@/lib/web-types";

interface Props {
  open: boolean;
  /** Called when the modal should be dismissed (X / backdrop / Esc). */
  onClose: () => void;
  userChallengeId: string;
  challengeTitle: string;
  dailyTask: string;
  /** The day number being checked in (1-based). Today by default; any
   *  past day if the user is editing from the calendar. */
  dayNumber: number;
  /**
   * ISO date (YYYY-MM-DD) for the day being checked in. The backend
   * upserts on (userChallengeId, checkinDate) so passing the right
   * date is what makes "edit Day 3" work — without it every submit
   * would write to today.
   */
  checkinDateIso: string;
  /** True when the modal represents today. Drives copy ("today's
   *  task" vs "Day 3"). */
  isToday: boolean;
  /**
   * Existing status for this day, if any. When set the modal
   * pre-highlights the matching button and switches copy to "Change
   * Day N status" so the user sees they're editing, not creating.
   */
  currentStatus?: CheckinStatus;
  /**
   * Fires after a successful POST /checkins. The progress page uses
   * this to refetch checkins so the calendar + stats update before
   * the user closes the modal — that way "close" lands them on an
   * up-to-date page, not a stale one.
   */
  onSubmitted: (status: CheckinStatus) => void;
}

/**
 * In-modal check-in flow. Two visual states inside one dialog:
 *
 *   1. Form        — the user picks Completed / Missed / Skipped.
 *   2. Result      — celebratory / supportive feedback for that pick,
 *                    with a "Done" button that closes the modal.
 *
 * We deliberately keep the celebration on the SAME surface (instead of
 * navigating to a /checkin success page) so the user sees the change
 * land on the progress view the moment they close the dialog —
 * tight feedback loop, no full-page nav.
 *
 * Backdrop click + Esc dismiss the modal but ONLY when no submission is
 * in flight; mid-submit dismissal would leave the user wondering
 * whether the check-in actually saved.
 */
export function CheckinModal({
  open,
  onClose,
  userChallengeId,
  challengeTitle,
  dailyTask,
  dayNumber: day,
  checkinDateIso,
  isToday,
  currentStatus,
  onSubmitted,
}: Props) {
  const [submitting, setSubmitting] = useState<CheckinStatus | null>(null);
  const [result, setResult] = useState<CheckinStatus | null>(null);
  // `challengeComplete` is true when the just-submitted COMPLETED
  // check-in pushed the user over the durationDays threshold — used
  // to swap the routine "Nice work" result panel for a bigger
  // "Challenge complete!" celebration. Comes from the API response.
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  // Reset the modal each time it's opened — otherwise the user would
  // see last session's result flash before the form renders.
  useEffect(() => {
    if (open) {
      setSubmitting(null);
      setResult(null);
      setChallengeComplete(false);
      setErr(null);
    }
  }, [open]);

  // Esc-to-close + focus the primary action on open. The focus call
  // matters for keyboard users; without it focus stays on the trigger
  // button behind the backdrop.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    // Defer focus to the next tick so the element is actually in the DOM.
    const t = window.setTimeout(() => firstButtonRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, submitting, onClose]);

  // Lock body scroll while open so the backdrop doesn't appear to slide
  // when the user scrolls the page underneath.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function checkin(status: CheckinStatus) {
    if (submitting !== null) return;
    setSubmitting(status);
    setErr(null);
    try {
      // Always pass checkinDate so backend upserts on the right day.
      // For "today" we could omit it (backend would default), but
      // sending it explicitly keeps the wire format consistent and
      // sidesteps any client/server clock drift.
      const res = await apiClient<{ challengeComplete?: boolean }>(
        "/checkins",
        {
          method: "POST",
          body: { userChallengeId, status, checkinDate: checkinDateIso },
        },
      );
      // `challengeComplete` is true when this check-in pushed the
      // user over their durationDays. Backend also flips the
      // userChallenge.status to COMPLETED in the background; the
      // /progress page picks that up on next refetch.
      setChallengeComplete(!!res?.challengeComplete);
      setResult(status);
      onSubmitted(status);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(null);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (submitting) return;
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      role="presentation"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-modal-title"
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* Close button — top right, always present so the user can
            bail out at any stage (other than mid-submit). */}
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting !== null}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-slate-100 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {result === null ? (
          <CheckinForm
            day={day}
            isToday={isToday}
            challengeTitle={challengeTitle}
            dailyTask={dailyTask}
            currentStatus={currentStatus}
            submitting={submitting}
            err={err}
            onPick={checkin}
            firstButtonRef={firstButtonRef}
          />
        ) : (
          <CheckinResult
            result={result}
            day={day}
            challengeComplete={challengeComplete}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// =========================================================================
// Form state
// =========================================================================

function CheckinForm({
  day,
  isToday,
  challengeTitle,
  dailyTask,
  currentStatus,
  submitting,
  err,
  onPick,
  firstButtonRef,
}: {
  day: number;
  isToday: boolean;
  challengeTitle: string;
  dailyTask: string;
  currentStatus?: CheckinStatus;
  submitting: CheckinStatus | null;
  err: string | null;
  onPick: (s: CheckinStatus) => void;
  firstButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  // Heading switches between three modes — today new, today edit, past
  // day edit — so the user always understands what surface they're on.
  const heading = currentStatus
    ? `Change Day ${day} status`
    : isToday
      ? "Did you complete today’s task?"
      : `Log Day ${day}`;

  return (
    <div className="px-6 pb-6 sm:px-8 sm:pb-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Day {day} · {challengeTitle}
      </p>
      <h2
        id="checkin-modal-title"
        className="mt-2 text-2xl font-bold text-ink sm:text-3xl"
      >
        {heading}
      </h2>
      <p className="mt-3 text-base text-ink-muted">{dailyTask}</p>

      {currentStatus ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              currentStatus === "COMPLETED"
                ? "bg-brand-500"
                : currentStatus === "MISSED"
                  ? "bg-rose-400"
                  : "bg-slate-400"
            }`}
            aria-hidden="true"
          />
          Currently: {currentStatus.toLowerCase()}
        </p>
      ) : null}

      {err ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {err}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <button
          ref={firstButtonRef}
          type="button"
          onClick={() => onPick("COMPLETED")}
          disabled={submitting !== null}
          aria-pressed={currentStatus === "COMPLETED"}
          className={`inline-flex h-14 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold transition-colors disabled:opacity-50 ${
            currentStatus === "COMPLETED"
              ? "bg-brand-700 text-white ring-2 ring-brand-700 ring-offset-2 hover:bg-brand-700"
              : "bg-brand-500 text-white hover:bg-brand-600"
          }`}
        >
          {submitting === "COMPLETED"
            ? "Saving…"
            : currentStatus === "COMPLETED"
              ? "Completed ✓ (current)"
              : "Yes, completed ✓"}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPick("MISSED")}
            disabled={submitting !== null}
            aria-pressed={currentStatus === "MISSED"}
            className={`inline-flex h-12 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              currentStatus === "MISSED"
                ? "border-rose-400 bg-rose-100 text-rose-800 ring-2 ring-rose-400 ring-offset-2"
                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            {submitting === "MISSED"
              ? "Saving…"
              : currentStatus === "MISSED"
                ? "Missed (current)"
                : isToday
                  ? "No, missed today"
                  : "Mark as missed"}
          </button>
          <button
            type="button"
            onClick={() => onPick("SKIPPED")}
            disabled={submitting !== null}
            aria-pressed={currentStatus === "SKIPPED"}
            className={`inline-flex h-12 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
              currentStatus === "SKIPPED"
                ? "border-slate-400 bg-slate-100 text-ink ring-2 ring-slate-400 ring-offset-2"
                : "border-slate-200 bg-white text-ink-muted hover:bg-slate-50"
            }`}
          >
            {submitting === "SKIPPED"
              ? "Saving…"
              : currentStatus === "SKIPPED"
                ? "Skipped (current)"
                : "Skip"}
          </button>
        </div>
      </div>

      <p className="mt-5 text-xs text-ink-muted">
        {currentStatus
          ? "Pick a new status to overwrite this day."
          : "Missing a day breaks your current streak — but never erases your active days."}
      </p>
    </div>
  );
}

// =========================================================================
// Result state — feedback for what they picked
// =========================================================================

function CheckinResult({
  result,
  day,
  challengeComplete,
  onClose,
}: {
  result: CheckinStatus;
  day: number;
  challengeComplete: boolean;
  onClose: () => void;
}) {
  // Final-day celebration takes precedence over the routine "Nice
  // work" panel — only fires when the COMPLETED check-in just pushed
  // the user over their durationDays threshold.
  if (result === "COMPLETED" && challengeComplete) {
    return (
      <ResultPanel
        accent="from-amber-400 via-amber-500 to-amber-600"
        textTone="text-amber-950"
        subTone="text-amber-900"
        iconBg="bg-white/30"
        icon={<TrophyGlyph className="h-9 w-9 text-amber-950" />}
        eyebrow="Challenge complete"
        title="You did it!"
        body={`Day ${day} logged. That's the whole challenge — every cell on your calendar is yours. Take a moment to be proud of this.`}
        onClose={onClose}
        closeStyle="bg-amber-950 text-amber-50 hover:bg-amber-900"
      />
    );
  }
  if (result === "COMPLETED") {
    return (
      <ResultPanel
        accent="from-brand-500 to-brand-700"
        textTone="text-white"
        subTone="text-brand-50"
        iconBg="bg-white/20"
        icon={<CheckGlyph className="h-8 w-8 text-white" />}
        eyebrow={`Day ${day} done`}
        title="Nice work."
        body="One more day toward better habits. See you tomorrow."
        onClose={onClose}
        closeStyle="bg-white text-brand-700 hover:bg-brand-50"
      />
    );
  }
  if (result === "MISSED") {
    return (
      <ResultPanel
        accent="from-rose-50 to-white"
        textTone="text-ink"
        subTone="text-ink-muted"
        iconBg="bg-rose-100"
        icon={<HeartGlyph className="h-7 w-7 text-rose-600" />}
        eyebrow={`Day ${day}`}
        title="That’s okay."
        body="Recovery matters. Your active days are safe — come back tomorrow."
        onClose={onClose}
        closeStyle="bg-brand-500 text-white hover:bg-brand-600"
      />
    );
  }
  // SKIPPED
  return (
    <ResultPanel
      accent="from-slate-50 to-white"
      textTone="text-ink"
      subTone="text-ink-muted"
      iconBg="bg-slate-100"
      icon={<PauseGlyph className="h-7 w-7 text-slate-600" />}
      eyebrow={`Day ${day}`}
      title="Skipped today."
      body="Your streak is paused but your active days are safe."
      onClose={onClose}
      closeStyle="bg-brand-500 text-white hover:bg-brand-600"
    />
  );
}

function ResultPanel({
  accent,
  textTone,
  subTone,
  iconBg,
  icon,
  eyebrow,
  title,
  body,
  onClose,
  closeStyle,
}: {
  accent: string;
  textTone: string;
  subTone: string;
  iconBg: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  onClose: () => void;
  closeStyle: string;
}) {
  return (
    <div
      className={`mx-3 mb-3 rounded-2xl bg-gradient-to-br ${accent} p-6 text-center sm:mx-4 sm:mb-4 sm:p-8`}
    >
      <div
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${iconBg}`}
      >
        {icon}
      </div>
      <p
        className={`mt-4 text-xs font-bold uppercase tracking-wide ${subTone}`}
      >
        {eyebrow}
      </p>
      <h2
        id="checkin-modal-title"
        className={`mt-2 text-3xl font-bold ${textTone}`}
      >
        {title}
      </h2>
      <p className={`mt-3 text-sm sm:text-base ${subTone}`}>{body}</p>
      <button
        type="button"
        onClick={onClose}
        className={`mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold ${closeStyle}`}
      >
        Done
      </button>
    </div>
  );
}

// =========================================================================
// Glyphs
// =========================================================================

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HeartGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s-7-4.5-9.5-9.5C.5 7 4 3 7.5 4.5 9.5 5.3 11 7 12 8.5 13 7 14.5 5.3 16.5 4.5 20 3 23.5 7 21.5 11.5 19 16.5 12 21 12 21z" />
    </svg>
  );
}

function TrophyGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 6h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 6H5a2 2 0 0 0 0 4h2" />
    </svg>
  );
}

function PauseGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
