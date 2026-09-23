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
| Railway project | `pdx-pride-guide` (`13064cbe-e2d7-41cd-a028-fa957d0c9167`) |
| Railway service | `pdx-pride-guide` (`c87eff12-aee2-4af2-8fd9-7f42b67c3ba3`) |
| Railway environment | `production` (`8ab787f3-f5ee-4713-9845-bd17dd30ad08`) |
| Production volume | `pdx-pride-guide-volume` (`d824af22-9a4b-4e1f-8f76-8be45f93886b`) at `/data` |
| Live site | `https://www.zaylist.com` |
| Health endpoint | `/api/health` |

Production deploys use GitHub `master` -> GitHub Actions -> Railway. Do not use
`railway up`, `railway sandbox`, create a replacement Railway project, or upload the
application tree from the CLI. Before shipping, synchronize safely with `origin/master`,
commit only the intended diff, push, wait for Railway `SUCCESS`, and probe the affected
live path when useful. Keep the `domain-redirects` and `domain-redirects-apex` services.
Use the connected GitHub integration to publish an approved release when terminal Git
authentication is unavailable. Create blobs for exactly the intended files (base64 for
binary assets), create a tree based on the current `origin/master` tree, verify its SHA
matches the local release tree, create a commit with the current remote head as parent,
then advance `master` without force. Fetch and align the local checkout with the remote
commit after publication. Preserve the same GitHub Actions, Railway, and live-site checks
as a terminal push. Do not treat a GitHub ref update alone as a production deployment.

Staging environment `d10b5732-c324-46bc-b557-ac2cc626d4f0` was torn down on 2026-09-18.
Do not wake or recreate it, apply leftover Railway canvas creates, or attach the
production `/data` volume to any preview environment.

The canonical phone/Safari preview is a Railway Sandbox in the existing
`pdx-pride-guide` project. Requests such as **stage this**, **show me on my phone**,
**test in Safari**, or **give me a demo URL** authorize that temporary sandbox preview.
Follow `.claude/skills/railway-sandbox-preview/SKILL.md` for that workflow.
It replaces the old staging environment. It is not a hidden production path such as
`/hauz-map-sandbox`, a zip, or a second always-on service.

Every sandbox must have a public HTTPS URL, use no more than 2 GB, idle out after about
15 minutes, have no `/data` volume, and have no `zaylist.com` or `prideguidepdx.com`
DNS. Destroy it when Tucker says done. Sandbox VMs cost about $50/GB-month while they
exist, and workspace compute is already $45.12 of the $60 cap this cycle. Check current
spend before creating one, never leave one running, and stop to tell Tucker first if it
would risk the $60 cap. Keep Mapz color and shader work off `master`.

Current production uses about 0.71 GB RAM, although Railway still reports an 8 GB limit.
A 1.5 GB replica-cap attempt did not stick; do not keep retrying caps that do not apply.
Current env controls are `FLYER_LLM_DISABLED=1`, `QSEARCH_SCRUB_LLM=0`, and
`QSEARCH_SCRUB_FLYER_VISION=0`.

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

## Required task closeout

Before ending any task that touched this repository, leave every file in one explicit
state:

- intended work is committed (and pushed only when Tucker authorized a push), or
- unfinished work is preserved in a clearly named stash or branch, or
- intentionally discarded work is restored and the checkout is clean.

Always run `git status --short --branch` as the final repository check. Never leave an
unexplained dirty checkout, mix unrelated work into a commit, or carry dirty files
through a pull/rebase. If pre-existing changes prevent a clean closeout, preserve them
without modification and report their paths and owner/status to Tucker.

Local development must use the ignored `.local/data.db` runtime database through the
repository scripts. The tracked root `data.db` is a production seed and must not be used
as a writable local runtime database.

For stale worktree maintenance, use `npm run git:worktree-prune`. It prunes only Git
metadata for already-missing worktree directories; it never deletes a live worktree.

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
