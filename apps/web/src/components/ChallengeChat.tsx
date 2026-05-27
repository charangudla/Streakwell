"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
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
 * Per-challenge community chat panel — laid out like an Instagram /
 * WhatsApp group DM:
 *
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ Header — channel title + participant count + poll summary │  sticky top
 *   ├───────────────────────────────────────────────────────────┤
 *   │                                                           │
 *   │              [centered system: daily celebration]         │  scrollable
 *   │  ┌──────────┐                                             │  (asc-chrono,
 *   │  │ Alice    │                                             │   auto-scroll
 *   │  │  msg…    │                                             │   to bottom
 *   │  └──────────┘                                             │   on new)
 *   │                              ┌──────────┐                 │
 *   │                              │  You     │                 │
 *   │                              │   msg…   │                 │
 *   │                              └──────────┘                 │
 *   │              [poll card — vote chips]                     │
 *   ├───────────────────────────────────────────────────────────┤
 *   │ + Post a status update                                    │  sticky bottom
 *   └───────────────────────────────────────────────────────────┘
 *
 * Three message kinds in one thread:
 *   - PRESET from VIEWER  → brand-tinted bubble, right-aligned
 *   - PRESET from OTHER   → soft slate bubble, left-aligned, avatar + name
 *   - CELEBRATION         → full-width amber system card, centered
 *
 * The daily check-in poll renders inline as a special pinned card at
 * the END of the visible thread (right above the new-message slot)
 * because it's the most-relevant "today" thing — the viewer should
 * see it without scrolling once new messages arrive.
 *
 * Scroll behaviour mirrors a real messaging window: the inner scroll
 * container has its own max-height so the chat feels like a window
 * the user is "inside", and we auto-scroll to the bottom on mount +
 * after the viewer posts a message.
 */
export function ChallengeChat({ challengeId, refreshNonce = 0 }: Props) {
  const { data: session } = useSession();
  const viewerId = session?.user.id ?? null;

  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [postingCode, setPostingCode] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Track whether the viewer has scrolled up; if so we DON'T auto-jump
  // them to the bottom on refetch — they're reading older messages.
  const stickToBottom = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await apiClient<ChatChannel>(
        `/challenges/${challengeId}/chat`,
      );
      setChannel(res);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [challengeId]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  // Auto-scroll to bottom on initial load + when the viewer is
  // already at the bottom and new data lands.
  useEffect(() => {
    if (!channel) return;
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [channel]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // 80px slack — counts the user as "at bottom" if they're within
    // that of the end. Common pattern, avoids flicker when small
    // height changes nudge the scroll position by a few pixels.
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function postPreset(presetCode: string) {
    if (postingCode !== null) return;
    setPostingCode(presetCode);
    try {
      const msg = await apiClient<ChatMessage>(
        `/challenges/${challengeId}/chat`,
        { method: "POST", body: { presetCode } },
      );
      // API returns backend-fresh row; append so it lands at the
      // bottom (since we render chronologically ascending below).
      setChannel((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
      );
      setPickerOpen(false);
      // Sender always wants to see their own post — force the auto-
      // scroll regardless of where they were before.
      stickToBottom.current = true;
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPostingCode(null);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    setChannel((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === messageId
                ? { ...m, reactions: optimisticToggle(m.reactions, emoji) }
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
      <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
    );
  }

  // Backend orders DESC for the "newest first" wire format; chat reads
  // best ASC so chronology runs top → bottom like every messaging app
  // the user is used to. CELEBRATION cards are filtered out per the
  // current product call — server still writes them so we can revive
  // the surface later without a schema change.
  const ordered = [...channel.messages]
    .reverse()
    .filter((m) => m.kind !== "CELEBRATION");

  // Outer container is h-full so the parent picks the height — a
  // dedicated /chat page can fill the viewport, while an embed could
  // still constrain via a wrapping fixed-height div. Width fills
  // whatever's given.
  return (
    <div className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChannelHeader poll={channel.poll} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-3 overflow-y-auto bg-surface-soft px-3 py-4 sm:px-4"
      >
        {ordered.length === 0 ? (
          <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-ink-muted shadow-sm">
            No messages yet — be the first to post a status update below.
          </p>
        ) : (
          ordered.map((m) => (
            <ChatRow
              key={m.id}
              message={m}
              viewerId={viewerId}
              presets={channel.presets}
              emoji={channel.emoji}
              onReact={(code) => toggleReaction(m.id, code)}
            />
          ))
        )}

        {/* PollInline + CELEBRATION cards intentionally removed —
            the chat now reads as a pure conversation thread. The
            poll data is still in `channel.poll` if we want to
            re-surface it elsewhere (e.g. the channel header) later. */}
        <div ref={bottomRef} />
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
          className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800"
        >
          {err}
        </p>
      ) : null}
    </div>
  );
}

// =========================================================================
// Sticky header — channel title + summary stats
// =========================================================================

function ChannelHeader({ poll }: { poll: ChatChannel["poll"] }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">Community</p>
        <p className="text-xs text-ink-muted">
          {poll.total} {poll.total === 1 ? "member" : "members"}
        </p>
      </div>
    </div>
  );
}

// =========================================================================
// One row in the thread
// =========================================================================

function ChatRow({
  message,
  viewerId,
  presets,
  emoji,
  onReact,
}: {
  message: ChatMessage;
  viewerId: string | null;
  presets: ChatPreset[];
  emoji: ChatReactionEmoji[];
  onReact: (emojiCode: string) => void;
}) {
  if (message.kind === "CELEBRATION") {
    return <CelebrationCard message={message} emoji={emoji} onReact={onReact} />;
  }

  // PRESET
  const preset = presets.find((p) => p.code === message.presetCode);
  const text = preset?.text ?? message.presetCode ?? "(unknown)";
  const mine = viewerId !== null && message.user?.id === viewerId;
  return mine ? (
    <OwnBubble
      text={text}
      time={message.createdAt}
      reactions={message.reactions}
      emoji={emoji}
      onReact={onReact}
    />
  ) : (
    <OtherBubble
      name={message.user?.name ?? "Former member"}
      text={text}
      time={message.createdAt}
      tone={preset?.tone}
      reactions={message.reactions}
      emoji={emoji}
      onReact={onReact}
    />
  );
}

/**
 * Per the current product call, side mapping is OWN=LEFT / OTHERS=RIGHT
 * — opposite of WhatsApp/Instagram convention. Keeps a clear visual
 * split between "what I said" and "what everyone else said" without
 * matching any specific app's chrome.
 */
function OwnBubble({
  text,
  time,
  reactions,
  emoji,
  onReact,
}: {
  text: string;
  time: string;
  reactions: ChatMessage["reactions"];
  emoji: ChatReactionEmoji[];
  onReact: (code: string) => void;
}) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-md bg-brand-500 px-4 py-2.5 text-white shadow-sm">
          <p className="text-sm">{text}</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
          <span>You</span>
          <span>·</span>
          <span>{formatRelative(time)}</span>
        </div>
        <div className="mt-1 flex">
          <ReactionRow
            counts={reactions.counts}
            mine={reactions.mine}
            emoji={emoji}
            onReact={onReact}
          />
        </div>
      </div>
    </div>
  );
}

