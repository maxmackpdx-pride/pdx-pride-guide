# Grok Session Handoff for Codex — 2026-06-22 (updated)

Read this file first. GitHub is the communication bus — same pattern as `GROK_HANDOFF_FOR_CLAUDE.md`.

## How this bridge works

| Direction | File | Writer | Reader |
|-----------|------|--------|--------|
| Grok → Codex | `GROK_HANDOFF_FOR_CODEX.md` | Grok | Codex |
| Codex → Grok | `CODEX_HANDOFF_FOR_GROK.md` | Codex | Grok |
| Grok → Claude | `GROK_HANDOFF_FOR_CLAUDE.md` | Grok | Claude |

**Codex start prompt:**
> Read `GROK_HANDOFF_FOR_CODEX.md` and `SOFT_LAUNCH_UAT_REPORT_CODEX.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Reply in `CODEX_HANDOFF_FOR_GROK.md` or via commits.

## Executive summary

| Item | Status |
| --- | --- |
| **GitHub HEAD** | `b8e5ddc` (docs refresh); feature HEAD `49227a2` |
| Live site | `https://www.prideguidepdx.com` — serving `index-CSxnRzuH.css`, `index-D7i_j5zy.js` |
| `GET /api/gigs` on www | **FIXED** — valid JSON |
| Production deploy drift | **FIXED** — GitHub Actions auto-deploy on `master` |
| Pride Work UI error masking | **FIXED** |
| Avatar system (Section 17) | **DEPLOYED** — circle crop + optional pride rings |
| Mobile hero + nav | **DEPLOYED** |
| Gift With Pride art | **DEPLOYED** |
| Apex `prideguidepdx.com` | **STILL BROKEN** — Railway 404 |
| Codex UAT P1 items | **NOT STARTED** (ticket links, mobile overflow, admin cleanup) |
| Claim route / popup / feedback | Deployed — needs browser re-UAT |

## Project paths

| Item | Value |
|------|-------|
| Canonical repo | `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide` |
| GitHub | `maxmackpdx-pride/pdx-pride-guide` (branch `master`) |
| Plan PDF | `/Users/tuckercasey/Downloads/pdx-pride-guide-plan-v8.pdf` |
| UAT report | `SOFT_LAUNCH_UAT_REPORT_CODEX.md` |

## Admin & identity

- **Owner/admin Google login:** `hello.tuckercasey@gmail.com`
- **Display username:** `tucker_pdmax`
- **Creator credit everywhere:** Tucker Max — NOT Tucker Casey (hard rule)
- Admin via `ADMIN_USER_EMAILS` in `server/routes.ts`

## What changed since last Codex handoff (`c7b71db`)

| Commit | Description |
|--------|-------------|
| `49227a2` | Avatar system: `UserAvatar`, `AvatarEditor`, pride rings, schema `avatar_ring`/`avatar_crop` |
| `6537bee` | Mobile hero title restored; countdown row shrunk |
| `bdc0898` | Gift With Pride hero art on home + `/gifting` |
| `fedf025` | Dist refresh for production CSS |
| `3872755` | Mobile nav MENU dropdown (≤640px) |
| `75d54d7` | Mobile hero image; desktop title sizing |
| `b8e5ddc` | Claude + Codex bridge docs refresh |

### Avatar system (for UAT)

- **Path:** Dashboard → Edit Profile → choose photo → drag/zoom crop → optional ring → save
- **Files:** `UserAvatar.tsx`, `AvatarEditor.tsx`, `shared/avatarRings.ts`, `client/src/lib/avatarCrop.ts`
- **Sitewide:** Nav, Dashboard, event check-ins, Gifting poster/interests
- **Test:** `https://www.prideguidepdx.com/#/dashboard` logged in as admin

## Deploy (auto-deploy restored)

GitHub Actions: `.github/workflows/railway-deploy.yml` — push to `master` triggers Railway deploy via GraphQL.

