"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "./Container";
import { ButtonLink } from "./Button";
import { isAppRoute } from "./MobileTabBar";
import { NotificationBell } from "./NotificationBell";
import { signOut, useSession } from "@/lib/auth-client";

const PUBLIC_NAV = [
  { href: "/challenges", label: "Challenges" },
  { href: "/about", label: "About" },
  { href: "/download", label: "Download" },
  { href: "/faq", label: "FAQ" },
];

const AUTHED_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-challenges", label: "My challenges" },
  { href: "/challenges", label: "Browse" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const nav = user ? AUTHED_NAV : PUBLIC_NAV;
  // On phone-sized viewports + an authenticated app route, the bottom
  // tab bar carries navigation, so we collapse the top header to just
  // brand + bell. Desktop and marketing pages keep the full header.
  const slimMobile = !!user && isAppRoute(pathname);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <Container
        className={`flex h-16 items-center justify-between ${slimMobile ? "" : ""}`}
      >
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            V
          </span>
          Vital30
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8">
          {nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          {isPending ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <ChatIconLink />
              <NotificationBell />
              <UserMenu name={user.name} onSignOut={handleSignOut} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-semibold text-ink-muted hover:text-ink"
              >
                Sign in
              </Link>
              <ButtonLink href="/register" size="md">
                Get started
              </ButtonLink>
            </div>
          )}
        </div>

        {/* On phone-sized authenticated app pages, the bottom tab bar
            carries navigation, so we show JUST a notification bell on the
            right instead of the hamburger menu. We conditionally RENDER
            (not toggle a `hidden` class) because mixing Tailwind display
            utilities like `inline-flex` and `hidden` on the same element
            is order-dependent and the wrong one can win. */}
        {slimMobile ? (
          <div className="flex items-center gap-1 md:hidden">
            <ChatIconLink />
            <NotificationBell />
          </div>
        ) : (
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
        )}
      </Container>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isPending ? null : user ? (
              <>
                <Link
                  href="/profile"
                  className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 rounded-lg px-3 py-3 text-left text-base font-medium text-ink-muted hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-2 grid gap-2">
                <Link
                  href="/login"
                  className="rounded-full px-5 py-3 text-center text-sm font-semibold text-ink ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <ButtonLink
                  href="/register"
                  size="md"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  Get started
                </ButtonLink>
              </div>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}

function UserMenu({
  name,
  onSignOut,
}: {
  name: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-200"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-xs text-white">
          {initials || "V"}
        </span>
        <span className="hidden sm:inline">{name.split(" ")[0]}</span>
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/my-challenges"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              My challenges
            </Link>
            <Link
              href="/my-created-challenges"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Challenges you created
            </Link>
            <Link
              href="/invites"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Challenge invites
            </Link>
            <Link
              href="/favorites"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Saved challenges
            </Link>
            <Link
              href="/achievements"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Achievements
            </Link>
            <Link
              href="/invite"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Invite friends
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-ink hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="block w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
            >
              Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Header chat link — speech-bubble glyph in a hoverable square tile,
 * sized to match the NotificationBell next to it. Links to the chat
 * inbox where the user picks which challenge channel to open.
 */
function ChatIconLink() {
  return (
    <Link
      href="/chat"
      aria-label="Community chat"
      className="grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-slate-100 hover:text-ink"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </Link>
  );
}
