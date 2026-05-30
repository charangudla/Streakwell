# Vital30 MVP Status & Pending Tasks

**Last updated:** 2026-05-30
**Scope:** Mobile (`apps/mobile`), public website (`apps/web` — full app, not just marketing), backend (`services/api`), admin (`apps/admin` — reworked + live).

> Read this before starting work. Verify claims against the code before acting on them — items here may have been completed since this was last updated.

---

## TL;DR — where the platform stands

| Surface | State | Verified |
|---|---|---|
| **Backend** (`services/api`) | Better Auth + the original 9 domain modules **plus** custom-challenges, invites, challenge-chat, friends, audit, and a full admin module. RBAC: USER / ADMIN / SUPER_ADMIN. | curl + on-device |
| **Mobile** (`apps/mobile`) | Full Vital30 client. 46/46 flutter tests. 0 analyzer issues. End-to-end verified on iOS Simulator (register → join → check-in → achievement notification). | on-device |
| **Website** (`apps/web`) | Was scaffolded as marketing-only on 2026-05-26 AM. By 2026-05-27 expanded to **full app parity** + PWA-installable. Build green, 14/14 vitest. | curl + browser |
| **Admin** (`apps/admin`) | **Reworked.** Migrated to Better Auth + `useSession` with an RBAC gate (ADMIN / SUPER_ADMIN); wired to real `/admin/*` endpoints (dashboard stats, users, challenge/category CRUD, check-ins, share-events, moderation, contact inbox). | deployed; e2e smoke recommended |
| **Deploy** | **Live in production** on Hostinger KVM 4 (challenge / api / admin / www .charangudla.com), HTTPS via a Let's Encrypt SAN cert. **Staging environment** runs alongside prod (staging.challenge.charangudla.com) — see [docs/staging-environment.md](docs/staging-environment.md). | live |

---

## What works on each surface

### Backend `services/api` (NestJS + Better Auth + Prisma)

**Auth routes (Better Auth, `/api/auth/*`):**
sign-up, sign-in, sign-out, request-password-reset, reset-password, send-verification-email, verify-email, update-user, delete-user, get-session. Bearer mode for mobile + cookie mode for web. Auto-mints an 8-char referral code on signup. Password policy: 8+ chars with upper/lower/number/symbol.

**Domain routes (`@AllowAnonymous()` unless noted):**

| Route | Notes |
|---|---|
| `GET /health`, `GET /` | anonymous |
| `GET /categories`, `GET /challenges`, `GET /challenges/:id`, `GET /challenges/slug/:slug` | anonymous |
| `POST /user-challenges`, `GET /user-challenges` | session-gated; server-computed `progressPercent` |
| `POST /checkins`, `GET /checkins/challenge/:id` | session-gated. COMPLETED check-ins auto-award FIRST_CHECKIN, 7/21-day streaks, CHALLENGE_COMPLETED (also flips userChallenge.status), THREE_CHALLENGES_COMPLETED. Each award emits a notification. |
| `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all` | session-gated |
| `GET /favorites`, `POST /favorites`, `DELETE /favorites/:challengeId` | session-gated, duplicate protection (409) |
| `GET /achievements` | session-gated |
| `GET /referrals/me`, `POST /referrals/redeem` | session-gated. Redeem emits REFERRAL_JOIN notification to the inviter. |
| `POST /share-events` | session-gated |
| `POST /public/contact` | anonymous, rate-limited 5/hr/IP, honeypot, persists to `ContactSubmission` table + emails CONTACT_INBOX |

**Added since 2026-05-27** (routes not expanded here — see each module):
- **`custom-challenges`** — user-created challenges + `ChallengeInvite` tokens (`/c/[token]` join flow), joiners list, auto-join creator.
- **`challenge-chat`** — per-challenge messages + reactions (daily system prompts via a unique `(challengeId, kind, scheduledDate)` constraint, **no cron**).
- **`friends`** — `ChallengeFriendship` connections.
- **`admin`** — RBAC-gated `/admin/*` surface (dashboard stats, user management, challenge/category CRUD, check-in + share-event viewers, moderation, contact-submission inbox).

