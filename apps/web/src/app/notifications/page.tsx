"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import type { AppNotification } from "@/lib/web-types";

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsInner />
    </AuthGuard>
  );
}

const ICONS: Record<AppNotification["type"], string> = {
  REMINDER: "🔔",
  STREAK_MILESTONE: "🔥",
  ACHIEVEMENT: "🏆",
  REFERRAL_JOIN: "👋",
  CHALLENGE_COMPLETE: "🎉",
  SYSTEM: "✨",
};

function NotificationsInner() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const list = await apiClient<AppNotification[]>("/notifications");
      setItems(list);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    if (!items) return;
    setItems(
      items.map((n) =>
        n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    try {
      await apiClient(`/notifications/${id}/read`, { method: "POST" });
    } catch {
      void load();
    }
  }

  async function markAllRead() {
    if (!items) return;
    const now = new Date().toISOString();
    setItems(items.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    try {
      await apiClient("/notifications/read-all", { method: "POST" });
    } catch {
      void load();
    }
  }

  const hasUnread = (items ?? []).some((n) => !n.readAt);

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Notifications
          </h1>
          <button
            type="button"
            onClick={markAllRead}
            disabled={!hasUnread}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-ink-muted"
          >
            Mark all read
          </button>
        </div>

        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {err}
          </p>
        ) : null}

        {items === null ? (
          <div className="mt-8 h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-10 text-center">
            <p className="text-lg font-semibold text-ink">
              No notifications yet
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              When you hit a streak, complete a challenge, or a friend joins
              with your code, you&rsquo;ll see it here.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {items.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${n.readAt ? "border-slate-200 bg-white" : "border-brand-200 bg-brand-50/40"}`}
              >
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white text-lg ring-1 ring-slate-200"
                >
                  {ICONS[n.type] ?? "•"}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {n.title}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{n.body}</p>
                  {!n.readAt ? (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="mt-2 text-xs font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}
