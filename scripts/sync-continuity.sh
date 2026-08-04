#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_REMOTE="${1:-sites}"
TARGET_BRANCH="${2:-main}"
LOCAL_BRANCH="${3:-main}"

LOCK_PATH=".git/index.lock"
LOCK_MAX_AGE_SECONDS=120

if [[ ! -d .git ]]; then
  echo "No git repo at $ROOT_DIR"
  exit 1
fi

is_git_running() {
  pgrep -x git >/dev/null 2>&1
}

lock_mtime_age_seconds() {
  local path="$1"
  python3 - "$path" <<'PY'
import os
import sys
import time

path = sys.argv[1]
age = int(time.time() - os.path.getmtime(path))
print(age)
PY
}

if [[ ! -f "$LOCK_PATH" ]]; then
  echo "No stale index lock found"
else
  if is_git_running; then
    echo "Index lock exists, but a git process is currently running. Skipping lock removal to avoid corruption."
    exit 1
  fi

  LOCK_AGE_SECONDS="$(lock_mtime_age_seconds "$LOCK_PATH")"
  if [[ "$LOCK_AGE_SECONDS" -lt "$LOCK_MAX_AGE_SECONDS" ]]; then
    echo "Index lock is too new (${LOCK_AGE_SECONDS}s) and may be live. Please retry after 2 minutes or remove manually with caution."
    exit 1
  fi

  echo "Clearing stale index lock (${LOCK_AGE_SECONDS}s old)"
  rm -f "$LOCK_PATH"
  if [[ -f "$LOCK_PATH" ]]; then
    echo "Failed to remove stale index lock."
    exit 1
  fi
fi

if ! git remote get-url "$TARGET_REMOTE" >/dev/null 2>&1; then
  echo "Remote '$TARGET_REMOTE' not configured. Configure first, then rerun."
  exit 1
fi

cleanup_rebase_state() {
  local status=$?
  if [[ -d .git/rebase-merge ]] || [[ -d .git/rebase-apply ]]; then
    echo "Rebase conflict detected. Resolve conflicts and run: git rebase --continue"
    echo "Or run: git rebase --abort to stop and retry."
  fi
  exit "$status"
}

trap cleanup_rebase_state ERR

echo "Fetching latest remote state from $TARGET_REMOTE/$TARGET_BRANCH"
git fetch "$TARGET_REMOTE"

echo "Switching to $LOCAL_BRANCH"
git checkout "$LOCAL_BRANCH"

echo "Rebasing local $LOCAL_BRANCH onto $TARGET_REMOTE/$TARGET_BRANCH"
git rebase "$TARGET_REMOTE/$TARGET_BRANCH"

echo "Pushing continuity changes"
git push "$TARGET_REMOTE" "$LOCAL_BRANCH:$TARGET_BRANCH"

echo "Done"