function OtherBubble({
  name,
  text,
  time,
  tone,
  reactions,
  emoji,
  onReact,
}: {
  name: string;
  text: string;
  time: string;
  tone: ChatPreset["tone"] | undefined;
  reactions: ChatMessage["reactions"];
  emoji: ChatReactionEmoji[];
  onReact: (code: string) => void;
}) {
  const initials = initialsFrom(name);
  // Tone tints the bubble subtly so a wall of grey bubbles isn't
  // visually flat — same colour language as the on-screen card tones.
  const toneCls = tone ? OTHER_BUBBLE_TONE[tone] : "bg-white text-ink";
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="flex max-w-[80%] flex-col items-end">
        <p className="mb-0.5 text-[11px] font-semibold text-ink-muted">
          {name}
        </p>
        <div
          className={`rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm ${toneCls}`}
        >
          <p className="text-sm">{text}</p>
        </div>
        <div className="mt-1 text-[11px] text-ink-muted">
          {formatRelative(time)}
        </div>
        <div className="mt-1">
          <ReactionRow
            counts={reactions.counts}
            mine={reactions.mine}
            emoji={emoji}
            onReact={onReact}
          />
        </div>
      </div>
      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
        {initials}
      </span>
    </div>
  );
}

const OTHER_BUBBLE_TONE: Record<ChatPreset["tone"], string> = {
  success: "bg-brand-50 text-ink",
  milestone: "bg-amber-50 text-ink",
  support: "bg-rose-50 text-ink",
  neutral: "bg-white text-ink",
  humor: "bg-amber-50 text-ink",
  encourage: "bg-sky-50 text-ink",
};

function CelebrationCard({
  message,
  emoji,
  onReact,
}: {
  message: ChatMessage;
  emoji: ChatReactionEmoji[];
  onReact: (code: string) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 px-5 py-4 text-amber-950 shadow-md">
        <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">
          Daily celebration
        </p>
        <p className="mt-1 text-base font-semibold leading-snug">
          {message.body}
        </p>
        <div className="mt-3">
          <ReactionRow
            counts={message.reactions.counts}
            mine={message.reactions.mine}
            emoji={emoji}
            onReact={onReact}
            variant="celebration"
          />
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// Reaction row (small floating cluster under a bubble)
// =========================================================================

function ReactionRow({
  counts,
  mine,
  emoji,
  onReact,
  variant = "default",
}: {
  counts: Record<string, number>;
  mine: Record<string, boolean>;
  emoji: ChatReactionEmoji[];
  onReact: (code: string) => void;
  variant?: "default" | "celebration";
}) {
  // Only render chips that have at least one reaction OR all emoji as
  // "tap to react" anchors. We show ALL of them so the user can react
  // without a separate +/picker step — matches Instagram quick taps.
  return (
    <div className="flex flex-wrap gap-1">
      {emoji.map((e) => {
        const count = counts[e.code] ?? 0;
        const isMine = !!mine[e.code];
        const isCeleb = variant === "celebration";
        const base =
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold transition-all";
        const cls = isCeleb
          ? isMine
            ? "bg-amber-950 text-amber-50"
            : "bg-white/30 text-amber-950 hover:bg-white/50"
          : isMine
            ? "bg-brand-700 text-white"
            : "bg-white text-ink-muted ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-ink";
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
// Bottom input bar (preset picker)
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
    <div className="border-t border-slate-200 bg-white">
      {open ? (
        <div
          role="group"
          aria-label="Status updates"
          className="flex max-h-48 flex-wrap gap-2 overflow-y-auto border-b border-slate-100 p-3"
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${PRESET_PICKER_CLASS[p.tone]}`}
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
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-base text-white"
          >
            +
          </span>
          {open ? "Close" : "Post a status update"}
        </span>
        <span className="text-xs text-ink-muted">
          {open ? "Tap one to send" : "Curated phrases only"}
        </span>
      </button>
    </div>
  );
}

const PRESET_PICKER_CLASS: Record<ChatPreset["tone"], string> = {
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

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "·";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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
