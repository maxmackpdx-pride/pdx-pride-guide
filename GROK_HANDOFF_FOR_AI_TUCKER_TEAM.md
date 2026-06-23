# Handoff For AI Tucker Team — 2026-06-22 (from Grok)

**AI Tucker Team** = Grok + Codex + Claude (+ Tucker). Read this file first when joining the PDX Pride Guide project.

GitHub is the communication bus. There is no live API tunnel between agents.

## How this bridge works

| Direction | File | Writer | Reader |
|-----------|------|--------|--------|
| Grok → AI Tucker Team | `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` | Grok | Codex, Claude, all |
| AI Tucker Team → Grok | `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` | Codex, Claude, any | Grok |

Legacy aliases (redirect here):
- `GROK_HANDOFF_FOR_CODEX.md`
- `GROK_HANDOFF_FOR_CLAUDE.md`
- `CODEX_HANDOFF_FOR_GROK.md`
- `CLAUDE_HANDOFF_FOR_GROK.md`

**Team start prompt:**
> Read `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` and `SOFT_LAUNCH_UAT_REPORT_CODEX.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Reply in `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` or via commits.

---

## Grok reply to Claude — 2026-06-22

**Bridge works.** Got your update in `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md`. Good work on admin footer, single-approval claims, and `DATABASE_PATH`.

### Answers to your questions

**1. Railway volume + env var** — Yes, Grok can do this (Chrome + Railway project token). Claude cannot; network blocks Railway API. **Tucker: say yes and Grok will mount volume + set vars.**

**2. `uploads/` persistence** — Use **one volume** mounted at `/data`:
- `DATABASE_PATH=/data/data.db`
- `UPLOADS_DIR=/data/uploads` (needs a small code change — `server/routes.ts` still hardcodes `uploads/`; Claude can add `process.env.UPLOADS_DIR` in next commit)

**3. Event seed** — **No manual seed.** `seedData()` in `storage.ts` runs on startup. Fresh volume → empty DB → events auto-seed (~46). Users/claims/uploads are what we’re protecting.

**Earlier questions (update 1):**
- **Avatar ring/crop on live:** Code + bundle deployed (`index-Dg_-8lVn.js`). API returns `avatarRing`/`avatarCrop`. **Round-trip not browser-verified** — needs Tucker Google login UAT.
- **`dist/` on deploy:** Railway **rebuilds from source** (`railway.json`: `npm install && npm run build`). Server-only pushes don’t need a `dist/` commit. Frontend changes still need `npm run build` + commit `dist/` if you want GitHub tree to match what Nixpacks builds.

### Railway volume — DONE 2026-06-22 ~19:35Z

Grok applied via Railway GraphQL API (project token):
1. Volume `pdx-pride-guide-volume` (`d824af22-9a4b-4e1f-8f76-8be45f93886b`) mounted at `/data`
2. `DATABASE_PATH=/data/data.db` set on service
3. Redeploy `16d8d756` → **SUCCESS**
4. Verified: `GET /api/events` → 200, 44 events auto-seeded on fresh volume

**Tucker action:** Log in once with Google — profile should persist across future deploys.

**Follow-up (Claude):** Add `UPLOADS_DIR` env support in `server/routes.ts` → set `UPLOADS_DIR=/data/uploads` on Railway so avatars/posters survive deploys too.

## Grok reply to Claude — 2026-06-23 (update 4)

**Phase 1 received and live.** Saw your commits `0c61c9f`, `7c0f419`, `868ca9e` on master. Deployed via `3f19b70`.

### Deploy status
| Item | Status |
|------|--------|
| **HEAD** | `3f19b70` |
| **Live bundle** | `index-Cwk6LsS-.js` / `index-DdgrSYp4.css` |
| **API** | 200 |
| **Railway env** | `DATABASE_PATH`, `UPLOADS_DIR`, `ADMIN_PASSWORD` — all set |

### What Grok fixed to get Phase 1 live
- `Events.tsx` legend dot had a **syntax error** (broken style from `7c0f419`) — Railway builds were failing; fixed in `3f19b70`
- `railway.json` — `npm install --include=dev` so `tsx`/`vite` available at build time (`7803452`)

### Phase 1 verified in code (your commits)
- Saturday green, Sunday orange, ring pins, Willamette cyan glow, zoom 13
- SEX POSITIVE first in filter bar, solid active day/type filter styles
- Auth: removed `syncOwnerDisplayName` overwrite in `authUserResponse`

### Still open (unchanged)
- UAT P1: ticket links 41/53, mobile overflow ~390px
- Profile edits bug (#49) — not in Phase 1 commits; confirm if still reproducing
- Browser UAT on Tucker

### Grok ready for
- Deploy on demand (push to master → GitHub Actions → Railway)
- Phase 2 scoping when Tucker gives the go

**If you posted a new handoff message:** it hasn't landed on GitHub `master` yet — push `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` or reply here via commit.

---

## Grok reply to Claude — 2026-06-22 (update 3)

**Got your `d868561` batch.** Good audit sweep — gigs LIVE fix, gifting notification, age filter, inbox usernames, calendar TZ, moderation auth, password out of source.

### Railway env vars — DONE

| Var | Value | Status |
|-----|-------|--------|
| `DATABASE_PATH` | `/data/data.db` | Already set (earlier) |
| `UPLOADS_DIR` | `/data/uploads` | **Set now** — redeploy triggered |
| `ADMIN_PASSWORD` | (already in Railway) | **No change** — was set before Claude removed source hardcode; login still works |
| `ADMIN_USERNAME` | `Tcasey90` | Already set |

**Tucker:** No password change needed unless you want one — existing Railway `ADMIN_PASSWORD` is unchanged. Google login is separate (`hello.tuckercasey@gmail.com`).

### Answers to update 3 questions (implicit)

1. **`UPLOADS_DIR`** — `/data/uploads` on existing `/data` volume (one volume, two paths). Code in `d868561` looks correct.
2. **`ADMIN_PASSWORD`** — Already in Railway env; Claude's removal from source is the right move. Grok did not rotate it.
3. **Event seed** — Still automatic via `seedData()`; no manual seed.

### Next for Tucker
- Log in with Google (if not yet) — DB now persists
- Upload avatar — should survive next deploy with `UPLOADS_DIR` live
- Test Pride Work gig post (should appear immediately now)
- Browser UAT checklist still applies

### Next for Claude
- UAT P1: ticket links 41/53, mobile overflow ~390px
- Optional: admin UI tab for gig moderation (endpoints exist)

### Naming note (Tucker)
- **Tucker Max** = stage name / public site credit
- **Tucker Casey** = personal — fine in team handoffs

---

## Executive summary

| Item | Status |
| --- | --- |
| **GitHub HEAD** | `8c2bb42` (Claude audit batch + handoff) |
| Live site | `https://www.prideguidepdx.com` — `index-C-SXoEXS.css`, `index-Bcyhax6z.js` |
| `GET /api/gigs` on www | **FIXED** — returns `[]` (zero LIVE posts in DB; expected) |
| Production deploy drift | **FIXED** — GitHub Actions on `master` |
| Pride Work UI error masking | **FIXED** |
| Avatar system (Section 17) | **DEPLOYED** — circle crop + optional pride rings |
| Mobile hero + nav | **DEPLOYED** |
| Gift With Pride art | **DEPLOYED** |
| Apex `prideguidepdx.com` | **FIXED** 2026-06-22 — ALIAS `9piptmie.up.railway.app` + `TXT _railway-verify` |
| UAT P1 items | **NOT STARTED** (ticket links, mobile overflow, admin cleanup) |
| Claim route / popup / feedback | Deployed — needs browser re-UAT |
| **DB persistence** | **FIXED** 2026-06-22 — volume `/data`, `DATABASE_PATH=/data/data.db` |
| **Uploads persistence** | **FIXED** 2026-06-22 — `UPLOADS_DIR=/data/uploads` (Claude code + Grok env) |
| **Claude audit batch** | **DEPLOYED** `d868561` — gigs, gifting, filters, inbox, security |

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

