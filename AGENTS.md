# Agent rules — PDX Pride Guide

## Deploy / “push” claims (hard rule)

**Never** report a push as fully successful, live, shipped, or “pushes are working” based only on `git push`.

When the user asks to **push** (or after any push to `master`):

| Step | Required | Language if this is all you have |
|------|----------|----------------------------------|
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
