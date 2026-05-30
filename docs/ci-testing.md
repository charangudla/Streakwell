# CI & Testing Strategy

How automated quality gates are wired for Vital30, what each layer covers, and
the recommended roadmap for hardening them further.

## Philosophy

Vital30 is a four-surface monorepo (Flutter mobile, Next.js web, React admin,
NestJS API) with **no workspace tool** — each app has its own `package.json` /
`pubspec.yaml` and its own path-filtered workflow. The testing approach is a
standard pyramid, weighted to where bugs actually bite:

- **Static analysis (widest, cheapest):** type-checking + linting on every app.
  Catches the majority of regressions before a test ever runs.
- **Unit / component tests:** Jest (API), Vitest (web + admin), Flutter test.
- **End-to-end / regression:** Playwright smoke over the public web surface.
- **Build verification:** every app must compile/produce a production artifact.
- **Security + supply chain:** CodeQL static analysis + Dependabot updates.

Each workflow is **path-filtered** so only the affected surface runs on a given
change, and each uses a **concurrency group** so a new push cancels the prior
in-flight run for the same ref.

## Workflow matrix

| Workflow | File | Trigger paths | Steps |
|---|---|---|---|
| Backend CI | `backend-ci.yml` | `services/api/**` | Postgres 16 + Redis 7 services → `prisma generate` → `migrate deploy` → lint → **typecheck** → unit (`jest`) → e2e (`jest-e2e`) → build |
| Web CI | `web-ci.yml` | `apps/web/**` | lint *(advisory)* → typecheck → unit (`vitest`) → build |
| Web E2E | `web-e2e.yml` | `apps/web/**` | build → Playwright smoke (`chromium`) → upload report |
| Admin CI | `admin-ci.yml` | `apps/admin/**` | lint → **typecheck** → unit (`vitest`) → build |
| Flutter CI | `flutter-ci.yml` | `apps/mobile/**` | `pub get` → `dart format --set-exit-if-changed` → `flutter analyze` → `flutter test --coverage` → upload lcov |
| Docker CI | `docker-ci.yml` | compose/Dockerfiles/nginx | compose `config` validate → build API + admin images (now also on PRs) |
| CodeQL | `codeql.yml` | all (+ weekly cron) | JS/TS `security-and-quality` analysis |
| Dependabot | `dependabot.yml` | weekly | npm (api/web/admin), pub (mobile), github-actions, docker |

All app workflows run on **push to `main`** and **pull requests to `main`**.

## Per-surface detail

### NestJS API (`services/api`)
- **Unit:** `npm run test` (`jest`, `*.spec.ts`).
- **E2E:** `npm run test:e2e` (`jest-e2e.json`, `*.e2e-spec.ts`). The harness
  (`test/test-app.ts`) **stubs `PrismaService` and mocks Better Auth**
  (`test/mocks/`), so it boots the full Nest module graph and exercises the
  **HTTP boundary without a database**:
  - `app.e2e-spec.ts` — root + health endpoints, Helmet headers, CORS allow.
  - `api-contracts.e2e-spec.ts` — `ValidationPipe` rejection (missing fields,
    bad email, unknown fields via `forbidNonWhitelisted`), 404 routing, and
    CORS *not* reflecting a disallowed origin.
- **DB-backed contracts** (register/login, RBAC, per-user isolation) live as
  `it.todo` in `mvp-contract.e2e-spec.ts`. They need a **real Postgres + real
  Better Auth** and are intentionally *not* faked — see the roadmap below.

### Web (`apps/web`)
- **Unit/component:** `npm run test` (`vitest`, `test/**/*.test.tsx`).
- **E2E:** `npm run test:e2e` (`playwright test`, `e2e/**/*.spec.ts`). Smoke
  suite loads every public page against the production build (`next start`)
  with **no API** — challenge data falls back to `lib/fallback-challenges.ts`,
  so assertions target server-rendered, hydration-independent content (the
  global `<footer>`, page title, legal links, 404 status).
- Vitest's `include` is scoped to `test/**`, so it never picks up the
  Playwright specs in `e2e/`, and vice-versa (`testDir: ./e2e`).

### Admin (`apps/admin`) & Mobile (`apps/mobile`)
- Admin: Vite build, `vitest`, ESLint, `tsc -b`.
- Mobile: `flutter analyze` (0 issues required), `flutter test --coverage`,
  and a strict `dart format` gate. Coverage `lcov.info` is uploaded as an
  artifact (no threshold gate yet — see roadmap).

## Known advisory / non-blocking gates

These are **intentional** so CI reflects reality without going red on
pre-existing debt. Each should be tightened to *blocking* once cleared.

1. **Web lint is advisory** (`continue-on-error: true`). `apps/web` has
   pre-existing `react-hooks/set-state-in-effect` violations (≈15 files) plus
   one `@next/next/no-html-link-for-pages`. The signal stays visible in the
   run log; it just doesn't fail the pipeline. **Action:** fix the violations,
   then remove `continue-on-error` from `web-ci.yml`.