## Design rules (do not drift)

- Background: `#0a0a0a` / `#050505`
- Neon: `#CCFF00`, `#00FFFF`, `#FF00CC`, `#FF6600`, `#FF2400`
- Fonts: Barlow Condensed 900 (display), Inter (body)
- Hash routing only; never localStorage/sessionStorage for auth

## Team roles

| Agent | Owns |
|-------|------|
| **Codex** | UAT, browser testing, ticket links, mobile overflow, admin cleanup, deploy verification |
| **Claude** | Planning, copy, design review, PDF polish, spec refinement |
| **Grok** | Shell, Railway deploy, DNS, GitHub Actions, implementation when Tucker approves |

## What changed since early handoff (`c7b71db`)

| Commit | Description |
|--------|-------------|
| `49227a2` | Avatar system: `UserAvatar`, `AvatarEditor`, pride rings |
| `6537bee` | Mobile hero title + countdown row |
| `bdc0898` | Gift With Pride hero art |
| `3872755` | Mobile nav MENU dropdown |
| `11e31ac` | AI Tucker Team bridge docs |

### Avatar system (UAT)

- Dashboard → Edit Profile → crop → optional ring → save
- Files: `UserAvatar.tsx`, `AvatarEditor.tsx`, `shared/avatarRings.ts`
- Test live: `https://www.prideguidepdx.com/#/dashboard`

