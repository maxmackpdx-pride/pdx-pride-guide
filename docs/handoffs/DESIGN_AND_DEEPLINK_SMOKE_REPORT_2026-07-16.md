# Design standards + deep-link smoke inventory

**Date:** 2026-07-16  
**Scope:** Read-only map of design source-of-truth + site-wide deep links (ads & events prioritized), for later mass-change smoke tests.  
**Method:** Direct repo inspection after explore agents timed out. No code changes in this pass.  
**Status:** Inventory complete enough to drive smoke matrices; not a full Playwright suite.

---

## 1. Design system source of truth

### Chain (do not fork)

```
shared/prideWeek.ts                 day codes, dates, day colors, RSVP hex
        ↓
client/src/index.css                global / legacy CSS vars
client/src/components/ds/tokens/*   modular production tokens
        ↓  npm run sync:design-system
design-system/tokens/tokens.css     portable single-file kit
design-system/previews/*.html       HTML samples for design tools
```

**Docs**

| Doc | Role |
|-----|------|
| `docs/DESIGN_SYSTEM_INTEGRATION.md` | Integration rules, shipped DS surfaces, token map |
| `docs/BOARD_CARD_STANDARD.md` | Board cards, feed glow vs plain posts, rainbow seam, `?post=` overlay |
| `docs/featured-event-card.md` | Featured event ad rotation / expiry |
| `design-system/README.md` | Portable kit entry |
| `design-system/EVENTS_GUIDE.md` | Events layout guidance |
| `design-system/AVATARS_GUIDE.md` | Avatar rules |

**Before any push that touches colors, Pride week, or global CSS:**

```bash
npm run sync:design-system
git add design-system/
```

### Token modules (`client/src/components/ds/tokens/`)

| File | Contents |
|------|----------|
| `fonts.css` | Barlow Condensed + Inter |
| `colors.css` | Surfaces, neons, day colors, gradients, semantic tags |
| `typography.css` | Display / chrome / body / meta |
| `layout.css` | 4px space scale, radii, z-index, widths |
| `effects.css` | Shadows, glows, motion, calm / reduced-motion kill switches |
| `base.css` | Reset, focus ring, **rainbow rule**, card `::before` seams |
| `index.css` | Imports all of the above |

Live sandbox: `/design-preview` (`DesignSystemSandbox.tsx`).

### Locked visual rules (smoke these after mass CSS/token changes)

1. **Rainbow top seam on every clickable card** — Events grid/list, schedule cells, boards (gigs/gifts/MC), glowing hub-feed board cards only (`.fitem--glow`), featured event ad, PlaceCard / PlaceModal, EventModal bar.  
   - Animated (`pdxSeamFlow` / glow / glint) unless **calm** or `prefers-reduced-motion` → static bar.  
   - Reference: PlaceCard `.pdxPlace__seam.pdx-rainbow-rule` or root `::before` list in `base.css`.  
   - **Do not** invent one-off stripes or solid day-color caps.

2. **Feed posts vs glowing cards**  
   - **Plain feed rows:** RSVPs, check-ins, member text/photo — no glow, no overlay.  
   - **Glowing cards:** board posts (gig purple / gift lime / MC magenta) + featured event ad — border + glow + tap-to-open.

3. **Board triad** — board page + feed card + feed overlay must share **one** card component.  
   - Overlay: accent border + outer glow, portal to `body`, close restores scroll.  
   - Feed deep-link shape: `link: /<board>?post=${id}` + `boardPostId` (`shared/hubFeed.ts` / `getHubFeed()`).

4. **Board accents**

| Board | Signature |
|-------|-----------|
| Missed Connections | magenta `#ff1fa0` |
| Gifting | lime `#ccff00` |
| Pride Werk | purple `#b06bff` |

5. **Featured event ad** — top of hub feed; day-color glow; slideshow; countdown; Buy tickets + RSVP → EventModal. Config/rotation in `HubFeed.tsx` (`FEATURED`, localStorage `hub-featured-rotation`). See `docs/featured-event-card.md`.

6. **Day colors** — always from `shared/prideWeek.ts` / day tokens, not hard-coded one-offs.

---

## 2. App routes (wouter)

From `client/src/App.tsx`:

