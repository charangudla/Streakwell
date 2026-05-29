#!/usr/bin/env bash

# ==============================================================================
# Vital30 STAGING deployment — runs alongside prod on the same VPS.
# ==============================================================================
# Usage (on the VPS, from /opt/vital30):  ./scripts/deploy-staging.sh
#
# This builds + starts the isolated staging stack (its own Postgres/Redis/
# volumes/network) and points it at .env.staging. It does NOT touch any prod
# container and does NOT manage nginx — the prod nginx already routes the
# staging hostnames once deploy/nginx/staging-ssl.conf is mounted (see runbook).
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE="docker compose -f docker-compose.staging.yml --env-file .env.staging"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   🧪 Vital30 STAGING deployment${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Prerequisites
echo -e "\n${BLUE}[Step 1/6] Verifying system prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed on this VPS.${NC}"
    exit 1
fi
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed on this VPS.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose are present.${NC}"

# 2. Environment validation
echo -e "\n${BLUE}[Step 2/6] Verifying .env.staging...${NC}"
if [ ! -f .env.staging ]; then
    echo -e "${YELLOW}⚠️ .env.staging not found.${NC}"
    if [ -f .env.staging.example ]; then
        echo -e "${YELLOW}Initializing .env.staging from .env.staging.example...${NC}"
        cp .env.staging.example .env.staging
        echo -e "${RED}⚠️ Created .env.staging template. Edit it with real secrets, then re-run.${NC}"
        exit 1
    else
        echo -e "${RED}❌ .env.staging.example template missing.${NC}"
        exit 1
    fi
fi

# Refuse to deploy while any <REPLACE_ME_*> placeholders remain.
if grep -q "<REPLACE_ME_" .env.staging; then
    echo -e "${RED}❌ .env.staging still contains placeholder values:${NC}"
    grep -n "<REPLACE_ME_" .env.staging | sed 's/^/  /' || true
    echo -e "${YELLOW}Replace every placeholder with a real secret before deploying.${NC}"
    exit 1
fi

# Hard-fail on a short BETTER_AUTH_SECRET (< 32 chars).
BETTER_AUTH_SECRET_VAL=$(grep -E "^BETTER_AUTH_SECRET=" .env.staging | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [ ${#BETTER_AUTH_SECRET_VAL} -lt 32 ]; then
    echo -e "${RED}❌ BETTER_AUTH_SECRET must be at least 32 characters (got ${#BETTER_AUTH_SECRET_VAL}).${NC}"
    echo -e "${YELLOW}Generate one with: openssl rand -base64 32${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env.staging validated.${NC}"

# 3. Ensure the shared edge network exists (idempotent).
echo -e "\n${BLUE}[Step 3/6] Ensuring shared 'vital30_edge' network exists...${NC}"
if ! docker network inspect vital30_edge >/dev/null 2>&1; then
    docker network create vital30_edge
    echo -e "${GREEN}✓ Created vital30_edge network.${NC}"
else
    echo -e "${GREEN}✓ vital30_edge already exists.${NC}"
fi

# 4. Build
echo -e "\n${BLUE}[Step 4/6] Building staging containers...${NC}"
$COMPOSE build --pull
echo -e "${GREEN}✓ Staging build completed.${NC}"

# 5. Start + migrate + seed
echo -e "\n${BLUE}[Step 5/6] Launching staging containers...${NC}"
$COMPOSE up -d
echo -e "${GREEN}✓ Staging containers started.${NC}"

echo -e "${YELLOW}Waiting for Postgres + API to finish startup...${NC}"
sleep 5

if $COMPOSE exec -T staging-api npx prisma migrate deploy; then
    echo -e "${GREEN}✓ Staging migrations applied.${NC}"
else
    echo -e "${RED}❌ Failed to apply staging migrations.${NC}"
    echo -e "${YELLOW}Check logs: ${COMPOSE} logs staging-api${NC}"
    exit 1
fi

# Auto-seed the 42 starter challenges. This is the NON-destructive catalog
# seed (upserts categories + challenges only) — safe to re-run, never touches
# user data. Staging gets a fresh, populated catalog on every deploy.
echo -e "${BLUE}Seeding starter challenge catalog (non-destructive)...${NC}"
if $COMPOSE exec -T staging-api node dist-seed/seed-catalog.js; then
    echo -e "${GREEN}✓ Challenge catalog seeded.${NC}"
else
    echo -e "${YELLOW}⚠️ Catalog seed failed (non-fatal). Check logs if challenges are missing.${NC}"
fi

# 6. Health audit
echo -e "\n${BLUE}[Step 6/6] Staging service statuses:${NC}"
$COMPOSE ps

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🧪 Vital30 STAGING deployed.${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "${YELLOW}Verify (once DNS + cert + nginx staging route are live):${NC}"
echo -e " - Site:   ${BLUE}https://staging.challenge.charangudla.com${NC}"
echo -e " - API:    ${BLUE}https://api.staging.challenge.charangudla.com/health${NC}"
echo -e " - Admin:  ${BLUE}https://admin.staging.challenge.charangudla.com${NC}"
echo -e "${GREEN}======================================================================${NC}"
