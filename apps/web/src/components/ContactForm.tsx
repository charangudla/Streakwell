"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/constants";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — must stay empty on a real user's submission.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch(`${API_BASE_URL}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      if (res.status === 204) {
        setStatus({ kind: "success" });
        setName("");
        setEmail("");
        setMessage("");
        return;
      }
      if (res.status === 400) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string | string[];
        };
        const msg = Array.isArray(body.message)
          ? body.message[0]
          : body.message;
        setStatus({
          kind: "error",
          message: msg ?? "Please check your entries and try again.",
        });
        return;
      }
      if (res.status === 429) {
        setStatus({
          kind: "error",
          message: "Too many submissions. Try again in an hour.",
        });
        return;
      }
      setStatus({
        kind: "error",
        message: "Something went wrong on our end. Please try again.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-brand-700">
          Message sent — thank you.
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          We read everything and reply within a few business days.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Send another →
        </button>
      </div>
    );
  }

  const disabled = status.kind === "submitting";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        id="name"
        label="Your name"
        value={name}
        onChange={setName}
        required
        autoComplete="name"
        disabled={disabled}
      />
      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
        disabled={disabled}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
        >
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          disabled={disabled}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
          placeholder="What's on your mind?"
        />
        <p className="text-xs text-ink-muted">
          {message.length} / 2000 characters
        </p>
      </div>

      {/* Honeypot — visually hidden, off-screen, aria-hidden. Real users
          never see or fill this. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10000px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="website">Website (leave blank)</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {status.kind === "error" ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {status.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-500 px-6 text-base font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {disabled ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
  disabled = false,
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
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      />
    </div>
  );
}
