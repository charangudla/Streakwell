"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container } from "@/components/Container";
import { resetPassword } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(params.get("token"));
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Request a new reset email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await resetPassword({
      newPassword: password,
      token,
    });
    if (err) {
      setError(err.message ?? "Could not reset password.");
      setSubmitting(false);
      return;
    }
    router.replace("/login");
  }

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Set a new password
        </h1>
        <p className="mt-3 text-base text-ink-muted">
          Choose a password with at least 8 characters, including an upper
          case letter, a number, and a symbol.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <PasswordField
            id="password"
            label="New password"
            value={password}
            onChange={setPassword}
            disabled={submitting}
          />
          <PasswordField
            id="confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
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
            disabled={submitting || !token}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save new password"}
          </button>

          <p className="text-center text-sm text-ink-muted">
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              Back to sign in
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
  disabled?: boolean;
};

function PasswordField({ id, label, value, onChange, disabled }: FieldProps) {
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
        required
        autoComplete="new-password"
        disabled={disabled}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
    </div>
  );
}
