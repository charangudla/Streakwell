# Vital30 — Engineering Principles for AI Agents

You are working on the Vital30 MVP codebase.

Before implementing any feature, **strictly follow these engineering principles**. Prioritize maintainability, clarity, security, testability, scalability, and efficient coding. These are non-negotiable for every implementation.

> See [MVP_STATUS.md](MVP_STATUS.md) for the current list of pending tasks across mobile, backend, and admin.

---

## Project stack

- Flutter mobile app (`apps/mobile`)
- React + Vite admin dashboard (`apps/admin`)
- NestJS backend API (`services/api`)
- PostgreSQL database
- Prisma ORM
- Docker deployment for Hostinger KVM 4

---

## Core engineering principles

### 1. Keep code modular
- Do not put large amounts of logic in one file.
- Separate controllers, services, DTOs, guards, repositories/data access, and utilities.
- In Flutter, separate UI widgets, state providers, API services, models, and screens.
- In React admin, separate pages, components, API clients, hooks, and types.

### 2. Follow clean architecture where reasonable
- UI should not directly contain business logic.
- API calls should be isolated in service/client files.
- Business rules should live in services or domain helpers.
- Reusable calculations should be utility functions with tests.

### 3. Avoid duplication
- Do not repeat API response types in multiple places.
- Create shared constants and reusable components.
- Reuse validation schemas and DTOs where possible.
- Extract repeated UI patterns into components.

### 4. Use strong typing
- Use TypeScript strictly in backend and admin.
- Avoid `any` unless absolutely necessary.
- Use Dart models clearly in Flutter.
- Define request and response types.

### 5. Write secure code by default
- Never hardcode secrets.
- Never expose passwords or tokens in logs.
- Validate all incoming API input.
- Enforce authorization in backend services, not only frontend.
- Users must never access another user's private data.
- Admin-only routes must require admin roles.
- Use secure password hashing.
- Use environment variables for config.

### 6. Handle errors properly
- Return useful but safe API errors.
- Do not leak stack traces in production.
- Show friendly error states in mobile/admin UI.
- Add loading, empty, and retry states.
- Handle network failures gracefully.

### 7. Optimize for MVP but do not create throwaway code
- Build only required MVP features.
- Avoid unnecessary complexity.
- Do not overengineer microservices.
- Keep the system simple but extensible.
- Design so AI recommendations, chat, groups, and custom challenges can be added later.

### 8. Use consistent naming
- Use clear model names: `User`, `Challenge`, `UserChallenge`, `DailyCheckin`.
- Use consistent route names.
- Use consistent file and folder names.
- Use readable function names that explain intent.

### 9. Keep functions small and focused
- Each function should do one clear thing.
- Avoid deeply nested logic.
- Extract complex calculations into named helpers.
- Progress/streak calculation must be isolated and tested.

### 10. Add tests for important logic
- Backend services should have unit tests.
- API endpoints should have integration tests.
- Progress calculation must have tests.
- Auth and authorization must have tests.
- Flutter helper logic and important widgets should have tests.
- Admin forms and protected routes should have tests.

### 11. Use database best practices
- Use indexes for common queries.
- Use unique constraints where needed.
- Use migrations, not manual database changes.
- Use soft deactivate for challenges/categories instead of deleting important records.
- Do not expose PostgreSQL publicly.

### 12. Use API design best practices
- Use RESTful route names.
- Use DTOs for request validation.
- Return consistent response shapes.
- Use pagination for list endpoints where appropriate.
- Do not return unnecessary sensitive fields.
- Use proper HTTP status codes.

### 13. Use frontend best practices
- Mobile and admin should never trust client-side authorization alone.
- Keep API URLs in environment configuration.
- Create reusable UI components.
- Keep screens readable and not too large.
- Use accessible buttons, labels, and readable text.

### 14. Use logging carefully
- Log useful operational information.
- Do not log passwords, JWTs, personal health details, or secrets.
- Add structured logs where reasonable.

### 15. Prepare for deployment
- Use Docker-friendly configuration.
- Use health checks.
- Use environment-specific config.
- Keep production build clean.
- Ensure the app can run on Hostinger KVM 4.

### 16. Maintain documentation
- Update README when adding setup or commands.
- Add comments only where helpful.
- Document important business rules.
- Update API docs or endpoint lists when routes are added.

### 17. Follow formatting and linting
- Use ESLint and Prettier for TypeScript projects.
- Use Flutter analyzer and `dart format`.
- Keep imports clean.
- Remove unused code.

### 18. Avoid speculative features
- Do not implement AI, chat, groups, voice coach, subscriptions, or wearable integration unless explicitly asked.
- Add extension points where useful, but do not build future features prematurely.

### 19. Prioritize user trust
- Show health disclaimers where needed.
- Do not make medical claims.
- Use wording like "general wellness guidance."
- Keep challenge descriptions safe and realistic.

### 20. Before coding, briefly inspect the existing structure and follow the established patterns
- Do not rewrite unrelated working code.
- Do not change public APIs unless needed.
- Do not introduce breaking changes without updating dependent parts.

---

## Implementation rule

For every task:

1. **Identify** the files that need changes.
2. **Implement** the smallest clean solution.
3. **Run or describe** the relevant tests / build checks.

---

## Expected result

The Vital30 codebase should remain **clean, modular, secure, testable, and easy to extend** after each implementation step.
