"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Wrap any client page or layout that requires an authenticated session.
 *
 * - While Better Auth's session check is in flight → centered spinner.
 * - If unauthed → redirect to /login?next=<currentPath> so we can bounce
 *   back after login. Renders null during the redirect.
 * - If authed → renders children.
 *
 * Use only inside client components. For server-component pages, do an
 * SSR session check + redirect there instead (we don't need that yet —
 * all authed pages are client-rendered).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !session?.user) {
      const next = encodeURIComponent(pathname ?? "/dashboard");
      router.replace(`/login?next=${next}`);
    }
  }, [isPending, session, router, pathname]);

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </div>
    );
  }
  if (!session?.user) return null;

  return <>{children}</>;
}
