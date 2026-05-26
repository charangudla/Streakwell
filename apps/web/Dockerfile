# Build from the repo root so we can include /docs alongside /apps/web:
#   docker build -f apps/web/Dockerfile .

FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Install deps for apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

# Copy app source + the legal markdown source-of-truth from /docs.
# Same path layout as in the repo so src/lib/markdown.ts (../../docs/...) works.
WORKDIR /repo
COPY apps/web ./apps/web
COPY docs ./docs

# Move node_modules into place (kept warm in /app to leverage the layer cache).
RUN mv /app/node_modules /repo/apps/web/node_modules

WORKDIR /repo/apps/web
RUN npm run build

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Next standalone bundles a minimal server.js + node_modules.
# Standalone output preserves the monorepo path layout, so /apps/web/server.js
# is the entrypoint and /docs lives at /app/docs (one level above /apps).
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /repo/docs ./docs

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
