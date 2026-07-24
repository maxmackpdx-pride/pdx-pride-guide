# Zaylist — Design Standard Migration Brief (for Grok)

## Your job
Zaylist app (`maxmackpdx-pride/pdx-pride-guide`) currently ships a **"lite glass" design standard** — translucent panels, soft shadows, neon kept only on borders/CTAs. We have moved to a **new "deep-glass / OLED-neon" standard**. Your task is to **rewrite the global design standards and every surface's styling** to match the new standard, starting with **cards and maps**, which change the most.

This brief is organized so that **every section names (a) what it was, (b) what it is now, and (c) which NEW universal token it points back to.** Do not invent per-component values — everything resolves to the universal tokens in §1. A reference screenshot is named for each section (see `/screenshots`), and a fully-built reference implementation is included as `Card System.html` (open it in a browser — it is the source of truth for pixel values).

Work token-first: author §1 as real CSS custom properties + one shared `.glass` / `.glass-btn` / `.map-surface` recipe, then point every component at them. When you finish, produce updated `tokens/*.css`, a new `glass.ts`/`glass.css`, and a new `mapTheme.ts`, plus per-component diffs.

---

## 0. What changed at a glance (old → new)

| Aspect | OLD ("lite glass") | NEW ("deep glass / OLED neon") |
|---|---|---|
| Card fill | translucent `--pdx-glass-fill: #0c0c12 @76%` | **OLED near-black radial** — `#000` center fading to a 6% accent tint at the rim |
| Card edge | 1px `rgba(255,255,255,.10)` | **2px solid `#000` ring** + 1px `color-mix(accent 55%, #101014)` border |
| Accent glow | none on rest (hover/pulse only) | **always-on double neon bloom** keyed to the card's accent color |
| Corner light | flat top specular gradient | **133° diagonal white sheen** in the top-left corner + bottom-right radial specular |
| Top seam | elaborate flowing rainbow (`pdxSeamFlow`+glint+glow) | **thin 2px edge-masked prismatic refraction bar** (`dirRefract`) |
| Poster/image well | plain | **radial accent well** with `border-bottom: 4px solid accent` + scanline overlay |
| Buttons | solid fill + `--brutal-shadow` magenta offset | **glassy fill** — top-light sheen, white top-edge, inner bottom shade, colored bloom |
| Maps | `#101018→#06060a` radial, cyan pins, animated seam | **OLED `#06060A` surface, 2px black outline, tight per-day neon pin bloom, reduced inward hole-rim vignette**, prismatic seam |
| Depth model | soft `0 8px 24px` drop | **hard black ring + long soft drop + inset vignette** ("debossed" edge) |

The vibe shifted from *frosted translucent* to *black glass slab with neon trapped inside it.*

---

## 1. NEW UNIVERSAL TOKENS (author these first)

These are the canonical values. Every surface points back here. `--c` (or `--dc`) is the per-instance **accent color** (day color, category color, board color). Copy these exactly — they are lifted from the reference build.

### 1.1 `--glass-card` (the master card recipe)
```
position: relative;
border-radius: 14px;
overflow: visible;
--c: <accent>;
background:
  radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--c) 6%, #050408) 100%),
  radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--c) 18%, transparent), transparent 56%);
border: 1px solid color-mix(in srgb, var(--c) 55%, #101014);
box-shadow:
  0 0 0 2px #000,                                                   /* hard black ring */
  0 34px 66px -24px rgba(0,0,0,.95),                                /* long soft drop */
  0 0 26px -8px color-mix(in srgb, var(--c) 78%, transparent),      /* outer neon bloom */
  0 0 13px -5px color-mix(in srgb, var(--c) 78%, transparent),      /* tight neon bloom */
  inset 0 1px 0 color-mix(in srgb, var(--c) 55%, rgba(255,255,255,.12)),  /* top edge light */
  inset 0 0 34px -26px color-mix(in srgb, var(--c) 40%, transparent);     /* inner accent haze */
backdrop-filter: blur(12px);
animation: dirCardIn .5s ease both;
```

### 1.2 `--glass-sheen` (corner light overlay — an absolute child, `pointer-events:none; z-index:2`)
```
/* top-left diagonal sheen */
background: linear-gradient(133deg, rgba(255,255,255,.15), rgba(255,255,255,.03) 12%, transparent 34%);
/* optional second layer: bottom-right specular */
background: radial-gradient(70% 55% at 108% 112%, rgba(255,255,255,.1), color-mix(in srgb, var(--c) 12%, transparent) 40%, transparent 70%);
```
For **neutral (no-accent) cards** use `0 0 26px -12px rgba(255,255,255,.15)` as the bloom instead of the accent version.

