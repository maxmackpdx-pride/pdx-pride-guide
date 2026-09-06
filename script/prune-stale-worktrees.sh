#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

before="$(git worktree list --porcelain | awk '/^prunable / { count++ } END { print count + 0 }')"

if [[ "$before" -eq 0 ]]; then
  echo "No stale worktree metadata to prune."
  exit 0
fi

git worktree prune

after="$(git worktree list --porcelain | awk '/^prunable / { count++ } END { print count + 0 }')"
echo "Pruned $((before - after)) stale worktree registration(s); deleted no worktree directories."
