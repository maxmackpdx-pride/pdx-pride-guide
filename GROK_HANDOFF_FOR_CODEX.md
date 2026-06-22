# Grok Session Handoff for Codex — 2026-06-22 ~07:15 UTC

User paused ~1 hour. This document is the full handoff from the Grok agent session that reviewed `SOFT_LAUNCH_UAT_REPORT_CODEX.md`, investigated `/api/gigs`, fixed what could be fixed without user input, and continued DNS/deploy work.

## Executive summary

| Item | Status |
| --- | --- |
| `GET /api/gigs` on www | **FIXED** — returns `[]` (valid JSON) as of deploy `9be1878f` / commit `c7b71db` |
| Production deploy drift | **FIXED** — live is now `c7b71db` (was stuck at `11884e0`) |
| Pride Work UI error masking | **FIXED in repo** — `b5b0f74` surfaces API errors instead of "0 posts" |
| Apex `prideguidepdx.com` on Railway | **STILL BROKEN** — returns Railway `404 Application not found` |
| GitHub → Railway auto-deploy | **STILL BROKEN** — `repoTriggers` empty; manual deploy required |
| Claim route / soft-launch popup / feedback | **IN REPO, DEPLOYED** — needs browser UAT on live site |
| Codex UAT P1 items | **NOT STARTED** (ticket links, mobile overflow, admin cleanup) |

## Root cause: `/api/gigs` 500

Two compounding issues:

1. **Deploy drift** — Railway production was stuck on commit `11884e0` while GitHub `master` had `ce8ad4d` (startup migration) and later fixes. GitHub webhooks were disconnected (`repoTriggers: []`). `serviceInstanceDeploy` / `serviceInstanceRedeploy` only rebuilt the *currently pinned* commit, not latest GitHub.

2. **Legacy `data.db` in git** — `data.db` is tracked in the repo (not gitignored) and ships with every Railway build. Its `gig_posts` table used the **old schema** (`type`, `role`, `pay`, …) without `post_type`. Drizzle queries `post_type`, causing:
   ```
   no such column: "post_type"
   ```
   Startup migrations in `server/storage.ts` should have fixed this at runtime, but the persisted runtime DB + shipped git `data.db` both lacked the column. **Direct migration of tracked `data.db` + redeploy resolved it.**

## What Grok changed (commits pushed to `master`)

| Commit | Description |
| --- | --- |
| `b5b0f74` | `client/src/pages/PrideWork.tsx` — show error state when `/api/gigs` fails (UAT P0 UI masking) |
| `f862267` | `server/storage.ts` — PRAGMA-based `ensureGigPostsSchema()` for legacy `gig_posts` (+ maps old `type` column) |
| `c7b71db` | Migrated tracked `data.db` `gig_posts` schema; added startup column logging; call `ensureGigPostsSchema()` in `getGigPosts()` |

**GitHub HEAD:** `c7b71dbfc47bcb6ba57d94d36ae95898764cab0a`

**Live Railway deployment:** `9be1878f-0ad5-4b52-8ae1-60d832e31f78` (SUCCESS, commit `c7b71db`)

## How to deploy Railway (until auto-deploy is restored)

`serviceInstanceDeploy` / `serviceInstanceRedeploy` **do not** pull latest GitHub. Use:

```bash
# Get latest SHA
cd /Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide
SHA=$(git rev-parse HEAD)

# Deploy that SHA
curl -sS -X POST https://backboard.railway.com/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Project-Access-Token: e1875005-7e94-455a-98e4-ed6821da7495" \
  -d "{\"query\":\"mutation { serviceInstanceDeployV2(serviceId: \\\"c87eff12-aee2-4af2-8fd9-7f42b67c3ba3\\\", environmentId: \\\"8ab787f3-f5ee-4713-9845-bd17dd30ad08\\\", commitSha: \\\"$SHA\\\") }\"}"

# Poll status (replace DEPLOY_ID from response)
curl -sS -X POST https://backboard.railway.com/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Project-Access-Token: e1875005-7e94-455a-98e4-ed6821da7495" \
  -d '{"query":"query { project(id: \"13064cbe-e2d7-41cd-a028-fa957d0c9167\") { services { edges { node { deployments(first:1) { edges { node { id status meta } } } } } } } }"}'
```

**Restore auto-deploy (needs Railway dashboard / account owner):**
- Service → Settings → Connect GitHub repo `maxmackpdx-pride/pdx-pride-guide`, branch `master`
- GraphQL `deploymentTriggerCreate` returned `Bad Access` with project token — likely needs user OAuth in dashboard

## Verification commands (run after any deploy)

```bash
# APIs
curl -sS "https://www.prideguidepdx.com/api/events?limit=1"   # expect JSON array
curl -sS "https://www.prideguidepdx.com/api/gigs"              # expect JSON array (may be empty)
curl -sS "https://www.prideguidepdx.com/api/gifting" | head -c 200

# Apex (still broken as of handoff)
curl -sS -o /dev/null -w "%{http_code}\n" "https://prideguidepdx.com/api/events?limit=1"  # expect 404 today

# DNS authoritative
dig @ns-cloud-e1.googledomains.com prideguidepdx.com A +short      # 69.46.46.118
dig @ns-cloud-e1.googledomains.com www.prideguidepdx.com CNAME +short  # he6e3ojn.up.railway.app
```

