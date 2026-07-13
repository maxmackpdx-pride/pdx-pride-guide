# PDX Pride Guide — Events System Explainer

Written for claude.ai/design (or any design tool) that needs to understand how
events, cards, and the two event layouts work. Everything here mirrors the live
code; the renderable samples live in `previews/events-page-layout.html` and
`previews/schedule-grid.html`.

## The big picture

One event dataset, two page layouts:

1. **Events page** (`/events`) — browse view. Map with day-colored pins on top,
   a sticky filter bar, then a board of poster cards. Tapping a card opens the
   event modal.
2. **Schedule page** (`/schedule`) — plan view. A 7-column day × time grid
   (like a calendar week view), horizontally scrollable on mobile, with an
   "Export to Instagram Stories" button that renders the grid to a 1080×1920 PNG.

Every event belongs to exactly one **Pride day** (MON–SUN, July 13–19, 2026),
and that day drives the accent color on pins, tags, card glows, and filters.
Multi-day festivals are split server-side into one listing per day, so the UI
only ever renders single-day entries.

## Event data model (what a card can show)

| Field | Example | Notes |
|---|---|---|
| `title` | "Horse Meat Disco" | Display font, uppercase |
| `venueName` | "Crystal Ballroom" | |
| `neighborhood` | "Pearl District" | Optional |
| `dayOfWeek` | `"FRI"` | One of MON…SUN — drives the accent color |
| `dateStart` / `dateEnd` | `2026-07-17T21:00` | Pacific time; overnight ends (2am) stay on the start day |
| `admission` | `FREE` \| `TICKETED` | Shown as a tag |
| `ageRequirement` | `ALL_AGES` \| `18_PLUS` \| `21_PLUS` | Shown as a tag |
| `eventTypes` | `["drag", "dance-party"]` | Small outline tags |
| `posterImageUrl` | 2:3 portrait flyer | Card art; placeholder block when missing |
| `isClaimable` / `claimedBy` | | Unclaimed events show a "CLAIMABLE" tag; claimed ones have a host |
| attendance | "12 going" | Avatar cluster + count, live-updating |

## Day color system (the one rule that matters most)

Colors are semantic — a day always has the same color everywhere: map pin,
filter pill, day tag, card glow, schedule column underline.

| Day | Date | Base color | Text variant |
|-----|------|-----------|--------------|
| MON | Jul 13 | `#8800FF` purple | `#AA66FF` |
| TUE | Jul 14 | `#0044FF` blue | `#4488FF` |
| WED | Jul 15 | `#FFEE00` yellow | same |
| THU | Jul 16 | `#00FFFF` cyan | same |
| FRI | Jul 17 | `#FF00CC` pink | same |
| SAT | Jul 18 | `#39FF14` green | same |
| SUN | Jul 19 | `#FF6600` orange | same |

Rules:
- **Text variants** exist because purple/blue fail contrast on the black
  background — pills and tags use the text variant, pins and glows use the base.
- **`#CCFF00` (acid yellow) is reserved** for the RSVP pulse on map pins and
  primary action buttons. It is never a day color.
- Unknown/no day = white `#FFFFFF`, never a day color.
- CSS custom props: `--day-mon` … `--day-sun`, plus `--day-mon-text`,
  `--day-tue-text` (see `tokens/tokens.css`).
- Calm mode flattens all day colors to `#888` — never hard-code a day hex where
  the var should go.

## Card anatomy — board card (default view)

Vertical poster card. The event's day color arrives as `--card-day-color` and
produces the ambient glow, the thin day stripe on the poster, and pairs with
the day tag.

