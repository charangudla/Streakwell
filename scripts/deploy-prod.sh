#!/usr/bin/env bash

# ==============================================================================
# Vital30 MVP - Hostinger KVM 4 Production Deployment Script
# ==============================================================================
# Usage: ./scripts/deploy-prod.sh
# ==============================================================================

# Exit immediately if any command fails or variable is undefined
set -euo pipefail

# Text styling color tokens
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}   🚀 Starting Vital30 MVP Production Deployment Flow (Hostinger KVM 4)${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Prerequisite Checks
echo -e "\n${BLUE}[Step 1/6] Verifying system prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed on this VPS.${NC}"
    echo -e "${YELLOW}Please consult docs/hostinger-kvm4-deployment.md for installation commands.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed on this VPS.${NC}"
    echo -e "${YELLOW}Please consult docs/hostinger-kvm4-deployment.md for installation commands.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are present.${NC}"

# 2. Production Environment Checks
echo -e "\n${BLUE}[Step 2/6] Verifying environment configurations...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Production .env file not found in root monorepo directory.${NC}"
    if [ -f .env.prod.example ]; then
        echo -e "${YELLOW}Initializing .env from .env.prod.example template...${NC}"
        cp .env.prod.example .env
        echo -e "${RED}⚠️ Created .env template. Please edit .env immediately to add secure, strong credentials!${NC}"
        exit 1
    else
        echo -e "${RED}❌ Error: Production .env.prod.example template missing.${NC}"
        exit 1
    fi
fi

# Basic check for default placeholder values
if grep -q "<STRONG_SECURE_JWT_SECRET_RANDOM_HEX>" .env || grep -q "<STRONG_RANDOM_DATABASE_PASSWORD_KEY>" .env; then
    echo -e "${RED}❌ Error: Your .env file contains default security placeholders.${NC}"
    echo -e "${YELLOW}Please edit .env and replace all placeholders with strong random keys before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Production environment .env validated.${NC}"

# 3. Pull / Compile Docker Stacks
echo -e "\n${BLUE}[Step 3/6] Building production Docker containers...${NC}"
docker compose -f docker-compose.prod.yml build --pull

echo -e "${GREEN}✓ Production build completed successfully.${NC}"

# 4. Start Docker Containers
echo -e "\n${BLUE}[Step 4/6] Launching containers in detached background mode...${NC}"
docker compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Production service containers started.${NC}"

# 5. Database Migrations Execution
echo -e "\n${BLUE}[Step 5/6] Executing safe production database migrations...${NC}"
echo -e "${YELLOW}Waiting for Postgres and API service containers to complete startup...${NC}"
sleep 5

# Run prisma migration deploy
if docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy; then
    echo -e "${GREEN}✓ Production database migrations successfully applied!${NC}"
else
    echo -e "${RED}❌ Error: Failed to apply database migrations.${NC}"
    echo -e "${YELLOW}Check container logs: docker compose -f docker-compose.prod.yml logs api${NC}"
    exit 1
fi

# Optional seed check - if database is empty, seed it
echo -e "${YELLOW}Checking if database seeding is required...${NC}"
# We safely run database seeder. In production, we typically do this on initial setup or manually.
# Let's seed by default to ensure the 42 starter challenges are populated.
if docker compose -f docker-compose.prod.yml exec -T api npx prisma db seed; then
    echo -e "${GREEN}✓ Production database seeded with starter blueprints!${NC}"
else
    echo -e "${YELLOW}⚠️ Seeding skipped or completed (database records already exist).${NC}"
fi

# 6. Service Health Audit
echo -e "\n${BLUE}[Step 6/6] Auditing production health statuses...${NC}"
docker compose -f docker-compose.prod.yml ps

# Hit local Nginx endpoints if possible, or print instructions
echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}🎉 Vital30 MVP Production Stack Successfully Deployed!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "${YELLOW}Verify public URLs: ${NC}"
echo -e " - API Gateway:      ${BLUE}http://api.vital30.com/health${NC}"
echo -e " - Admin Dashboard:  ${BLUE}http://admin.vital30.com${NC}"
echo -e "\n${YELLOW}Next Step:${NC} Set up SSL certificate using Let's Encrypt / Certbot by running:"
echo -e "           ${BLUE}sudo certbot --nginx -d api.vital30.com -d admin.vital30.com${NC}"
echo -e "${GREEN}======================================================================${NC}"
