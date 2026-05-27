"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type {
  ChatChannel,
  ChatMessage,
  ChatPreset,
  ChatReactionEmoji,
  ToggleReactionResult,
} from "@/lib/web-types";

interface Props {
  /** Challenge whose channel to render. Required. */
  challengeId: string;
  /**
   * Bumping this nonce triggers a channel re-fetch. The parent
   * (/progress page) bumps it after a successful check-in so the
   * poll counts update without waiting for next mount.
   */
  refreshNonce?: number;
}

/**
 * Per-challenge community chat panel. Three things in one surface:
 *
 *  1. Today's check-in poll at the top — derived live from each
 *     joiner's DailyCheckin row. Updates automatically when the
 *     viewer themselves checks in (parent bumps `refreshNonce`).
 *  2. Message list — auto-generated daily CELEBRATION card pinned at
 *     the top, then user-posted PRESET messages reverse-chrono.
 *  3. Preset picker at the bottom — user picks one of the curated
 *     phrases to post. No free-text input; the API rejects unknown
 *     codes so we can't accidentally bypass the catalog.
 *
 * Reactions sit under each message. Tap to toggle; tapping again
 * removes. The API returns fresh totals so we can update without a
 * full refetch.
 */
export function ChallengeChat({ challengeId, refreshNonce = 0 }: Props) {
  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [postingCode, setPostingCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient<ChatChannel>(
        `/challenges/${challengeId}/chat`,
      );
      setChannel(res);
      setErr(null);
    } catch (e) {
      // Most likely 403 — not a joiner. The progress page only renders
      // this component for joined challenges so this is a real error
      // (e.g. server hiccup, expired session).
      setErr((e as Error).message);
    }
  }, [challengeId]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  async function postPreset(presetCode: string) {
    if (postingCode !== null) return;
    setPostingCode(presetCode);
    try {
      const msg = await apiClient<ChatMessage>(
        `/challenges/${challengeId}/chat`,
        {
          method: "POST",
          body: { presetCode },
        },
      );
      // Insert at the top (channel is reverse-chrono). Cheaper than a
      // full refetch — the poll counts don't change from posting a
      // chat message anyway.
      setChannel((prev) =>
        prev
          ? {
              ...prev,
              messages: [msg, ...prev.messages],
            }
          : prev,
      );
      setPickerOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPostingCode(null);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    // Optimistic toggle so the chip flips instantly. The server
    // response then reconciles totals.
    setChannel((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    reactions: optimisticToggle(m.reactions, emoji),
                  }
                : m,
            ),
          }
        : prev,
    );
    try {
      const res = await apiClient<ToggleReactionResult>(
        `/chat-messages/${messageId}/reactions`,
        { method: "POST", body: { emoji } },
      );
      setChannel((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === messageId
                  ? { ...m, reactions: { counts: res.counts, mine: res.mine } }
                  : m,
              ),
            }
          : prev,
      );
    } catch (e) {
      // Roll back the optimistic flip + surface the error.
      void load();
      setErr((e as Error).message);
    }
  }

  if (err && !channel) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Couldn&rsquo;t load the chat: {err}
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
    );
  }

  return (
    <div className="space-y-4">
      <PollCard poll={channel.poll} totalJoiners={channel.poll.total} />

      <div className="space-y-3">
        {channel.messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-surface-soft p-6 text-center text-sm text-ink-muted">
            Be the first to post! Pick a status update below.
          </p>
        ) : (
          channel.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              presets={channel.presets}
              emoji={channel.emoji}
              onReact={(code) => toggleReaction(m.id, code)}
            />
          ))
        )}
      </div>

      <PostBar
        open={pickerOpen}
        onToggle={() => setPickerOpen((o) => !o)}
        presets={channel.presets}
        postingCode={postingCode}
        onPost={postPreset}
      />

      {err ? (
        <p
          role="status"
          className="mt-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
        >
          {err}
        </p>
      ) : null}
    </div>
  );
}

// =========================================================================
// Poll card
// =========================================================================

