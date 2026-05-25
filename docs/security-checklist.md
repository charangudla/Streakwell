# Security Checklist

## API Security Checklist

Based on OWASP API risk themes:

- Validate every request body with DTOs and `ValidationPipe`.
- Require JWT auth for private endpoints.
- Enforce role checks on the backend, not only in clients.
- Prevent IDOR by checking resource ownership on every user-scoped query.
- Never return password hashes, reset tokens, JWT secrets, or internal IDs that are not needed by the client.
- Use pagination and server-side filtering for list endpoints.
- Apply rate limits to auth and write-heavy endpoints.
- Keep Helmet enabled.
- Keep CORS restricted to known admin/mobile origins.
- Return safe errors without stack traces in production.

## Mobile Security Checklist

Based on OWASP MASVS principles:

- Store tokens only in secure storage.
- Do not hardcode secrets in Dart code.
- Use environment configuration for API URLs.
- Avoid logging JWTs, passwords, or personal health details.
- Show safe, non-medical wellness wording.
- Handle offline and failed network states gracefully.
- Validate client input, while still treating backend validation as authoritative.

## Admin/Web Security Checklist

Based on OWASP ASVS principles:

- Protect all admin routes behind authenticated sessions.
- Require `ADMIN` or `SUPER_ADMIN` on backend admin endpoints.
- Do not rely on hidden buttons or client-side checks for authorization.
- Sanitize and validate all form inputs.
- Avoid rendering unsafe HTML.
- Keep dependencies updated.
- Use HTTPS in production.
- Disable verbose error exposure in production.

## Production VPS Security Checklist

- Keep Ubuntu packages patched.
- Use a non-root SSH user.
- Disable password SSH login when key-based auth is configured.
- Restrict firewall ports to SSH, HTTP, and HTTPS.
- Do not expose PostgreSQL or Redis publicly.
- Use Docker Compose networks for internal services.
- Add Let's Encrypt certificates before real users access the app.
- Back up PostgreSQL daily and test restore steps.

## Database Security Checklist

- Use strong production passwords.
- Use Prisma migrations, not manual schema edits.
- Add indexes for common queries.
- Use unique constraints for business invariants.
- Soft deactivate important records instead of deleting audit-relevant data.
- Never share production database credentials in chat, logs, or commits.

## Secrets Management Checklist

- Keep `.env` files out of Git.
- Rotate leaked secrets immediately.
- Use different secrets for local, staging, and production.
- Use a strong `JWT_SECRET` in production.
- Never log secrets or tokens.
- Store production `.env` only on the VPS or a trusted secret manager.
