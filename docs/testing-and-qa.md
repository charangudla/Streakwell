# Testing and QA

Vital30 uses layered testing so MVP work can move quickly without losing quality.

## Testing Strategy

- Backend: unit tests for services/helpers, e2e tests for HTTP endpoints with Supertest, and security regression tests for auth and object-level authorization.
- Admin: Vitest and React Testing Library for pages, route access helpers, API states, and form validation.
- Flutter: `flutter_test` for pure helpers and widgets, with API states tested through provider overrides.
- CI: GitHub Actions runs backend, admin, and Flutter checks on pushes and pull requests. Deployment is intentionally not automated yet.

## Backend Test Cases

Current passing coverage:

- Root API endpoint returns the running message.
- Health endpoint returns `status`, `service`, and `timestamp`.
- Helmet security headers are present.
- CORS allows the configured admin origin.
- Password hashing never stores plaintext and verifies valid/invalid passwords.
- Role helper allows only matching roles.
- Object-level authorization helper blocks cross-user access.
- Progress calculation handles unique completion days and streaks.

MVP contract tests are recorded as todo tests until the related endpoints exist:

- Register and login.
- Protected route access.
- Admin-only route access.
- Challenge listing.
- Joining a challenge.
- Daily check-in.
- IDOR/object-level authorization for challenge and check-in data.

## Admin Test Cases

Current passing coverage:

- Dashboard renders placeholder cards.
- API health status renders connected and disconnected states.
- Login form validates required fields, email format, and password length.
- Challenge form validation helper checks title, description, and duration.
- Category form validation helper checks name.
- Admin route access helper permits `ADMIN` and `SUPER_ADMIN` only.

Todo contract tests cover future protected admin routing behavior.

## Flutter Test Cases

Current test coverage:

- App starts and renders the home screen.
- Home screen handles API error state.
- Challenge card renders title, subtitle, and duration.
- Progress calculation helper counts unique days and streaks.
- Share text generation creates safe copy.
- Login validation helper rejects missing or malformed input.

## Security Test Cases

- Password hashing and verification.
- Role-based access helper.
- Object ownership helper for IDOR prevention.
- Helmet and CORS e2e checks.
- Future auth endpoints must add tests for token validation, admin role enforcement, and user data isolation.

## Release QA Checklist

- All CI jobs pass.
- Backend health endpoint works.
- Admin dashboard shows API connected.
- Mobile app opens on iOS simulator and Android emulator.
- No console errors in admin.
- No unhandled Flutter exceptions in normal navigation.
- New API endpoints have unit and e2e tests.
- New form flows have loading, error, and empty states.

## App Store QA Checklist

- App launches cleanly on a current iOS simulator.
- App launches cleanly on a current Android emulator.
- No medical claims are made in app copy.
- Privacy copy is accurate for collected data.
- App icons, display name, and bundle IDs are configured.
- Release builds complete with `flutter build appbundle --release` and `flutter build ipa --release`.

## Deployment Smoke Test Checklist

- `docker compose -f docker-compose.prod.yml config` succeeds with production `.env`.
- Production containers build successfully.
- Nginx routes `api` and `admin` traffic internally.
- PostgreSQL and Redis are not exposed publicly.
- `GET /health` returns `status: ok`.
- Admin loads through Nginx.
- Logs do not include secrets, JWTs, passwords, or personal health details.
