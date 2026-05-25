# MVP End-to-End Verification Checklist

A scripted walkthrough to confirm the backend + mobile actually round-trip after the backend MVP wire-up (auth, users, categories, challenges, user-challenges, checkins, share-events).

Setup commands live in [local-development.md](local-development.md). This file is **what to run after setup and what to look for** at each step.

> The mobile app has an offline fallback (`ApiService._apiCall`) that returns mock data when a network call fails. That is great for working in a coffee shop but it can **silently mask a broken backend**. The curl steps below verify the backend independently before you trust the mobile.

---

## 0. Prereqs

You should already have followed [local-development.md](local-development.md):
- Postgres + Redis containers up (`docker compose ps` shows both healthy).
- `services/api/.env` filled in — **change `JWT_SECRET=change_me` to a real value**, even for local dev, before you trust any token.
- `cd services/api && npx prisma migrate dev --name init && npm run prisma:seed` ran successfully (you should see "✅ Seeding completed successfully!").
- `npm run start:dev` running in another terminal.

---

## 1. Smoke checks (10 seconds)

```bash
curl -s http://localhost:3000 | jq .
# → { "message": "Vital30 API is running" }

curl -s http://localhost:3000/health | jq .
# → { "status": "ok", "service": "vital30-api", "timestamp": "..." }
```

If either fails, the API isn't running. Don't proceed.

---

## 2. Auth round-trip (the only MVP gate that's pure mobile↔backend)

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"correct horse battery staple"}' \
  | jq -r .token)
echo "$TOKEN"
# → eyJhbGci... (a real JWT, ~150 chars)
```

```bash
# Read the current user
curl -s http://localhost:3000/users/me -H "Authorization: Bearer $TOKEN" | jq .
# → { "id": "...", "email": "test@example.com", "name": "Test User", "role": "USER", ... }

# Edit the name
curl -s -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Renamed"}' | jq .name
# → "Renamed"
```

Negative cases to confirm guards work:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/users/me
# → 401  (no token)

curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"correct horse battery staple"}' \
  -o /dev/null -w '%{http_code}\n'
# → 409  (duplicate email)

curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"X","email":"weak@example.com","password":"short"}' \
  -o /dev/null -w '%{http_code}\n'
# → 400  (validation: password too short)
```

---

## 3. Public reads (confirms the seed landed)

```bash
curl -s http://localhost:3000/categories | jq 'length'
# → 6

curl -s http://localhost:3000/challenges | jq 'length'
# → 42  (7 per category, all isActive=true)

curl -s http://localhost:3000/challenges | jq '.[0]'
# → first challenge ranked by recommended/popular/title, with benefits as a JSON array
```

If `length` is 0, the seed didn't run; `cd services/api && npm run prisma:seed`.

---

## 4. User-scoped writes (auth + ownership chain)

```bash
# Grab a challenge id to join
CHALLENGE_ID=$(curl -s http://localhost:3000/challenges | jq -r '.[0].id')

# Join
UC_ID=$(curl -s -X POST http://localhost:3000/user-challenges \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"challengeId\":\"$CHALLENGE_ID\"}" | jq -r .id)
echo "$UC_ID"
# → a uuid

# List your challenges
curl -s http://localhost:3000/user-challenges -H "Authorization: Bearer $TOKEN" | jq .
# → [{ id, userId, challengeId, status: "ACTIVE", startDate, progressPercent: 0, ... }]

# Check in
curl -s -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"userChallengeId\":\"$UC_ID\",\"status\":\"COMPLETED\"}" | jq .
# → { id, userChallengeId, checkinDate: "<today UTC>", status: "COMPLETED", ... }

# Re-check-in same day should upsert, not duplicate
curl -s -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"userChallengeId\":\"$UC_ID\",\"status\":\"SKIPPED\"}" | jq .status
# → "SKIPPED"

curl -s "http://localhost:3000/checkins/challenge/$UC_ID" \
  -H "Authorization: Bearer $TOKEN" | jq 'length'
# → 1  (one row, upserted)
```

