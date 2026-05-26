import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Vital30's docs/ live one level above this app in the monorepo; include them
  // in the standalone build so legal pages can read the markdown at runtime.
  outputFileTracingIncludes: {
    "/privacy": ["../../docs/privacy-policy.md"],
    "/terms": ["../../docs/terms-of-service.md"],
    "/health-disclaimer": ["../../docs/health-disclaimer.md"],
  },
  poweredByHeader: false,
};

export default nextConfig;