```html
<article class="event-board-card" style="--card-day-color:#FF00CC">
  <!-- Poster: 2:3 flyer, thin day-color stripe along the bottom edge -->
  <div class="poster">
    <img src="flyer.jpg" alt="" />
    <span class="day-stripe"></span>
  </div>

  <div class="meta">
    <!-- Tags row: day tag first (white pill, black text), then outline tags -->
    <div class="tags">
      <span class="day-tag">FRI</span>
      <span class="type-tag">Drag</span>
      <span class="type-tag">Dance party</span>
      <span class="meta-tag">Ticketed · 21+</span>
    </div>

    <h3 class="title">HORSE MEAT DISCO</h3>
    <div class="venue">Crystal Ballroom</div>
    <div class="when">Fri, Jul 17 · 9:00 PM · Pearl District</div>
    <span class="details-link">Event details →</span>
  </div>

  <!-- Attendance cluster: overlapping avatars + "12 going" + RSVP button -->
  <footer class="attendance">…</footer>
</article>
```

Styling essentials:
- **Top rainbow seam** on every board/list card (shared site chrome — same
  animated bar as directory cards / hub feed; see `docs/BOARD_CARD_STANDARD.md`).
- Card: `#0b0b0b` on `#0a0a0a` page, `2px solid #2b2b2b` border, 0–6px radius
  (brutalist), glow `0 0 14px color-mix(in srgb, var(--card-day-color) 18%, transparent)`
  with a slow ~4s pulse; hover lifts 2px and brightens the glow.
- Title: Barlow Condensed 900, uppercase, line-height ~1.05.
- Venue `#888`, when-line `#999`, both Inter.

### List-view variant

Same data as a horizontal row: flyer thumbnail left, text right, and a
**4px solid left border in the day color** instead of the poster stripe.

## Events page layout (top to bottom)

```html
<main class="events-page"> <!-- bg #0a0a0a -->
  <!-- 1. PageHero: kicker chip, huge two-line display title, lede, CTA -->
  <section class="page-hero">
    <span class="kicker">PORTLAND PRIDE WEEK 2026 · JULY 13–19</span>
    <h1>EVENTS<br /><span class="accent-cyan">GUIDE</span></h1>
    <p class="lede">Every queer party, parade, show, and gathering…</p>
    <a class="btn-neon">VIEW AS SCHEDULE →</a>
  </section>

  <!-- 2. Map strip (dark Carto tiles), expandable. Pins:
       · single-day = 22px hollow circle, 3px stroke in day color + neon glow
       · multi-day venue = pie chart, one slice per day, slices in MON→SUN order, black ring
       · RSVP'd = #CCFF00 pulsing glow on top of the day color
       Legend: 7 day swatches + a MULTI-DAY pie demo -->
  <section class="events-map">…</section>

  <!-- 3. Sticky filter bar (black, sticks under the site header) -->
  <div class="filter-bar">
    <button class="filter-tag active">ALL</button>
    <button class="filter-tag">MON</button> <!-- …TUE WED THU FRI SAT SUN -->
    <div class="divider"></div>
    <button class="type-tag">Drag</button> <!-- event-type filters -->
    <div class="view-toggle">grid | list | map</div>
  </div>

  <!-- 4. Card board: responsive grid of board cards -->
  <section class="card-grid">…</section>
</main>
```

Filter pill states:
- Default: transparent, `1px` grey border, grey uppercase text.
- **Active day pill: fills with the day's base color, black text** (white text
  on MON/TUE because their fills are dark), glow `0 0 14px <color>aa`.

## Schedule page layout (the separate page)

A week-calendar grid, not a card board. Key structure:

```html
<div class="schedule-page">
  <!-- Header row -->
  <h1>SCHEDULE</h1>
  <div class="toggle">MY SCHEDULE | ALL EVENTS</div>  <!-- RSVP-only filter -->
  <button class="btn-neon magenta">EXPORT TO INSTAGRAM STORIES</button>

  <!-- Horizontally scrollable wrapper (mobile shows ~2 columns) -->
  <div class="schedule-grid-wrapper"> <!-- overflow-x:auto -->
    <div class="schedule-grid">
      <!-- grid-template-columns: 56px repeat(7, minmax(0,1fr)) -->

      <!-- Time axis: 11 AM → 3 AM next day, one label per hour -->
      <div class="time-axis">11 AM … 3 AM</div>

      <!-- One column per day, MON Jul 13 → SUN Jul 19 -->
      <div class="day-col">
        <!-- Header: 3px bottom border in the DAY color -->
        <header style="border-bottom:3px solid var(--day-fri)">
          <div class="label">FRIDAY</div>
          <div class="date">JUL 17</div>
        </header>
        <!-- Body: relative; 64px per hour (48px mobile); faint hour lines;
             a magenta "now" line during Pride week -->
        <div class="body">
          <!-- Events absolutely positioned: top/height from start/end time.
               Overlapping events split the column width side-by-side. -->
          <div class="schedule-event-card" style="top:640px;height:320px">
            <span class="time">9:00pm–2:00am</span>
            <strong>HORSE MEAT DISCO</strong>
            <span class="venue">Crystal Ballroom</span>
          </div>
        </div>
      </div>
      <!-- …6 more day columns -->
    </div>
  </div>
</div>
```