**Security posture:**
- `AuthGuard` registered globally; every route is authenticated unless `@AllowAnonymous()`.
- Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.
- Per-route rate limits in Better Auth + `@Throttle` on contact form.
- `class-validator` on all DTOs.
- `helmet`, `enableCors` from CSV `CORS_ORIGIN`.
- `audit_log` table — appended on signup, login, password reset request, password reset complete, account delete.

### Mobile `apps/mobile` (Flutter + Riverpod + go_router)

**Working end-to-end** (verified on iOS Simulator):
- Welcome / register / login / forgot-password / OTP / new-password / reset-success — Better Auth Bearer.
- Onboarding carousel with seen-flag persistence.
- Challenge browse / filter / search / detail.
- Join challenge, daily check-in (Yes / Missed / Skip), day-complete celebration, day-30 challenge-complete screen, streak milestone modal.
- Progress screen with 30-day calendar grid.
- **Notifications inbox** — real-time, optimistic mark-read, pull-to-refresh.
- **Achievements** — 5-badge gallery with earned/locked state.
- **Invite friends** — backend-minted 8-char referral code + copy/share + redeem tile.
- **Saved challenges** (favorites) — heart on every challenge card + dedicated screen.
- **In-app FAQ** — 9 questions in accordion.
- **Share progress PNG** — 9:16 share card captured via RepaintBoundary, attached as PNG to iOS share sheet.
- **Edit profile, delete account.**
- **Local notifications** via flutter_local_notifications (reminder time picker; daily reminders fire when phone is locked).

**Quality:** `flutter analyze` 0 issues, `flutter test` 46/46. `apps/mobile/assets/env/development.env` points at `http://localhost:3000` for Simulator use.

### Website `apps/web` (Next.js 16 App Router + Tailwind 4 + Better Auth)

