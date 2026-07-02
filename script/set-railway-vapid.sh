#!/usr/bin/env bash
# Set VAPID keys on Railway for Web Push.
# Requires: npx @railway/cli login OR RAILWAY_PROJECT_TOKEN
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${RAILWAY_PROJECT_ID:-13064cbe-e2d7-41cd-a028-fa957d0c9167}"
ENVIRONMENT_ID="${RAILWAY_ENVIRONMENT_ID:-8ab787f3-f5ee-4713-9845-bd17dd30ad08}"
SERVICE_ID="${RAILWAY_SERVICE_ID:-c87eff12-aee2-4af2-8fd9-7f42b67c3ba3}"

VAPID_PUBLIC_KEY="${VAPID_PUBLIC_KEY:-}"
VAPID_PRIVATE_KEY="${VAPID_PRIVATE_KEY:-}"
VAPID_SUBJECT="${VAPID_SUBJECT:-mailto:hello@pdxprideguide.com}"
PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-https://www.prideguidepdx.com}"

KEYS_FILE=".railway/vapid-keys.txt"
if [[ -z "$VAPID_PUBLIC_KEY" || -z "$VAPID_PRIVATE_KEY" ]]; then
  if [[ -f "$KEYS_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$KEYS_FILE"
  fi
fi

if [[ -z "$VAPID_PUBLIC_KEY" || -z "$VAPID_PRIVATE_KEY" ]]; then
  echo "Generate keys: npx web-push generate-vapid-keys"
  echo "Then export VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, or save to $KEYS_FILE"
  exit 1
fi

RAILWAY_CLI=(npx @railway/cli)

if [[ -z "${RAILWAY_PROJECT_TOKEN:-}" ]]; then
  if ! "${RAILWAY_CLI[@]}" whoami >/dev/null 2>&1; then
    echo "Not authenticated. Run: npx @railway/cli login"
    exit 1
  fi
fi

set_var() {
  local name="$1"
  local value="$2"
  if [[ -n "${RAILWAY_PROJECT_TOKEN:-}" ]]; then
    local payload
    payload=$(jq -n \
      --arg query 'mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }' \
      --arg projectId "$PROJECT_ID" \
      --arg environmentId "$ENVIRONMENT_ID" \
      --arg serviceId "$SERVICE_ID" \
      --arg name "$name" \
      --arg value "$value" \
      '{query: $query, variables: {input: {projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId, name: $name, value: $value}}}')
    local response
    response=$(curl -sS -X POST https://backboard.railway.com/graphql/v2 \
      -H "Content-Type: application/json" \
      -H "Project-Access-Token: $RAILWAY_PROJECT_TOKEN" \
      -d "$payload")
    if echo "$response" | jq -e '.errors' >/dev/null 2>&1; then
      echo "$response" | jq .
      exit 1
    fi
  else
    "${RAILWAY_CLI[@]}" variable set "${name}=${value}" \
      --project "$PROJECT_ID" \
      --environment "$ENVIRONMENT_ID" \
      --service "$SERVICE_ID"
  fi
}

echo "Setting VAPID env vars on Railway..."
set_var VAPID_PUBLIC_KEY "$VAPID_PUBLIC_KEY"
set_var VAPID_PRIVATE_KEY "$VAPID_PRIVATE_KEY"
set_var VAPID_SUBJECT "$VAPID_SUBJECT"
set_var PUBLIC_SITE_URL "$PUBLIC_SITE_URL"

echo "Done. Railway will redeploy."