import Link from "next/link";
import { dayNumber } from "@/lib/progress";
import type { UserChallenge } from "@/lib/web-types";

/**
 * Compact card for an in-progress UserChallenge. Used on /dashboard's
 * "Your other active challenges" grid and on /challenges' "Your
 * challenges" carousel so a logged-in user can hop straight to today's
 * check-in from either surface.
 *
 * Pure presentational — no data fetching. The caller hands in a
 * UserChallenge that already has `challenge` embedded (the
 * /user-challenges endpoint includes it).
 */
export function ActiveChallengeCard({ uc }: { uc: UserChallenge }) {
  const c = uc.challenge;
  const day = dayNumber(uc.startDate, c.durationDays);
  const pct = Math.min(100, Math.max(0, uc.progressPercent));
  return (
    <Link
      href={`/my-challenges/${uc.id}/checkin`}
      className="group block h-full rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Day {day} of {c.durationDays}
      </p>
      <h3 className="mt-1 text-lg font-bold text-ink group-hover:text-brand-700">
        {c.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{c.dailyTask}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-brand-700">
        Check in today →
      </p>
    </Link>
  );
}
