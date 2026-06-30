#!/usr/bin/env bash
# Set SESSION_SECRET and ADMIN_PASSWORD on Railway (production).
# Requires: npx @railway/cli and an authenticated session (`railway login`)
# Or: RAILWAY_PROJECT_TOKEN in the environment (GitHub Actions project token works).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${RAILWAY_PROJECT_ID:-13064cbe-e2d7-41cd-a028-fa957d0c9167}"
ENVIRONMENT_ID="${RAILWAY_ENVIRONMENT_ID:-8ab787f3-f5ee-4713-9845-bd17dd30ad08}"
SERVICE_ID="${RAILWAY_SERVICE_ID:-c87eff12-aee2-4af2-8fd9-7f42b67c3ba3}"

RAILWAY_CLI=(npx @railway/cli)

if [[ -z "${RAILWAY_PROJECT_TOKEN:-}" ]]; then
  if ! "${RAILWAY_CLI[@]}" whoami >/dev/null 2>&1; then
    echo "Not authenticated to Railway."
    echo "Run: npx @railway/cli login"
    echo "Or export RAILWAY_PROJECT_TOKEN from GitHub repo secrets / Railway project settings."
    exit 1
  fi
fi

SESSION_SECRET="$(openssl rand -hex 32)"
ADMIN_PASSWORD="$(openssl rand -base64 32 | tr -d '/+=' | head -c 28)"

echo "Upserting SESSION_SECRET and ADMIN_PASSWORD on Railway service ${SERVICE_ID}..."

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
      echo "Failed to set $name"
      exit 1
    fi
  else
    "${RAILWAY_CLI[@]}" variable set "${name}=${value}" \
      --project "$PROJECT_ID" \
      --environment "$ENVIRONMENT_ID" \
      --service "$SERVICE_ID"
  fi
}

set_var SESSION_SECRET "$SESSION_SECRET"
set_var ADMIN_PASSWORD "$ADMIN_PASSWORD"

mkdir -p .railway
SECRETS_FILE=".railway/production-secrets.txt"
cat > "$SECRETS_FILE" <<EOF
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ) — delete after saving to your password manager.
SESSION_SECRET=$SESSION_SECRET
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOF
chmod 600 "$SECRETS_FILE"

echo ""
echo "Done. Railway will redeploy with the new values."
echo "Credentials saved locally: $SECRETS_FILE"
echo "Copy ADMIN_PASSWORD somewhere safe, then delete that file."