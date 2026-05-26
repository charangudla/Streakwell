# Vital30 MVP Status & Pending Tasks

**Last updated:** 2026-05-25 (after on-device end-to-end verification)
**Scope:** Mobile (`apps/mobile`) is the active surface. Backend (`services/api`) and admin (`apps/admin`) status noted but not recently audited.

> Read this before starting work. Verify claims against the code before acting on them — items here may have been completed since this was last updated.

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

## Backend (`services/api`) — MVP wired 2026-05-25

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
