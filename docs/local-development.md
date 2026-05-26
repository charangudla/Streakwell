# Local Development

## 1. Environment Files

Copy the root example file:

```bash
cp .env.example .env
```

Copy service-level examples when needed:

```bash
cp services/api/.env.example services/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/mobile/.env.example apps/mobile/.env
```

> ⚠️ **Heads-up — `services/api/.env` shadows the root `.env`.**
>
> The NestJS app loads `services/api/.env` first, then falls back to the
> repo-root `.env` for missing keys. That means:
> - **API-only secrets** (`BETTER_AUTH_SECRET`, `EMAIL_PROVIDER`,
>   `RESEND_API_KEY`, `MAILPIT_HOST`) live in `services/api/.env`.
> - **Shared keys** (`CORS_ORIGIN`, `DATABASE_URL`) are duplicated in
>   both files in this repo. When you change a shared key, change it
>   in **both** places — otherwise the API won't see your edit.
> - The mobile app reads its own `apps/mobile/assets/env/<env>.env`
>   asset file, **not** any of these `.env` files.
> - The website reads `NEXT_PUBLIC_*` only from the root `.env`.

## 2. Start PostgreSQL and Redis

```bash
docker compose up -d
docker compose ps
```

PostgreSQL runs on `localhost:5432`. Redis runs on `localhost:6379`.

## 3. Start the Backend

```bash
cd services/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Health checks:

- http://localhost:3000
- http://localhost:3000/health

## 4. Start the Admin Website

```bash
cd apps/admin
npm install
npm run dev
```

Open http://localhost:5173.

## 5. Start Flutter

Install Flutter first and verify with:

```bash
flutter doctor
```

Then run:

```bash
cd apps/mobile
flutter create . --project-name vital30 --org com.vital30 --platforms=ios,android
flutter pub get
flutter run
```

Run `flutter create .` only when platform folders are missing or need to be regenerated. Keep the existing `lib/` and `pubspec.yaml` files.

API base URL notes:

- iOS simulator can use `http://localhost:3000`
- Android emulator usually needs `http://10.0.2.2:3000`
- Physical devices need your Mac LAN IP, for example `http://192.168.1.20:3000`

Set the base URL with `--dart-define` when needed:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```
