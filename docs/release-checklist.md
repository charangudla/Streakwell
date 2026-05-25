# Release Checklist

## Functional QA

- Backend `/health` works.
- Admin dashboard loads and shows API connected.
- Mobile app launches.
- Core MVP flows have happy-path and error-path tests.
- Empty states and loading states are visible where expected.

## Security QA

- All protected endpoints require JWT auth.
- Admin endpoints require `ADMIN` or `SUPER_ADMIN`.
- Users cannot access another user's private challenge/check-in data.
- Passwords are hashed with bcrypt.
- CORS is restricted.
- No secrets or sensitive health details appear in logs.

## Mobile QA

- iOS simulator test run passes.
- Android emulator test run passes.
- `flutter analyze` passes.
- `flutter test` passes.
- API base URL is correct for simulator/emulator.
- App copy avoids medical claims.

## Admin QA

- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- Forms validate required fields.
- API disconnected state is friendly.
- Admin-only route behavior is tested once auth is implemented.

## Deployment QA

- Production `.env` is configured.
- `docker compose -f docker-compose.prod.yml config` succeeds.
- Production images build.
- Nginx exposes only ports `80` and `443`.
- PostgreSQL and Redis remain internal.
- Health endpoint passes through the reverse proxy.

## App Store Readiness

- Android App Bundle builds.
- iOS IPA builds.
- Bundle IDs and signing are configured.
- Store listing screenshots and descriptions are ready.
- Privacy and data safety answers match actual app behavior.