| Path | Page / notes |
|------|----------------|
| `/` | Home |
| `/events`, `/events/:id/:slug?` | Events board + deep-linked event modal |
| `/schedule` | Schedule |
| `/submit`, `/submit/claim/:eventId` | Submit / claim (also legacy query rewrite in `main.tsx`) |
| `/pride-work` | Gigs board |
| `/gifting` | Gifting board |
| `/spotted` | Missed Connections (`/missed-connections` → redirect) |
| `/directory`, `/directory/:id/:slug?` | Places |
| `/nude-beaches` | Nude beaches + River Brats shell |
| `/u/:username` | Member profile |
| `/dashboard` | Promoter / member hub |
| `/inbox` | Standalone inbox route |
| `/admin` | Admin (owner tools include Ad Manager) |
| `/settings/notifications` | Notification prefs (bookmark / deep link) |
| `/about`, `/resume`, `/contact`, `/sponsors`, `/access`, `/legal` | Static-ish marketing |
| `/design-preview` | DS sandbox |

---

## 3. Deep-link catalog (query + path)

### 3A. Events (priority)

| Pattern | Behavior | Code |
|---------|----------|------|
| `/events/:id/:slug?` | Opens EventModal for that id | `Events.tsx` + `shared/eventSlug.ts` `eventPath` |
| `/events/:id/:slug?day=SAT` (etc.) | Multi-day disambiguation; API `GET /api/events/:id?day=` | `routeDay` in Events |
| `/events?q=…` | Search query sync | Events |
| `/events?tab=schedule` | Schedule sub-tab | Events |
| `/events/:id/…?chat=1` | Auto-open event group chat once (strips param) | `AttendanceCluster.tsx` (embedded) |
| Admin “VIEW PUBLIC” → `/events?event=ID` | **Legacy / likely broken** — Events does **not** read `?event=`; canonical is path `/events/:id/...` | `Admin.tsx` links only |

**APIs (smoke health):**

- `GET /api/events`
- `GET /api/events/:id` (+ optional `?day=`)
- `GET /api/events/attendance-summaries`
- `GET /api/events/mine/*` (claimed, submitted, talent)
- OG: `/api/og/event/:id`

**Canonical share URL helper:** `eventUrl()` / `eventPath()` in `shared/eventSlug.ts`.

### 3B. Ads (priority)

| Surface | Behavior | Code |
|---------|----------|------|
| Events grid affiliate posters | `GET /api/ads/serve?surface=grid` → scatter among grid cards | `Events.tsx` + `server/adsRoutes.ts` |
| Hub / feed serve | `GET /api/ads/serve?surface=feed` (default surface `feed`) | `adsRoutes` + `serveAds` in `server/ads.ts` |
| Impression | `POST /api/ads/:id/impression` body `{ sessionId?, surface? }` | capped / freq |
| Click | `POST /api/ads/:id/click` same body | rollups on `ads` row |
| Audience | Derived from **session** (members vs guests); clients cannot spoof via query | `adsRoutes` comment |
| Featured event ad | **Not** Ad Manager — product feature in hub feed (`FeaturedEventAd`) | separate from `/api/ads` |

**Owner Ad Manager:** Admin UI (owner-only). Track rate limit: `app.use("/api/ads", adsTrackLimiter)` in `server/index.ts`.

**Serve formats:** `surface=grid|poster` → poster format; else feed format. Optional `tab` query for feed filtering.

### 3C. Boards

| Pattern | Behavior | Status |
|---------|----------|--------|
| `/pride-work?post=<id>` | Auto-expand gig on board | **Implemented** (`PrideWork.tsx`) |
| `/gifting?post=<id>` | Auto-expand gift listing | **Implemented** (`Gifting.tsx`) |
| `/spotted?post=<id>` | Documented feed fallback `link` | **Gap:** board page does not appear to handle `?post=` (feed overlay still works via `boardPostId`) |
| Hub feed glowing card tap | `BoardPostOverlay` / `SpottedDetailModal` in place | **Implemented** |

### 3D. Directory / places

| Pattern | Behavior |
|---------|----------|
| `/directory/:id/:slug?` | Place detail route |
| `/directory?place=<id>` | Open place by id |
| `/directory?q=<name>` | Search / name open |
| `/directory?add=1` | Open add form |

