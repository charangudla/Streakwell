/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { useSession, signOut, readRole, type UserRole } from '../lib/auth-client';

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

  const value = useMemo<AuthContextType>(() => {
    const sessionUser = session?.user ?? null;
    const user: AuthUser | null = sessionUser
      ? {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name ?? sessionUser.email,
          role: readRole(sessionUser),
        }
      : null;

    return {
      user,
      token: user ? 'session' : null,
      isAuthenticated: !!user,
      isLoading: isPending,
      logout: () => {
        void signOut();
      },
    };
  }, [session, isPending]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
