import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The legal markdown lives at ../../docs in the monorepo. Turbopack's
  // tracer refuses to include files outside the project root, so we don't
  // try — instead, the Dockerfile copies the docs/ tree into the image
  // and src/lib/markdown.ts reads them via process.cwd() at runtime.
  // For local `npm run build`, the relative path still resolves correctly
  // because the legal pages are pre-rendered at build time from the
  // sibling docs/ directory.
  poweredByHeader: false,
};

export default nextConfig;
