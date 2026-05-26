/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment */

// CJS-friendly stub of `better-auth` for Jest. Real flows are exercised
// against the running server (on-device + curl); this only exists so the
// module graph can be required without the ESM-only package blowing up.

export function betterAuth(_config: any): any {
  return {
    api: {},
    handler: (_req: any, _res: any) => undefined,
    options: _config,
  };
}
