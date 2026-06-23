# Session Handoff — 2026-06-23 (Grok → Tucker + AI Team)

**Read this first after reboot.** Full memory refresh for the PDX Pride Guide work session.

---

## Quick start prompt (paste into any agent)

> Read `SESSION_HANDOFF_2026-06-23.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Site: prideguidepdx.com. Standing constraint: Tucker likes the site as-is — only make requested changes. Do NOT touch `client/src/pages/Events.tsx` or filter bar / day-pill styling in `client/src/index.css` (handled separately). Local path: `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide`.

---

## Project

| Field | Value |
|-------|-------|
| **Site** | https://prideguidepdx.com / https://www.prideguidepdx.com |
| **Repo** | `maxmackpdx-pride/pdx-pride-guide` |
| **Branch** | `master` |
| **Local path** | `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide` |
| **Stack** | React + TypeScript + Vite (`client/src`), Express + SQLite (`server/`) |
| **Owner** | Tucker Casey — `hello.tuckercasey@gmail.com`, display `tucker_pdmax` |
| **AI team** | Grok (deploy/shell), Claude Cowork (commits), Codex paused |

---

## Standing constraints (Tucker)

1. **Site is good as-is** — no redesigns, no drive-by improvements.
2. **Do NOT touch:**
   - `client/src/pages/Events.tsx`
   - Filter bar / day-pill / `.filter-tag` sections in `client/src/index.css` (Events work handled separately — merge conflicts)
3. **Brand:** black base, neon accents (#CCFF00 primary, #00FFFF cyan/water, #FF00CC pink sparingly, #FF6600 Sunday), massive condensed ALL-CAPS type, RGB rainbow divider strips, 90s punk-zine × rave Pride aesthetic.
4. **Ask rather than guess** on data models, auth, admin permissions.

---

## GitHub HEAD (end of session)

```
b6d198a style: thin black outline and sharp right drop shadow on all h1
5217617 build: update production bundle with placeholders, submit, host, promoter
f3ff4a9 feat: promoter claim verification flow with admin approval queue
e4f9919 feat: show latest host messages on event detail page
d41ccb7 feat: polish event submit form with neon focus and step indicator
8d6279a feat: add branded event placeholder images for missing posters
```

**Live CSS bundle (verified):** `index-Dk4jzjl3.css` — includes h1 outline/shadow + all session work.

---

## Completed this session

### 1. Four branded placeholder images (`8d6279a`)

- **Assets:** `client/public/placeholders/event-placeholder-{1-4}.svg`
- **Aesthetic:** 90s punk-zine + Pride + EDC/raver neon (black base, yellow-green/cyan/pink/orange)
- **Wiring:** `shared/eventPoster.ts` → `resolveEventPosterUrl(eventId, posterImageUrl)` in `publicEvent()` API — round-robin by event id. **No Events.tsx changes needed** — API always returns a poster URL.

### 2. Submit form polish (`d41ccb7`)

- **File:** `client/src/pages/Submit.tsx` + `.submit-form__*` CSS in `index.css`
- Neon border glow on focus (yellow/cyan/magenta/orange tokens)
- Form max ~760px centered
- Step indicator: `Your Info → Event Details → Review` (scroll-spy)
- House Party → `filter-tag` pill toggle

### 3. Latest message from host (`e4f9919`)

- **Schema:** `host_messages` table
- **API:** `GET /api/events/:id/host-messages` (max 2), `POST` (claimed host only)
- **UI:** Pinned section in `EventModal.tsx` with empty state
- **Post from:** Dashboard claimed-event edit panel

### 4. Promoter claim + approval (`f3ff4a9` + routes in `8d6279a`)

- **Users:** `promoter_status` — `none | pending | approved | rejected`
- **Claim submit** → sets `pending` + creates CLAIM submission
- **New event submit** → blocked until `approved` (admins bypass via `isMainAdminUser`)
- **Admin:** new **PROMOTERS** tab — approve/deny queue
- **Claim approval** (submissions queue) also grants `approved` promoter status

### 5. H1 typography (`b6d198a`)

- All `h1` / `h1.display`: **1px black stroke** + **hard 5px/5px black shadow** (zero blur)
- Home + Gifting heroes keep neon glow layered underneath
- Tucker asked to preview — opened live site tabs; deploy confirmed live

---

## NOT done / open

| Item | Notes |
|------|-------|
| **Claude Design motifs** | Prompt pack written for map lettering + LED video loops — **not generated yet** (see below) |
| **Events.tsx / filter CSS** | Intentionally untouched — separate work stream |
| **Browser UAT** | Tucker should spot-check placeholders, submit form, host messages, promoter flow, h1 styling |
| **Codex** | Paused (out of credits) |
| **tsc hang** | `npm run check` hung ~3min; `npm run build` passes cleanly |

---

## Infrastructure (still valid)

| Item | Status |
|------|--------|
| Railway volume `/data` | Live |
| `DATABASE_PATH=/data/data.db` | Set |
| `UPLOADS_DIR=/data/uploads` | Set |
| `ADMIN_PASSWORD` | Railway env |
| Build | `npm install --include=dev && npm run build` |
| Agent async bus | `AGENT_TUNNEL.jsonl` + `scripts/agent-tunnel.sh` |

---

## Key files touched this session

```
shared/eventPoster.ts
shared/schema.ts          (host_messages, users.promoter_status)
server/storage.ts
server/routes.ts
client/public/placeholders/
client/src/pages/Submit.tsx
client/src/pages/Admin.tsx
client/src/pages/Dashboard.tsx
client/src/components/EventModal.tsx
client/src/context/AuthContext.tsx
client/src/index.css      (submit-form + h1 — NOT filter/day-pill blocks)
dist/                     (committed with builds)
```

---

## Claude Design prompt pack (for map lettering + LED loops)

**Purpose:** Generate map lettering PNGs + seamless 6s glowing LED video loop motifs for `client/public/motifs/`. **For Claude Design, not Grok Imagine.**

### Brand tokens

- Base: `#000` / `#050505`
- Primary: `#CCFF00` | Cyan: `#00FFFF` | Pink: `#FF00CC` | Orange: `#FF6600`
- RGB rainbow divider strips (hard bands, no blur)
- Condensed ALL-CAPS, 1px black stroke, 5px hard shadow down-right
- Aesthetic: punk zine × rave Pride × blacklight laser grid

