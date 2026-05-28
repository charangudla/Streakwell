"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/Container";
import { signUp } from "@/lib/auth-client";

// ============================================================================
// NOTE — username + phone capture is DISABLED for now.
// ============================================================================
// Signup is intentionally back to name + email + password only. The
// full username (with live availability check) + phone capture lived
// here and is preserved in git history at commit 75a778a — restore
// from there when we re-enable. The backend endpoints
// (GET /users/check-username, PATCH /users/me) and the DB columns
// remain in place but are simply not called from this form. The
// commented JSX block lower in this file shows exactly where the
// fields went.
// ============================================================================

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Where to send the user after a successful signup. The share-link
  // landing (`/c/<token>`) sends them here with `?next=/c/<token>` so we
  // bounce them straight back to complete the join. Default to /dashboard.
  const next = safeNext(params.get("next")) ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (signUpError) {
      setError(signUpError.message ?? "Could not create account.");
      setSubmitting(false);
      return;
    }
    // Better Auth's autoSignIn:true (services/api/src/auth/auth.ts) means
    // we land authenticated immediately. Route NEW signups through the
    // skippable /welcome flow (goals + personal details → better
    // recommendations). Preserve the original `next` so a share-link
    // signup still lands at its join after onboarding.
    const welcome =
      next === "/dashboard"
        ? "/welcome"
        : `/welcome?next=${encodeURIComponent(next)}`;
    router.replace(welcome);
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Start your first 30-day challenge in under a minute.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <Field
            id="name"
            label="Full name"
            value={name}
            onChange={setName}
            autoComplete="name"
            required
            disabled={submitting}
          />
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            disabled={submitting}
          />
          {/* DISABLED — username + phone capture. Restore from commit
              75a778a (debounced /users/check-username availability cue +
              a two-step submit that PATCHes /users/me with the values).
              <Field id="username" label="Username" ... /> with the
              <UsernameStatus/> cue, and
              <Field id="phone" label="Phone (optional)" ... /> went
              right here, between Email and Password. */}
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            disabled={submitting}
            hint="At least 8 characters, with upper + lower + number + symbol."
          />

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
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-ink-muted">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            .
          </p>
        </form>
      </Container>
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  placeholder?: string;
};

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  disabled,
  hint,
  placeholder,
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
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

// Only honor `next` values that look like a local app path. Reject
// scheme-qualified URLs and protocol-relative paths — belt-and-braces
// against open-redirect even though the link is from our own UI.
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}
