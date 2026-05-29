#!/usr/bin/env bash
#
# One-command release: push the current branch to GitHub, then pull + deploy
# it on the VPS. Run this from your LOCAL machine (the repo root).
#
#   ./scripts/deploy-remote.sh
#
# Override the VPS target via env vars if your SSH user/host/path differ:
#   VPS_USER=cg VPS_HOST=2.24.89.83 ./scripts/deploy-remote.sh
#
# Requires: SSH access to the VPS (the same key you used to set it up) and
# a clean, committed working tree (commit your changes first).

set -euo pipefail

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-2.24.89.83}"
VPS_PATH="${VPS_PATH:-/opt/vital30}"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Refuse to deploy with uncommitted changes — what's on the VPS should match
# a real commit, so a rollback (git checkout <SHA>) always works.
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ You have uncommitted changes. Commit them first:${NC}"
  echo -e "   ${BLUE}git add -A && git commit -m \"...\"${NC}"
  exit 1
fi

echo -e "${BLUE}▶ Pushing ${BRANCH} to GitHub...${NC}"
git push origin "$BRANCH"

echo -e "${BLUE}▶ Deploying on ${VPS_USER}@${VPS_HOST}:${VPS_PATH} ...${NC}"
ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_PATH} && git pull --ff-only && ./scripts/deploy-prod.sh"

echo -e "${GREEN}✅ Deployed ${BRANCH} ($(git rev-parse --short HEAD)).${NC}"
echo -e "${YELLOW}   Verify: https://challenge.charangudla.com${NC}"