Helpers: `client/src/lib/avatarLinks.ts` (members → `/u/…`, venues → directory).

### 3E. Hub / dashboard

| Pattern | Behavior |
|---------|----------|
| `/dashboard?section=<hubSection>` | Hub section |
| `/dashboard?view=posts` | Posts focus (legacy sections map) |
| `/dashboard?edit=profile` | Profile edit mode |
| `/dashboard?editEvent=<id>` | Open event editor |
| `/dashboard?editGig=<id>` | Open gig editor |

### 3F. Inbox / notifications / beaches / submit

| Pattern | Behavior |
|---------|----------|
| `/inbox?thread=<id>` | Open thread |
| Inbox FAB / overlay | In-app sheet (smoke: `script/smoke-inbox-*.mjs`) |
| `/settings/notifications` | Prefs deep link |
| `/nude-beaches?tab=…` | Beach tab |
| River Brats `?chat=1` | Open chat shell (`RiverBratsShell.tsx`) |
| `/submit/claim/:eventId` | Claim flow |
| Legacy `/submit?mode=claim&eventId=` | Rewritten in `main.tsx` to path form |
| `/admin?tab=…` | Admin tab deep link |

### 3G. Profiles / marketing

| Pattern | Behavior |
|---------|----------|
| `/u/:username` | Public member profile |
| Marketing routes | No entity deep links beyond page load |

---

## 4. Smoke matrix (manual or future Playwright)

Use against **local** (`SMOKE_BASE_URL`) and **prod** after mass design/CSS or route changes.

### Design / chrome (visual)

| # | Check | Pass criteria |
|---|--------|---------------|
| D1 | Events grid PosterCard | Rainbow top seam; day glow; calm = static |
| D2 | Events list EventCard | Same seam rules |
| D3 | Schedule cells | Seam present |
| D4 | Gifting / Pride Work listing cards | Board accent + rainbow seam |
| D5 | Missed Connections cards | Magenta accent + seam |
| D6 | Hub feed: plain post vs glowing board card | Only board + featured glow |
| D7 | Feed overlay open/close | Full accent frame; scroll restored |
| D8 | PlaceCard (directory + home) | Explicit `.pdx-rainbow-rule` seam |
| D9 | Featured event ad | Day glow, slideshow, countdown, CTAs |
| D10 | Calm mode / reduced motion | Seams static; no excessive motion |
| D11 | After token edit | `npm run sync:design-system`; design-system committed |

### Events deep links

| # | URL / action | Pass |
|---|--------------|------|
| E1 | `/events/<known-id>/<slug>` | Modal opens, correct event |
| E2 | Multi-day event with `?day=FRI` vs `?day=SAT` | Correct occurrence |
| E3 | `/events?q=stank` | Search applied |
| E4 | `/events?tab=schedule` | Schedule view |
| E5 | Open event → `?chat=1` (member with attendance) | Chat panel opens once; param stripped |
| E6 | Share / OG | `eventPath` URL; `/api/og/event/:id` returns image |
| E7 | Admin VIEW PUBLIC | Prefer fix to path URL; until then expect **fail** on `?event=` |

### Ads deep links / serve

| # | Action | Pass |
|---|--------|------|
| A1 | Events board grid | `/api/ads/serve?surface=grid` 200; poster cards scatter or empty list OK |
| A2 | Logged-out vs logged-in serve | Guest vs member creatives respect audience (no spoof via `?audience=`) |
| A3 | Impression POST | 200 `{ ok }`; cap respected |
| A4 | Click POST | 200; click count rolls |
| A5 | Rate limit abuse | Track limiter engages under spam |
| A6 | Featured ad vs Ad Manager | Featured still product UI; not broken by ads DDL |

### Rest of site

