"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Container } from "@/components/Container";
import { apiClient } from "@/lib/api-client";
import { authClient, signOut, useSession } from "@/lib/auth-client";
import type { UserChallenge } from "@/lib/web-types";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileInner />
    </AuthGuard>
  );
}

type MeView = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  createdAt: string;
};

function ProfileInner() {
  const router = useRouter();
  const { data: session, refetch } = useSession();
  const user = session?.user ?? null;

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  // The Better Auth session.user doesn't carry our custom username +
  // phone fields, so the profile page fetches /users/me for those.
  // One extra round-trip on mount; treated as authoritative for
  // editing those two fields.
  const [me, setMe] = useState<MeView | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSavedMessage, setPhoneSavedMessage] = useState<string | null>(
    null,
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Pull just the counts the identity card needs. Same /user-challenges
  // endpoint the dashboard hits, so this is usually warm-cached by the
  // browser by the time the user lands here.
  const [ucs, setUcs] = useState<UserChallenge[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rows, meRes] = await Promise.all([
          apiClient<UserChallenge[]>("/user-challenges"),
          apiClient<MeView>("/users/me"),
        ]);
        if (!cancelled) {
          setUcs(rows);
          setMe(meRes);
          setPhoneInput(meRes.phone ?? "");
        }
      } catch {
        // Silent — profile page still works without the count tiles;
        // they just render as "—" until next reload.
        if (!cancelled) setUcs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user || saving) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Name can't be empty.");
      return;
    }
    if (trimmed === user.name) {
      setSavedMessage("Nothing to save.");
      return;
    }
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    const { error: err } = await authClient.updateUser({ name: trimmed });
    setSaving(false);
    if (err) {
      setError(err.message ?? "Could not update profile.");
      return;
    }
    setSavedMessage("Saved.");
    await refetch();
  }

  async function onSavePhone(e: React.FormEvent) {
    e.preventDefault();
    if (!me || phoneSaving) return;
    const trimmed = phoneInput.trim();
    if (trimmed === (me.phone ?? "")) {
      setPhoneSavedMessage("Nothing to save.");
      return;
    }
    setPhoneSaving(true);
    setPhoneError(null);
    setPhoneSavedMessage(null);
    try {
      const updated = await apiClient<MeView>("/users/me", {
        method: "PATCH",
        // Empty string CLEARS the phone server-side — see backend
        // UsersService.updateMe.
        body: { phone: trimmed },
      });
      setMe(updated);
      setPhoneInput(updated.phone ?? "");
      setPhoneSavedMessage(
        updated.phone ? "Phone saved." : "Phone removed.",
      );
    } catch (e) {
      setPhoneError((e as Error).message);
    } finally {
      setPhoneSaving(false);
    }
  }

  async function onDelete() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    const { error: err } = await authClient.deleteUser({});
    setDeleting(false);
    if (err) {
      setError(err.message ?? "Could not delete account.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch {
      // Even on a network-level failure the cookie is cleared locally
      // by signOut(); a hard reload to "/" still gets the user out.
      router.push("/");
      router.refresh();
    }
  }

  if (!user) return null;

  const initials = computeInitials(user.name);
  const activeCount = (ucs ?? []).filter((u) => u.status === "ACTIVE").length;
  const completedCount = (ucs ?? []).filter(
    (u) => u.status === "COMPLETED",
  ).length;

  return (
    <section className="py-10 sm:py-12">
      <Container className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Profile
        </h1>

        {/* Identity card — avatar circle + display name + email. Mirrors
            the mobile profile_screen IdentityCard so users moving between
            surfaces see the same "this is you" header. */}
        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-brand-700 text-lg font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
          </div>
        </div>

        {/* Stats — Active + Completed challenge counts. Each tile deep-
            links into the matching status-scoped view of /my-challenges,
            where the user can see month/year bucketing for the completed
            list and tap any card to enter that challenge's progress
            page. The query param pre-applies the existing Status filter
            on /my-challenges (year/month dropdowns stay default). */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile
            label="ACTIVE"
            value={ucs === null ? "—" : `${activeCount}`}
            href="/my-challenges?status=active"
          />
          <StatTile
            label="COMPLETED"
            value={ucs === null ? "—" : `${completedCount}`}
            href="/my-challenges?status=completed"
          />
        </div>

        {/* Account — edit name, change password, email (read-only).
            Input + Save are stacked vertically (input owns its full row,
            button below) so the textbox gets the same breathing room
            the /challenges search input has. Inline Save next to the
            input made the box feel cramped — both fields have the same
            Tailwind classes, only the layout changed. */}
        <SectionCard title="Account">
          <form onSubmit={onSaveName} noValidate className="px-5 py-4 sm:px-6">
            <label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wide text-ink-muted"
            >
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              placeholder="e.g. Alex Rivera"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
            {error ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </p>
            ) : null}
            {savedMessage ? (
              <p className="mt-3 text-sm font-semibold text-brand-700">
                {savedMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
          <Divider />
          <RowItem
            icon={<KeyIcon />}
            label="Change password"
            href="/forgot-password"
            // /forgot-password works for logged-in users too — Better
            // Auth emails the reset link to the address on file.
            hint="We'll email you a reset link"
          />
          <Divider />
          {/* Username — read-only after signup. Editing handles
              encourages link rot and squatting; we'll add a
              cooldown-gated edit later. For now, set-it-once. */}
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <RowIconWrap>
              <AtIcon />
            </RowIconWrap>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                Username
              </p>
              <p className="truncate text-xs text-ink-muted">
                {me?.username ? `@${me.username}` : "—"}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
              Read-only
            </span>
          </div>
          <Divider />
          {/* Phone — editable. Empty input + Save clears it. Validated
              server-side (E.164) so format errors surface as
              phoneError below. */}
          <form
            onSubmit={onSavePhone}
            noValidate
            className="px-5 py-4 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <RowIconWrap>
                <PhoneIcon />
              </RowIconWrap>
              <label
                htmlFor="phone"
                className="flex-1 truncate text-sm font-semibold text-ink"
              >
                Phone
              </label>
            </div>
            <input
              id="phone"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              disabled={phoneSaving}
              placeholder="+1 415 555 0123"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-ink placeholder:text-ink-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-ink-muted">
              International format (e.g. +14155551234). Used for
              phone-OTP sign-in once that lands.
            </p>
            {phoneError ? (
              <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {phoneError}
              </p>
            ) : null}
            {phoneSavedMessage ? (
              <p className="mt-2 text-xs font-semibold text-brand-700">
                {phoneSavedMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={phoneSaving}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-brand-500 px-4 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {phoneSaving ? "Saving…" : "Save phone"}
            </button>
          </form>
          <Divider />
          <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
            <RowIconWrap>
              <MailIcon />
            </RowIconWrap>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">Email</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
              Read-only
            </span>
          </div>
        </SectionCard>

        {/* Your activity — surfaces the screens that used to be reachable
            only from the desktop UserMenu dropdown. Phone users on app
            routes have a slim header so they couldn't get here otherwise. */}
        <SectionCard title="Your activity">
          <RowItem
            icon={<TrophyIcon />}
            label="Achievements"
            href="/achievements"
          />
          <Divider />
          <RowItem
            icon={<HeartIcon />}
            label="Saved challenges"
            href="/favorites"
          />
          <Divider />
          <RowItem
            icon={<FlagIcon />}
            label="Challenges you created"
            href="/my-created-challenges"
          />
          <Divider />
          <RowItem
            icon={<InboxIcon />}
            label="Challenge invites"
            href="/invites"
          />
          <Divider />
          <RowItem
            icon={<UsersIcon />}
            label="Challenge friends"
            href="/friends"
            hint="Manage requests + see your friends"
          />
          <Divider />
          <RowItem
            icon={<ShareIcon />}
            label="Invite friends"
            href="/invite"
          />
        </SectionCard>

        {/* Help & legal — pulls the same routes the mobile profile menu
            lists, plus Privacy / Terms which the web has as routes but
            never linked from /profile before. */}
        <SectionCard title="Help & legal">
          <RowItem icon={<HelpIcon />} label="Help & FAQ" href="/faq" />
          <Divider />
          <RowItem
            icon={<ShieldIcon />}
            label="Health disclaimer"
            href="/health-disclaimer"
          />
          <Divider />
          <RowItem icon={<LockIcon />} label="Privacy policy" href="/privacy" />
          <Divider />
          <RowItem icon={<DocIcon />} label="Terms of service" href="/terms" />
        </SectionCard>

        {/* Sign out — own card, berry/rose accent so it stands apart from
            the navigation tiles above. Primary reason the profile page
            rewrite happened: phone users on app routes had no way to
            log out (slim header strips the hamburger). */}
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-4 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          {signingOut ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-700" />
              Signing out…
            </>
          ) : (
            <>
              <LogoutIcon />
              Sign out
            </>
          )}
        </button>

        {/* Danger zone — kept at the bottom + visually distinct so it
            doesn't get confused with the routine Sign-Out above. */}
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8">
          <h2 className="text-base font-bold text-rose-800">Delete account</h2>
          <p className="mt-2 text-sm text-rose-900/70">
            Permanently removes your account, challenges, check-ins, share
            events, and achievements. This cannot be undone.
          </p>
          <label
            htmlFor="confirm"
            className="mt-4 block text-xs font-semibold uppercase tracking-wide text-rose-800"
          >
            Type DELETE to confirm
          </label>
          <input
            id="confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-rose-300 bg-white px-4 text-base text-ink focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteConfirm !== "DELETE" || deleting}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-rose-600 px-6 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete account permanently"}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Vital30 · v1.0 (MVP) — Wellness guidance only — not medical advice.
        </p>
      </Container>
    </section>
  );
}

// =========================================================================
// Building blocks
// =========================================================================

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function Divider() {
  return <div className="ml-[60px] border-t border-slate-100" />;
}

function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  /**
   * Optional destination. When set the tile becomes a Link with a
   * brand-tinted hover affordance so the user reads it as tappable.
   * Used for Active / Completed counts on /profile so a tap drills
   * straight into the matching scoped view of /my-challenges (with
   * year/month buckets already laid out by that page).
   */
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink sm:text-3xl">
        {value}
      </p>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group block rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-5"
      >
        {inner}
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </p>
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      {inner}
    </div>
  );
}

function RowItem({
  icon,
  label,
  href,
  hint,
}: {
  icon: ReactNode;
  label: string;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:px-6"
    >
      <RowIconWrap>{icon}</RowIconWrap>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">
          {label}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
      <ChevronIcon />
    </Link>
  );
}

function RowIconWrap({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-surface-soft text-ink-muted">
      {children}
    </span>
  );
}

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0].length === 0) return "V";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// =========================================================================
// Icons — all stroke-based, single colour, inherit currentColor so the
// row wrapper can tint them. Kept inline so we don't add an icon library
// dependency just for these.
// =========================================================================

const ICON_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-4 w-4",
  "aria-hidden": true,
} as const;

function KeyIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="8" cy="15" r="4" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}
function AtIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 6h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 6H5a2 2 0 0 0 0 4h2" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 22V4" />
      <path d="M4 4h13l-3 5 3 5H4" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function HelpIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 flex-none text-ink-muted"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
