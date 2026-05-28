# Vital30 MVP Status & Pending Tasks

**Last updated:** 2026-05-27 (end of multi-session push)
**Scope:** Mobile (`apps/mobile`), public website (`apps/web` — now full app, not just marketing), backend (`services/api`), admin (`apps/admin` — needs rework).

> Read this before starting work. Verify claims against the code before acting on them — items here may have been completed since this was last updated.

---

## TL;DR — where the platform stands

| Surface | State | Verified |
|---|---|---|
| **Backend** (`services/api`) | Better Auth + 9 domain modules (challenges, user-challenges, checkins, notifications, achievements, favorites, referrals, share-events, public-contact). 12/12 jest. Typecheck clean. | curl + on-device |
| **Mobile** (`apps/mobile`) | Full Vital30 client. 46/46 flutter tests. 0 analyzer issues. End-to-end verified on iOS Simulator (register → join → check-in → achievement notification). | on-device |
| **Website** (`apps/web`) | Was scaffolded as marketing-only on 2026-05-26 AM. By 2026-05-27 expanded to **full app parity** + PWA-installable. Build green, 14/14 vitest. | curl + browser |
| **Admin** (`apps/admin`) | 2,500 lines of pages exist but still on pre-Better-Auth Bearer auth and references `/admin/*` API endpoints that don't exist. **Needs a dedicated rework session.** | broken |
| **Deploy** | docker-compose.prod.yml + nginx prod.conf + Dockerfile per app + launch-checklist.md ready. SSL plan: single SAN cert for all 4 hostnames. Not yet deployed. | doc only |

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

### Admin `apps/admin` — REWORK NEEDED

Has CategoriesPage, ChallengesPage, UsersPage, UserDetailPage, CheckinsPage, ShareEventsPage, DashboardPage, LoginPage. ~2,500 lines.

**Problem:** uses pre-Better-Auth Bearer auth (`localStorage.vital30_admin_token`) and references `/admin/*` API endpoints that don't exist on the current API. Likely all pages are broken against the live backend.

**Estimated rework:** ~6–8h. Plan:
1. Migrate to Better Auth (Bearer mode is fine — admin can use the same `useSession` pattern as web). Add a role-check so only `role IN ('ADMIN', 'SUPER_ADMIN')` users can sign in.
2. Audit each page against current API surface; rewrite endpoints that moved.
3. Build the missing **`/contact-submissions`** inbox view (backend rows already exist as of 2026-05-27; just needs a `GET /admin/contact-submissions` + `PATCH /admin/contact-submissions/:id/resolve` and a React page).

### Deploy

- **Hostinger KVM 4 walkthrough** in [docs/hostinger-kvm4-deployment.md](docs/hostinger-kvm4-deployment.md).
- **One-page launch checklist** in [docs/launch-checklist.md](docs/launch-checklist.md).
- `.env.prod.example` covers BETTER_AUTH_SECRET, BETTER_AUTH_URL, COOKIE_DOMAIN, CORS_ORIGIN, CONTACT_INBOX, EMAIL_PROVIDER=resend, RESEND_API_KEY, POSTGRES_*, NEXT_PUBLIC_*, VITE_API_BASE_URL. Deploy script `scripts/deploy-prod.sh` refuses to run while any `<REPLACE_ME_*>` placeholder remains.
- `docker-compose.prod.yml` covers postgres + redis + api + admin + web + nginx. Web uses Next.js standalone output. nginx serves the 4 subdomains.
- **DNS:** 4 A records (`@`, `www`, `api`, `admin`) → VPS IP.
- **SSL:** single Let's Encrypt SAN cert for all 4 hostnames via Certbot.

---

## What's blocked or deferred

These genuinely need YOU (your accounts, decisions, money, or human review). No code-only path.

| Item | Blocker | Effort |
|---|---|---|
| **Push notifications** (FCM + APNs) | Firebase project + APNs key from your Apple Developer account ($99/yr) | ~6h after credentials |
| **Real testimonials** on landing | Need real beta users to ask | n/a |
| **App Store / Play Store submission** | Apple Developer + Google Play Console accounts; screenshots; data-safety answers | ~half a day each |
| **Production deploy** | Hostinger VPS provisioning, DNS at registrar, real BETTER_AUTH_SECRET + Resend key | ~2h pairing |
| **Attorney review** of `/docs/{privacy,terms,health-disclaimer}.md` | Human only | n/a |
| **Admin rework** (above) | Not blocked, but better as a dedicated session | ~6-8h |

---

## How to use this file

- Pick an unchecked item, **verify it's still pending** (claims may be stale), then work it.
- When you complete an item, check it off in the same PR.
- If you discover a new gap, add it under the right section.
- The last-audited date matters: anything > a couple of weeks old should be re-verified before being trusted.

---

## Verification commands (latest run: 2026-05-27)

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