⚠️ **Nuance:** schedule event cards do NOT use day colors (the whole column is
one day, so it would be redundant). They cycle through a separate accent list —
`#19E3FF`, `#FF6600`, `#39FF14`, `#A855F7`, `#FF00CC` — as a thin left border /
tint per card. The day color appears only in the column-header underline.

## Event modal (opened from any card)

Full-bleed poster header → day + type tags → title/venue/when in the day's
**text** color → description → host row (avatar + HOST chip in day color) →
talent/lineup rows → RSVP "I'll be there" (acid yellow `#CCFF00`) → attendance
avatars → share/calendar actions. Unclaimed events show a CLAIMABLE tag that
links to the claim flow.

## Design system components (production mapping)

Portable samples: `previews/event-card.html`, `events-page-layout.html`,
`schedule-grid.html`. React: `client/src/components/ds/`.

| UI surface | DS component | Notes |
|---|---|---|
| Events **grid** card | `PosterCard` (`.pdxBoard`) | 2:3 flyer, bottom day stripe, ambient day glow, white day pill + outline tags |
| Events **list** row | `EventCard` (`.pdxRow`) | Thumbnail + meta; **4px left border** in day color |
| Events listing bridge | `adapters/ListingCard` | Maps API event → PosterCard / EventCard; keeps share / attendance / talent |
| Day / type filters | `FilterChip` | Active day fill = day base color; MON/TUE use light text on dark fill |
| Search | `SearchInput` | Filter bar search |
| Map legend | `MapLegend` | Day swatches + multi-day pie demo |
| Primary CTAs | `Button` accent `lime` | RSVP / "I'll be there" — acid yellow only |
| Directory venues | `PlaceCard` | Animated rainbow top seam (`.pdx-rainbow-rule`) + category neon edge (`--cat-*`), not day colors |

### Glow policy (cards)

- **Normal:** soft day-color glow; hover lifts ~2px and brightens glow (`--card-glow-idle` → `--card-glow-hot`). Some boards use slow ~4s pulse (`pdxPulse`).
- **Calm / reduced-motion:** no glow, no pulse; day accents flatten to `#888` where calm rules apply. Hover may still lift without neon shadow.

### Tokens used on events

- Day fills: `--day-mon` … `--day-sun` (from `shared/prideWeek.ts`)
- Day text-safe: `--day-mon-text`, `--day-tue-text` (pills/tags on near-black)
- Multi-day pin: `--day-multi`
- RSVP / primary: `--rsvp` / `--neon-yellow` (`#CCFF00`) — **never** a day
- Unknown day: `--day-unknown` / white
- Schedule card accents: `--schedule-accent-1` … `5` (not day tokens)

## Do / don't for design work

- ✅ One neon per element; day colors are data, not decoration.
- ✅ Near-black backgrounds, hard borders, minimal radius, uppercase condensed display type.
- ✅ Use `var(--day-*)` tokens, never raw hexes, so calm mode still works.
- ✅ Board grid = `PosterCard`; list = `EventCard`; wire through `ListingCard` when possible.
- ❌ Don't use `#CCFF00` for a day, and don't recolor RSVP anything else.
- ❌ Don't give schedule cards day colors (see nuance above).
- ❌ Don't invent an 8th day: the week is exactly MON Jul 13 → SUN Jul 19.
- ❌ Don't idle-glow everything in calm mode — calm is a product requirement.
