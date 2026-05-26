# Vital30 MVP Status & Pending Tasks

**Last updated:** 2026-05-26 (after overnight feature expansion)
**Scope:** Mobile (`apps/mobile`), public website (`apps/web`, new), and backend (`services/api`).

> Read this before starting work. Verify claims against the code before acting on them — items here may have been completed since this was last updated.

---

## 2026-05-26 overnight expansion — quick punch list

User asked for "fully functional" mobile + website, not just MVP. Worked autonomously through these in one session:

**New surface — public website (`apps/web`):** Next.js 16 (App Router, Turbopack) + Tailwind 4 marketing site on port 3001.
- [x] Landing (hero, How It Works, popular challenges from API, Why Vital30, phone mockup, testimonials, disclaimer, CTA)
- [x] `/challenges` with client-side search + category + difficulty filters
- [x] `/challenges/[slug]` SSG (one per active challenge) + per-page dynamic OG image (`opengraph-image.tsx`)
- [x] `/categories` + `/categories/[slug]` SSG
- [x] `/about`, `/download` (with phone-frame screenshot gallery), `/contact`, `/faq`
- [x] `/privacy`, `/terms`, `/health-disclaimer` (rendered from `docs/*.md`)
- [x] `sitemap.xml`, `robots.txt`, JSON-LD (Organization + WebSite + per-challenge Article), `not-found.tsx`, `error.tsx`
- [x] Multi-stage Dockerfile (standalone output, non-root user, includes `docs/` for legal pages); `docker-compose.prod.yml` `web` service; nginx vital30.com + www→apex server blocks
- [x] Vitest setup with 14 tests (Button, ChallengeCard, lib/api fallback paths)

**Backend new surface:**
- [x] `GET /challenges/slug/:slug` (anonymous)
- [x] `Notification` model + module: `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`
- [x] `Favorite` model + module: `GET /favorites`, `POST /favorites`, `DELETE /favorites/:challengeId`
- [x] `Achievement` model + module: `GET /achievements`. Awarded automatically from `CheckinsService` on FIRST_CHECKIN, 7-day streak, 21-day streak, CHALLENGE_COMPLETED, THREE_CHALLENGES_COMPLETED. Each award also emits an inbox notification.
- [x] `User.referralCode` + `User.referredById`. Auto-generated 8-char base32 code in Better Auth's `user.create.after` hook. `GET /referrals/me` (lazy mint as safety net), `POST /referrals/redeem` (emits REFERRAL_JOIN notification to the inviter).
- [x] On day-30 completion, server now marks `UserChallenge.status = COMPLETED` automatically (mobile no longer needs to compute completion locally).
- [x] Migration `20260526064349_notifications_referrals_favorites_achievements` applied locally.
- [x] `docker-compose.prod.yml` fixed: replaced stale `JWT_SECRET`/`JWT_EXPIRES_IN` (pre-Better-Auth) with `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`/`EMAIL_*` so prod boot won't fail.

**Mobile wiring:**
- [x] **Notifications inbox** — fully wired. Replaced hardcoded list with `notificationsProvider` (Riverpod AsyncNotifier). Pull-to-refresh, optimistic mark-read + mark-all, empty/error states.
- [x] **Invite friends** — referral code now comes from the backend. New "Redeem" tile lets the user input someone else's code. Removed the fake `_FriendsList` hardcoded entries.
- [x] **In-app FAQ** — new `/faq` route + entry in Profile.

**Pending tonight (deferred to morning testing):**
- [ ] **M3 favorite challenges UI** — backend done; mobile UI (heart icon on cards, Favorites tab) not added yet.
- [ ] **M5 achievements screen** — backend done + auto-awarding works; mobile screen to display badges not added yet.
- [ ] **M4 share card PNG export** — requires RepaintBoundary work + device verification; safer to do with you watching.
- [ ] **W4/B5 contact form** — rate-limited public endpoint + form on `/contact`; deferred (mailto still works).
- [ ] **CI workflows** for web (lint + build + test).