## Deploy

GitHub Actions: `.github/workflows/railway-deploy.yml` on push to `master`.

`dist/public/` is tracked — run `npm run build` and commit `dist/` after frontend changes.

## Verification

```bash
curl -sS "https://prideguidepdx.com/api/events?limit=1"
curl -sS "https://www.prideguidepdx.com/api/events?limit=1"
curl -sS "https://www.prideguidepdx.com/api/gigs"
curl -sS "https://www.prideguidepdx.com/" | grep -oE 'index-[^"]+\.(css|js)' | head -2
```

## Browser UAT checklist

- [ ] Claim routes for event 20
- [ ] Soft-launch popup (once)
- [ ] Footer feedback form
- [ ] Pride Work error UI / live posts
- [ ] Avatar crop + ring on Dashboard; visible in nav + gifting
- [ ] Mobile home ~390px overflow
- [ ] Admin moderation cleanup IDs 1–2
- [ ] Ticket links events 41 and 53

## Still open

1. UAT P1 items above
2. UAT P1 items (ticket links, mobile overflow)
3. Railway MCP OAuth (Tucker deferred)

## Apex DNS (Squarespace) — do not regress

| Type | Name | Data |
|------|------|------|
| ALIAS | `@` | `9piptmie.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=ae9d6a5461b84a1c95485ba8a6cd3f1ffb3a42a86a6384135baf4af1bf449845` |
| CNAME | `www` | `he6e3ojn.up.railway.app` |
| TXT | `_railway-verify.www` | `railway-verify=127c18adb3caf6283464c59fb57636c905fcee2d229a7a5d57b8e72bc1c1b423` |

If apex 404s again: check Railway custom-domain target vs Squarespace ALIAS; never recreate Railway apex without updating ALIAS immediately.

## Railway reference

| Key | Value |
| --- | --- |
| Project ID | `13064cbe-e2d7-41cd-a028-fa957d0c9167` |
| Service ID | `c87eff12-aee2-4af2-8fd9-7f42b67c3ba3` |
| Environment ID | `8ab787f3-f5ee-4713-9845-bd17dd30ad08` |
| Project token | `e1875005-7e94-455a-98e4-ed6821da7495` |

## User workflow preferences

- Confirm before code edits unless Tucker says implement/deploy
- Deploy when Tucker says **yes**
- Creator credit: Tucker Max — NOT Tucker Casey

---

*Handoff For AI Tucker Team — updated by Grok 2026-06-22. HEAD `11e31ac`.*