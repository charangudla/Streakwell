import type { ReactNode } from "react";

type AppScreenshotProps = {
  title: string;
  caption: string;
  children: ReactNode;
};

export function AppScreenshot({ title, caption, children }: AppScreenshotProps) {
  return (
    <figure className="flex flex-col items-center">
      <div className="relative w-full max-w-[260px]">
        <div className="aspect-[9/19] w-full rounded-[2rem] border-[8px] border-ink bg-ink p-1.5 shadow-xl">
          <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-brand-50 via-white to-white">
            <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-ink" />
            <div className="flex h-full flex-col px-4 pb-4 pt-8">{children}</div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs text-ink-muted">{caption}</p>
      </figcaption>
    </figure>
  );
}

export function HomeScreenshot() {
  return (
    <AppScreenshot
      title="Home"
      caption="Recommended + popular challenges, plus your active check-ins."
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Good morning
      </p>
      <h3 className="mt-0.5 text-base font-bold text-ink">Ready for Day 7?</h3>
      <div className="mt-3 rounded-xl bg-brand-500 p-3 text-white shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-100">
          Check in today
        </p>
        <p className="mt-1 text-sm font-semibold">30 Days Walking</p>
        <p className="text-[10px] text-brand-100">Day 7 of 30</p>
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        Recommended
      </p>
      <div className="mt-1.5 space-y-1.5">
        {["30 Days Meditation", "30 Days Hydration"].map((t) => (
          <div
            key={t}
            className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-100"
          >
            <p className="text-xs font-semibold text-ink">{t}</p>
            <p className="text-[10px] text-ink-muted">Beginner · 30 days</p>
          </div>
        ))}
      </div>
    </AppScreenshot>
  );
}

export function CheckinScreenshot() {
  return (
    <AppScreenshot
      title="Daily check-in"
      caption="One tap per day. Missed counts too — recovery matters."
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Day 12 · 30 Days No Added Sugar
      </p>
      <h3 className="mt-2 text-base font-bold leading-tight text-ink">
        Did you complete today&rsquo;s task?
      </h3>
      <p className="mt-1.5 text-[11px] text-ink-muted">
        No sugar in coffee, snacks, or drinks today.
      </p>
      <div className="mt-4 space-y-2">
        <button
          type="button"
          className="w-full rounded-xl bg-brand-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm"
        >
          Yes, completed
        </button>
        <button
          type="button"
          className="w-full rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-ink"
        >
          No, missed today
        </button>
        <button
          type="button"
          className="w-full rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-ink"
        >
          Skip today
        </button>
      </div>
      <p className="mt-4 text-[10px] text-ink-muted">
        Missing a day breaks your streak but never erases your active days.
      </p>
    </AppScreenshot>
  );
}

export function ProgressScreenshot() {
  return (
    <AppScreenshot
      title="Progress"
      caption="30-day calendar with active days, missed days, and streaks."
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Progress · Day 18
      </p>
      <p className="mt-1 text-xl font-bold text-ink">15 active days</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="rounded-md bg-streak/15 px-2 py-1.5 font-semibold text-amber-700">
          5-day streak
        </div>
        <div className="rounded-md bg-brand-50 px-2 py-1.5 font-semibold text-brand-700">
          Best: 8 days
        </div>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1">
        {Array.from({ length: 30 }).map((_, i) => {
          const tone =
            i === 6 || i === 14
              ? "bg-rose-200"
              : i < 18
                ? "bg-brand-500"
                : "bg-slate-100";
          return (
            <div
              key={i}
              className={`aspect-square rounded ${tone}`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      <button
        type="button"
        className="mt-4 rounded-xl bg-ink px-3 py-2 text-[11px] font-semibold text-white"
      >
        Share progress
      </button>
    </AppScreenshot>
  );
}
