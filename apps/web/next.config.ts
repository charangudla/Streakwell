import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the standalone file-tracing root to the repo root so the output
  // ALWAYS nests under apps/web/ (i.e. server.js → apps/web/server.js),
  // which is exactly what apps/web/Dockerfile copies and runs
  // (`node apps/web/server.js`). Without this, Next *infers* the root from
  // the build context: locally it lands on the repo root, but inside the
  // Docker build — which only contains apps/web + docs, with no workspace
  // marker above apps/web — it infers apps/web and emits a FLAT standalone
  // (server.js at the root), causing "Cannot find module
  // /app/apps/web/server.js" at container startup. `next build` is always
  // invoked from apps/web here, so cwd/../.. is the repo root.
  outputFileTracingRoot: path.join(process.cwd(), "..", ".."),
  // The legal markdown lives at ../../docs in the monorepo. Turbopack's
  // tracer refuses to include files outside the project root, so we don't
  // try — instead, the Dockerfile copies the docs/ tree into the image
  // and src/lib/markdown.ts reads them via process.cwd() at runtime.
  // For local `npm run build`, the relative path still resolves correctly
  // because the legal pages are pre-rendered at build time from the
  // sibling docs/ directory.
  poweredByHeader: false,

  // In dev, proxy /api/* + /referrals|/notifications|... through Next so
  // the browser sees same-origin requests to the API. This makes Better
  // Auth's HTTP-only session cookie a first-party cookie (no SameSite=None
  // hell on http://localhost) and keeps fetch() calls simple — no CORS
  // preflight, no credentials gymnastics.
  //
  // In prod, the API is at api.challenge.charangudla.com (separate subdomain) and the
  // cookie is set with `Domain=.challenge.charangudla.com; SameSite=Lax`, so this rewrite
  // is not used.
  async rewrites() {
    if (!isDev) return [];
    const apiBase = process.env.API_PROXY_TARGET ?? "http://localhost:3000";
    return [
      { source: "/api/auth/:path*", destination: `${apiBase}/api/auth/:path*` },
      { source: "/api/proxy/:path*", destination: `${apiBase}/:path*` },
    ];
  },
};

export default nextConfig;