### 1.3 `--refract-seam` (prismatic refraction bar — replaces the old rainbow seam)
```
position:absolute; top:0; left:6-8px; right:6-8px; height:2px; z-index:5;
background: linear-gradient(90deg,#ff2d5e,#ff9500,#ffee00,#39ff14,#00ffff,#3a6bff,#8800ff,#ff00cc,#ff2d5e);
background-size:200% 100%;
opacity:.7; filter:blur(.2px);
animation: dirRefract 7s linear infinite;
-webkit-mask: linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
        mask: linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);

@keyframes dirRefract { from { background-position:200% 0; } to { background-position:0 0; } }
@keyframes dirCardIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
```
Calm mode: `animation:none`.

### 1.4 `--poster-well` (any image/logo well at the top of a card)
```
position:relative; border-radius:13px 13px 0 0; overflow:hidden;
background: radial-gradient(130% 130% at 50% 14%, color-mix(in srgb, var(--c) 32%, #050506), #050506 72%);
border-bottom: 4px solid var(--c);
/* scanline overlay child: */
background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.16) 3px 4px); opacity:.35;
```

### 1.5 `--glass-btn` (primary, solid-accent glass button)
```
color:#050506;
background: linear-gradient(150deg, rgba(255,255,255,.55), rgba(255,255,255,0) 42%), var(--c);
border: 1px solid rgba(255,255,255,.35);
box-shadow:
  0 0 22px -6px var(--c),
  inset 0 1px 0 rgba(255,255,255,.7),
  inset 0 -6px 12px -6px rgba(0,0,0,.35);
```
**Outlined/secondary glass button** (keeps accent text, transparent-ish fill):
```
border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
color: var(--c);
background: linear-gradient(150deg, color-mix(in srgb, var(--c) 16%, transparent), color-mix(in srgb, var(--c) 2%, transparent) 46%), rgba(255,255,255,.015);
box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -6px 12px -8px rgba(0,0,0,.5), 0 0 18px -12px var(--c);
```
This **replaces the old `--brutal-shadow` magenta offset** on CTAs. (The hard offset can survive only on deliberately "sticker" elements like "Claim this event" — everything interactive becomes glass.)

### 1.6 `--map-surface` (the map frame)
```
/* frame */
position:relative; border-radius:16px; overflow:hidden; background:#06060A;
border:1px solid #000;
box-shadow: 0 0 0 1px #000, inset 0 3px 7px -1px rgba(0,0,0,.95), inset 0 1px 2px rgba(0,0,0,.9), inset 0 -1px 0 rgba(255,255,255,.05);
/* grid plate (inner) */
background:
  repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
  repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
  radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%);
/* hole-rim vignette (inner overlay, REDUCED from old) */
box-shadow: inset 0 0 12px 1px rgba(0,0,0,.38), inset 0 0 40px 6px rgba(0,0,0,.32);
background: radial-gradient(130% 130% at 50% 50%, transparent 55%, rgba(0,0,0,.14) 78%, rgba(0,0,0,.32) 100%);
```
Pins: `18px` dot, `background:#000`, `border:3px solid var(--dayColor)`, `box-shadow:0 0 12px 1px var(--dayColor)` (tight bloom). Multi-day pin = conic rainbow, white bloom. Legend/expand chips keep the lime 2px outline + `0 0 14–18px -4px` lime glow.

### 1.7 Palette (unchanged — reuse the repo neons)
`--neon-magenta #FF00CC · --neon-cyan #00FFFF (bright #19E3FF) · --neon-yellow/lime #CCFF00 · --neon-green #39FF14 · --neon-orange #FF6600 · --neon-violet #8800FF/#6E3DFF · --neon-blue #1A4DFF`. Day map: MON #8800FF, TUE #0044FF, WED #FFEE00, THU #00FFFF, FRI #FF00CC, SAT #39FF14, SUN #FF6600. Fonts and type scale are **unchanged** (display = the existing condensed black; body + mono unchanged).

---

## 2. SECTION-BY-SECTION MIGRATION

Each entry: **source component → what it was → what it is now → tokens.** Screenshot in `/screenshots`.

### 2.1 Event cards — `ds/EventCard.tsx`  ·  `01-event-cards.png`
- **Was:** `.pdxBoard` translucent card, day-glow on hover only, poster in a plain well, solid CTA + brutal magenta offset.
- **Now:** `--glass-card` with `--c = day color`; `--glass-sheen` (both layers); `--refract-seam` at top; poster sits in `--poster-well` (radial + `border-bottom:4px day` + scanline); the CTA is a `--glass-btn`. Tag pills unchanged. "Claim this event" may keep the hard offset as an intentional sticker.
- **Tokens:** 1.1, 1.2, 1.3, 1.4, 1.5.

