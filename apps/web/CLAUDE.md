# apps/web — Vital30 Public Website

@AGENTS.md

## Scope

This is the public marketing site at `vital30.com`. **Marketing only — no auth, no check-in, no user state.** All account features live in the Flutter mobile app (`apps/mobile`).

If a feature requires a logged-in user, it does not belong here.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4 (theme tokens live in `src/app/globals.css` under `@theme`, not a JS config)
- `marked` for rendering legal docs from `../../docs/*.md`

## Routes

| Path | Source | Notes |
|---|---|---|
| `/` | static + ISR | Hero, how it works, popular challenges (from API, falls back to `lib/fallback-challenges.ts`), why, disclaimer, CTA |
| `/challenges` | ISR | Grouped by category from the API |
| `/challenges/[slug]` | SSG | `generateStaticParams` from `GET /challenges`; slug lookup is client of `fetchChallengeBySlug` which filters the list (no slug-based API route yet) |
| `/about` | static |
| `/download` | static | "Coming soon" — no real store links yet |
| `/contact` | static | mailto links |
| `/privacy`, `/terms`, `/health-disclaimer` | static | Rendered from `/docs/*.md` via `lib/markdown.ts` |
| `/sitemap.xml`, `/robots.txt` | auto | `app/sitemap.ts`, `app/robots.ts` |

## Data fetching

`src/lib/api.ts` wraps `fetch(API_BASE_URL + path, { next: { revalidate: 3600 } })`. All endpoints used are `@AllowAnonymous()` on the NestJS side:
- `GET /challenges`
- `GET /categories`

Failures fall through to empty arrays — the UI handles empty state gracefully and the landing page falls back to a hardcoded popular-challenges list so the site renders even if the API is down.

**Do not add `fetch` calls to authenticated endpoints from this app.** If you need that, the user wants the mobile app, not the website.

## Local dev

```bash
# 1. From repo root, start API + Postgres
docker compose up -d
cd services/api && npm run start:dev

# 2. In another terminal:
cd apps/web
cp .env.example .env.local   # only if you need to override
npm install
npm run dev                   # http://localhost:3001
```

The website hits the API at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3000`). The API must include `http://localhost:3001` in its `CORS_ORIGIN` (already in root `.env.example`).

## Build + verify

```bash
npm run build         # full prod build, includes typecheck
npm run typecheck     # tsc --noEmit only
npm run lint          # eslint
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

## Deploy (future)

- Production domain: `vital30.com` (+ `www.` redirect)
- Container in the prod docker-compose; nginx at `deploy/nginx/prod.conf` should proxy to `apps/web` on its internal port
- SSL via Let's Encrypt — must be on day 1 of any public domain
- `NEXT_PUBLIC_SITE_URL=https://vital30.com` and `NEXT_PUBLIC_API_BASE_URL=https://api.vital30.com` in production env
- API CORS must include the production website origin
