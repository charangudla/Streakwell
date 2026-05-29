/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useSession,
  signOut,
  getSession,
  readRole,
  type UserRole,
} from '../lib/auth-client';

export type { UserRole };

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  /**
   * Retained for API/test compatibility. With Better Auth cookie sessions
   * there is no bearer token held in the client; this is `'session'` when
   * authenticated and `null` otherwise so `isAuthenticated`-style checks
   * keep working.
   */
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Sign out via Better Auth, clearing the session cookie. */
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Bridges Better Auth's `useSession()` to the `useAuth()` surface the rest
 * of the admin app already consumes (`user`, `isAuthenticated`, `isLoading`,
 * `logout`). The session lives in an HTTP-only cookie shared with the API;
 * there is no token in localStorage anymore.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const sessionUserId = session?.user?.id ?? null;

  // The reactive `useSession()` hook doesn't reliably surface custom fields
  // (our `role` additionalField) on `session.user`. The authoritative
  // `getSession()` does (verified: it returns role=ADMIN), so resolve the
  // role from there whenever the signed-in user changes. We stay "loading"
  // until it resolves so ProtectedRoute never prematurely treats an admin
  // as a non-admin and bounces them to /404.
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleResolved, setRoleResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!sessionUserId) {
      setRole(null);
      setRoleResolved(true);
      return;
    }
    setRoleResolved(false);
    getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setRole(readRole(data?.user));
        setRoleResolved(true);
      })
      .catch(() => {
        if (cancelled) return;
        setRole(readRole(session?.user));
        setRoleResolved(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  const value = useMemo<AuthContextType>(() => {
    const sessionUser = session?.user ?? null;
    const user: AuthUser | null = sessionUser
      ? {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name ?? sessionUser.email,
          role: role ?? readRole(sessionUser),
        }
      : null;

    return {
      user,
      token: user ? 'session' : null,
      isAuthenticated: !!user,
      // Still loading while the session is pending OR while we're resolving
      // the authoritative role for a signed-in user.
      isLoading: isPending || (!!sessionUser && !roleResolved),
      logout: () => {
        void signOut();
      },
    };
  }, [session, isPending, role, roleResolved]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
