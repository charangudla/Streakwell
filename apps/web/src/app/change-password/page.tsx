"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { BackLink } from "@/components/BackLink";
import { Container } from "@/components/Container";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  return (
    <AuthGuard>
      <ChangePasswordInner />
    </AuthGuard>
  );
}

/**
 * In-app password change for a signed-in user: current → new → confirm.
 *
 * This is the logged-in counterpart to /forgot-password (which emails a
 * reset link for people who can't sign in). Better Auth's
 * `changePassword` re-checks the current password server-side before
 * applying the new one, and the API's password-policy hook (auth.ts)
 * enforces the same upper+lower+number+symbol rules it does at signup —
 * so the only checks we do here are the ones the server can't: that the
 * two "new" boxes match, and a quick length pre-check to save a
 * round-trip. Everything else surfaces from the server's response.
 */
function ChangePasswordInner() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // UI-only guards — the server can't see `confirm`, and a length
    // pre-check avoids a needless request for the obvious case.
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current one.");
      return;
    }

    setSubmitting(true);
    const { error: err } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      // Keep other signed-in devices (e.g. the mobile app) logged in —
      // this is a routine settings change, not a breach response.
      revokeOtherSessions: false,
    });
    setSubmitting(false);
    if (err) {
      setError(friendlyError(err));
      return;
    }
    setDone(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  if (done) {
    return (
      <section className="py-12 sm:py-16">
        <Container className="max-w-md">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-brand-700">
              Password changed
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              Your password has been updated. Use it next time you sign in.
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Back to profile →
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <BackLink />
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Change password
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Enter your current password, then choose a new one.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <Field
            id="current"
            label="Current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
            disabled={submitting}
          />
          <Field
            id="new"
            label="New password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            disabled={submitting}
            hint="At least 8 characters, with upper + lower + number + symbol."
          />
          <Field
            id="confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
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
            {submitting ? "Changing…" : "Change password"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Forgot your current password?{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Email me a reset link
            </Link>
          </p>
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
  autoComplete?: string;
  disabled?: boolean;
  hint?: string;
};

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  hint,
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
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

// Map Better Auth's response to a sentence the user can act on. A wrong
// current password comes back as code "INVALID_PASSWORD" (message
// "Invalid password" — ambiguous about *which* password), so we restate
// it. The server's password-policy failures arrive as a plain
// BAD_REQUEST whose message is already friendly ("Password must include a
// symbol…"), so we pass those straight through.
function friendlyError(err: {
  code?: string;
  message?: string;
  status?: number;
}): string {
  if (err.code === "INVALID_PASSWORD") {
    return "Your current password is incorrect.";
  }
  return err.message || "Could not change your password. Please try again.";
}
