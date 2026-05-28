"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type {
  Category,
} from "@/lib/types";
import type {
  Gender,
  MeAccount,
  PrimaryGoal,
  UnitPreference,
} from "@/lib/web-types";

export default function WelcomePage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <WelcomeInner />
      </Suspense>
    </AuthGuard>
  );
}

const GOALS: Array<{ value: PrimaryGoal; label: string; emoji: string }> = [
  { value: "LOSE_WEIGHT", label: "Lose weight", emoji: "⚖️" },
  { value: "BUILD_FITNESS", label: "Get fitter & stronger", emoji: "💪" },
  { value: "EAT_BETTER", label: "Eat better", emoji: "🥗" },
  { value: "BETTER_SLEEP", label: "Sleep better", emoji: "😴" },
  { value: "MENTAL_WELLNESS", label: "Mental wellness", emoji: "🧘" },
  { value: "BREAK_HABIT", label: "Break a bad habit", emoji: "🚭" },
  { value: "GENERAL_WELLNESS", label: "General wellness", emoji: "✨" },
];

const TIME_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hr+" },
];

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

/**
 * Skippable post-signup welcome flow. Two steps:
 *   1. Goals    — primary goal + interest categories + daily minutes
 *                 (drives challenge recommendations)
 *   2. About you — gender, date of birth, height, weight (with a
 *                 metric/imperial toggle)
 *
 * Every step can be skipped; "Skip for now" on either step jumps
 * straight to finish. We PATCH whatever the user DID fill, and always
 * stamp markOnboardingComplete so this flow doesn't reappear — the
 * user can complete the rest from /profile any time.
 *
 * Reached via /register's post-signup redirect. `?next=` is honoured
 * so a share-link signup (/c/<token> → register → welcome) still lands
 * back at the join after onboarding.
 */
function WelcomeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next")) ?? "/dashboard";

  const [step, setStep] = useState<1 | 2>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — goals
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);

  // Step 2 — about you
  const [unit, setUnit] = useState<UnitPreference>("METRIC");
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthYear, setBirthYear] = useState(""); // year only (minimised)
  const [cm, setCm] = useState(""); // metric height
  const [kg, setKg] = useState(""); // metric weight
  const [ft, setFt] = useState(""); // imperial height
  const [inches, setInches] = useState("");
  const [lb, setLb] = useState(""); // imperial weight

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch categories (for the interest picker) + the user's
        // current profile in parallel. Pre-filling from /users/me
        // means this same flow works as an EDITOR when reached from
        // the profile's "Edit details" link, not just first-run.
        const [cats, me] = await Promise.all([
          apiClient<Category[]>("/categories"),
          apiClient<MeAccount>("/users/me").catch(() => null),
        ]);
        if (cancelled) return;
        setCategories(cats);
        if (me) {
          if (me.primaryGoal) setPrimaryGoal(me.primaryGoal);
          if (me.interestCategoryIds.length)
            setInterests(new Set(me.interestCategoryIds));
          if (me.dailyMinutes) setDailyMinutes(me.dailyMinutes);
          if (me.gender) setGender(me.gender);
          if (me.birthYear) setBirthYear(String(me.birthYear));
          setUnit(me.unitPreference);
          // Seed the unit-appropriate inputs from the stored metric
          // values so an editor shows what's already saved.
          if (me.unitPreference === "METRIC") {
            if (me.heightCm) setCm(String(me.heightCm));
            if (me.weightKg) setKg(String(me.weightKg));
          } else {
            if (me.heightCm) {
              const totalIn = me.heightCm / 2.54;
              setFt(String(Math.floor(totalIn / 12)));
              setInches(String(Math.round(totalIn % 12)));
            }
            if (me.weightKg) {
              setLb(String(Math.round(me.weightKg / 0.453592)));
            }
          }
        }
      } catch {
        // Categories drive the interest picker; if it fails the user
        // can still skip + recommendations fall back to popularity.
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleInterest(id: string) {
    setInterests((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  /**
   * Build the PATCH body from whatever the user filled. Height/weight
   * convert from the active unit into the canonical metric values the
   * API stores. Empty fields are omitted (not sent as null) so a
   * partial fill doesn't wipe anything.
   */
  function buildPatchBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      markOnboardingComplete: true,
      unitPreference: unit,
    };
    if (primaryGoal) body.primaryGoal = primaryGoal;
    if (interests.size > 0) body.interestCategoryIds = [...interests];
    if (dailyMinutes) body.dailyMinutes = dailyMinutes;
    if (gender) body.gender = gender;
    if (birthYear.trim()) body.birthYear = Number(birthYear);

    if (unit === "METRIC") {
      if (cm.trim()) body.heightCm = Math.round(Number(cm));
      if (kg.trim()) body.weightKg = Number(kg);
    } else {
      const ftN = Number(ft) || 0;
      const inN = Number(inches) || 0;
      if (ft.trim() || inches.trim()) {
        body.heightCm = Math.round(ftN * 30.48 + inN * 2.54);
      }
      if (lb.trim()) {
        body.weightKg = Math.round(Number(lb) * 0.453592 * 10) / 10;
      }
    }
    return body;
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient<MeAccount>("/users/me/profile", {
        method: "PATCH",
        body: buildPatchBody(),
      });
      router.replace(next);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  async function skipAll() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      // Mark complete with no data so we don't nag again. Keep the
      // unit pref in case they touched the toggle.
      await apiClient<MeAccount>("/users/me/profile", {
        method: "PATCH",
        body: { markOnboardingComplete: true, unitPreference: unit },
      });
    } catch {
      // Even if the mark fails, get them into the app — the flow
      // only shows post-signup, so worst case they see it once more.
    } finally {
      router.replace(next);
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <Container className="max-w-lg">
        {/* Progress + skip-all */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <StepDot active={step >= 1} />
            <StepDot active={step >= 2} />
          </div>
          <button
            type="button"
            onClick={skipAll}
            disabled={saving}
            className="text-sm font-medium text-ink-muted hover:text-ink disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>

        {step === 1 ? (
          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              What brings you to Vital30?
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              This helps us recommend challenges that fit your goals. You
              can change it anytime.
            </p>

            {/* Primary goal */}
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-muted">
              My main goal
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setPrimaryGoal(g.value)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    primaryGoal === g.value
                      ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20"
                      : "border-slate-200 bg-white text-ink hover:border-brand-300"
                  }`}
                >
                  <span aria-hidden="true">{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>

            {/* Interests */}
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-muted">
              I&rsquo;m interested in{" "}
              <span className="font-normal lowercase">(pick any)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = interests.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleInterest(c.id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      on
                        ? "bg-brand-500 text-white"
                        : "bg-slate-100 text-ink hover:bg-slate-200"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Daily minutes */}
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Time I can commit per day
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setDailyMinutes(t.value)}
                  className={`rounded-xl border px-2 py-3 text-sm font-semibold transition-all ${
                    dailyMinutes === t.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-ink hover:border-brand-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-ink-muted hover:text-ink"
              >
                Skip this step →
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white hover:bg-brand-600"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              A bit about you
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              All optional — these help tailor your experience. You can edit
              or remove them anytime in Profile, and only you and friends you
              accept can see your profile.
            </p>

            {/* Unit toggle */}
            <div className="mt-6 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
              {(["METRIC", "IMPERIAL"] as UnitPreference[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-4 py-1.5 transition-colors ${
                    unit === u
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-muted"
                  }`}
                >
                  {u === "METRIC" ? "Metric" : "Imperial"}
                </button>
              ))}
            </div>

            {/* Gender */}
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Gender
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                    gender === g.value
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-ink hover:bg-slate-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Year of birth — we store only the year, not a full DOB */}
            <div className="mt-6 flex flex-col gap-1.5">
              <label
                htmlFor="birthYear"
                className="text-xs font-bold uppercase tracking-wide text-ink-muted"
              >
                Year of birth
              </label>
              <input
                id="birthYear"
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="1995"
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-xs text-ink-muted">
                Year only — we never store your full date of birth.
              </p>
            </div>

            {/* Height + weight — layout depends on unit */}
            {unit === "METRIC" ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <NumberField
                  id="cm"
                  label="Height (cm)"
                  value={cm}
                  onChange={setCm}
                  placeholder="170"
                />
                <NumberField
                  id="kg"
                  label="Weight (kg)"
                  value={kg}
                  onChange={setKg}
                  placeholder="68"
                />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-3 gap-3">
                <NumberField
                  id="ft"
                  label="Height (ft)"
                  value={ft}
                  onChange={setFt}
                  placeholder="5"
                />
                <NumberField
                  id="in"
                  label="(in)"
                  value={inches}
                  onChange={setInches}
                  placeholder="7"
                />
                <NumberField
                  id="lb"
                  label="Weight (lb)"
                  value={lb}
                  onChange={setLb}
                  placeholder="150"
                />
              </div>
            )}

            {error ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-ink-muted hover:text-ink"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish"}
              </button>
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

function StepDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-8 rounded-full transition-colors ${
        active ? "bg-brand-500" : "bg-slate-200"
      }`}
    />
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-bold uppercase tracking-wide text-ink-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}