**Verification this session:**
- API: typecheck clean, jest 12/12 pass, lint 0 errors. `/health` 200, `/challenges/slug/daily-10k-steps` 200 against live DB.
- Web: build green (60+ prerendered routes), vitest 14/14, dev serves all routes 200.
- Mobile: `flutter analyze` 0 issues, `flutter test` 46/46 pass.

**Owed before public launch (carried over):**
- Real `BETTER_AUTH_SECRET` (>= 32 chars) in prod env.
- Resend (or other) API key in prod env.
- DNS for vital30.com / api. / admin. + Let's Encrypt cert chain.
- App Store + Play Store assets + submission.
- Attorney review of `/docs/{privacy,terms,health-disclaimer}.md`.

---

## Mobile app (`apps/mobile`)

### Fully working end-to-end on the mobile side

These features have correct UI + state. **All MVP backend endpoints now exist** (see Backend section); the offline-fallback in the mobile's `_apiCall` is now a safety net rather than the primary data source. The next step is running the API + DB locally and verifying each flow on device.

- Welcome / login / register — backend `POST /auth/login` + `POST /auth/register` ready.
- Challenge browse + filter + search — backed by `GET /categories` + `GET /challenges`.
- Challenge detail + join — backed by `GET /challenges/:id` + `POST /user-challenges`.
- My challenges (active + completed) — backed by `GET /user-challenges`, with server-computed `progressPercent`.
- Daily check-in (yes / no / skip) with missed-day dialog — backed by `POST /checkins` (upserts on the calendar day) + `GET /checkins/challenge/:userChallengeId`.
- Progress screen + 30-day map.
- Profile + log out.
- Health disclaimer.
- Splash + routing.
- Day-complete celebration (fires after "Yes, completed").

### UI complete — NOT wired to backend

Buttons navigate but no API call / no persistence:

