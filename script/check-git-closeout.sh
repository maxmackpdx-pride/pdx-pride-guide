#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

branch="$(git branch --show-current)"
if [[ "$branch" != "master" ]]; then
  echo "Closeout blocked: expected master, found ${branch:-detached HEAD}." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain=v1)" ]]; then
  echo "Closeout blocked: the checkout has tracked or untracked changes:" >&2
  git status --short >&2
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/master; then
  echo "Closeout blocked: origin/master is unavailable; fetch origin first." >&2
  exit 1
fi

read -r behind ahead < <(git rev-list --left-right --count origin/master...HEAD)
if [[ "$behind" -ne 0 || "$ahead" -ne 0 ]]; then
  echo "Closeout blocked: master is ${ahead} ahead and ${behind} behind origin/master." >&2
  exit 1
fi

echo "Git closeout clean: master matches origin/master and the worktree is clean."
