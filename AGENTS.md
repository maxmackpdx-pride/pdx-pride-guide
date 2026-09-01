# Agent rules - Zaylist

The global instructions in `/Users/tuckercasey/.codex/AGENTS.md` define Tucker's workflow,
shipping language, production identity, and approval boundaries. This file contains only
repository-specific facts and safeguards.

## Scope and authority

- Implement exactly the requested change. Do not expand it into design-system work,
  Foundation governance, cleanup, refactoring, or deployment without Tucker's approval.
- A request to **fix/change/build** authorizes local implementation, not a push.
- A request to **push/ship/deploy/go live** authorizes the complete production pipeline;
  do not pause for a redundant second confirmation.
- Keep unrelated user and agent work unstaged and untouched.

## Repository and production

| Thing | Value |
|---|---|
| Checkout | `/Users/tuckercasey/pdx-pride-guide` |
| Repository | `maxmackpdx-pride/pdx-pride-guide` |
| Production branch | `master` |
| Railway project | `pdx-pride-guide` |
| Railway service | `pdx-pride-guide` |
| Railway environment | `production` |
| Live site | `https://www.zaylist.com` |
| Health endpoint | `/api/health` |

Production deploys use GitHub `master` -> GitHub Actions -> Railway. Do not use
`railway up`, create a replacement Railway project, or upload the application tree from
the CLI. Before shipping, synchronize safely with `origin/master`, commit only the
intended diff, push, wait for Railway `SUCCESS`, and probe the affected live path when
useful.

Staging is branch `staging`, Railway environment `staging`, at
`https://pdx-pride-guide-staging.up.railway.app`. Do not merge or fast-forward staging
without explicit authorization.

## Verification

Verification must be proportional to the change:

- Run focused checks for the affected files and behavior.
- Use broader typecheck/build/smoke coverage when the change crosses systems or has
  meaningful production risk.
- For UI-affecting work, visually inspect the affected route and representative state
  when practical.
- For broad asset/code deletion, check static and plausible dynamic references, remove
  genuinely orphaned dependents, and run the relevant technical and visual checks.
- Minor deletion does not automatically require an exhaustive whole-product audit.
- If a meaningful verification step is unavailable, report the limitation and judge
  readiness based on the actual risk; do not fail closed by default.

## Product and design sources

- Primary navigation order lives in `client/src/lib/siteNav.ts` (`PRIMARY_NAV`). Do not
  restyle navigation unless Tucker asks.
- Product code implements the current design standard. The durable design/Foundation
  source is the private `maxmackpdx-pride/zaylist-foundation-library` repository and its
  published Cloudflare library.
- `docs/LIVE_DESIGN_STANDARD.md` is the repository's production trap list.
- Consult Foundation onboarding or durable decisions only when a task actually touches
  architecture, product scope, naming, permissions, privacy, safety, cross-product
  behavior, or a design-system rule. It is not a prerequisite for every first edit.
- A local product change does not automatically require a Foundation change. If the two
  would materially diverge, explain the discrepancy and ask Tucker before expanding
  scope.
- Never describe a Foundation update as published until its Cloudflare deployment and
  live release content are verified.

## Current design traps

Do not reintroduce retired treatments unless Tucker explicitly requests a new direction:
default brutal-magenta CTAs, yellow-rim claim stickers, dead "Event details" on grid
cards, Mr. S red ads, MC seven-day-window-as-past behavior, the Z/Space Featured dropdown,
or the sitewide cyan bottom-nav pull handle. Maps use the debossed well without outer
bloom. Check `docs/LIVE_DESIGN_STANDARD.md` when the requested work touches these rules.

## Accurate completion language

- Local only: **"Fixed locally - ready to push."**
- Pushed while Railway runs: **"On GitHub; deploy in progress."**
- Railway `SUCCESS`: **"Production updated."**
- Failed or crashed: report the failure and relevant logs; never call it shipped.
