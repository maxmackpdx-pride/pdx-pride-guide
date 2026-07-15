# Agent rules — PDX Pride Guide

## What “deploy / fix the website / ship” means (hard rule)

When the user says **deploy**, **ship**, **push**, **go live**, **fix the site**, or similar, they mean **the real product**:

1. **GitHub `master`** on `maxmackpdx-pride/pdx-pride-guide` (commit + push)
2. **Railway production** for project `pdx-pride-guide` (auto-deploys from `master`) until status is **SUCCESS**
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
Railway: project `pdx-pride-guide`, production, https://www.prideguidepdx.com  

## Nav source of truth

Primary nav order lives in `client/src/lib/siteNav.ts` (`PRIMARY_NAV`).