| # | URL | Pass |
|---|-----|------|
| B1 | `/pride-work?post=<active-id>` | Card expands |
| B2 | `/gifting?post=<active-id>` | Card expands |
| B3 | `/spotted?post=<id>` | **Document gap** — currently may only land on board |
| B4 | `/directory?place=<id>` | Place modal/detail |
| B5 | `/dashboard?section=feed` (and posts/edit*) | Correct hub pane |
| B6 | `/inbox?thread=…` | Thread opens (auth) |
| B7 | `/u/<username>` | Profile loads |
| B8 | `/nude-beaches?tab=…` | Correct tab |
| B9 | `/submit/claim/<eventId>` | Claim form prefilled |
| B10 | `/admin?tab=…` | Tab selected (auth + role) |

---

## 5. Existing automation (reuse first)

| Script | Purpose |
|--------|---------|
| `script/smoke-auth.mjs` | Shared login / context helpers |
| `script/smoke-inbox-posts-deeplinks.mjs` | Inbox POSTS → edit event/gig deep paths |
| `script/smoke-inbox-sheet-provider.mjs` | Inbox sheet provider |
| `script/smoke-inbox-admin-queue.mjs` | Admin queue via inbox |
| `script/smoke-admin-ops.mjs` / `smoke-admin-phase4.mjs` | Admin ops |
| `script/smoke-people-hub.mjs` | People hub |
| `script/verify-events-page.mjs` | Events page verify |
| `script/verify-deploy-bundle.mjs` | Deploy bundle check (`npm run verify:deploy`) |
| `script/verify-shadowban.mjs` | Shadowban |

Typical:

```bash
# local app on 5050
SMOKE_BASE_URL=http://127.0.0.1:5050 node script/smoke-inbox-posts-deeplinks.mjs
npm run verify:deploy
npm run sync:design-system
```

**Not yet automated (candidates for later):**

- Full design seam matrix (D1–D11) — visual / Playwright screenshots  
- Ads serve + impression/click (A1–A6)  
- Events multi-day + `?chat=1` (E2, E5)  
- Board `?post=` (B1–B3)  
- Directory / hub / beaches (B4–B8)

---

## 6. Known gaps / watch items

1. **Admin public event links use `?event=`** while Events only honors `/events/:id/...` — fix or add alias before relying on those links in smoke.  
2. **MC `?post=`** documented in board standard / feed `link` field but board page may not auto-expand — feed overlay path is the reliable open.  
3. **Featured event ad ≠ Ad Manager ads** — test both after ads or hub feed changes.  
4. **Deploy desync** (ongoing ops rule): ship = GitHub `master` + Railway SUCCESS + local sync; multi-agent pushes are the usual gap.  
5. **Unrelated WIP (not this report):** message-reactions stash; Stripe Payment Link optional; tip/Venmo direct pay; Sauvie day-pass vs season copy — verify live separately if product work resumes.

---

## 7. Suggested order for a mass-change smoke day

1. `git status` / align local ↔ `origin/master` ↔ Railway SUCCESS.  
2. `npm run sync:design-system` if tokens/CSS touched; commit kit.  
3. `npm run build` + `npx tsc --noEmit`.  
4. Design chrome D1–D10 on home, events, boards, directory, hub feed.  
5. Events E1–E6 (and E7 if admin links fixed).  
6. Ads A1–A6 (grid + feed + tracking).  
7. Boards/hub/inbox B1–B10 + existing Playwright smokes.  
8. Spot-check OG share card and calm mode.

---

## 8. Key file index

| Area | Paths |
|------|--------|
| Tokens | `client/src/components/ds/tokens/*`, `shared/prideWeek.ts` |
| Card standard | `docs/BOARD_CARD_STANDARD.md`, `base.css`, `effects.css` |
| Board pages | `PrideWork.tsx`, `Gifting.tsx`, `MissedConnections.tsx` |
| Feed | `HubFeed.tsx`, `HubFeedCard.tsx`, `FeaturedEventAd.tsx`, `BoardPostOverlay.tsx` |
| Events | `Events.tsx`, `EventModal.tsx`, `AttendanceCluster.tsx`, `shared/eventSlug.ts` |
| Ads | `server/ads.ts`, `server/adsRoutes.ts`, Events grid serve |
| Routes | `client/src/App.tsx`, `main.tsx` (claim rewrite) |
| Hub URL state | `Dashboard.tsx`, `Nav.tsx` |
| Portable kit | `design-system/` |

---

*End of inventory. Agents were not required for this snapshot; expand Playwright coverage when mass redesigns land.*
