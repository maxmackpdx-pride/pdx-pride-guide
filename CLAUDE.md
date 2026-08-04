# Project rules

## Copy
- **Never use em dashes (—) in any copy.** This applies to all user-facing text: event blurbs, welcome/hero copy, UI labels, button text, readme prose, component sample content. Use a period, comma, colon, parentheses, or the word "to" for ranges (e.g. "Jul 16 to 19"). En dashes in date/number ranges are acceptable only where a range glyph is truly needed, but prefer "to".

## Claude handoff: low local burden

Prefer this flow to keep local actions to one command when updates are continuity-only:

1. Record notes and continuity updates in `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity`.
2. Run: `./scripts/sync-continuity.sh sites main`

If using a GitHub canonical remote in this repo in the future, use:

`./scripts/sync-continuity.sh github master`

The script is intentionally strict:

- it only rebases and pushes the current branch against the selected remote/branch
- it exits if the remote is missing
- it removes a stale `.git/index.lock` only if no git process is running and the lock is older than 120 seconds
- it does not stage unrelated files
- it warns clearly on rebase conflicts and tells you how to continue or abort

Do not use network operations from a shell with no outbound access. Use a local shell with normal git permissions for the sync step.
