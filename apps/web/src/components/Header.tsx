"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "./Container";
import { ButtonLink } from "./Button";
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
  const { data: session, isPending } = useSession();
  const user = session?.user ?? null;
  const nav = user ? AUTHED_NAV : PUBLIC_NAV;

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
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
