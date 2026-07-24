# Agent rules — Zaylist

## Prod fixes: ready-to-ship + confirm before push (hard rule)

When the user reports a **live-site bug** or asks to **fix** something on the product (reload glitch, broken UI, wrong data, etc.):

1. **Destination is production**, not a local-only patch. Implement the fix on `master` (or a clean commit that will land on `master`) with **only the fix** — leave unrelated feature WIP unstaged.
2. **Never imply the site is fixed** while the change is still local/unpushed. Say clearly: *“Fixed locally — ready to push”* (or equivalent).
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

**Always keep local `master` synced with `origin/master` before and after shipping** (`git fetch` + `pull --ff-only` when behind). Multi-agent (Claude/etc.) pushes to the same remote — lagging local is how “desync” happens.

## Deploy / “push” claims (hard rule)

**Never** report a push as fully successful, live, shipped, or “pushes are working” based only on `git push`.

When the user asks to **push** / **deploy** / **ship** (or after any push to `master`):

| Step | Required | Language if this is all you have |
|------|----------|----------------------------------|
| 0. `git fetch` + sync local with `origin/master` | Always before starting | “Behind remote — pulled first” |
| 1. `git push` + local `HEAD` == `origin/master` | Always | “On GitHub / remote has the commit” |
| 2. GitHub commit on `master` confirmed | Always | Same — still not “live” |
| 3. Railway production deploy **SUCCESS** (poll until terminal) | Always before “shipped/live” | Building/deploying → “deploy in progress” |
| 4. Live probe when relevant (`/api/health`, asset, or JS string) | Preferred | Note cache risk if asset looks stale |

- **SUCCESS** → may say production is updated.
- **FAILED / CRASHED** → report failure + logs; never success.
- **BUILDING / DEPLOYING** → in progress only; do not declare done.

Repo: `maxmackpdx-pride/pdx-pride-guide`  
Railway: project `zaylist`, production, https://www.zaylist.com  

## Design source of truth (hard rule)

**The live site is truth.** Production code on `master` / https://www.zaylist.com beats portable kits, previews, sandboxes, and old handoffs.

| Priority | Location |
|----------|----------|
| 1 | Live React + CSS (`client/src/components/ds/**`, page/component CSS) |
| 2 | Tokens: `client/src/components/ds/tokens/glass.css` (+ colors/type/layout/effects) |
| 3 | Portable: `design-system/` (sync only — never invent chrome that fights live) |
| Archive | `docs/handoffs/deep-glass-2026-07-16/` (migration package, not open work orders) |

**Canonical rulebook:** [`docs/LIVE_DESIGN_STANDARD.md`](docs/LIVE_DESIGN_STANDARD.md)

**Do not re-introduce** retired globals: default brutal magenta CTAs, map outer neon bloom, yellow-rim claim stickers, dead “Event details” on grid cards, Mr. S red ads, MC 7-day window as board “past.” Full trap list is in the live standard.

When UI chrome changes, update `docs/LIVE_DESIGN_STANDARD.md` in the **same** ship.

## Nav source of truth

Primary nav order lives in `client/src/lib/siteNav.ts` (`PRIMARY_NAV`).
Do **not** restyle nav unless the user explicitly asks (black outlines; cyan active/handle only).
