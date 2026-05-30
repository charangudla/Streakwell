#!/usr/bin/env bash

# ==============================================================================
# Vital30 MVP - PostgreSQL Automatic Production Backup Utility
# ==============================================================================
# Usage: ./scripts/backup-postgres.sh
# Cron integration: 0 2 * * * /opt/vital30/scripts/backup-postgres.sh >> /var/log/vital30-backup.log 2>&1
# ==============================================================================

# Exit immediately if any command fails or variable is undefined
set -euo pipefail

# Text styling color tokens
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Retrieve root directory of the repository
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}[Backup] Initializing Postgres database snapshot...${NC}"

# 1. Load Environment Settings
if [ -f .env ]; then
    # Safely load variables from .env
    set -a
    source .env
    set +a
else
    echo -e "${RED}[Backup] Error: .env file missing in root directory ($ROOT_DIR).${NC}" >&2
    exit 1
fi

# Ensure mandatory environment parameters are declared
POSTGRES_USER="${POSTGRES_USER:-}"
POSTGRES_DB="${POSTGRES_DB:-}"

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
    echo -e "${RED}[Backup] Error: POSTGRES_USER or POSTGRES_DB variables not set in .env.${NC}" >&2
    exit 1
fi

# 2. Configure Backup Directories & Target Files
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_backup_$TIMESTAMP.sql"

# Check if postgres container is running
if ! docker compose -f docker-compose.prod.yml ps --format json | grep -q '"Service":"postgres"'; then
    echo -e "${RED}[Backup] Error: The 'postgres' Docker container is not running.${NC}" >&2
    exit 1
fi

# 3. Execute pg_dump Inside Container
echo -e "${BLUE}[Backup] Executing pg_dump on active database '${POSTGRES_DB}'...${NC}"

if docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"; then
    echo -e "${GREEN}[Backup] SQL dump saved: $BACKUP_FILE${NC}"
else
    echo -e "${RED}[Backup] Error: pg_dump execution failed.${NC}" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 4. Gzip Compress File
echo -e "${BLUE}[Backup] Compressing SQL backup file to gzip archive...${NC}"
if gzip "$BACKUP_FILE"; then
    echo -e "${GREEN}[Backup] Compressed snapshot created: ${BACKUP_FILE}.gz${NC}"
else
    echo -e "${RED}[Backup] Error: Gzip compression failed.${NC}" >&2
    exit 1
fi

# 5. Retention Pruning (Rolling history window; override via BACKUP_RETENTION_DAYS)
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
echo -e "${BLUE}[Backup] Executing rolling retention audit (Keeping last ${BACKUP_RETENTION_DAYS} days)...${NC}"
# Delete backup files older than the retention window
find "$BACKUP_DIR" -name "*.sql.gz" -mtime "+${BACKUP_RETENTION_DAYS}" -type f -delete
echo -e "${GREEN}[Backup] Retention pruning complete.${NC}"

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}✓ Database snapshot completed cleanly: ${BACKUP_FILE}.gz${NC}"
echo -e "${GREEN}======================================================================${NC}"

# ==============================================================================
# 🛠️ DATABASE RESTORE DRILL PROCEDURES (RESTORATION INSTRUCTIONS)
# ==============================================================================
# To restore the database from a backup file, perform the following commands:
#
# 1. Unzip the selected gzipped backup file:
#    gunzip ./backups/vital30_prod_db_backup_YYYY-MM-DD_HHMMSS.sql.gz
#
# 2. Terminate existing connections to the target database to prevent lockouts:
#    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c \
#      "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"
#
# 3. Drop and recreate the database to guarantee a clean snapshot slate:
#    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE \"$POSTGRES_DB\";"
#    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\";"
#
# 4. Pipe the SQL backup file directly back into the recreated database container:
#    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < ./backups/vital30_prod_db_backup_YYYY-MM-DD_HHMMSS.sql
#
# 5. Perform a quick container migration sync check:
#    docker compose -f docker-compose.prod.yml exec -T api npx prisma db pull
# ==============================================================================
