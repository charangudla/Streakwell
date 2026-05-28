"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Context-aware "← Back" link.
 *
 * Several pages are reachable from more than one place. The Help & legal
 * pages (/faq, /privacy, /terms, /health-disclaimer) are linked from the
 * public footer AND from the authenticated /profile, and /friends is
 * reachable from both the header 👥 icon and /profile. A hardcoded back
 * button would point to the wrong place for at least one origin — and on
 * the public legal pages it would even render for logged-out footer
 * visitors, sending them somewhere behind the auth wall.
 *
 * So instead the linking page tags its links with a `?from=` query param,
 * and this component only renders a back link when it recognises the
 * origin. Pages that always want *some* back affordance pass a `fallback`
 * pair used when no recognised `from` is present — that's how /friends
 * keeps its default "← Dashboard" when reached from the header icon.
 *
 * Wrapped in <Suspense> so it can be dropped straight into the server
 * components (the legal + FAQ pages) without each one having to add its
 * own boundary for useSearchParams (required in Next 16).
 */
const ORIGINS: Record<string, { href: string; label: string }> = {
  profile: { href: "/profile", label: "Profile" },
};

export function BackLink(props: {
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  return (
    <Suspense fallback={null}>
      <BackLinkInner {...props} />
    </Suspense>
  );
}

function BackLinkInner({
  fallbackHref,
  fallbackLabel,
}: {
  fallbackHref?: string;
  fallbackLabel?: string;
}) {
  const params = useSearchParams();
  const origin = ORIGINS[params.get("from") ?? ""];
  const href = origin?.href ?? fallbackHref;
  const label = origin?.label ?? fallbackLabel;
  if (!href || !label) return null;
  return (
    <div className="mb-4 text-left">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        ← {label}
      </Link>
    </div>
  );
}
