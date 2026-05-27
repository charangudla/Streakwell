"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Container } from "@/components/Container";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next")) ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn.email({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(signInError.message ?? "Could not sign in.");
      setSubmitting(false);
      return;
    }
    router.replace(next);
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Welcome back. Sign in to pick up your 30-day challenge.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
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
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            disabled={submitting}
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Forgot password?
            </Link>
            <Link
              href="/register"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Create account →
            </Link>
          </div>
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
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
    </div>
  );
}

// Only honor local paths so a malicious `?next=https://...` can't turn
// the login page into an open-redirect.
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}