### 2.2 Open event (detail modal) — `EventModal.tsx`  ·  `02-open-event.png`
- **Was:** translucent overlay panel.
- **Now:** `--glass-card` (day accent), `--refract-seam`, poster header uses `--poster-well`. Big **Tickets** button + host action buttons (Edit / Add to Calendar / Message) are all `--glass-btn` (primary = day color; secondary = outlined glass). "3 Going" pill and RSVP pills get the outlined-glass treatment.
- **Tokens:** 1.1–1.5.

### 2.3 Directory cards — `ds/PlaceCard.tsx`  ·  `03-directory-cards.png`
- **Was:** translucent listing card, category color on a thin border only.
- **Now:** `--glass-card` with `--c = category color`; logo sits in `--poster-well`; category chip + open-in-maps link keep accent; card carries the accent bloom at rest. Nonprofit = conic-rainbow swatch (unchanged rule).
- **Tokens:** 1.1, 1.2, 1.4.

### 2.4 Board cards + open board — `EventBoardCard.tsx`, `board/BoardPostOverlay.tsx`  ·  `04-board-cards.png`
- **Was:** `.board-listing-card` / `.spotted-card` translucent, magenta idle pulse on spotted.
- **Now:** `--glass-card` keyed to board color (Missed Connections #FF00CC, Gifting #CCFF00, Gigs #6E3DFF); **stronger glass sheen**; each board type carries a faint backdrop **motif** (quote-marks for Missed Connections, gift-box for Gifting "give", magnifier for Gifting "ISO", `$` for Gigs "offering", binoculars for Gigs "looking"). Open-board overlay = same card recipe, magenta accent.
- **Tokens:** 1.1, 1.2. Motifs are per-type decorative SVGs at ~4–12% accent opacity.

### 2.5 Map surfaces — `ds/MapPanel.tsx`, `DirectoryMap.tsx`, `EventsMap.tsx`  ·  `05-map-surfaces.png`, `06-directory-map.png`
- **Was:** `.pdxMap` `#101018→#06060a` radial, 3px animated flowing seam, cyan pins, no outline.
- **Now:** `--map-surface` — OLED `#06060A`, **2px black outline** + inset top-shadow (debossed), grid plate, **reduced** inward hole-rim vignette (≈60% lighter than a full vignette), diagonal light-shaft kept. Pins = per-day color, black core, tight 12px bloom. The map island in the directory uses the same recipe with a **neutral grey** glow instead of cyan. Legend + Expand chips keep lime outline + glow.
- **Tokens:** 1.6. This is the biggest single change — rebuild `mapTheme.ts` around 1.6.

### 2.6 Floating inbox — `inbox/InboxShell.tsx`  ·  `07-floating-inbox.png`
- **Was:** translucent panel + plain FAB.
- **Now:** `--glass-card` (blue/violet accent) for the drawer; the FAB button uses a glossy radial (`linear-gradient(160deg,rgba(255,255,255,.35)…)` over `radial-gradient(#0d1224,#050506)`) + `inset 0 1.5px 0 rgba(255,255,255,.3)` top gloss + `0 0 22px -6px accent` bloom. Search pill and rows unchanged in layout.
- **Tokens:** 1.1, 1.5 (button gloss).

### 2.7 Work card + Project rows — `profile/HostingPanel.tsx`, `dashboard/DashboardVenueSection.tsx`  ·  `08-work-project-rows.png`
- **Was:** translucent panels/rows.
- **Now:** Work card = `--glass-card` (cyan). Project rows = `--glass-card` with a **neutral/grey glass** variant (`glassGrey`) + corner sheen + `--refract-seam`; thumbnail in a rounded accent-bordered well. "View resume" / "Pitch me" = glass buttons.
- **Tokens:** 1.1, 1.2, 1.3, 1.5. Add a **`--glass-card-neutral`** variant (grey `--c`, white-based bloom) for rows/panels with no semantic color.

### 2.8 Navigation (drawer + folder + mobile bar) — `dashboard/DashboardDrawer.tsx`, `hub/HubShell.tsx`, `hub/hubIcons.tsx`  ·  `09-navigation.png`
- **Was:** flat panels; segmented control; static bar.
- **Now:** Drawer + folder sheet carry an **inward-debossed edge** (`inset 0 0 34px -10px rgba(0,0,0,.95), inset 0 2px 3px rgba(0,0,0,.6)`) + half-strength cyan outward glow. Mobile bar: active tab = neon accent color, tinted fill, glow; a glowing-cyan pull handle animates (`pullHandle`). Segmented Member/Admin toggle keeps inset pill shadows.
- **Tokens:** 1.1 + the **deboss inset** pair (add as `--edge-deboss`).

### 2.9 Islands / River Brats — `river-brats/*`, `NudeBeachesHubPanel.tsx`, `pages/NudeBeaches.tsx`  ·  `10-islands.png`
- **Was:** `.nude-live-card` / `.rb-*` translucent tiles.
- **Now:** every tile = `--glass-card` with thin black outline + corner sheen; accent = per-card semantic color (Rooster orange #FF6600, Sauvie green #39FF14, river-level cyan #19E3FF). Check-in tab card uses orange top like live conditions. Check-in CTA + tickets = glass buttons. Grouped by island (Rooster Rock, Sauvie Island/Collins Beach) with live-conditions, logistics (parking/rules/farm stores) sub-cards.
- **Tokens:** 1.1, 1.2, 1.5.

### 2.10 Promoter intake — `promoter/PromoterIntake.tsx`, `promoter/ActionRow.tsx`  ·  `11-promoter-intake.png`
- **New surface.** Verified-promoter banner = neutral dark card (lime label + dot, **no** green fill/glow). Three action rows (Submit=lime, Claim=cyan, Spotted=magenta) each use `--glass-card` keyed to that accent, with the project-row edge (sheen + refract seam), a number, and an outlined status badge.
- **Tokens:** 1.1, 1.2, 1.3.

### 2.11 Infrastructure grid — `home/InfrastructureGrid.tsx`  ·  `12-infrastructure-grid.png`
- **New surface.** 2×2 cards (Gigs #6E3DFF, Gifting #CCFF00, Missed Connections #FF00CC, Nude Beaches #FF6600) — each is a `--glass-card` with a **left 4px accent border** variant, no title glow.
- **Tokens:** 1.1 (with `border-left:4px solid var(--c)` variant).

### 2.12 Support (keep-alive / affiliate / sponsors) — `support/SupportPanel.tsx`, `support/AffiliatePartners.tsx`, `support/SponsorsPanel.tsx`  ·  `13-support.png`
- **New surface.** Keep-This-Guide-Alive + Sponsors = **neutral** `--glass-card` (thin black edge, corner sheen, `rgba(255,255,255,.15)` bloom, no accent). Affiliate card keeps a cyan left accent but neutral glow. Venmo / Pitch buttons = lime glass buttons. Sponsor qualifier rows = lime-left-accent glass cards. Real partner logos (CockBlock, Mr. S Leather) sit on `#050506` wells.
- **Tokens:** 1.1 neutral variant, 1.2, 1.5.

### 2.13 Hub items (keys / scene feed / rails) — `hub/AdminKeysCard.tsx`, `hub/SceneFeed.tsx`, `hub/NextMovesRail.tsx`, `hub/WhoToFollow.tsx`  ·  `14-hub-items.png`
- **New surface.** "You hold the keys" = magenta-accent glass card + magenta glass button. Scene-feed items = **neutral glass** cards (thin black edge, corner sheen as a *background* layer so text stays legible); status badges (RSVP/Submitted/Looking/Check-in/Event) are outlined-glass pills in the status color; a "Looking" post gets a full rainbow top bar. Rails (Your Next Moves, Who To Follow) = neutral glass cards; Follow buttons = cyan glass buttons; avatars use conic-rainbow rings.
- **Tokens:** 1.1 neutral, 1.2 (as background layer, not overlay, for text-heavy cards), 1.5.

### 2.14 Ads (events-grid slot + in-feed slot) — `ads/PosterAdCard.tsx`→`GridSlotAd`, `ads/FeedAdCard.tsx`→`InFeedAd`  ·  `15-ads.png`
- **Was:** simple bordered ad cards.
- **Now:** **both ads must be visually identical to a real event card** — `--glass-card` (green grid slot / red in-feed), `--glass-sheen`, `--refract-seam`, and a `--poster-well` header (radial accent + `border-bottom:4px`). Grid slot: AFFILIATE lime tag, LOGO well, PARTNER/LOCAL tags, "SHOP NOW" green glass button, AD dot. In-feed: transparent AFFILIATE badge with glowing red text, close ✕, logo well, red title, mono subcopy, code line.
- **Tokens:** 1.1, 1.2, 1.3, 1.4, 1.5.

---

## 3. Deliverables expected from you (Grok)
1. Rewrite `client/src/components/ds/tokens/glass.css` + a new `glass.ts` implementing §1.1–1.5 as one shared recipe (the reference build exposes it as a `glass(accent)` function — mirror that).
2. New `mapTheme.ts` / map CSS implementing §1.6.
3. New `effects.css`: keep the palette + motion vars; **retire `--brutal-shadow` as the default CTA shadow** (glass buttons instead); keep `dirRefract`/`dirCardIn`/`pullHandle` keyframes; keep calm-mode + reduced-motion guards (all glows/animations off).
4. Per-component edits for every source file listed in §2, each pointing only at the new tokens.
5. Keep layout, spacing, radii, fonts, and type scale **unchanged** — this is a **surface/edge/glow** migration, not a re-wireframe.

**Ground everything in `Card System.html` (included) — it is the built reference for exact pixel values. The screenshots show intended output per section.**
