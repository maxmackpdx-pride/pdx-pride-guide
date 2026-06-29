# Handoff For AI Tucker Team — 2026-06-22 (from Grok)

**AI Tucker Team** = Grok + Codex + Claude (+ Tucker). Read this file first when joining the PDX Pride Guide project.

GitHub is the communication bus. There is no live API tunnel between agents (Cowork/Codex/Grok cannot share a session).

## Agent tunnel (async bus) — NEW 2026-06-23

Closest thing to a "direct line": **`AGENT_TUNNEL.jsonl`** + **`scripts/agent-tunnel.sh`**

| Command | Who runs it |
|---------|-------------|
| `./scripts/agent-tunnel.sh poll codex` | Codex — check inbox |
| `./scripts/agent-tunnel.sh poll grok` | Grok — check inbox |
| `./scripts/agent-tunnel.sh send codex grok "..."` | Anyone — sends message, auto-pushes `master` |
| `./scripts/agent-tunnel.sh status` | Last 5 messages |

**Codex start prompt:** `cd pdx-pride-guide && ./scripts/agent-tunnel.sh poll codex`

**Claude Cowork:** cannot poll live — push to tunnel via commit or ask Tucker to relay.

Long-form updates still go in handoff markdown files below.

## BRIDGE STATUS — update this block every time you post

> **⚠️ STALENESS RULE:** Any claim in handoff files or tunnel older than **15 minutes** must be **re-verified** before you act on it (fresh `git pull`, live site fetch, `curl /api/events`, Railway). Do not trust deploy hashes or HEAD SHAs from stale entries.

| Field | Value |
|-------|-------|
| **Bridge updated** | 2026-06-26 20:18 UTC · 13:18 PDT |
| **master HEAD** | `7f9ca4c` |
| **Last Grok post** | `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` update 11 — 2026-06-26 20:13 UTC |
| **Last Claude post** | update 9 — 2026-06-24 (**>15 min — verify before citing**) |
| **Last tunnel** | `2026-06-26T20:13:26Z-grok-17167` grok → claude |
| **Next reply owed by** | **Claude** (update 12 in reply channel) |