### Assets to generate

1. **Map lettering PNG 16:9** — `"PDX PRIDE MAP"` + variants (`FRI`, `SAT`, `SUN`, `WILLAMETTE`, `SEX POSITIVE`)
2. **LED border loop MP4 16:9** — neon frame pulse, 6s seamless
3. **Laser grid loop MP4 16:9** — alternating row pulse, 6s seamless
4. **Sidebar stickers loop MP4 9:16** — glowstick/bolt/droplet stack pulse
5. **Pin ring loop MP4 1:1** — rotating neon ring segments

### One-shot prompt for Claude Design

```
Design assets for prideguidepdx.com — 90s punk zine × rave Pride aesthetic on pure black. Colors: #CCFF00 primary, #00FFFF water accent, #FF00CC sparingly, #FF6600 Sunday, RGB hard-edge rainbow divider strips. Massive condensed ALL-CAPS type with 1px black outline and sharp 5px black shadow down-right. Deliver: (1) "PDX PRIDE MAP" lettering PNG 16:9, (2) neon LED border frame loop 6s, (3) laser grid atmosphere loop 6s, (4) vertical glowstick/bolt/droplet sticker stack loop 9:16, (5) rotating neon pin ring loop 1:1. All video: seamless loop, camera locked, one simple pulse motion, no people, no stock Pride, no real geography. Photocopy grit, blacklight, laser grid, LED bloom.
```

### Suggested filenames

```
client/public/motifs/motif-map-lettering-pdx-pride-map.png
client/public/motifs/motif-led-border-loop.mp4
client/public/motifs/motif-laser-grid-loop.mp4
client/public/motifs/motif-sidebar-stickers-loop.mp4
client/public/motifs/motif-pin-ring-loop.mp4
```

---

## Conversation arc (for context)

1. Tucker gave 4-item spec (placeholders, form polish, host messages, promoter flow) → Grok implemented all, committed, pushed, returned SHAs.
2. Tucker asked h1 thin black outline + sharp right drop shadow → done in `b6d198a`, live on production.
3. Tucker asked to see h1 changes → Grok opened live site tabs; confirmed `index-Dk4jzjl3.css` deployed.
4. Tucker asked for Grok Design prompt for map lettering + LED loops → Grok wrote prompt pack.
5. Tucker corrected: **prompts are for Claude Design, not Grok** → Grok reformatted for Claude Design.
6. Tucker rebooting → **this file**.

---

## Transcript location

Full unsummarized transcript:
`/Users/tuckercasey/.grok/sessions/%2FUsers%2Ftuckercasey/019eec74-0266-7510-be28-43ba7cb573c9/updates.jsonl`

---

## Next actions when back

1. Browser UAT on live site (placeholders, submit, host messages, promoters, h1)
2. Run Claude Design with prompt pack → drop assets in `client/public/motifs/` → wire into map/UI
3. If Events.tsx filter work merges, resolve any conflicts carefully (don't overwrite their branch's Events/filter CSS work)
4. Push handoff to GitHub: `git add SESSION_HANDOFF_2026-06-23.md && git commit && git push`