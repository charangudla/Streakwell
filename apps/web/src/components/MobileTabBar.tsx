"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * Bottom tab bar — mirrors the mobile app's `MainNavigationShell`. Only
 * renders on viewports below `md` (so phones + most tablets) and only
 * when the user is on an authenticated app route. Desktop users keep the
 * top header + user menu.
 *
 * 4 tabs match the mobile app exactly:
 *   Home (/dashboard) · Challenges (/challenges) · Progress (/my-challenges) · Profile (/profile)
 *
 * Marketing pages (/about, /, /faq, /privacy, etc.) are intentionally
 * NOT in the app shell — they use the standard responsive Header with
 * its hamburger menu so first-time visitors get a normal-looking landing.
 */
const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    matchPrefixes: ["/dashboard"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12L12 3l9.75 9M4.5 10.5V21h15V10.5"
        />
      </svg>
    ),
  },
  {
    href: "/challenges",
    label: "Challenges",
    matchPrefixes: ["/challenges", "/categories", "/create-challenge"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3.75h6v6h-6v-6zM14.25 3.75h6v6h-6v-6zM3.75 14.25h6v6h-6v-6zM14.25 14.25h6v6h-6v-6z"
        />
      </svg>
    ),
  },
  {
    href: "/my-challenges",
    label: "Progress",
    matchPrefixes: ["/my-challenges", "/my-created-challenges", "/invites"],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5l5-5 4 4 7-7M21 8.5V3.5h-5"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    matchPrefixes: [
      "/profile",
      "/notifications",
      "/achievements",
      "/favorites",
      "/invite",
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a7.5 7.5 0 0115 0"
        />
      </svg>
    ),
  },
] as const;

/**
 * Routes considered "app" — the tab bar shows when the user is on one
 * of these AND signed in. Matched as prefixes.
 */
const APP_ROUTE_PREFIXES = TABS.flatMap((t) => t.matchPrefixes);

export function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session?.user) return null;
  if (!isAppRoute(pathname)) return null;

  const activePrefix =
    TABS.find((t) =>
      t.matchPrefixes.some(
        (p) => pathname === p || (pathname?.startsWith(`${p}/`) ?? false),
      ),
    )?.href ?? null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-between px-2 pt-1.5">
        {TABS.map((t) => {
          const isActive = activePrefix === t.href;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors ${isActive ? "text-brand-700" : "text-ink-muted hover:text-ink"}`}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
