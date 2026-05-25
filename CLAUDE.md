# Vital30 — Claude Code Instructions

**Read these two files before doing any work in this repo:**

1. [AGENTS.md](AGENTS.md) — the 20 engineering principles that govern every implementation decision (modularity, security, testing, clean architecture, MVP scope, naming, etc.). These are non-negotiable.
2. [MVP_STATUS.md](MVP_STATUS.md) — the current list of pending tasks across mobile, backend, and admin. Verify any claim there against the code before acting on it.

## Project stack

- Flutter mobile (`apps/mobile`)
- React + Vite admin (`apps/admin`)
- NestJS API (`services/api`)
- PostgreSQL + Prisma
- Docker on Hostinger KVM 4

## Implementation rule

For every task: identify the files that need changes → implement the smallest clean solution → run or describe the relevant tests/build checks.
