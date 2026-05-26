# Flutter ↔ Backend integration guide

How `apps/mobile` (Flutter) talks to `services/api` (NestJS + Better Auth). Read this before touching mobile network code, especially if you're new to the project or adding a new endpoint.

> The backend authoritative auth implementation is [Better Auth](https://better-auth.com); we mount it via the `@thallesp/nestjs-better-auth` adapter. The mobile never imports Better Auth — it just calls plain HTTP endpoints.

---

## At a glance

- **Transport:** REST over HTTPS in production, HTTP over LAN in dev.
- **Auth scheme:** Bearer token. The mobile reads it from the JSON body of sign-up / sign-in responses, stores it in iOS Keychain / Android Keystore via `flutter_secure_storage`, and attaches it to every subsequent request via a Dio interceptor.
- **Base URL:** `--dart-define=API_BASE_URL=https://api.vital30.com` (or your LAN IP in dev). See [local-development.md](local-development.md) for the simulator-vs-physical-device gotchas.
- **No cookies on mobile.** Better Auth also issues a `Set-Cookie` for web clients; Dio on iOS/Android ignores them and uses the bearer token exclusively.

---

## Endpoint map

Auth-related endpoints live under `/api/auth/*` and are owned by Better Auth. Domain endpoints (challenges, check-ins, share events) live at the root and are guarded by Better Auth's global `AuthGuard`.

| Mobile call site | HTTP verb + path | Notes |
|---|---|---|
| `ApiService.register` | `POST /api/auth/sign-up/email` | Returns `{ token, user }`. Fires a verification email but `requireEmailVerification: false` lets the user log in immediately. |
| `ApiService.login` | `POST /api/auth/sign-in/email` | Same shape. Rate-limited 5 / min. |
| `AuthNotifier.logout` (local clear) | `POST /api/auth/sign-out` | Invalidates the session server-side. The mobile also clears `SecureStorage` regardless. |
| `ApiService.updateProfile` | `POST /api/auth/update-user` → `GET /api/auth/get-session` | Better Auth returns `{ status: true }` from the first call; we re-fetch the session for the updated user record. |
| `ApiService.deleteAccount` | `POST /api/auth/delete-user` | Hard-deletes; Prisma cascade removes the user's UserChallenge, DailyCheckin, ShareEvent rows. |
| `ApiService.requestPasswordReset` | `POST /api/auth/request-password-reset` | Always returns 204 — even for unknown emails — to avoid enumeration. Rate-limited 3 / min. |
| `ApiService.resetPassword` | `POST /api/auth/reset-password` | Accepts `{ token, newPassword }`. Token comes from the email Better Auth sent. |
| `AuthNotifier.checkAuth` (boot) | `GET /api/auth/get-session` | Used implicitly via the stored token — if the token is invalid, the mobile drops the user back to Welcome. |
| `ApiService.getCategories` | `GET /categories` | `@AllowAnonymous()` — no token needed. |
| `ApiService.getChallenges` | `GET /challenges` | Same. |
| `ApiService.joinChallenge` | `POST /user-challenges` | Bearer required. Ownership scoped server-side. |
| `ApiService.getUserChallenges` | `GET /user-challenges` | Returns the *current user's* list — the path takes no userId because the server reads it from the session. |
| `ApiService.checkin` | `POST /checkins` | Upserts on `(userChallengeId, today UTC)` — re-checking-in same day replaces, never duplicates. |
| `ApiService.getDailyCheckins` | `GET /checkins/challenge/:userChallengeId` | Ownership-checked. |
| `ApiService.createShareEvent` | `POST /share-events` | Attributed to the bearer-token user. |

---

## Where the token lives

```
┌──────────────────────────────────────────────────────────────┐
│  Sign-in / Sign-up response (JSON body)                      │
│  { "token": "abc123...", "user": { ... } }                   │
└────────┬─────────────────────────────────────────────────────┘
         │
         │ AuthNotifier.login / register
         ▼
┌──────────────────────────────────────────────────────────────┐
│  SecureStorage (flutter_secure_storage)                      │
│  - "auth_token" → "abc123..."     (iOS Keychain)             │
│  - "auth_user"  → JSON serialised User                       │
└────────┬─────────────────────────────────────────────────────┘
         │ Dio interceptor reads it on every request
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Outbound HTTP request                                       │
│  Authorization: Bearer abc123...                             │
└──────────────────────────────────────────────────────────────┘
```

The Dio interceptor lives in [`core/network/api_service.dart`](../apps/mobile/lib/core/network/api_service.dart):

```dart
dio.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) async {
      final secureStorage = ref.read(secureStorageProvider);
      final token = await secureStorage.getToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
  ),
);
```

Importantly, the **Keychain entry survives app deletion** on iOS. If a tester deletes the app and reinstalls, the old token may still be present and will fail validation against the new backend session table. The fix: in the post-install path, the user lands on Welcome because `checkAuth()` sees the stored token but `GET /api/auth/get-session` returns 401 → the AuthNotifier transitions to `unauthenticated` and the router redirects.

---

## Response shapes the mobile relies on

**`POST /api/auth/sign-up/email`** and **`POST /api/auth/sign-in/email`**

```json
{
  "token": "dYYc7ZUawrpgzJjdd96eSuRmZMqlRR2E",
  "user": {
    "id": "87b46068-506a-4f4d-88e5-43f853f647f4",
    "name": "Test User",
    "email": "test@example.com",
    "emailVerified": false,
    "image": null,
    "role": "USER",
    "createdAt": "2026-05-26T04:56:15.078Z",
    "updatedAt": "2026-05-26T04:56:15.078Z"
  }
}
```

`User.fromJson` in [`features/auth/domain/user.dart`](../apps/mobile/lib/features/auth/domain/user.dart) reads only `id`, `name`, `email`, `role` — the extra fields are ignored.

**`GET /api/auth/get-session`**

```json
{
  "session": {
    "id": "36cc426e-...",
    "token": "dYYc7ZUawrpg...",
    "expiresAt": "2026-06-02T04:56:15.164Z",
    "userId": "87b46068-..."
  },
  "user": { "...": "(same shape as above)" }
}
```

**`POST /api/auth/request-password-reset`**

Always returns `204 No Content`. Never reveals whether the email is registered (anti-enumeration). Always advance the mobile UI to the OTP screen.

**`POST /api/auth/reset-password`**

Body: `{ "token": "<from email>", "newPassword": "<new>" }`. Returns 200 on success, 400 with `{ "message": "..." }` if the token is invalid/expired or the password fails the policy.

---

## Password recovery deep-link strategy

Right now Vital30 uses **paste-the-code**: Better Auth includes both a URL and an opaque token in the reset email, and the mobile asks the user to paste the token on the OTP screen. This is the simplest cross-platform approach and works on iOS, Android, and email clients that strip links.

If we later want **tap-to-open-app** (deep linking):

1. iOS: set up [Universal Links](https://developer.apple.com/ios/universal-links/) with an Apple App Site Association file hosted at `https://vital30.com/.well-known/apple-app-site-association`.
2. Android: set up [App Links](https://developer.android.com/training/app-links) with the equivalent assetlinks.json.
3. Configure Better Auth's `emailAndPassword.resetPasswordRedirectURL` to a route like `https://vital30.com/auth/reset?token=...` — the universal link will intercept this and open the Flutter app with the token in the URL.
4. Flutter route handler reads the token from the URI and pre-fills the New Password screen.

That's a half-day-to-day of work and only worth it once the app is in TestFlight and we want to optimise UX. Until then, paste-the-code is fine.

---

## Email verification

`sendOnSignUp: true` means every new account triggers an email. `requireEmailVerification: false` means the user can use the app immediately — verifying just toggles `emailVerified: true` on their User row, and once they have a verified email they can also recover via the password-reset flow (which technically works without verification today, but in practice verified users are easier to support).

If we later flip `requireEmailVerification: true`, **the mobile needs a "check your email" gate** before it shows the home screen — otherwise users see a black hole. We'd intercept the sign-in response: if `user.emailVerified === false`, route to a new screen that explains and offers "Resend verification email" (`POST /api/auth/send-verification-email`).

---

## CORS, cookies, and origins

Better Auth's `trustedOrigins` is set from `CORS_ORIGIN` env var. The mobile sends `Origin: null` (or omits it) so CORS doesn't enforce anything for mobile requests — only browser-based clients (the admin React app) actually hit CORS. The admin's allowed origin is `http://localhost:5173` in dev, set per-environment in production.

Dio on iOS and Android does **not** persist cookies by default. Better Auth still issues `Set-Cookie: better-auth.session_token=...` on sign-in/sign-up, but Dio ignores it; we rely on the bearer plugin's response-body token instead. If you ever switch the mobile to cookie-based auth, you'd need `dio_cookie_manager` and to handle the iOS App Transport Security `NSAllowsArbitraryLoadsForCookies` plist key.

---

## Error handling on the mobile

Every `ApiService` auth call lets `DioException` propagate — `AuthNotifier` catches it and turns it into a friendly string via `_friendlyError`. The general rule:

- 4xx with a `{ message: "..." }` body → show that message verbatim (Better Auth's error messages are user-safe).
- 4xx without a usable body → "Server error. Please try again."
- Connection timeout / network error → "Unable to connect. Check your internet connection."

The mobile **never** opens the offline-fallback path for auth calls — `ApiService._apiCall` is reserved for read-only endpoints where mocked data is acceptable.

---

## Local dev

See [local-development.md](local-development.md) for the full setup. The short version:

```bash
# 1. Backing services (Postgres + Redis + Mailpit)
cd /Users/cg1971/Documents/Vital30
docker compose up -d

# 2. API
cd services/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev

# 3. Mobile — point at your Mac's LAN IP for a physical iPhone
cd /Users/cg1971/Documents/Vital30/apps/mobile
flutter run -d <device-id> --release \
  --dart-define=API_BASE_URL=http://192.168.1.20:3000 \
  --dart-define=DEBUG_MENU=true
```

Watch outbound emails at **http://localhost:8025** (Mailpit). Every signup verification + password reset shows up there in dev; the same callback paths use Resend in production via `EMAIL_PROVIDER=resend`.

---

## Adding a new endpoint — the checklist

When you add a new backend route that the mobile will call:

1. Decide if it needs auth. If yes, drop the `@AllowAnonymous()` decorator (or just don't add one) — the global `AuthGuard` covers it.
2. Use `@Session() session: UserSession<Auth>` to read the current user instead of accepting a `userId` from the request body. **Never trust client-supplied identity.**
3. If the route mutates per-user data, gate it on ownership server-side (see `UserChallengesService.assertOwnership` for the pattern).
4. Add the matching method in [`ApiService`](../apps/mobile/lib/core/network/api_service.dart). If the call is a mutation, do **not** wrap it in `_apiCall` — let errors propagate.
5. If the response shape isn't trivially serialisable, add a `fromJson` factory in the relevant model file.
6. Write at least one test against the new method via the Dio-interceptor pattern (see `auth_notifier_update_profile_test.dart` for an example).
7. Update this file if the endpoint affects the auth model or response shape.

---

## Common confusions

- **"Why isn't my new endpoint returning the user as `req.user.id`?"** Better Auth's adapter populates `req.user` and `req.session`, but accessing them via NestJS uses the `@Session()` param decorator from `@thallesp/nestjs-better-auth`, not a custom decorator.
- **"`POST /api/auth/sign-up/email` returns 400 with a password message."** The strict password policy (upper + lower + number + symbol, 8–128 chars) lives in [`src/auth/password-policy.ts`](../services/api/src/auth/password-policy.ts). Match it in the Flutter validator.
- **"My PATCH to /users/me doesn't work."** That endpoint no longer exists — Better Auth uses `POST /api/auth/update-user`. The `UsersModule` was deleted during the migration.
- **"Mobile login keeps failing for a previously-good account."** Most likely the old JWT in iOS Keychain doesn't match the new Better Auth session token format. Log out from the app once (or uninstall, but Keychain survives) — first fresh sign-in writes a new token.
