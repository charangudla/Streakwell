"use client";

import { useEffect, useState } from "react";

// Chrome / Edge / Brave fire `beforeinstallprompt`. We intercept it and
// expose a friendly "Install Vital30" CTA when the user has tried the
// dashboard at least twice (a tiny proxy for "they're getting value").
//
// Safari (iOS + macOS) doesn't fire this event — users must "Add to Home
// Screen" via the share menu. We show a one-line hint instead, on iOS only,
// limited to the dashboard.
//
// Always dismissable. Selected dismiss persists in localStorage.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vital30_install_dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Detect iOS Safari (no `beforeinstallprompt`) and show a hint instead.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const isStandalone = (
      window.navigator as Navigator & { standalone?: boolean }
    ).standalone;
    if (isIos && isSafari && !isStandalone) {
      setIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setIosHint(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferred(null);
  }

  if (deferred) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-500 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                Install Vital30
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Add it to your home screen for a native-app feel — opens in
                its own window, faster too.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={install}
                  className="inline-flex h-9 items-center rounded-full bg-brand-500 px-4 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  Install
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold text-ink-muted hover:bg-slate-100"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl">
              📲
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                Add Vital30 to your home screen
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Tap the Share button in Safari, then choose{" "}
                <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-2 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
