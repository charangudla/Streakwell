export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-brand-200/50 via-transparent to-sky-accent/20 blur-2xl"
      />
      <div className="relative aspect-[9/19] w-full rounded-[2.75rem] border-[10px] border-ink bg-ink p-2 shadow-2xl">
        <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-gradient-to-b from-brand-50 via-white to-white">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />

          <div className="flex h-full flex-col px-5 pb-5 pt-12">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Day 14 · 30 Days No Added Sugar
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">
              You&rsquo;re on a 6-day streak!
            </h3>

            <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Today&rsquo;s task
              </p>
              <p className="mt-1 text-sm font-medium text-ink">
                No sugar in coffee, snacks, or drinks today.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-brand-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm"
                >
                  Yes ✓
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-ink"
                >
                  Missed
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-ink"
                >
                  Skip
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Progress
                </p>
                <p className="text-xs font-medium text-ink-muted">14 / 30</p>
              </div>
              <p className="mt-1 text-xl font-bold text-ink">
                12 active days
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: "85%" }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 21 }).map((_, i) => {
                const state =
                  i === 5 || i === 12
                    ? "missed"
                    : i < 14
                      ? "completed"
                      : "pending";
                return (
                  <div
                    key={i}
                    className={
                      state === "completed"
                        ? "aspect-square rounded-md bg-brand-500"
                        : state === "missed"
                          ? "aspect-square rounded-md bg-rose-200"
                          : "aspect-square rounded-md bg-slate-100"
                    }
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