**Public (no auth):** `/`, `/challenges`, `/categories`, `/categories/[slug]`, `/challenges/[slug]`, `/about`, `/download`, `/contact` (with working form), `/faq`, `/privacy`, `/terms`, `/health-disclaimer`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/icon`, `/apple-icon`, `/login`, `/register`, `/forgot-password`, `/reset-password`.

**Authenticated (wrapped in `<AuthGuard>`):** `/dashboard`, `/my-challenges`, `/my-challenges/[id]/checkin`, `/my-challenges/[id]/progress`, `/notifications`, `/achievements`, `/favorites`, `/invite`, `/profile`.

**Auth architecture:** Better Auth React client. Dev uses Next.js rewrites so cookies are first-party. Prod uses cross-subdomain cookies (`Domain=.challenge.charangudla.com; SameSite=Lax; Secure`) via the API's `COOKIE_DOMAIN` env var.

**PWA-installable:** web manifest + dynamic icons + InstallPrompt component (Chrome `beforeinstallprompt` + iOS Safari "Add to Home Screen" hint).

**SEO:** per-challenge OG image (next/og), JSON-LD (Organization + WebSite + per-challenge Article), sitemap, robots.

**Quality:** build green (68 routes), `vitest` 14/14, no lint errors.

### Admin `apps/admin` — REWORKED

The rework session is **done** (the three planned steps below all landed):

1. **Auth migrated to Better Auth.** No more `localStorage.vital30_admin_token`; `src/lib/auth-client.ts` uses `createAuthClient` + `useSession`, and `src/routing/AuthProvider.tsx` bridges it to the app's `useAuth()`. RBAC gate restricts sign-in to `role IN ('ADMIN', 'SUPER_ADMIN')` (backed by the `User.isActive` + role migration).
2. **All pages wired to the real `/admin/*` API** — dashboard stats, users management + enriched UserDetail, challenge/category CRUD, check-in + share-event viewers, and moderation (custom challenges, chat, friends, contact).
3. **Contact-submission inbox** view shipped against the `GET /admin/contact-submissions` endpoint.

> [!NOTE]
> Verified at the build/endpoint level; the SPA serves on
> `admin.challenge.charangudla.com`. A full click-through e2e smoke against the
> live API (login as an admin → load each page) is still worth doing once.

### Deploy — LIVE

- **Production is live** on Hostinger KVM 4 (`root@2.24.89.83`, `/opt/vital30`): challenge.charangudla.com (web) + api / admin / www subdomains, all HTTPS.
- **Staging environment** runs alongside prod on the same VPS — see [docs/staging-environment.md](docs/staging-environment.md). Isolated DB/Redis/volumes/network; fronted by the same nginx over a shared `vital30_edge` network; staging.challenge.charangudla.com + api/admin variants.
- `docker-compose.prod.yml` covers postgres + redis + api + admin + web + nginx (Next.js standalone). `docker-compose.staging.yml` mirrors it with `staging-*` service names.
- **Deploy flow:** `./scripts/deploy-remote.sh` (Mac → push + VPS pull + `deploy-prod.sh`). `deploy-prod.sh` validates `.env`, builds, migrates, restarts nginx (refreshes cached upstream IPs), prints the safe catalog-seed command. `deploy-staging.sh` additionally auto-seeds the catalog.
- **DNS:** 7 A records (`@`, `www`, `api`, `admin` + `staging`, `api.staging`, `admin.staging`) → `2.24.89.83`.
- **SSL:** one Let's Encrypt SAN cert (lineage `challenge.charangudla.com`) covering all 7 hostnames; auto-renew timer active.
- **Recent prod fixes:** SSR fetches routed over the internal Docker network + 4s timeout (fixed a 502); nginx auto-restart on redeploy (stale upstream IPs); web healthcheck probes `127.0.0.1` not `localhost` (IPv4-only standalone bind → was false `unhealthy`).
- Reference docs: [docs/hostinger-kvm4-deployment.md](docs/hostinger-kvm4-deployment.md), [docs/launch-checklist.md](docs/launch-checklist.md).

---

## What's blocked or deferred

These genuinely need YOU (your accounts, decisions, money, or human review). No code-only path.

| Item | Blocker | Effort |
|---|---|---|
| **Push notifications** (FCM + APNs) | Firebase project + APNs key from your Apple Developer account ($99/yr) | ~6h after credentials |
| **Real testimonials** on landing | Need real beta users to ask | n/a |
| **App Store / Play Store submission** | Apple Developer + Google Play Console accounts; screenshots; data-safety answers | ~half a day each |
| **Attorney review** of `/docs/{privacy,terms,health-disclaimer}.md` | Human only | n/a |

> ✅ **Production deploy** and **Admin rework** (both previously listed here) are
> done — see the Deploy and Admin sections above.

---

## Known gaps / tech debt (code-only, not blocked on you)

| Item | Why it matters | Effort |
|---|---|---|
| **Data retention / pruning job** | No scheduler exists (`@nestjs/schedule` not installed, no cron). `Notification`, expired `Session`, `ContactSubmission`, `ShareEvent`, and `ChallengeChatMessage` rows accumulate without bound, and nightly DB backups under `./backups` are never rotated. Needs a scheduled task that deletes rows past a retention window + prunes old backup files. Fine to defer at low traffic. | ~3–4h once retention windows are decided |

---

## How to use this file

- Pick an unchecked item, **verify it's still pending** (claims may be stale), then work it.
- When you complete an item, check it off in the same PR.
- If you discover a new gap, add it under the right section.
- The last-audited date matters: anything > a couple of weeks old should be re-verified before being trusted.

---

## Verification commands

> [!NOTE]
> Last **full** local test run was 2026-05-27 (backend 12/12 jest, web 14/14
> vitest, mobile 46/46). The backend gained custom-challenges, challenge-chat,
> friends, and the admin module since, and the admin SPA was reworked — re-run
> the suites below before trusting those counts.

```bash
# Backend
cd services/api && npm test && npm run typecheck       # 12/12, 0 errors

# Mobile
cd apps/mobile && flutter analyze --no-pub && flutter test --no-pub
# 0 issues, 46/46

# Website
cd apps/web && npm test && npm run build               # 14/14, 68 routes

# Stack running:
docker compose up -d                                    # postgres + mailpit
cd services/api && npm run start:dev                    # API on :3000
cd apps/web && npm run dev                              # web on :3001
```

Smoke contracts:
```bash
curl http://localhost:3000/health                                  # → {"status":"ok"}
curl http://localhost:3001/                                        # → 200
curl http://localhost:3001/manifest.webmanifest                    # → 200 + manifest JSON
# Auth round-trip + favorites + checkins + notifications + achievements + referrals
# all verified end-to-end on 2026-05-27 via curl + iOS Simulator + browser.
```
