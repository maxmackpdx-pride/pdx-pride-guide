# Design System integration

**Rule:** Only replace surfaces that have a clear DS component spec. Everything else stays as-is until there is a rule.

**Surface chrome (2026-07-16):** Deep-glass / OLED-neon is the **canonical card/map/button surface standard** and **overrides** the prior lite-glass + default brutal-CTA look. Package + tokens:

- `docs/handoffs/deep-glass-2026-07-16/` (`Card System.html`, migration prompts, screenshots)
- `client/src/components/ds/tokens/glass.css` — `--glass-card`, sheen, poster-well, glass-btn, map-surface, `--edge-deboss`
- `client/src/components/ds/glass.ts` · `mapTheme.ts`

Layout, spacing, fonts, and type scale are unchanged. Feature-level motion outside glass is preserved (`GROK_ANIMATION_MIGRATION.md` §6).

**Claude Design / agents:** Prefer `design-system/` (tokens + previews + `EVENTS_GUIDE.md`) as the portable kit. Production React lives in `client/src/components/ds/`.

## Source of truth chain

```
shared/prideWeek.ts          day codes, dates, day colors, RSVP reserved hex
        ↓
client/src/index.css         global CSS vars used by legacy + app chrome
client/src/components/ds/tokens/*   modular production tokens
        ↓  npm run sync:design-system
design-system/tokens/tokens.css     portable single-file tokens
design-system/previews/*.html       @dsCard HTML samples for claude.ai/design
```

Before every push that touches colors, Pride week, or global CSS:

```bash
npm run sync:design-system
git add design-system/
```

## Shipped (complete)

### Foundation
- `client/src/components/ds/` — tokens + production components (Avatar excluded)
- Global token import in `main.tsx`, calm mode syncs `data-calm` on `<html>`
- Live sandbox: `/design-preview` (`DesignSystemSandbox.tsx`)
- Portable kit: `design-system/` (README, EVENTS_GUIDE, AVATARS_GUIDE, previews)

### Modular tokens (`client/src/components/ds/tokens/`)

| File | Contents |
|------|----------|
| `fonts.css` | Barlow Condensed + Inter loads |
| `colors.css` | Surfaces, neons, day colors, gradients, semantic tags/categories |
| `typography.css` | Display / chrome / body / meta scales |
| `layout.css` | 4px space scale, radii, z-index, content widths |
| `effects.css` | Brutal shadows, glows, motion, calm-mode kill switches |
| `base.css` | Reset, focus ring, rainbow rule, marker chip |
| `index.css` | Imports all of the above |

### Production components (`client/src/components/ds/`)

| Component | Role |
|-----------|------|
| `Button` | Canonical neon CTA — brutalist magenta offset shadow, accents lime/cyan/pink/orange/purple |
| `Badge` | Status / count badges |
| `FilterChip` | Events / directory / board filter pills |
| `StickerBadge` | Board sticker labels |
| `PosterCard` | Events **grid** board card (2:3 flyer, day stripe, glow) |
| `EventCard` | Events **list** row (left day border) |
| `PlaceCard` | Directory venue card (rainbow top seam + category neon edge + glow) |
| `PosterCard` / `EventCard` | Events grid/list — rainbow top seam via shared DS card chrome |
| `SearchInput` | Filter search field |
| `SectionHeader` | Section kicker + title |
| `StatCard` / `StatPill` | Admin / hub metrics |
| `Countdown` | Pride week countdown |
| `Divider` | Rainbow / hard rules |
| `HeroBanner` | Collage / banner hero shell |
| `Logo` | Brand lockup |
| `Marquee` | Scrolling ticker band |
| `MapPanel` / `MapLegend` | Map chrome (not fully wired to live Leaflet) |
| `IconButton` | Icon-only control |
| `adapters/ListingCard` | Bridges app event data → PosterCard / EventCard |

### Filter & admin chrome
- Events day filters, Events search, Directory type/area filters
- Board `FilterChip` / `StickerBadge` via `BoardActiveSection`
- Admin `StatCard` metrics, `Button` / `Badge` on key actions
- About, Legal, 404, ErrorBoundary reload → DS `Button`

### Cards & home
- **Events** — `ListingCard` → `PosterCard` (grid) / `EventCard` (list); share, attendance, talent extras preserved
- **Directory** — `PlaceCard` with linked upcoming events
- **Rainbow top seam (glowing cards)** — animated bar on Events / boards / MC / **glowing hub-feed cards only** (`.fitem--glow` for gig/gift/MC, not plain feed activity). Also PlaceCard/PlaceModal. Defined in `ds/tokens/base.css` (see `docs/BOARD_CARD_STANDARD.md`)
- **Dashboard hub** — `StatPill` summary chips
- **Home** — `Countdown` + `Button` on hero / promo actions (full masthead collage is still custom)

### Helpers
- `client/src/lib/dsEvent.ts` — event → listing card prop mapping
- `client/src/lib/dsColors.ts` — dashboard accent → DS color tokens
- `client/src/components/ds/adapters/` — production adapters

## Intentionally unchanged

- `EventBoardCard.tsx` (board feed cards outside Events page)
- Full home hero collage → not fully on `HeroBanner` (GlitchWord / video overlay)
- Map overlays (`MapPanel` / `MapLegend`) on live Leaflet maps (partial)
- Full merge of every legacy class in `index.css` into DS tokens only
- Avatar system (see `design-system/AVATARS_GUIDE.md` — excluded from React DS)

## Design rules (quick)

- Near-black `#0a0a0a` / card `#0b0b0b`, `2px solid #2b2b2b`, radius 0–6px
- Display: Barlow Condensed 700–900 uppercase; body: Inter `#e6e3da`
- One neon per element; primary CTA / RSVP = `#CCFF00` only (never a day)
- Day colors are data (MON–SUN Pride week); use `var(--day-*)` so calm mode works
- Button signature: `4px 4px 0 rgba(255,0,204,0.36)` offset shadow; hover lift
- Glow: idle soft, hover hotter; **calm mode / reduced-motion** kills glow + pulse
- Motion: ~150ms hover, ~4s ambient pulse

## Previews (`design-system/previews/`)

First line carries `@dsCard group="…"` for Claude Design indexing:

| File | Group | What it shows |
|------|-------|----------------|
| `colors.html` | Colors | Neon palette, day swatches, surfaces, text, tags |
| `typography.html` | Type | Display / body / meta / kicker samples |
| `buttons.html` | Buttons | Neon, solid, accent, pill, ghost |
| `event-card.html` | Cards | Board poster + list row |
| `chips-effects.html` | Effects | Rainbow bar, day chips, live pill, glow |
| `events-page-layout.html` | Layout | Events page stack (hero → map → filters → board) |
| `schedule-grid.html` | Layout | Week grid schedule |
| `place-card.html` | Cards | Directory place card |
| `avatars.html` | Avatars | Avatar guide samples (not React DS) |

## Preview (app)

```bash
npm run dev
# → http://localhost:5000/design-preview
```

## Do not

- Invent day colors or an 8th Pride day
- Use `#CCFF00` as a day accent
- Put day colors on schedule event cards (column header only)
- Ship UI that hard-codes day hexes where `var(--day-*)` belongs
- Grow the DS with one-off components that lack a preview + guide note