## Browser UAT checklist (post-deploy)

From `SOFT_LAUNCH_UAT_REPORT_CODEX.md`, re-test on live:

- [ ] `#/submit/claim/20` and `#/submit?mode=claim&eventId=20` open claim form (not React 404)
- [ ] Soft-launch welcome popup appears once
- [ ] Footer tech feedback form submits successfully
- [ ] Pride Work page shows error UI if API fails; shows posts when LIVE gigs exist
- [ ] Treasure Trail / Bearracuda claim flow end-to-end
- [ ] Mobile home at 390px — horizontal overflow
- [ ] Admin: clear moderation test requests IDs 1–2

## P0 still open: apex domain

**Symptom:** `https://prideguidepdx.com/*` → Railway `{"status":"error","code":404,"message":"Application not found"}` even when DNS A record points to Railway (`69.46.46.118`).

**www works:** `he6e3ojn.up.railway.app` → `69.46.46.18`

**apex Railway target:** `9bkv0osk.up.railway.app` → `69.46.46.118`

**Squarespace DNS (already applied):**
- ALIAS `@` → `9bkv0osk.up.railway.app`
- TXT `@` → `railway-verify=ae9d6a5461b84a1c95485ba8a6cd3f1ffb3a42a86a6384135baf4af1bf449845`
- CNAME `www` → `he6e3ojn.up.railway.app`

**Railway custom domains (both registered):**
- `www.prideguidepdx.com` — CERT VALID, DNS PROPAGATED
- `prideguidepdx.com` — CERT VALID, DNS `REQUIRES_UPDATE` (`currentValue` empty; Squarespace ALIAS quirk)

**Likely fix for Codex:** In Railway dashboard, open apex domain `prideguidepdx.com` → verify DNS / re-issue cert / confirm routing. ALIAS at Squarespace may not satisfy Railway's DNS checker even when A record IP is correct. Options:
1. Re-save apex domain in Railway after confirming ALIAS target `9bkv0osk.up.railway.app`
2. Move DNS to Cloudflare (CNAME flattening at apex)
3. Temporary: Squarespace path-preserving redirect apex → www (worked during cache transition but not ideal long-term)

**DNS rollback snapshots:** `/Users/tuckercasey/pdx-pride-guide/DNS_SNAPSHOT_BEFORE.txt`, `DNS_SNAPSHOT_AFTER.txt`, `DNS_MIGRATION_VERIFICATION.txt`

## Railway project reference

| Key | Value |
| --- | --- |
| Project ID | `13064cbe-e2d7-41cd-a028-fa957d0c9167` |
| Environment ID | `8ab787f3-f5ee-4713-9845-bd17dd30ad08` |
| Service ID | `c87eff12-aee2-4af2-8fd9-7f42b67c3ba3` |
| Project token | `e1875005-7e94-455a-98e4-ed6821da7495` (GraphQL header: `Project-Access-Token`) |
| Canonical repo | `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide` |
| GitHub | `maxmackpdx-pride/pdx-pride-guide` |

## data.db warning for Codex

- `data.db` is **tracked in git** and deployed with the app.
- Long-term: attach a Railway volume, set explicit `DATABASE_PATH`, gitignore `data.db`, and stop committing runtime state.
- Short-term: startup migrations in `ensureGigPostsSchema()` should keep legacy schemas compatible.

## Failed deploy history (for context)

Between `11884e0` (last auto success) and this session, several GitHub-triggered deploys **FAILED** (`294d1ff`, `5dc480b`, etc.). Builds pass locally now (`npm run build` OK). If auto-deploy is reconnected, watch first build logs in Railway dashboard.

## Codex UAT report status update

Original report: `SOFT_LAUNCH_UAT_REPORT_CODEX.md` — **NO-SHIP**

**Would change after this session:**
- ~~Pride Work API 500~~ → fixed
- ~~Production deploy drift~~ → fixed (manual deploy)
- ~~Pride Work UI masking~~ → fixed in `b5b0f74`
- ~~Apex API returns HTML~~ → DNS moved; apex now 404 on Railway (different blocker)
- Claim route / feedback / popup → deployed, needs re-UAT

**Still NO-SHIP for wide promotion until:** apex domain works, browser UAT passes, P1 items addressed.

## What Grok could not fix without user

1. Railway dashboard: reconnect GitHub auto-deploy (`deploymentTriggerCreate` → Bad Access)
2. Apex domain routing / DNS verification in Railway UI
3. Admin cleanup of moderation requests IDs 1–2 (needs admin login)
4. Event-specific ticket URLs for events 41 and 53
5. Mobile overflow CSS polish

---

*Generated by Grok agent during paused session. User expected back in ~1 hour.*