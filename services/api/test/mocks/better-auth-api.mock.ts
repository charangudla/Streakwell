/* eslint-disable @typescript-eslint/no-explicit-any */

// CJS-friendly stub of `better-auth/api`. Real behaviour validated against
// the running server; this only exists so the module graph can be required
// from Jest without the ESM-only package blowing up.

export class APIError extends Error {
  constructor(
    public status: string,
    init?: { message?: string },
  ) {
    super(init?.message ?? status);
  }
}

export const createAuthMiddleware = <T extends (...args: any[]) => any>(
  fn: T,
): T => fn;
