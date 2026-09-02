#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "predeploy: no git metadata — skipping branch checks (CI/Railway tarball builds)"
  exit 0
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
HEAD="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"

on_master_lineage() {
  if [[ "$BRANCH" == "master" || "$BRANCH" == "staging" ]]; then
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

# Admin ops smoke (queue aggregate, claims, bulk preview, guide identity).
# Skip in pure Railway tarball if node_modules not ready; local/CI ship always runs.
if [[ -f "script/smoke-admin-ops.mjs" ]] && command -v node >/dev/null 2>&1; then
  if [[ -d "node_modules" ]] || [[ -n "${CI:-}" ]]; then
    echo "predeploy: running smoke-admin-ops…"
    node --import tsx script/smoke-admin-ops.mjs
  else
    echo "predeploy: skip smoke-admin-ops (no node_modules yet)"
  fi
fi

# QSearch identity rules are production data guards: ordinary venues require
# explicit LGBTQ+ evidence, dedicated queer venues pass, The Sports Bra remains
# founder-locked as a dedicated lesbian/LGBTQ+ venue, and its unreliable direct
# schedule stays out of scraper registries.
if [[ -d "node_modules" ]] || [[ -n "${CI:-}" ]]; then
  echo "predeploy: running QSearch identity guards…"
  node --import tsx script/smoke-qsearch-identity.ts
  node --import tsx script/smoke-sports-bra.ts
  node --import tsx script/smoke-qsearch-agent-auth.ts
  qsearch_test_dir="$(mktemp -d "${TMPDIR:-/tmp}/qsearch-event-change.XXXXXX")"
  cp data.db "$qsearch_test_dir/data.db"
  qsearch_test_status=0
  ALLOW_QSEARCH_TEST_DB=1 DATABASE_PATH="$qsearch_test_dir/data.db" \
    node --import tsx script/smoke-event-research-change.ts || qsearch_test_status=$?
  unlink "$qsearch_test_dir/data.db"
  rmdir "$qsearch_test_dir"
  if [[ "$qsearch_test_status" -ne 0 ]]; then
    exit "$qsearch_test_status"
  fi
fi