**When you post:** refresh this block + the same block at top of `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md`.

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
> Read `SESSION_HANDOFF_2026-06-23.md` (latest session), then `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` and `SOFT_LAUNCH_UAT_REPORT_CODEX.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Reply in `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` or via commits.

---

## Saved data persistence — REQUIRED READING (2026-06-24)

**Problem we fixed:** Profiles, event edits, inbox mail, gig posts, and uploaded images kept resetting because Railway redeploys wiped the container filesystem. All user-saved data must live on the `/data` volume.

### Production env (already set — do not change casually)

| Variable | Value | What it protects |
|----------|-------|------------------|
| `DATABASE_PATH` | `/data/data.db` | All SQLite rows (see table below) |
| `UPLOADS_DIR` | `/data/uploads` | Avatar photos, event posters, gifting photos |
| Volume mount | `/data` | Single persistent disk |

**Grok owns Railway env/volume changes.** Claude/Codex cannot reach Railway API — ask Grok via handoff or tunnel.

### What each agent MUST do before shipping any feature that saves data

1. **Store text/JSON in SQLite** via `server/storage.ts` — never write user data to files, `localStorage`, or `sessionStorage` (auth is cookie + server session only).
2. **Store uploaded images** via existing upload routes → `UPLOADS_DIR`. Never save uploads to `client/public/`, repo paths, or hardcoded `./uploads/`.
3. **Read paths from env** — use `DATABASE_PATH` / `UPLOADS_DIR` (already wired in `storage.ts` + `routes.ts`). Do not hardcode `data.db` or `uploads/` in new server code.
4. **Never widen `seedData()` deletes** — reseed may only remove unclaimed `admin_seeded` events. Do **not** add `DELETE FROM` on `users`, `messages`, `submissions`, `gig_posts`, `gifting_*`, `host_messages`, or claimed/user-submitted events.
5. **After frontend changes:** `npm run build` + commit `dist/` if you want GitHub tree to match Nixpacks output.
6. **Verify persistence** before marking done — see checklist below.

### Event & social data — especially important

Event-related content promoters/hosts save includes links and live updates. All of this is in SQLite unless noted.

| What users save | Where it lives | API / upload |
|-----------------|----------------|--------------|
| **Ticket / social / external links** | `events.ticket_url`, `submissions.ticket_url` | Submit form, Dashboard edit, Admin edit |
| **Claim proof (website, IG, etc.)** | `submissions.claim_reason` | Submit CLAIM flow — free text + URLs |
| **Host broadcast messages** (event “social feed”) | `host_messages` table | `POST /api/events/:id/host-messages` — pinned on event detail modal |
| **Event poster / flyer image** | `events.poster_image_url` → file in `UPLOADS_DIR` | `POST /api/upload/poster` — path stored as `/uploads/...` |
| **New event submissions** | `submissions` (pending until admin approves) | `POST /api/submit` |
| **Approved events on the board** | `events` (`source: user_submitted` or claimed `admin_seeded`) | Admin approve → `events` row |
| **Claimed event edits** | `events` (owner via Dashboard) | `PUT /api/events/:id/edit` |
| **Check-in bubbles** | `attendances` | `POST /api/events/:id/attendance` |
| **Inbox threads about events** | `messages` (`context_type: EVENT_HOST`, etc.) | Inbox reply routes |

**If adding new event social fields** (Instagram handle, Facebook event URL, Threads link, etc.):
- Add a column to `events` / `submissions` in `shared/schema.ts` + migration in `storage.ts` startup `ALTER TABLE` block.
- Save via existing `updateEvent` / `createSubmission` paths — still lands in `/data/data.db`.
- Do **not** store in component state only or browser storage.
- If it's an image, use `/api/upload/poster` (or add a new upload route that writes to `UPLOADS_DIR`, not the repo).

**Static seed posters** (`/posters/*.jpg` in `client/public/`) are bundled with the app — fine for admin-seeded events only. User-uploaded flyers must use `/uploads/...` on the volume.

### Full persistence surface map

Canonical list: `server/persistence.ts` → `PERSISTENCE_SURFACES`. Covers profile, inbox, event submit/approve, event board, gigs, gifting, check-ins, missed connections, promoter flow, moderation, feedback, login sessions.

Admin audit endpoint (after deploy): `GET /api/admin/persistence` — row counts + config OK/errors.

### Who does what

| Role | Action |
|------|--------|
| **Grok** | Keep `DATABASE_PATH`, `UPLOADS_DIR`, volume mounted; deploy; run persistence audit after deploy |
| **Claude** | Any new save path → SQLite or `UPLOADS_DIR`; document new tables in handoff; never touch Railway |
| **Codex** | UAT: save → redeploy or wait → confirm data still there (profile, event edit, host message, gig, inbox) |
| **Tucker** | One-time Google login after volume went live; browser UAT on Dashboard + event claim + host message |

### Persistence UAT checklist (Codex / Tucker)

After any deploy touching `server/` or uploads:

- [ ] Log in with Google — session survives redeploy (sessions now in `express_sessions` table on `/data`)
- [ ] Profile: upload avatar + ring → refresh → still there after deploy
- [ ] Event: edit `ticketUrl` on claimed event in Dashboard → still on event card/modal after deploy
- [ ] Event social: post a **host message** on event detail → still pinned after deploy
- [ ] Event image: upload poster on submit/edit → `/uploads/...` URL loads after deploy
- [ ] Submit/claim: pending submission visible in Admin → approve → event on board persists
- [ ] Gig board: post → still on `/api/gigs` after deploy
- [ ] Inbox: send/receive message → thread still in inbox after deploy
- [ ] Admin: `GET /api/admin/persistence` → `ok: true`, paths on `/data`

### Commits

| Commit | What |
|--------|------|
| `d19fa0c` | Persistence audit, SQLite session store, production guard, safe reseed, `/api/admin/persistence` |

---

## Latest session — 2026-06-26 (Grok) — Update 11

**HEAD:** (this commit) · **Site:** https://www.prideguidepdx.com · **API:** 44 events OK

**Full memory refresh:** `SESSION_HANDOFF_2026-06-23.md` + **Saved data persistence** section above (read first).

### Grok shipped — map, events UX, host notifications, design polish (Update 11)

| Area | What |
|------|------|
| **Map personal nav** | `YOU` geolocation button on home + events maps; cyan user dot; `MapFlyTo` centers on position |
| **Home map → events** | `View all N events` link overlay on home map preview |
| **RSVP pulse pins** | Pins glow/pulse when logged-in user has active check-in at venue (`/api/events/mine/check-ins`) |
| **Host update notifications** | `notifyAttendeesOfHostUpdate()` — inbox messages (`contextType: HOST_UPDATE`) to all active RSVPs when host posts |
| **Flag data error** | Event modal → `FLAG` moderation request; admin appends to `adminNotes` on approve |
| **Transfer host** | Event modal (current host only) → `POST /api/events/:id/transfer` → `TRANSFER` moderation; admin sets `claimedBy` on approve |
| **Events count banner** | Replaced large heading with compact `.events-count-banner` |
| **Home panel gradients** | Dark left → transparent right on `.home-promo-panel::after` |
| **Hero gradients** | Dark bottom → transparent top on gifting/gigs/about/inbox/missed/pride-work heroes |
| **Typography** | `.display` tightened: weight 800, condensed stretch, `letter-spacing: 0.04em` |
| **Section dividers** | `.section-slice-divider` + `.section-fade-divider` on home before promo stack |
| **Admin moderation** | FLAG / TRANSFER labels + approve copy in `ModerationCard` |
| **Dashboard** | Host update toast shows attendee inbox notification count |

**Codex UAT after deploy:**
- [ ] Map `YOU` button on iOS (geolocation permission)
- [ ] RSVP pulse only when logged in with check-ins
- [ ] Host posts update → attendee sees inbox thread (`HOST UPDATE`)
- [ ] Flag + transfer requests appear in Admin → moderation tab
- [ ] Home map link → `/events`; events count is small banner not hero heading

### Grok shipped since Claude credits ran out (do not redo)

| Commit | What |
|--------|------|
| `5eccc28` | Gifting + Gigs board pages aligned to Claude Design ref (`.board-page` system, Anton/DM Mono, compact cards) |
| `34206f6` | UX audit P0/P1: API error + retry UI (Home, Events, Gifting, Inbox, Missed Connections); gifting rules checkbox enforced; filtered empty states; on-brand 404; inbox mobile back-button; design polish (`::selection`, board film grain, `flickr` hero text, live badge blink) |
| `2c40987` | Contrast pass (`--text-muted/meta/faint` tokens); dashboard section fetch errors + retry banner |
| `84fdb08` | Live Portland weather (Open-Meteo); admin tab load errors + retry; submit claim unclaimed-events error |
| `bb111dc` | Parallax on all hero panels |

**Design ref decoded locally:** `.design-ref/` (gifting, ill-be-there, profile-dashboard, motion-guide) — same content as Claude's uploaded HTML in local-agent-mode-sessions.

### Safe for Claude to pick up next

1. **Hero / social image replacements** — Tucker asked for 5 site hero/social images. Home hero is **done** (`home-hero-desktop.jpg` + `home-hero-mobile.jpg`). Other heroes already wired: `/gift-with-pride-hero.jpg`, `/motifs/hero-*.jpg|png`. Needs **new image assets** from Tucker before swap — do not replace without files.
2. **Remaining contrast** — Grok bumped worst offenders site-wide; Admin panel inline `#666`/`#444` and any new UI should use `var(--text-meta)` / `var(--text-faint)`.
3. **Claude Design motifs** — motion-guide animations (marquee, aurora) are reference-only unless Tucker scopes a page.

### Do NOT touch (unless Tucker assigns)

- `Events.tsx` filter/day-pill CSS internals
- `AttendanceCluster.tsx` RSVP / message-drawer / badge-pulse (your recent work — live)
- Railway env/volume (Grok lane)
- Home hero wallpaper (Grok done)

### Claude — IGNORE old pending command (credits ran out)

**Do not run or resume whatever task was queued when your credits ran out.** Superseded by Grok UX audit above.

**When you start:** `./scripts/agent-tunnel.sh poll claude` then reply in `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md`.

---

## Latest session — 2026-06-24 (Grok) [archive]

**Done:** Full persistence audit; SQLite sessions; production `/data` guard; safe `seedData()`; event social/host-message paths documented. **Home hero wallpaper** updated to Tucker collage (`home-hero-desktop.jpg` + `home-hero-mobile.jpg`).

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
| **DB persistence** | **FIXED** — volume `/data`, `DATABASE_PATH=/data/data.db` |
| **Uploads persistence** | **FIXED** — `UPLOADS_DIR=/data/uploads` |
| **Session persistence** | **FIXED** `d19fa0c` — login sessions in SQLite on `/data` (was memory-only) |
| **Persistence audit** | **LIVE** `d19fa0c` — `server/persistence.ts`, `GET /api/admin/persistence` |
| **Event social data** | **DOCUMENTED** — `ticketUrl`, `claimReason`, `host_messages`, poster uploads → see persistence section |
| **Claude audit batch** | **DEPLOYED** `d868561` — gigs, gifting, filters, inbox, security |

## Project paths

| Item | Value |
|------|-------|
| Canonical repo | `/Users/tuckercasey/pdx-pride-guide` (Codex local workspace retired — git history unchanged) |
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

*Handoff For AI Tucker Team — updated by Grok 2026-06-26 (Update 11). Read **Saved data persistence** before any feature that saves user content.*