Ownership check — register a second user and confirm they cannot see the first user's challenge:

```bash
TOKEN2=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Other","email":"other@example.com","password":"correct horse battery staple"}' \
  | jq -r .token)

curl -s -o /dev/null -w '%{http_code}\n' \
  "http://localhost:3000/checkins/challenge/$UC_ID" \
  -H "Authorization: Bearer $TOKEN2"
# → 403  (Not your challenge.)
```

After `npm test` and `npm run test:e2e` already confirmed the unit-level guards, the 403 above is the headline assertion: server-side ownership actually fires.

---

## 5. Mobile end-to-end on a simulator / emulator

Point the mobile at the running API. Base URL gotchas (from `local-development.md`):

| Target | `API_BASE_URL` |
|---|---|
| iOS simulator | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical device on Wi-Fi | `http://<your Mac LAN IP>:3000` |

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://localhost:3000   # iOS sim
# or
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000    # Android emu
```

Walk the happy path:

1. **First launch.** Onboarding carousel appears (you should see "CATEGORIES" / "CHECK IN" / "PROGRESS" slides). Tap **Skip** or step through to **Get started**.
2. **Register.** Use a fresh email. The Profile screen should show the name you registered with — not "8:00 AM" placeholders.
3. **Browse.** The challenge list should show the **real seeded challenges** (e.g. "No Refined Sugar", "Hydration Hero"). If you see something else, the mobile is on offline mock data — your `API_BASE_URL` is wrong or the API is down.
4. **Join + check in.** Open a challenge, join, hit "Yes, completed". Day-complete screen should fire.
5. **Restart.** Close the app fully and reopen. You should still be signed in and the joined challenge should still be there. This is the most reliable end-to-end signal that login + persistence + listing all work against the real DB.
6. **Edit profile.** Profile → Edit profile → change the name → Save. Snackbar-on-failure path is the one to look at: stop the API, hit Save, you should see a server-error snackbar (not a silent close).
7. **Reminder.** Profile → Reminder time → pick a time a couple of minutes out → Save. Lock the device. Confirm the local notification fires. (This one is independent of the backend.)

---

## 6. Honest list of what this checklist does NOT verify

- **Push notifications on real iOS / Android hardware.** Simulators are unreliable for this. Test on a physical device.
- **The 9:16 share card.** Not implemented yet; share buttons currently produce plain text.
- **Password recovery.** Backend not built (needs email/SMS provider decision).
- **Notifications inbox / referral codes.** Backend not built; the mobile shows hardcoded sample data.
- **Production deploy on Hostinger KVM 4.** See `docs/hostinger-kvm4-deployment.md`.
- **Real load.** None of this exercises concurrency, large lists, or rate limits beyond the default `ThrottlerModule` settings.

---

## 7. If a step fails — short triage table

| Symptom | Likely cause | First check |
|---|---|---|
| `401` on `/users/me` | Token missing or `JWT_SECRET` changed between issuing the token and using it | Re-register, re-grab the token; confirm `services/api/.env` `JWT_SECRET` is stable |
| `/categories` returns `[]` | Seed didn't run | `cd services/api && npm run prisma:seed` |
| Mobile shows the mock challenge names (e.g. "Cold-water plunge starter") instead of seed names like "No Refined Sugar" | API_BASE_URL wrong, `_apiCall` fell back to mock | Check `--dart-define`, confirm curl from same machine hits `:3000` |
| `403` on your own user-challenge | Token was for a different user | Re-register, re-grab token; UUIDs don't lie |
| Android emulator can't reach API | `localhost` inside emulator points to the emulator itself | Use `10.0.2.2` |
| iOS sim says "Server error" intermittently | Connection timeout (default 4s in `ApiService`) | Check API logs; usually means a slow query or the API is stopped |

---

## 8. Suggested run cadence

- **Before pushing a backend change** that touches DTOs, controllers, or guards: run sections 1–4.
- **Before tagging an MVP build** for testers: run sections 1–5 + 7.
- **Before opening a release PR**: cross-reference this checklist with `docs/release-checklist.md`.
