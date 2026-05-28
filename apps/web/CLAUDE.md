# apps/web — Vital30 Public Website

@AGENTS.md

## Scope

**UPDATED 2026-05-26 PM: scope expanded from marketing-only to full app parity.**

This is the public site at `challenge.charangudla.com`. Users can sign up + use Vital30
fully in the browser, then optionally download the mobile app and sign in
with the same account. Marketing pages stay public + indexable; the
authenticated app surface is gated behind `<AuthGuard>`.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4 (theme tokens live in `src/app/globals.css` under `@theme`, not a JS config)
- `marked` for rendering legal docs from `../../docs/*.md`
- `better-auth@1.6.11` — matches the API version. Cookie sessions.

## Routes

### Public
| Path | Source | Notes |
|---|---|---|
| `/` | static | Hero, How It Works, popular challenges (from API, falls back to `lib/fallback-challenges.ts`), why, disclaimer, CTA |
| `/challenges` | ISR | Grouped by category from the API; client-side search + filter |
| `/challenges/[slug]` | SSG | `generateStaticParams` from `GET /challenges`; per-slug OG image |
| `/categories`, `/categories/[slug]` | static + SSG | One landing page per category |
| `/about`, `/download`, `/contact`, `/faq` | static | `/contact` has a working form (POST /public/contact) |
| `/privacy`, `/terms`, `/health-disclaimer` | static | Rendered from `/docs/*.md` via `lib/markdown.ts` |
| `/sitemap.xml`, `/robots.txt` | auto | `app/sitemap.ts`, `app/robots.ts` |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | static | Better Auth client |

### Authenticated (wrapped in `<AuthGuard>`)
| Path | What |
|---|---|
| `/dashboard` | Greeting, active challenges with check-in link, quick links |
| `/my-challenges` | Active / Completed / Abandoned groups |
| `/my-challenges/[id]/checkin` | Yes / Missed / Skip → backend awards achievements + notifications |
| `/my-challenges/[id]/progress` | 30-day grid + stat cards + Web Share API |
| `/notifications` | Inbox; optimistic mark-read + mark-all |
| `/achievements` | All 5 badge slots with earned/locked state |
| `/favorites` | Saved challenges with per-row remove |
| `/invite` | Referral code + Copy/Share + Redeem form |
| `/profile` | Edit name, delete account |

## Auth architecture

- `src/lib/auth-client.ts` — Better Auth React client. baseURL is the
  website's own origin (`http://localhost:3001/api/auth` in dev,
  `https://api.challenge.charangudla.com/api/auth` in prod).
- Dev: Next.js rewrites in `next.config.ts` proxy `/api/auth/*` →
  `http://localhost:3000/api/auth/*` and `/api/proxy/*` →
  `http://localhost:3000/*`. Browser sees same-origin requests → session
  cookie is first-party, no CORS preflight, no SameSite=None.
- Prod: API sets cookie with `Domain=.challenge.charangudla.com; SameSite=Lax; Secure`
  via Better Auth's `crossSubDomainCookies` config (gated on the API's
  `COOKIE_DOMAIN` env var). Browser at `challenge.charangudla.com` sends the cookie to
  `api.challenge.charangudla.com` naturally.
- `<AuthGuard>` wraps every authenticated page. Checks `useSession()`,
  redirects unauthed users to `/login?next=<current>`.

## Data fetching

- **Server-side** (SSG / ISR / server components): `src/lib/api.ts`
  hits `NEXT_PUBLIC_API_BASE_URL` directly. Used only for
  `@AllowAnonymous()` endpoints (challenges, categories) where cookies
  don't matter.
- **Client-side** (any `'use client'` component): `src/lib/api-client.ts`.
  Routes through `/api/proxy/*` in dev (same-origin, cookie attached),
  hits `NEXT_PUBLIC_API_BASE_URL` directly in prod. Always
  `credentials: include`. Throws `ApiClientError` on non-2xx.

## Local dev

```bash
# 1. From repo root, start Postgres + Mailpit
docker compose up -d
cd services/api && npm run start:dev

# 2. In another terminal:
cd apps/web
npm install
npm run dev                   # http://localhost:3001
```

> The website hits the API through Next.js rewrites in dev. The API
> must include `http://localhost:3001` in its `CORS_ORIGIN` — which
> means BOTH the repo-root `.env` AND `services/api/.env` (the latter
> shadows the former — see `docs/local-development.md`).

## Build + verify

```bash
npm run build       # full prod build, includes typecheck
npm run typecheck   # tsc --noEmit only
npm run test        # vitest
npm run lint        # eslint
```

## Design tokens

Defined in `src/app/globals.css` under `@theme`:
- `brand-{50..900}` — primary green (#10b981 at 500)
- `sky-accent` — secondary blue
- `streak` — amber for streak counters
- `ink`, `ink-muted`, `surface`, `surface-soft` — text + background

Tailwind utilities use these directly: `bg-brand-500`, `text-ink-muted`, `bg-surface-soft`.

## Legal pages

The Markdown source of truth is `/docs/{privacy-policy,terms-of-service,health-disclaimer}.md`. `lib/markdown.ts` reads them at request/build time, strips GFM alert blocks (since Tailwind prose doesn't style them), and emits HTML. Update the docs, not the TSX.

## Deploy

- Production domain: `challenge.charangudla.com` (+ `www.` redirect)
- Container in `docker-compose.prod.yml`; nginx in `deploy/nginx/prod.conf` proxies challenge.charangudla.com to the web container.
- SSL via Let's Encrypt — issue **one SAN cert** for `challenge.charangudla.com`, `www.challenge.charangudla.com`, `api.challenge.charangudla.com`, `admin.challenge.charangudla.com`.
- Env vars to set in production `.env`:
  - `NEXT_PUBLIC_SITE_URL=https://challenge.charangudla.com`
  - `NEXT_PUBLIC_API_BASE_URL=https://api.challenge.charangudla.com`
  - On the API side, `COOKIE_DOMAIN=.challenge.charangudla.com` and CORS_ORIGIN include all three subdomains
