#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_REMOTE="${1:-sites}"
TARGET_BRANCH="${2:-main}"
LOCAL_BRANCH="${3:-main}"

if [[ ! -d .git ]]; then
  echo "No git repo at $ROOT_DIR"
  exit 1
fi

if [[ ! -f .git/index.lock ]]; then
  echo "No stale index lock found"
else
  echo "Clearing stale index lock"
  rm -f .git/index.lock
fi

if ! git remote get-url "$TARGET_REMOTE" >/dev/null 2>&1; then
  echo "Remote '$TARGET_REMOTE' not configured. Configure first, then rerun."
  exit 1
fi

echo "Fetching latest remote state from $TARGET_REMOTE/$TARGET_BRANCH"
git fetch "$TARGET_REMOTE"

echo "Switching to $LOCAL_BRANCH"
git checkout "$LOCAL_BRANCH"

echo "Rebasing local $LOCAL_BRANCH onto $TARGET_REMOTE/$TARGET_BRANCH"
git rebase "$TARGET_REMOTE/$TARGET_BRANCH"

echo "Pushing continuity changes"
git push "$TARGET_REMOTE" "$LOCAL_BRANCH:$TARGET_BRANCH"

echo "Done"

