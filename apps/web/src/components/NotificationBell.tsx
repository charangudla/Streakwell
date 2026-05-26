"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

/** Polls /notifications/unread-count every 60s. */
export function NotificationBell() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await apiClient<{ count: number }>(
          "/notifications/unread-count",
        );
        if (!cancelled) setCount(r.count ?? 0);
      } catch {
        // Silently ignore — bell shows last known value.
      }
    }
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
      aria-label={
        count > 0
          ? `Notifications, ${count} unread`
          : "Notifications, no unread"
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      {count > 0 ? (
        <span className="absolute right-1 top-1 grid h-4 min-w-[16px] items-center justify-center rounded-full bg-streak px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
