#!/usr/bin/env bash
# Usage: bash scripts/deploy-linux.sh <dev|qa>
set -euo pipefail

ENVIRONMENT="${1:-}"
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "qa" ]]; then
  echo "Usage: $0 <dev|qa>"
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_COMPOSE="$REPO_ROOT/compose.yaml"
OVERLAY_COMPOSE="$REPO_ROOT/compose.$ENVIRONMENT.yaml"
ENV_FILE="$REPO_ROOT/.env.$ENVIRONMENT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing environment file: $ENV_FILE"
  exit 1
fi

echo "==> Deploying [$ENVIRONMENT] environment"
echo "==> Base compose  : $BASE_COMPOSE"
echo "==> Overlay compose: $OVERLAY_COMPOSE"
echo "==> Env file      : $ENV_FILE"

docker compose \
  --env-file "$ENV_FILE" \
  -f "$BASE_COMPOSE" \
  -f "$OVERLAY_COMPOSE" \
  pull --ignore-pull-failures 2>/dev/null || true

docker compose \
  --env-file "$ENV_FILE" \
  -f "$BASE_COMPOSE" \
  -f "$OVERLAY_COMPOSE" \
  up -d --build --remove-orphans

echo "==> Waiting for containers to become healthy..."
sleep 10

docker compose \
  --env-file "$ENV_FILE" \
  -f "$BASE_COMPOSE" \
  -f "$OVERLAY_COMPOSE" \
  ps

echo "==> [$ENVIRONMENT] deployment complete"