function PollCard({
  poll,
  totalJoiners,
}: {
  poll: ChatChannel["poll"];
  totalJoiners: number;
}) {
  // Avoid divide-by-zero when a brand-new challenge has zero joiners
  // showing this in the UI (which shouldn't happen because the viewer
  // is a joiner by definition, but be defensive).
  const denom = Math.max(1, totalJoiners);
  const rows = [
    { label: "Completed", count: poll.completed, bar: "bg-brand-500" },
    { label: "Missed", count: poll.missed, bar: "bg-rose-400" },
    { label: "Skipped", count: poll.skipped, bar: "bg-slate-400" },
    {
      label: "Not in yet",
      count: poll.pending,
      bar: "bg-slate-200",
    },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
            Today&rsquo;s check-in poll
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {totalJoiners} {totalJoiners === 1 ? "person" : "people"} on
            this challenge
          </p>
        </div>
        {poll.yourStatus ? (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            You: {poll.yourStatus.toLowerCase()}
          </span>
        ) : (
          <span className="rounded-full bg-streak/15 px-3 py-1 text-xs font-semibold text-streak">
            You: not in yet
          </span>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const pct = Math.round((row.count / denom) * 100);
          return (
            <li key={row.label} className="text-sm">
              <div className="flex items-center justify-between text-ink">
                <span>{row.label}</span>
                <span className="font-mono font-semibold">
                  {row.count}{" "}
                  <span className="font-normal text-ink-muted">
                    ({pct}%)
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${row.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// =========================================================================
// Message bubble
// =========================================================================

function MessageBubble({
  message,
  presets,
  emoji,
  onReact,
}: {
  message: ChatMessage;
  presets: ChatPreset[];
  emoji: ChatReactionEmoji[];
  onReact: (emojiCode: string) => void;
}) {
  if (message.kind === "CELEBRATION") {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-5 text-amber-950 shadow-md">
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">
          Daily celebration
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">
          {message.body}
        </p>
        <ReactionRow
          counts={message.reactions.counts}
          mine={message.reactions.mine}
          emoji={emoji}
          onReact={onReact}
          variant="celebration"
        />
      </div>
    );
  }

  // PRESET
  const preset = presets.find((p) => p.code === message.presetCode);
  const text = preset?.text ?? message.presetCode ?? "(unknown)";
  const toneClass = preset ? PRESET_TONE_CLASS[preset.tone] : "bg-white";
  const initials = (message.user?.name ?? "•")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className={`rounded-2xl border border-slate-200 p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand-700 text-xs font-bold text-white">
          {initials || "·"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-bold text-ink">
              {message.user?.name ?? "Former member"}
            </span>
            <span className="text-xs text-ink-muted">
              {formatRelative(message.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink">{text}</p>
          <ReactionRow
            counts={message.reactions.counts}
            mine={message.reactions.mine}
            emoji={emoji}
            onReact={onReact}
            variant="preset"
          />
        </div>
      </div>
    </div>
  );
}

const PRESET_TONE_CLASS: Record<string, string> = {
  success: "bg-brand-50",
  milestone: "bg-amber-50",
  support: "bg-rose-50",
  neutral: "bg-white",
  humor: "bg-amber-50",
  encourage: "bg-sky-50",
};

// =========================================================================
// Reaction row
// =========================================================================

function ReactionRow({
  counts,
  mine,
  emoji,
  onReact,
  variant,
}: {
  counts: Record<string, number>;
  mine: Record<string, boolean>;
  emoji: ChatReactionEmoji[];
  onReact: (code: string) => void;
  variant: "preset" | "celebration";
}) {
  const isCeleb = variant === "celebration";
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {emoji.map((e) => {
        const count = counts[e.code] ?? 0;
        const isMine = !!mine[e.code];
        const base =
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all";
        const cls = isCeleb
          ? isMine
            ? "bg-amber-950 text-amber-50 ring-2 ring-amber-950 ring-offset-1 ring-offset-amber-500"
            : "bg-white/30 text-amber-950 hover:bg-white/50"
          : isMine
            ? "bg-brand-700 text-white ring-2 ring-brand-700 ring-offset-1 ring-offset-white"
            : "bg-white text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50";
        return (
          <button
            key={e.code}
            type="button"
            onClick={() => onReact(e.code)}
            aria-label={`${e.label} reaction${
              count > 0 ? ` — ${count}` : ""
            }${isMine ? " (yours)" : ""}`}
            className={`${base} ${cls}`}
          >
            <span aria-hidden="true">{e.char}</span>
            {count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

// =========================================================================
// Preset picker bar
// =========================================================================

function PostBar({
  open,
  onToggle,
  presets,
  postingCode,
  onPost,
}: {
  open: boolean;
  onToggle: () => void;
  presets: ChatPreset[];
  postingCode: string | null;
  onPost: (code: string) => void;
}) {
  return (
    <div className="sticky bottom-0 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-soft px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-slate-100"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-base text-white"
          >
            +
          </span>
          {open ? "Pick a status update" : "Post a status update"}
        </span>
        <span className="text-xs text-ink-muted">
          {open ? "Tap one to send" : "Curated phrases only"}
        </span>
      </button>
      {open ? (
        <div
          role="group"
          aria-label="Status updates"
          className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto pb-1"
        >
          {presets.map((p) => {
            const busy = postingCode === p.code;
            const disabled = postingCode !== null && !busy;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => onPost(p.code)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${PRESET_PICKER_CLASS[p.tone]}`}
              >
                {busy ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending…
                  </>
                ) : (
                  p.text
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const PRESET_PICKER_CLASS: Record<string, string> = {
  success: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  milestone: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  support: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  neutral: "bg-slate-100 text-ink hover:bg-slate-200",
  humor: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  encourage: "bg-sky-50 text-sky-700 hover:bg-sky-100",
};

// =========================================================================
// helpers
// =========================================================================

function formatRelative(iso: string): string {
  // Compact "just now / 3m / 2h / 5d" formatting — keeps message rows
  // tidy without pulling in a date library.
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 45) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Local-only optimistic toggle: flip the viewer's own row + bump/dec
 * the count for that emoji. The server response then replaces this
 * with authoritative totals from the DB.
 */
function optimisticToggle(
  reactions: ChatMessage["reactions"],
  emoji: string,
): ChatMessage["reactions"] {
  const wasMine = !!reactions.mine[emoji];
  const counts = { ...reactions.counts };
  counts[emoji] = Math.max(0, (counts[emoji] ?? 0) + (wasMine ? -1 : 1));
  const mine = { ...reactions.mine };
  if (wasMine) delete mine[emoji];
  else mine[emoji] = true;
  return { counts, mine };
}

