"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { Category } from "@/lib/types";
import type {
  ChallengeVisibility,
  CustomChallenge,
} from "@/lib/web-types";

export default function CreateChallengePage() {
  return (
    <AuthGuard>
      <CreateChallengeInner />
    </AuthGuard>
  );
}

const DIFFICULTIES = ["BEGINNER", "EASY", "MEDIUM", "HARD"] as const;
const DURATION_PRESETS = [7, 14, 21, 30, 60, 90];

function CreateChallengeInner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[] | null>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [dailyTask, setDailyTask] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [difficulty, setDifficulty] =
    useState<(typeof DIFFICULTIES)[number]>("EASY");
  const [categoryId, setCategoryId] = useState<string>("");
  const [visibility, setVisibility] =
    useState<ChallengeVisibility>("PRIVATE");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await apiClient<Category[]>("/categories");
        if (cancelled) return;
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiClient<CustomChallenge>(
        "/custom-challenges",
        {
          method: "POST",
          body: {
            title: title.trim(),
            shortDescription: shortDescription.trim(),
            description: description.trim() || undefined,
            dailyTask: dailyTask.trim(),
            durationDays,
            difficulty,
            categoryId,
            visibility,
          },
        },
      );
      router.replace(`/my-created-challenges/${created.id}`);
    } catch (e) {
      if (e instanceof ApiClientError) {
        setError(e.bodyMessage);
      } else {
        setError((e as Error).message);
      }
      setSubmitting(false);
    }
  }

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Browse challenges
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Create your own challenge
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          Set the rules, pick a duration, then share it with friends.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
          noValidate
        >
          <Field
            id="title"
            label="Title"
            value={title}
            onChange={setTitle}
            required
            placeholder="14 Days No Coffee"
            maxLength={80}
            disabled={submitting}
          />
          <Field
            id="short"
            label="One-line description"
            value={shortDescription}
            onChange={setShortDescription}
            required
            placeholder="Cut caffeine for two weeks with my running group."
            maxLength={300}
            disabled={submitting}
          />
          <Field
            id="task"
            label="Daily task"
            value={dailyTask}
            onChange={setDailyTask}
            required
            placeholder="No caffeinated drinks today."
            maxLength={200}
            disabled={submitting}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="duration"
                className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                Duration (days)
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDurationDays(d)}
                    disabled={submitting}
                    className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${durationDays === d ? "bg-brand-500 text-white" : "bg-slate-100 text-ink-muted hover:bg-slate-200"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                id="duration"
                type="number"
                min={1}
                max={365}
                value={durationDays}
                onChange={(e) =>
                  setDurationDays(Math.max(1, Math.min(365, Number(e.target.value))))
                }
                disabled={submitting}
                className="mt-1 h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="difficulty"
                className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as (typeof DIFFICULTIES)[number],
                  )
                }
                disabled={submitting}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="category"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={submitting || !categories}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            >
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="long"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              More details (optional)
            </label>
            <textarea
              id="long"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              disabled={submitting}
              placeholder="Background, rules, motivation… anything you want joiners to know."
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Visibility
            </legend>
            <label className="flex cursor-pointer items-start gap-3 py-2">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={visibility === "PRIVATE"}
                onChange={() => setVisibility("PRIVATE")}
                disabled={submitting}
                className="mt-1 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Private (recommended)
                </span>
                <span className="block text-xs text-ink-muted">
                  Only people with your share link or an invite can join. You
                  can promote to public later.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 py-2">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === "PUBLIC"}
                onChange={() => setVisibility("PUBLIC")}
                disabled={submitting}
                className="mt-1 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">
                  Public
                </span>
                <span className="block text-xs text-ink-muted">
                  Anyone can find and join via the Challenges browse. Pick
                  this for community-wide invitations.
                </span>
              </span>
            </label>
          </fieldset>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !categoryId}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {submitting ? "Creating…" : "Create challenge"}
          </button>
        </form>
      </Container>
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
};

function Field({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  maxLength,
  disabled,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
    </div>
  );
}
