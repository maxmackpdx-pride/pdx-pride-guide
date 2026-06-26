#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
HEAD="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"

on_master_lineage() {
  if [[ "$BRANCH" == "master" ]]; then
    return 0
  fi

  # Railway/Nixpacks builds run at a detached HEAD for the deployed commit.
  if [[ -n "${RAILWAY_ENVIRONMENT:-}" || -n "${RAILWAY_GIT_COMMIT_SHA:-}" || -n "${RAILWAY_PROJECT_ID:-}" ]]; then
    return 0
  fi

  if [[ "$BRANCH" == "HEAD" ]] && git branch -r --contains "$HEAD" 2>/dev/null | grep -qE 'origin/(master|main)'; then
    return 0
  fi

  return 1
}

if ! on_master_lineage; then
  echo "BLOCKED: production deploys must run from master (currently on $BRANCH)"
  exit 1
fi

# Never redeploy the stripped reset that dropped 44 commits of polish.
if [[ "$SHORT" == "456689a" ]] || git log -1 --format=%s | grep -qi "user-picks design restore"; then
  echo "BLOCKED: HEAD matches the bad reset commit — do not deploy"
  exit 1
fi

echo "predeploy git OK: $SHORT on $BRANCH"