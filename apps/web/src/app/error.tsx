"use client";

import { useEffect } from "react";
import { Container } from "@/components/Container";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("App error boundary caught:", error);
    }
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
        Something went wrong
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        We hit a snag
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-ink-muted sm:text-lg">
        An unexpected error occurred while loading this page. We&rsquo;ve
        been notified — please try again.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-ink-muted">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
        >
          Go home
        </a>
      </div>
    </Container>
  );
}