2. **No `format:check` gate on API + admin.** Both have a `format:check`
   script, but the existing source isn't fully Prettier-clean (≈12 files in
   the API, ≈25 in admin). Adding the gate today would fail on untouched code.
   **Action:** run a one-time `npm run format` in each, commit the result,
   then add a `format:check` step to `backend-ci.yml` and `admin-ci.yml`.
   (Note: the API's `npm run lint` runs with `--fix`, so it silently rewrites
   *auto-fixable* formatting in place when run locally — CI discards those
   edits. `--fix` only touches mechanical nits, **not** type-safety errors, so
   it does not mask genuine lint failures: real errors still fail the build.)
3. **API + admin lint are blocking** (no `continue-on-error`) — but only after
   clearing pre-existing errors that were red on `main`:
   - `@typescript-eslint/no-unsafe-return` in the custom-challenge + contact
     DTOs, fixed **at the source** (the `@Transform` `value` params are now
     typed `unknown` so the `typeof` guard narrows instead of inferring `any`).
   - One `react-hooks/set-state-in-effect` in the admin `AuthProvider`, handled
     with a **scoped, documented** eslint-disable — the synchronous sign-out
     reset is intentional (it stops `ProtectedRoute` flashing `/404`).

   Both went out as **dedicated fix PRs**, separate from the CI wiring, so the
   concerns stay clean. The matching `set-state-in-effect` debt on `apps/web`
   is still outstanding — see #1.

## Security note: CodeQL

`codeql.yml` analyzes the JS/TS surface. CodeQL needs a **public repository**
(this repo is public — it runs free) **or GitHub Advanced Security** on a
private repo. If the repo is ever made private without GHAS, this workflow will
fail with a licensing error — either enable code scanning in repo settings or
delete the workflow. Dart is **not** a CodeQL-supported language, so mobile is
out of scope here (covered instead by `flutter analyze`).

## Recommended roadmap

Ordered roughly P0 → P2.

**P0 — make every gate blocking + honest**
- Clear the web lint backlog and flip `web-ci` lint to blocking.
- One-time Prettier pass on API + admin, then add `format:check` gates.

**P1 — real backend integration tests**
- Add a second e2e job in `backend-ci.yml` that runs against the **live
  Postgres service** (already available in CI) with Better Auth un-mocked, and
  implement the `mvp-contract.e2e-spec.ts` todos (register → login → join →
  check-in → cross-user isolation, RBAC allow/deny). This is the highest-value
  missing coverage: it's the actual product contract.
- Seed via `prisma/seed-tester.ts` (already present).

**P2 — coverage + broader E2E**
- **Coverage thresholds.** Collect and enforce per app:
  - API: `jest --coverage` (config already sets `collectCoverageFrom` +
    `coverageDirectory`).
  - Web/admin: add `@vitest/coverage-v8` (dev dep) then `vitest run --coverage`.
  - Mobile: `flutter test --coverage` (already wired) + an lcov threshold tool.
  Suggested **starting** thresholds (ratchet up over time, don't start high):
  lines/statements 50%, branches 40% — fail the build only below the floor.
- **Authenticated Playwright flows.** Extend the web E2E beyond public pages:
  register → login → join a challenge → daily check-in, against a seeded test
  user and a live API service in the workflow.
- Upload coverage to a dashboard (Codecov / Coveralls) for trend visibility.

## Branch protection

> ⚠️ **Path-filtered checks + "required status checks" interact badly.** A
> required check that is path-filtered never reports on PRs that don't touch
> its paths, leaving the PR stuck "Expected — waiting for status". Only mark a
> check **required** if it runs on *every* PR, **or** add an always-running
> sentinel job that short-circuits to success when the path is untouched
> (e.g. via `dorny/paths-filter`).

Recommended starting point for `main` (Settings → Branches → Branch protection):
- Require a pull request before merging (1 approval).
- Require branches to be up to date before merging.
- Require status checks — start with the **fast, always-relevant** ones and add
  more as the sentinel pattern is adopted. Candidate check names:
  - `NestJS API Quality Checks`
  - `Next.js Web Quality Checks`
  - `React Admin Quality Checks`
  - `Flutter Mobile Quality Checks`
  - `Analyze (javascript-typescript)` (CodeQL)
- Do **not** require `Docker Stack Production CI` or `Web E2E` for unrelated
  PRs unless you adopt the sentinel pattern — both are path-filtered and heavy.

## Local commands

```bash
# API
cd services/api
npm run lint && npm run typecheck && npm run test && npm run test:e2e

# Web
cd apps/web
npm run lint && npm run typecheck && npm run test
npm run build && npm run test:e2e     # Playwright (installs browsers once)

# Admin
cd apps/admin
npm run lint && npm run typecheck && npm run test

# Mobile
cd apps/mobile
flutter analyze && flutter test
```
