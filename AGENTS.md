# Agent rules - Zaylist

## Prod fixes: ready-to-ship + confirm before push (hard rule)

When the user reports a **live-site bug** or asks to **fix** something on the product (reload glitch, broken UI, wrong data, etc.):

1. **Destination is production**, not a local-only patch. Implement the fix on `master` (or a clean commit that will land on `master`) with **only the fix** - leave unrelated feature WIP unstaged.
2. **Never imply the site is fixed** while the change is still local/unpushed. Say clearly: *“Fixed locally - ready to push”* (or equivalent).
3. **Always confirm before `git push`** (and before any Railway deploy). Show short summary: commit subject, files, that prod will update. Wait for an explicit yes (e.g. “push,” “ship,” “do it,” “go”).
4. **After they confirm:** `git push origin master` → poll Railway until **SUCCESS** → live probe when useful. Same bar as “ship.”
5. **Local / preview testing only when they explicitly ask.** Don’t default to “test this first” and leave it there.

Default bias: **fix for prod, ask once, then ship.** Not “fixed” until they approved the push and deploy succeeded.

## What “deploy / fix the website / ship” means (hard rule)

When the user says **deploy**, **ship**, **push**, **go live**, **fix the site**, or similar, they mean **the real product**:

1. **GitHub `master`** on `maxmackpdx-pride/pdx-pride-guide` (commit + push)
2. **Railway production** for project `zaylist` (auto-deploys from `master`) until status is **SUCCESS**
3. Prefer a live probe (`/api/health` or the fixed path)

Local-only edits, stashes, or unpushed branches are **not** done. Do not leave WIP stashed after a “ship” request without saying so and finishing the ship.

**Always keep local `master` synced with `origin/master` before and after shipping** (`git fetch` + `pull --ff-only` when behind). Multi-agent (Claude/etc.) pushes to the same remote - lagging local is how “desync” happens.

## Deploy / “push” claims (hard rule)

**Never** report a push as fully successful, live, shipped, or “pushes are working” based only on `git push`.

When the user asks to **push** / **deploy** / **ship** (or after any push to `master`):

| Step | Required | Language if this is all you have |
|------|----------|----------------------------------|
| 0. `git fetch` + sync local with `origin/master` | Always before starting | “Behind remote - pulled first” |
| 1. `git push` + local `HEAD` == `origin/master` | Always | “On GitHub / remote has the commit” |
| 2. GitHub commit on `master` confirmed | Always | Same - still not “live” |
| 3. Railway production deploy **SUCCESS** (poll until terminal) | Always before “shipped/live” | Building/deploying → “deploy in progress” |
| 4. Live probe when relevant (`/api/health`, asset, or JS string) | Preferred | Note cache risk if asset looks stale |

- **SUCCESS** → may say production is updated.
- **FAILED / CRASHED** → report failure + logs; never success.
- **BUILDING / DEPLOYING** → in progress only; do not declare done.

Repo: `maxmackpdx-pride/pdx-pride-guide`  
Railway: project `zaylist`, production, https://www.zaylist.com  

## Design source of truth (hard rule)

**The design guide is truth for design rules.**  
**Product code implements it.** Do not keep a second contradictory kit.

| Priority | Location |
|----------|----------|
| 1 | Design guide: [`design-system/`](design-system/) · https://maxmackpdx-pride.github.io/zaylist-design-system/ |
| 2 | Live React + CSS (`client/src/components/ds/**`, page/component CSS) |
| 3 | Live token modules: `client/src/components/ds/tokens/` (esp. `glass.css`) |
| Archive | `docs/handoffs/deep-glass-2026-07-16/` (migration package, not open work orders) |

**Production trap list (must not contradict the guide):** [`docs/LIVE_DESIGN_STANDARD.md`](docs/LIVE_DESIGN_STANDARD.md)

**Do not re-introduce** retired globals: default brutal magenta CTAs, map outer neon bloom, yellow-rim claim stickers, dead “Event details” on grid cards, Mr. S red ads, MC 7-day window as board “past.”

When UI chrome or design rules change, update **`design-system/`** (mirror from the public design-system repo via `npm run sync:design-system`) and the trap list if needed, in the **same** ship.

## Nav source of truth

Primary nav order lives in `client/src/lib/siteNav.ts` (`PRIMARY_NAV`).
Do **not** restyle nav unless the user explicitly asks (black outlines; cyan active/handle only).

## The Foundation: read before deciding anything

`foundation/` holds the project's decisions, reasoning, and current state. Read
it before proposing architecture, naming, product scope, or design direction.

Entry point: **`foundation/llms.txt`**. It lists every governed area, the
authority order, and how to read a record's status.

- `foundation/decisions/` - one YAML record per durable decision. Check `status`
  before applying. `accepted` and `current` are authoritative; `recommendation`,
  `draft`, `queued`, and `deferred` are not. `superseded` is history, never apply it.
- `foundation/chapters/` - longer explanations of how each area works.
- `foundation/explorations/` - raw session thinking. **Zero authority.** Never
  cite an exploration as a rule or a plan. When only an exploration covers a
  topic, the correct answer is that no decision exists yet.
- `foundation/agent-continuity/` - current state and handoff. Start at
  `START_HERE.md`.

`implementation_state: not-implemented` means the decision is made and the code
has not caught up. Do not describe it as shipped.

Do not write pairwise handoff files (`X_HANDOFF_FOR_Y.md`). That pattern grows
N by N and nobody reads the one addressed to another model. Write to
`foundation/agent-continuity/` instead.

### Release ids

Every governed area's `llms.txt` carries `Release: zaylist-<area>-YYYY-MM-DD.N`.
Change content in an area, bump that id. CI enforces it via
`scripts/check-foundation-release.mjs`. `foundation/agent-continuity/` is exempt.