**Manual fallback** (if Actions fails):
```bash
cd /Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide
SHA=$(git rev-parse HEAD)
curl -sS -X POST https://backboard.railway.com/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Project-Access-Token: e1875005-7e94-455a-98e4-ed6821da7495" \
  -d "{\"query\":\"mutation { serviceInstanceDeployV2(serviceId: \\\"c87eff12-aee2-4af2-8fd9-7f42b67c3ba3\\\", environmentId: \\\"8ab787f3-f5ee-4713-9845-bd17dd30ad08\\\", commitSha: \\\"$SHA\\\") }\"}"
```

**Important:** `dist/public/` is tracked in git. Frontend CSS changes require `npm run build` + commit `dist/` before deploy.

## Verification commands

```bash
curl -sS "https://www.prideguidepdx.com/api/events?limit=1"
curl -sS "https://www.prideguidepdx.com/api/gigs"
curl -sS -o /dev/null -w "%{http_code}\n" "https://prideguidepdx.com/api/events?limit=1"  # expect 404
curl -sS "https://www.prideguidepdx.com/" | grep -oE 'index-[^"]+\.(css|js)' | head -2
```

## Browser UAT checklist (re-test on live)

From `SOFT_LAUNCH_UAT_REPORT_CODEX.md`:

- [ ] `#/submit/claim/20` and `#/submit?mode=claim&eventId=20` open claim form
- [ ] Soft-launch welcome popup appears once
- [ ] Footer tech feedback form submits
- [ ] Pride Work shows error UI if API fails; shows posts when LIVE gigs exist
- [ ] **Avatar:** circle crop + ring save on Dashboard; appears in nav + gifting
- [ ] Mobile home at 390px — horizontal overflow
- [ ] Admin: clear moderation test requests IDs 1–2
- [ ] Ticket links for events 41 and 53

## P0 still open: apex domain

**Symptom:** `https://prideguidepdx.com/*` → Railway `404 Application not found`

**www works:** `he6e3ojn.up.railway.app`

**Squarespace DNS:**
- ALIAS `@` → `9bkv0osk.up.railway.app`
- CNAME `www` → `he6e3ojn.up.railway.app`

**Likely fix:** Railway dashboard → apex domain → re-verify DNS / re-issue cert. ALIAS at Squarespace may not satisfy Railway checker.

## Railway reference

| Key | Value |
| --- | --- |
| Project ID | `13064cbe-e2d7-41cd-a028-fa957d0c9167` |
| Environment ID | `8ab787f3-f5ee-4713-9845-bd17dd30ad08` |
| Service ID | `c87eff12-aee2-4af2-8fd9-7f42b67c3ba3` |
| Project token | `e1875005-7e94-455a-98e4-ed6821da7495` |

## data.db warning

- `data.db` is **tracked in git** and deployed with the app
- `users.avatar_ring` and `users.avatar_crop` columns added in `49227a2`
- Long-term: Railway volume + gitignore `data.db`

## UAT report status

Original: `SOFT_LAUNCH_UAT_REPORT_CODEX.md` — **NO-SHIP**

**Would change after Grok sessions:**
- ~~Pride Work API 500~~ → fixed
- ~~Production deploy drift~~ → fixed (GitHub Actions)
- ~~Pride Work UI masking~~ → fixed
- Avatar system → implemented + deployed
- Mobile hero/nav/gifting → deployed

**Still NO-SHIP until:** apex works, browser UAT passes, P1 items addressed.

## What Codex should pick up

1. **UAT P1** — ticket links (events 41, 53), mobile overflow ~390px, admin moderation cleanup
2. **Browser re-UAT** — claim routes, popup, feedback, avatars on live
3. **Apex domain** — Railway dashboard DNS verification
4. Reply in `CODEX_HANDOFF_FOR_GROK.md` with findings

## User workflow preferences

- Confirm before code edits unless user explicitly says implement/deploy
- Deploy when user says **yes**
- Creator credit: Tucker Max — NOT Tucker Casey

---

*Updated by Grok — 2026-06-22. Live HEAD feature commit `49227a2`, docs `b8e5ddc`.*