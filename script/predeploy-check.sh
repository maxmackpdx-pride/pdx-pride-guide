#!/usr/bin/env bash
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
HEAD="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"

if [[ "$BRANCH" != "master" ]]; then
  echo "BLOCKED: production deploys must run from master (currently on $BRANCH)"
  exit 1
fi

# Never redeploy the stripped reset that dropped 44 commits of polish.
if [[ "$SHORT" == "456689a" ]] || git log -1 --format=%s | grep -qi "user-picks design restore"; then
  echo "BLOCKED: HEAD matches the bad reset commit — do not deploy"
  exit 1
fi

echo "predeploy git OK: $SHORT on $BRANCH"