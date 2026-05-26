"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/Container";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await requestPasswordReset({
      email: email.trim(),
      // Better Auth uses this to build the link inside the reset email.
      redirectTo:
        typeof window === "undefined"
          ? "https://vital30.com/reset-password"
          : `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message ?? "Could not send reset email.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <section className="py-12 sm:py-16">
        <Container className="max-w-md">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-brand-700">
              Check your email
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              If <span className="font-semibold">{email}</span> matches an
              account, we&rsquo;ve sent a password-reset link. The link
              expires in 15 minutes.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Back to sign in →
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Reset password
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Enter your email and we&rsquo;ll send a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>

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
            {submitting ? "Sending…" : "Send reset link"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Container>
    </section>
  );
}
