# Vital30

[![Backend CI](https://github.com/<your-username>/vital30/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/<your-username>/vital30/actions/workflows/backend-ci.yml)
[![Admin Dashboard CI](https://github.com/<your-username>/vital30/actions/workflows/admin-ci.yml/badge.svg)](https://github.com/<your-username>/vital30/actions/workflows/admin-ci.yml)
[![Flutter Mobile CI](https://github.com/<your-username>/vital30/actions/workflows/flutter-ci.yml/badge.svg)](https://github.com/<your-username>/vital30/actions/workflows/flutter-ci.yml)
[![Docker Production CI](https://github.com/<your-username>/vital30/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/<your-username>/vital30/actions/workflows/docker-ci.yml)

Vital30 is a 30-day health and wellness challenge app. The MVP will focus on users joining challenges, checking in daily, tracking active days/streaks, and sharing progress.

This repository currently contains the foundation only:

- Flutter mobile starter app
- React/Vite admin starter
- NestJS API starter
- PostgreSQL and Redis Docker Compose
- Hostinger KVM 4 deployment foundation

## Tech Stack

- Mobile: Flutter, Dart
- Admin: React, Vite, TypeScript, Tailwind CSS
- API: NestJS, TypeScript, Prisma
- Data: PostgreSQL, Redis
- Local containers: Docker Compose
- Production target: Hostinger KVM 4 VPS, Docker Compose, Nginx reverse proxy

## Folder Structure

```text
apps/
  mobile/      Flutter starter app
  admin/       React + Vite admin dashboard
services/
  api/         NestJS backend API
deploy/
  nginx/       Local and production Nginx reverse proxy configs
docs/          Setup and deployment notes
```

## Quick Start

```bash
cp .env.example .env
docker compose up -d

cd services/api
cp .env.example .env
npm install
npm run prisma:migrate -- --name init_mvp_schema
npm run prisma:seed
npm run start:dev
```

In a second terminal:

```bash
cd apps/admin
cp .env.example .env
npm install
npm run dev
```

For Flutter, install the Flutter SDK first, verify with `flutter doctor`, then:

```bash
cd apps/mobile
cp .env.example .env
flutter create . --project-name vital30 --org com.vital30 --platforms=ios,android
flutter pub get
flutter run
```

## Local Verification

- `docker compose ps` shows postgres and redis running
- `GET http://localhost:3000/health` returns `status: ok`
- `GET http://localhost:3000` returns the API running message
- `http://localhost:5173` loads the admin dashboard
- Admin dashboard shows API connected
- Flutter app launches on iOS simulator
- Flutter app launches on Android emulator
- Flutter app can call the backend health endpoint

## Useful Commands

```bash
# Database containers
docker compose up -d
docker compose down

# API
cd services/api
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run test:cov
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:studio

# Admin
cd apps/admin
npm run dev
npm run build
npm run lint
npm run test

# Mobile
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter run
```

## Quality Gates

Quality control and continuous integration is managed by four granular GitHub Actions workflows under `.github/workflows/`:
- **`backend-ci.yml`**: Triggers on NestJS API updates (installs, lints, runs unit/E2E tests, and compiles dist).
- **`admin-ci.yml`**: Triggers on React Admin dashboard updates (installs, lints, runs tests, and compiles Vite builds).
- **`flutter-ci.yml`**: Triggers on Flutter Mobile updates (installs Flutter stable, audits formats, analyzes, and runs tests).
- **`docker-ci.yml`**: Triggers on main push to compile production API/Admin Docker images and validate compose schema layouts.

See [docs/ci-cd.md](file:///Users/cg1971/Documents/Vital30/docs/ci-cd.md), `docs/testing-and-qa.md`, `docs/security-checklist.md`, and `docs/release-checklist.md` for QA, testing, and deployment guidelines.

## Deployment Notes

Production deployment is prepared in `docker-compose.prod.yml` and `deploy/nginx/prod.conf`. The production stack keeps PostgreSQL, Redis, API, and admin services internal, with Nginx exposing ports `80` and `443`.

SSL is intentionally left for the deployment phase with Let's Encrypt/Certbot after DNS is pointed to the VPS.

## Next Development Phase

- Add authentication and user model
- Add challenge and check-in models
- Implement mobile challenge browsing and joining
- Implement admin challenge management
- Add sharing and streak tracking

Do not add AI, chat, voice, social groups, advanced recommendations, questionnaires, or the full challenge system until the MVP feature prompt asks for them.
