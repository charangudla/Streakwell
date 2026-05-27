#!/usr/bin/env bash

# =============================================================================
# Vital30 — backfill creator-as-participant for custom challenges
# =============================================================================
# One-shot fix: every Challenge with createdById should also have a
# UserChallenge row for that user, so the creator's /my-challenges
# surfaces the thing they made and they can do daily check-ins.
#
# This logic is built into POST /custom-challenges going forward
# (see commit ae6fcd3). Run this script ONCE per environment to fix
# any challenges created BEFORE that commit. Idempotent — safe to
# re-run; the WHERE NOT EXISTS guard skips rows already backfilled.
#
# Usage:
#   ./scripts/backfill-creator-self-joins.sh                # local dev
#   ./scripts/backfill-creator-self-joins.sh prod           # prod (via prod compose)
# =============================================================================

set -euo pipefail

ENV="${1:-dev}"

if [ "$ENV" = "prod" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  CONTAINER="$(docker compose -f $COMPOSE_FILE ps -q postgres)"
else
  CONTAINER="vital30_postgres"
fi

# Load DB credentials from .env when available.
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-vital30}"
POSTGRES_DB="${POSTGRES_DB:-vital30_db}"

echo "Backfilling creator self-joins in $POSTGRES_DB (container=$CONTAINER)…"

docker exec -i "$CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
INSERT INTO "UserChallenge" (id, "userId", "challengeId", status, "startDate", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  c."createdById",
  c.id,
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
FROM "Challenge" c
WHERE c."createdById" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "UserChallenge" uc
    WHERE uc."userId" = c."createdById" AND uc."challengeId" = c.id
  )
RETURNING "userId", "challengeId";
SQL

echo "Done."
