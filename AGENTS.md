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

Cowork / claude.ai/code sessions that will `git push` must list both
`maxmackpdx-pride/pdx-pride-guide` and
`maxmackpdx-pride/zaylist-foundation-library` as session sources. A PAT in
the remote URL is intercepted and 403s. See `CLAUDE.md`.

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
Railway: project `pdx-pride-guide` (also called zaylist), production, https://www.zaylist.com

**Staging** (not production): branch `staging` → Railway environment `staging` → https://pdx-pride-guide-staging.up.railway.app  
Own variables, own SQLite volume at `/data`. Do not fast-forward `staging` to `master` without an explicit yes. Title contract and type snap stay parked until that yes and a look at staging.

Cowork / claude.ai/code sessions that will `git push` must list both
`maxmackpdx-pride/pdx-pride-guide` and
`maxmackpdx-pride/zaylist-foundation-library` as session sources. A PAT in
the remote URL is intercepted and 403s. See `CLAUDE.md`.

## Design source of truth (hard rule)

**The design guide is truth for design rules.**  
**Product code implements it.** Do not keep a second contradictory kit.

The guide is **not in this repo**. There is no `design-system/` directory here.

| Priority | Location |
|----------|----------|
| 1 | Design guide: `zaylist-foundation-library` `public/design-system/` · https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/ |
| 2 | Live React + CSS (`client/src/components/ds/**`, page/component CSS) |
| 3 | Live token modules: `client/src/components/ds/tokens/` (esp. `glass.css`, `chrome.css`) |
| Archive | `docs/handoffs/deep-glass-2026-07-16/` (migration package, not open work orders) |

**Production trap list (must not contradict the guide):** [`docs/LIVE_DESIGN_STANDARD.md`](docs/LIVE_DESIGN_STANDARD.md)

**Do not re-introduce** retired globals: default brutal magenta CTAs, yellow-rim claim stickers, dead “Event details” on grid cards, Mr. S red ads, MC 7-day window as board “past,” the Z/Space “Featured” dropdown panel, and the sitewide cyan bottom-nav pull handle.

**Outer neon bloom is 8% and is NOT retired.** It is carried by `--neon-bloom`
(`client/src/components/ds/tokens/chrome.css`) and composed, never hand-rolled, by tags,
tape, kickers, pills, badges, seams and buttons. **Maps are the sole exception:** debossed
well (`--map-frame-shadow`), no bloom at all.

**Buttons use the glow treatment:** dark plate, accent rim and ink, lit top edge, dark
inner floor, 8% bloom, composed from `--btn-glow-bg` and `--btn-glow-shadow`. The solid
accent fill is reserved for the one primary action on a surface.

When UI chrome or design rules change, update the design guide in
`zaylist-foundation-library` `public/design-system/` **and** the trap list here, in the
**same** ship. There is no `npm run sync:design-system` script in this repo.

## Nav source of truth

Primary nav order lives in `client/src/lib/siteNav.ts` (`PRIMARY_NAV`).
Do **not** restyle nav unless the user explicitly asks. When they do ask, ship the
standard in the **Site navigation** section of
[`docs/LIVE_DESIGN_STANDARD.md`](docs/LIVE_DESIGN_STANDARD.md), not a new treatment.

Two things that section retires, so never restore them: **nav pill glow is hover only**
(the current page keeps its accent on rim and label, with no standing glow and no pulse),
and the **sitewide cyan pull handle above the bottom nav is gone** (the grip belongs to
the hub drawer only).

## The Foundation: read before deciding anything

The Foundation is **not in this repo**. It lives in the private repo
`maxmackpdx-pride/zaylist-foundation-library`, and is published as a library at

  https://zaylist-foundation-library.maxmackpdx.workers.dev/library

Read it before proposing architecture, naming, product scope, or design
direction. Decisions, explorations, agent continuity, tunnels, claims, and the
release gate all live there now.

`implementation_state: not-implemented` means the decision is made and the code
has not caught up. Do not describe it as shipped.

Do not write pairwise handoff files (`X_HANDOFF_FOR_Y.md`). That pattern grows
N by N and nobody reads the one addressed to another model. Use a tunnel in the
Foundation repo instead.

## Live tunnels

Tunnels moved with the Foundation. Open, read, and close them from the
`maxmackpdx-pride/zaylist-foundation-library` checkout, not this one.

Transcripts carry no authority. Authority attaches only to what a closing agent
writes into the library.

## Before your first change

Read `foundation/agent-continuity/onboarding.md` in full. It is the operating
standard for every model on this repo: the library structure, authority order,
status fields, release gate, tunnels, path variables, and the divergence gate.

Roles are in `foundation/decisions/agent-roles-2026-08-06.yaml`. Role describes
what an agent is best pointed at. It never changes which rules apply.

## Session start

Claims, acknowledgements, and tunnels live in the Foundation repo
(`maxmackpdx-pride/zaylist-foundation-library`), not here. Run them from that checkout.

Route by cost: urgent production and verification loops go to grok, governance
writing and design reasoning to claude, multi-file implementation to codex.