- [ ] **Forgot password / OTP / new password / reset success** — 4-screen flow with no API calls. Needs backend endpoints first (see backend section).
- [ ] **Notifications inbox** — hardcoded sample data, no fetch.
- [x] **Edit profile** — `PATCH /users/me` on the backend and the mobile Save button now wired through `AuthNotifier.updateProfile`. Loading spinner on Save, snackbar on server errors, no-op + close when name is unchanged. Email field is read-only (backend doesn't support email change in MVP).
- [x] **Notification settings** — toggles persist via `PreferencesStorage`. Daily-reminder toggle also schedules/cancels the OS notification. *Caveat:* the "Quiet hours" toggle is persisted but not yet enforced in scheduling.
- [x] **Reminder time picker** — selected time persists and reschedules the daily notification via `NotificationService`.
- [ ] **Invite friends** — referral code generated client-side, not tracked server-side.
- [x] **Onboarding carousel** — `OnboardingNotifier` (in `features/onboarding/application/onboarding_provider.dart`) is watched by the router: unauthenticated + not-seen redirects to `/onboarding`, and the screen calls `markSeen()` on both Skip and Get started.

### UI complete — screens exist but never triggered

- [x] **Streak milestone modal** — day-complete screen now reads the latest stats and fires `StreakMilestoneModal.show` when `currentStreak ∈ {7, 14, 21}`. Logic lives in `features/celebrations/domain/checkin_celebration.dart` so it's unit-tested.
- [x] **Day-30 challenge complete** — `daily_checkin_screen` routes a successful `COMPLETED` check-in on day 30 to `/complete/{ucId}` instead of `/celebrate/{ucId}` via `CheckinCelebration.isFinalDay`.

### Cross-cutting gaps

- [x] **`flutter_local_notifications` added** to `pubspec.yaml` along with `shared_preferences`, `timezone`, `flutter_timezone`. Wrapped by `core/notifications/notification_service.dart`.
- [x] **Reminder time persistence** — `core/storage/preferences_storage.dart` + `notification_settings_provider` re-schedule on save and on app start (`_AppBootstrap` in `main_common.dart`).
- [x] **Android + iOS native config** — `POST_NOTIFICATIONS` / `RECEIVE_BOOT_COMPLETED` / `SCHEDULE_EXACT_ALARM` permissions and `flutter_local_notifications` boot/scheduled receivers added to `AndroidManifest.xml`. `UNUserNotificationCenter` delegate wired in `AppDelegate.swift`.
- [x] **Onboarding "seen" flag wiring** — router redirect + `markSeen()` calls landed. Widget test covers both first-launch (lands on onboarding) and returning-user (lands on welcome) paths.
- [ ] **Share card export** — share buttons use `share_plus` with plain text. The 9:16 PNG share card from the design (`screens-loop.jsx:449`) isn't implemented as a `RepaintBoundary` + screenshot.

---

## Backend (`services/api`) — Better Auth, wired 2026-05-26

Auth is now owned by **Better Auth** (`@thallesp/nestjs-better-auth` adapter) instead of the hand-rolled `passport-jwt` + `AuthService` we had on 2026-05-25. Password recovery, email verification, and rate-limited sign-in come out of the box; OAuth (Apple/Google) is a future config change away.

**Registered modules in `app.module.ts`:** `Config`, `Throttler`, `Prisma`, `Email`, `Health`, **`Auth` (Better Auth)**, `Categories`, `Challenges`, `UserChallenges`, `Checkins`, `ShareEvents`.

**Auth routes (under `/api/auth/*`, owned by Better Auth):**

| Route | Notes |
|---|---|
| `POST /api/auth/sign-up/email` | Returns `{ token, user }`. Bearer plugin also emits `set-auth-token` header. |
| `POST /api/auth/sign-in/email` | Same shape. Rate-limited 5/min. |
| `POST /api/auth/sign-out` | Invalidates the session. |
| `POST /api/auth/request-password-reset` | Sends an opaque token via email. 204 even if email unknown (anti-enumeration). Rate-limited 3/min. |
| `POST /api/auth/reset-password` | Consumes the token + sets the new password. |
| `POST /api/auth/send-verification-email` | Re-sends verification. Rate-limited 3 / 5min. |
| `POST /api/auth/verify-email` | Marks `emailVerified = true`. |
| `POST /api/auth/update-user` | Updates name/image. |
| `POST /api/auth/delete-user` | Hard-deletes; cascades via Prisma. |
| `GET /api/auth/get-session` | Returns `{ user, session }` for the current Bearer token. |

**Domain routes (Vital30-owned, JWT-protected by the adapter's global `AuthGuard`):**

| Route | Notes |
|---|---|
| `GET /` | `@AllowAnonymous()` |
| `GET /health` | `@AllowAnonymous()` |
| `GET /categories` | `@AllowAnonymous()`; sorted by name |
| `GET /challenges` | `@AllowAnonymous()`; filters `isActive=true`; orders by recommended/popular/title |
| `GET /challenges/:id` | `@AllowAnonymous()` |
| `POST /user-challenges` | scoped to `session.user.id`; duplicate active joins return the existing record |
| `GET /user-challenges` | returns the user's challenges with server-computed `progressPercent` |
| `POST /checkins` | upserts on `(userChallengeId, today UTC)` |
| `GET /checkins/challenge/:userChallengeId` | ordered ascending by `checkinDate` |
| `POST /share-events` | attributes to `session.user.id` |

**Security posture:**
- `AuthGuard` registered globally by the adapter — every route is authenticated by default; only `@AllowAnonymous()` routes opt out.
- Better Auth's `JwtStrategy` equivalent re-reads the user from Prisma on every request so revoked accounts can't keep using their token.
- Server-side ownership checks (`UserChallengesService.assertOwnership`) still gate every `userChallenge`-scoped action.
- `class-validator` whitelist + `forbidNonWhitelisted` is on globally for our DTOs; Better Auth handles validation on its own routes.
- Per-route rate limits live inside Better Auth's config (`/sign-in/email` 5/min, `/request-password-reset` 3/min, `/send-verification-email` 3 / 5min).
- bcrypt was removed; Better Auth uses scrypt by default and stores the hash in the `Account.password` column (one row per (user, provider) pair).

**Email** dispatch lives behind `EmailService` with two providers: `mailpit` for local dev (inspect at http://localhost:8025) and `resend` for production (switch via `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`).

**Tests:** `npm test` → 2/2 unit pass (we dropped tests of files we deleted; remaining unit surface is just `progress-calculator`). `npm run test:e2e` → 4 passing (the Better-Auth adapter is ESM-only and incompatible with ts-jest in CJS mode, so e2e mocks the adapter; real flows are exercised against the running server). `npm run typecheck` → clean. `npm run lint` → 0 errors.

**Verification done before the migration (still valid for the unchanged surfaces):**
- ✅ Local notifications (permission prompt + scheduling).
- ✅ Reminder time picker.
- ✅ Day-30 complete screen + streak milestone modal visuals via `--dart-define=DEBUG_MENU=true`.

**Verification done on iPhone after migration (2026-05-26):**
- ✅ Register → Mailpit caught the verification email.
- ✅ Forgot password full round-trip — Mailpit caught the reset email, paste-code flow on the OTP screen worked, new password saved, sign-in with new password succeeded.
- ✅ Edit profile → Save → restart → name persists.
- ✅ Delete account (after enabling `user.deleteUser.enabled` — commit 177632f).
- ✅ Browse + join + check-in still work against the new auth chain.
- ✅ Local notifications still fire.

**Verification still owed (production):**
- Set a real `BETTER_AUTH_SECRET` (≥ 32 chars) and any non-default DB credentials for staging/prod environments.
- Same flows on a real Android device.
- Pick + verify a real email provider (Resend recommended) before sending real email to users.

**Gap-fillers that still need new schema (deferred):**
- Notifications inbox (needs `Notification` model + emit points).
- Referral codes (needs `referralCode` + `referredById` on `User`).

---

## Backend (`services/api`) — pre-Better-Auth snapshot (2026-05-25, superseded above)

**Registered modules in `app.module.ts`:** `Config`, `Throttler`, `Prisma`, `Health`, **`Auth`, `Users`, `Categories`, `Challenges`, `UserChallenges`, `Checkins`, `ShareEvents`**.

**Routes that exist and are tested:**

| Route | Auth | Notes |
|---|---|---|
| `GET /` | public | `@Public()` |
| `GET /health` | public | `@Public()` |
| `POST /auth/register` | public | bcrypt hash (cost 12), 409 on duplicate email, returns `{token, user}` |
| `POST /auth/login` | public | constant-time hash compare even on miss to frustrate enumeration |
| `GET /users/me` | JWT | returns the current user (no `passwordHash`) |
| `PATCH /users/me` | JWT | `UpdateUserDto` validates; trims `name` |
| `DELETE /users/me` | JWT | Hard-delete; Prisma cascade removes the user's challenges, check-ins, and share events. Returns 204. The JWT becomes invalid on the next request because `JwtStrategy.validate` re-checks user existence. |
| `GET /categories` | public | sorted by name |
| `GET /challenges` | public | filters `isActive=true`; orders by recommended/popular/title |
| `GET /challenges/:id` | public | `ParseUUIDPipe` |
| `POST /user-challenges` | JWT | scoped to `currentUser.id`; duplicate active joins return the existing record |
| `GET /user-challenges` | JWT | returns the user's challenges with server-computed `progressPercent` |
| `POST /checkins` | JWT + ownership | upserts on `(userChallengeId, today UTC)` to match the unique constraint |
| `GET /checkins/challenge/:userChallengeId` | JWT + ownership | ordered ascending by `checkinDate` |
| `POST /share-events` | JWT | attributes to `currentUser.id` |

**Security posture:**
- `JwtAuthGuard` registered as `APP_GUARD` — every route is authenticated by default; only `@Public()` routes opt out.
- `JwtStrategy.validate` re-reads the user from Prisma so revoked accounts can't keep using their token.
- Server-side ownership checks (`UserChallengesService.assertOwnership`) gate every `userChallenge`-scoped action; the JWT subject is never trusted as the user id without verification.
- `class-validator` whitelist + `forbidNonWhitelisted` is on globally; controllers accept only declared DTO fields.

**Tests:** `npm test` → 22/22 unit pass. `npm run test:e2e` → 9 passing (auth-flow e2e + app e2e), 9 placeholder `.todo` left in `mvp-contract.e2e-spec.ts` for the contracts that need a real DB to be meaningful (joining, check-in dedupe, cross-user denial). `npm run typecheck` → clean. `npm run lint` → 0 errors (4 pre-existing warnings in `app.e2e-spec.ts`).

**Verification done on a real iPhone (iOS 26.5):**
- ✅ Register, persist across app restart, log out.
- ✅ Challenge list shows real seeded titles ("No Refined Sugar", "Hydration Hero", "Daily 10k Steps").
- ✅ Join → daily check-in → Day-complete celebration (4.5s).
- ✅ Edit profile name → Save → restart → new name persists.
- ✅ Delete account → app returns to Welcome; re-register with same email succeeds (cascade delete works).
- ✅ Local notification permission prompt fires on first launch with daily reminder on.
- ✅ Reminder time picker (1-minute steps, legible in dark mode) → notification fires at the chosen time when phone is locked.
- ✅ Day-30 complete screen + streak milestone modal visuals (via `--dart-define=DEBUG_MENU=true` triggers on Profile).

**Verification still owed for production:**
- Set a real `JWT_SECRET` and any non-default DB credentials for staging/prod environments.
- Same flows on a real Android device (notification permission on Android 13+ in particular).

**Gap-fillers that still need new schema (deferred):**
- Notifications inbox (needs `Notification` model + emit points).
- Referral codes (needs `referralCode` + `referredById` on `User`).
- Password Recovery (needs `PasswordReset` model + email provider decision).

---

## Admin (`apps/admin`) — scoped out of current MVP

Has brand color tokens but not restyled to the design package. New admin views from design (categories, users, check-ins, share events, user detail, notification composer) aren't built.

**Status:** explicitly deferred ("mobile only for now"). Re-scope before v2.

---

## MVP readiness verdict

**Closed beta / internal demo: YES — verified on iPhone 2026-05-25.** App boots, registers, joins challenges, checks in, tracks progress, edits profile, deletes account, fires local notifications. Caveat to testers: "password reset isn't live, log out/in if you forget."

**Public store submission: NO.** Blockers in priority order:

1. Backend endpoints for password recovery (4 screens currently do nothing). Needs a `PasswordReset` model + email/SMS provider decision.
2. ~~Add `flutter_local_notifications` + wire reminder time so daily nudges actually fire.~~ **Done.**
3. ~~Persist notification settings and reminder time.~~ **Done.**
4. ~~Trigger streak milestone + Day-30 screens from check-in flow.~~ **Done.**
5. Decide whether referral codes are MVP or v2.
6. Verify scheduled notifications actually fire on a real iOS device + Android device.
7. Verify the streak milestone modal and Day-30 routing on device.
8. ~~Wire the mobile Edit Profile Save button to `PATCH /users/me`.~~ **Done.**
9. **Stand up the API + DB locally and verify each mobile flow round-trips.** The offline fallback in `_apiCall` will silently mask a broken backend — see [docs/mvp-verification.md](docs/mvp-verification.md) for a scripted curl + mobile walkthrough that confirms the round-trip before you trust the mobile UI.
10. ~~In-app account deletion (App Store guideline 5.1.1(v)).~~ **Done.** `DELETE /users/me` on the backend + destructive confirm dialog on Edit Profile. Mobile clears local creds + router redirects to onboarding.

---

## How to use this file

- Pick an unchecked item, **verify it's still pending** (the previous Claude's claim may be stale), then work it.
- When you complete an item, check it off here in the same PR.
- If you discover a new gap, add it under the right section.
- Last-audited dates matter: anything > a couple of weeks old should be re-verified before being trusted.
