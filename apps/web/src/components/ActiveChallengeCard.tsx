import Link from "next/link";
import { dayNumber } from "@/lib/progress";
import type { UserChallenge } from "@/lib/web-types";

/**
 * Compact card for an in-progress UserChallenge. Used on /dashboard
 * (hero + grid layouts) and on /challenges' "Your challenges" carousel
 * so a logged-in user can hop straight to today's check-in from either
 * surface.
 *
 * Colour scheme reflects today's check-in status so the user can scan
 * a grid of these and see at a glance which ones still need attention:
 *
 *   todayCheckinStatus === null         → "action needed" treatment:
 *                                          white card + brand-tinted
 *                                          border + amber CTA dot,
 *                                          accent text "Check in
 *                                          today →".
 *   todayCheckinStatus === COMPLETED    → "done" treatment: brand-50
 *                                          bg, brand-400 border, "Day N
 *                                          done ✓" label, no CTA.
 *   todayCheckinStatus === MISSED       → "missed" treatment: rose-50
 *                                          bg, rose-200 border, "Day N
 *                                          marked missed" label.
 *   todayCheckinStatus === SKIPPED      → "skipped" treatment: slate-50
 *                                          bg, slate-200 border, "Day N
 *                                          skipped" label.
 *
 * Pure presentational — no data fetching. The caller hands in a
 * UserChallenge that already has `challenge` + `todayCheckinStatus`
 * embedded (the /user-challenges endpoint includes both).
 */
export function ActiveChallengeCard({ uc }: { uc: UserChallenge }) {
  const c = uc.challenge;
  const day = dayNumber(uc.startDate, c.durationDays);
  const pct = Math.min(100, Math.max(0, uc.progressPercent));
  const variant = pickVariant(uc.todayCheckinStatus);

  return (
    <Link
      href={`/my-challenges/${uc.id}/progress`}
      className={`group block h-full rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${variant.card}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${variant.eyebrow}`}>
        Day {day} of {c.durationDays}
      </p>
      <h3 className={`mt-1 text-lg font-bold text-ink group-hover:text-brand-700`}>
        {c.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{c.dailyTask}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${variant.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${variant.cta}`}>
        <span
          aria-hidden="true"
          className={`inline-block h-2 w-2 rounded-full ${variant.dot}`}
        />
        {variant.label(day)}
      </p>
    </Link>
  );
}

type Variant = {
  card: string;
  eyebrow: string;
  bar: string;
  cta: string;
  dot: string;
  label: (day: number) => string;
};

function pickVariant(status: UserChallenge["todayCheckinStatus"]): Variant {
  // Action-needed: most prominent — bright brand border, amber dot,
  // explicit "Check in today" CTA — so the user's eye lands here first
  // in a grid of mixed states.
  if (status === null) {
    return {
      card: "border-slate-200 bg-white hover:border-brand-300",
      eyebrow: "text-brand-700",
      bar: "bg-brand-500",
      cta: "text-brand-700",
      dot: "bg-streak animate-pulse",
      label: () => "Check in today →",
    };
  }
  if (status === "COMPLETED") {
    return {
      card: "border-brand-300 bg-brand-50 hover:border-brand-500",
      eyebrow: "text-brand-700",
      bar: "bg-brand-500",
      cta: "text-brand-700",
      dot: "bg-brand-500",
      label: (day) => `Day ${day} done`,
    };
  }
  if (status === "MISSED") {
    return {
      card: "border-rose-200 bg-rose-50 hover:border-rose-300",
      eyebrow: "text-rose-700",
      bar: "bg-rose-400",
      cta: "text-rose-700",
      dot: "bg-rose-400",
      label: (day) => `Day ${day} missed`,
    };
  }
  // SKIPPED
  return {
    card: "border-slate-200 bg-slate-50 hover:border-slate-300",
    eyebrow: "text-ink-muted",
    bar: "bg-slate-400",
    cta: "text-ink-muted",
    dot: "bg-slate-400",
    label: (day) => `Day ${day} skipped`,
  };
}
