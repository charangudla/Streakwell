"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}

/**
 * Username availability state — UI surfaces each phase with a tiny
 * inline cue under the input (✓ / ✕ / spinner / hint).
 */
type UsernameCheck =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "bad"; message: string };

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next")) ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck>({
    kind: "idle",
  });

  // Debounced live username availability check. Fires 350ms after the
  // last keystroke so we don't beat the server with one request per
  // character. Lowercases on the fly to match server-side
  // normalisation — what the server treats as "alice" must look like
  // "alice" in the input too.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = username.trim().toLowerCase();
    if (trimmed === "") {
      setUsernameCheck({ kind: "idle" });
      return;
    }
    if (trimmed.length < 3) {
      setUsernameCheck({
        kind: "bad",
        message: "At least 3 characters.",
      });
      return;
    }
    setUsernameCheck({ kind: "checking" });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient<
          | { available: true }
          | { available: false; reason: string; message: string }
        >(`/users/check-username?username=${encodeURIComponent(trimmed)}`);
        if (res.available) {
          setUsernameCheck({ kind: "ok" });
        } else {
          setUsernameCheck({ kind: "bad", message: res.message });
        }
      } catch {
        // Network blip — clear back to idle so the form doesn't lock.
        // Server still validates on submit anyway.
        setUsernameCheck({ kind: "idle" });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (usernameCheck.kind === "bad") {
      setError("Pick a valid username first.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Step 1 — Better Auth signup. autoSignIn:true (in
    // services/api/src/auth/auth.ts) means the session cookie lands
    // here too, which lets the follow-up PATCH below authenticate.
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

    // Step 2 — patch the just-created user with username + phone.
    // Two-step on purpose: Better Auth's signUp.email doesn't accept
    // arbitrary extra fields, and rolling a custom signup endpoint
    // would mean reimplementing password hashing + session cookie.
    // If the patch fails, the account still exists; the user can
    // continue and fill these in from /profile later. We surface
    // the specific reason so they know what to fix.
    try {
      await apiClient("/users/me", {
        method: "PATCH",
        body: {
          username: username.trim().toLowerCase(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
    } catch (e) {
      const err = e as { message?: string };
      setError(
        err.message ??
          "Account created, but we couldn't save your handle. You can set it from your profile.",
      );
      // Don't bail — let them land in the app. Profile page will let
      // them retry.
      router.replace(next);
      return;
    }
    router.replace(next);
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
            id="username"
            label="Username"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            required
            disabled={submitting}
            placeholder="e.g. alex_rivera"
            hint="Lowercase letters, numbers, periods, underscores. 3–30 chars."
            below={<UsernameStatus check={usernameCheck} />}
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

          <Field
            id="phone"
            label="Phone (optional)"
            type="tel"
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
            disabled={submitting}
            placeholder="+1 415 555 0123"
            hint="International format. Stored on your profile — you can add or change it later."
          />

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
            disabled={submitting || usernameCheck.kind === "bad"}
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

function UsernameStatus({ check }: { check: UsernameCheck }) {
  if (check.kind === "idle") return null;
  if (check.kind === "checking") {
    return (
      <p className="text-xs text-ink-muted">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 align-middle" />{" "}
        Checking…
      </p>
    );
  }
  if (check.kind === "ok") {
    return (
      <p className="text-xs font-semibold text-brand-700">✓ Available</p>
    );
  }
  return (
    <p className="text-xs font-semibold text-rose-700">✕ {check.message}</p>
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
  /** Extra slot below the hint — used for username availability cue. */
  below?: React.ReactNode;
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
  below,
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
      {below}
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
