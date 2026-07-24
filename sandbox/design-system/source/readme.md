# Zaylist, Design System

Energetic queer maximalism meets ruthlessly usable utility. A high-energy digital
club flyer and Portland DIY zine, given a polished 2026 glow-up while staying
welcoming, scannable, and community-first. Anti-corporate by design: built by and
for the PDX scene, not a sponsor.

This design system powers **Zaylist** (zaylist.com), a community-run
guide to Portland Pride Week 2026 (July 13 to 19). It covers the event directory,
the venue/places map, community boards (Spotted, Gifting, Gigs), the member Hub,
and the admin dashboard.

## Sources (ground truth)
- **Live site:** https://www.zaylist.com
- **Repo:** `maxmackpdx-pride/pdx-pride-guide` (default branch `master`). The
  canonical token + preview bundle lives at `design-system/` in that repo
  (`tokens/tokens.css`, `previews/*.html`, `EVENTS_GUIDE.md`). Token source of
  truth is `client/src/index.css`; day colors mirror `shared/eventWeek.ts`.
- Reference screenshots of Home, Events, Places, Hub, and Admin were provided by
  the client and are reflected throughout.

Assets, fonts, and color values here mirror that repo bundle. Where this project
adds components beyond the repo bundle (map, stat cards, place cards, dividers,
avatars, marquee), they are enhancements built on the same canonical foundations.

---

## CONTENT FUNDAMENTALS (voice & copy)

The voice is **conversational, cheeky, and caring**, activist and sex-positive
without being sterile. It talks to the reader as **"you"** and to the community as
**"we" / "each other."**

- **Tone:** warm, celebratory, a little unhinged (in the best way), but always
  practical. "This is your welcoming spot to discover events, find your people,
  and take care of each other." Signature sign-off energy: *"Pride is a protest.
  Take care of each other."*
- **Casing:** UI chrome (nav, buttons, chips, badges, section titles, counts) is
  **ALL CAPS** in the condensed display face. Body copy is sentence case.
- **Slogans / stickers:** loud, irreverent, collage-y: "KEEP PORTLAND WEIRD",
  "PRIDE IS A PROTEST", "GAY ALL DAY", "MADE BY THE SCENE". Used as flair above or
  below titles, never as functional labels.
- **Event copy** stays tight and scannable: title, venue, when-line
  ("Fri, Jul 17 · 9:00 PM · Pearl District"), a few tags. No fluff.
- **Emoji:** essentially none in the UI. A single sparkle "✦" appears as a
  decorative separator (marquee, footer). Day and status meaning is carried by
  **color**, not emoji.
- **No em dashes, ever.** Use periods, commas, colons, parentheses, or "to" for
  ranges ("July 13 to 19"). This is a hard project rule (see CLAUDE.md).

## VISUAL FOUNDATIONS

- **Base:** always near-black `#0a0a0a`. Content sits on `#0b0b0b` cards with
  `2px solid #2b2b2b` borders. Brutalist and hard-edged; radius is minimal (0 to
  6px). No soft rounded cards.
- **One neon per element.** Acid yellow `#CCFF00` is the primary action color
  (buttons, active states, counts, RSVP). Cyan `#00FFFF` is the accent pop and
  link color. Magenta `#FF00CC` mostly lives in the signature offset shadow and
  glows.
- **Day color system (the rule that matters most).** Every event belongs to one
  Pride day, and that day drives its color everywhere (map pin, filter pill, day
  tag, card glow, schedule underline). MON `#8800FF`, TUE `#0044FF`, WED
  `#FFEE00`, THU `#00FFFF`, FRI `#FF00CC`, SAT `#39FF14`, SUN `#FF6600`. MON and
  TUE have lighter text variants (`--day-mon-text`, `--day-tue-text`) for legible
  text on black. Colors are **data, not decoration**; always use the `--day-*`
  tokens so calm mode can flatten them to grey. `#CCFF00` is never a day color.
- **Type:** display is **Barlow Condensed** (700 to 900, uppercase, tight
  ~0.95 line-height); body is **Inter** (body text `#e6e3da`, meta `#999`, faint
  `#666`). See CAVEATS on fonts.
- **Backgrounds & imagery:** full-bleed collage hero wallpapers (grungy black
  base, distressed sticker text, halftone Mt. Hood, neon skyline and bridges,
  roses, Progress-flag nods). Heroes use a halftone dot texture and a bottom/left
  legibility scrim. Imagery reads warm and nighttime-saturated with heavy grain.
- **Signature effects:**
  - **Brutalist offset shadow** `4px 4px 0 rgba(255,0,204,0.36)` (hard magenta,
    no blur) on buttons; it grows on hover and collapses on the tactile press.
  - **Rainbow bar** divider (cyan, yellow, magenta, orange), 2 to 3px, used as
    seams under the header, at hero edges, and between sections.
  - **Soft neon glow** `0 0 14px color-mix(<accent> 18%)` on cards, with a slow
    ~4s pulse; hover brightens it. Spotted / missed-connections cards get a slow
    magenta glow pulse.
  - **Sticker outline:** big display numerals (countdown) carry an off-center,
    slightly hand-drawn black outline over the neon.
- **Motion:** 0.15s snappy on hovers/presses; ~4s ease-in-out ambient pulses.
  Buttons lift up-left on hover (shadow grows) and press down-right on click
  (shadow collapses). Respect reduced-motion and **calm mode** (`[data-calm]`
  turns glows and animation off, flattens day colors to grey).
- **Hover states:** neon fills invert to black text; cards lift 2px and brighten
  their glow; chips fill with their accent. **Press:** buttons translate toward
  the shadow; chips and icons scale down slightly.
- **Borders & radius:** 2px hard borders in `#2b2b2b` (or an accent for emphasis);
  radius 2 to 6px. Pills and avatars are the only fully-round shapes.

## ICONOGRAPHY
- The brand leans on **color and condensed type**, not a heavy icon set. Icons are
  simple line glyphs (map pin, clock, phone, globe, share, calendar, heart, chevron)
  used sparingly inside cards and toolbars.
- In this system, component icons are inline SVGs (stroke ~2 to 2.4, round caps) so
  they inherit color and need no dependency. The demo cards use **Lucide** via CDN
  for convenience; production may substitute any matching line set. There is no
  brand icon font.
- **Emoji are not used** as UI icons (one decorative "✦" sparkle aside). Meaning is
  color-coded by day/admission, not iconified.
- The one real brand mark is the app-icon **logo** (`assets/logo.png`): a black
  rounded tile with a lime glow border, rainbow EQ skyline, compass rose over a
  rainbow Mt. Hood, and "2026". It always appears with the stacked **PDX / PRIDE /
  GUIDE** wordmark (PRIDE in the rainbow gradient) unless used as a bare icon.

---

## Components

Reusable primitives (React, styled via CSS custom properties). Import from
`window.ZaylistDesignSystem_b20420` in card/kit HTML.

**Brand:** `Logo`, `Avatar`
**Forms:** `Button`, `IconButton`, `SearchInput`, `FilterChip`
**Data display:** `Badge`, `EventCard`, `PosterCard`, `PlaceCard`, `Countdown`,
`StatPill`, `StatCard`, `StickerBadge`
**Layout:** `SectionHeader`, `Divider`, `HeroBanner`, `Marquee`
**Map:** `MapPanel`, `MapLegend`

Each component directory holds `<Name>.jsx`, `<Name>.d.ts` (props + JSDoc),
`<Name>.prompt.md` (usage), and a `@dsCard` preview HTML.

### Intentional additions (beyond the repo bundle)
The repo `design-system/` bundle ships tokens + a few preview cards. This project
expands it into a full component library. Additions, each grounded in a real site
surface: `MapPanel`/`MapLegend` (events + places map), `PlaceCard` (venue
directory), `StatCard`/`StatPill` (admin + hub counts), `Divider` (rainbow seams),
`Marquee` (ticker band), `Avatar` (member chips), `HeroBanner` (collage heroes),
`Countdown`, `SectionHeader`, `StickerBadge`.

## UI kit

`ui_kits/pride-guide/` is an interactive recreation of the site. Open
`ui_kits/pride-guide/index.html`. Screens: **Home** (hero, featured board cards,
by-day list), **Events** (page hero, map strip, sticky filter bar, grid/list
board), **Places** (map, category filters, venue cards), **Hub** (profile, stat
pills, inbox/weather/pride-week panels), **Admin** (stat grid, review queue).
Data lives in `ui_kits/pride-guide/data.js`.

## Foundations (Design System tab)
Specimen cards under groups **Colors**, **Type**, **Spacing**, **Brand**, plus
**Components** and **Zaylist** previews.

## Root manifest
- `styles.css` — the single entry point consumers link (imports only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `layout.css`,
  `effects.css`, `base.css`.
- `components/` — `brand/`, `forms/`, `data-display/`, `layout/`, `map/`.
- `ui_kits/pride-guide/` — the interactive site recreation.
- `assets/` — `logo.png`, `banners/` (collage hero wallpapers).
- `guidelines/` — foundation specimen cards.
- `CLAUDE.md` — project rules (no em dashes). `SKILL.md` — portable skill wrapper.

## CAVEATS
- **Fonts:** no brand font files were provided. **Barlow Condensed** and **Inter**
  are loaded from Google Fonts to match the repo's canonical `--font-display` /
  `--font-body`. If real files exist, drop them in `assets/fonts/` and swap the
  `@import` + `@font-face` rules in `tokens/fonts.css`.
- **Map tiles:** `MapPanel` renders the branded overlay (glowing day pins, legend,
  seams) over a dark faux-street background. In production the base is a Leaflet +
  CARTO dark tile layer; wire that behind the overlay.
- **Avatars:** the `AVATARS_GUIDE.md` / `previews/avatars.html` referenced by the
  client were not accessible in the connected repo at build time. `Avatar` was
  built from the observed rainbow-ring treatment; confirm against that guide.
- Event, place, and community copy in the UI kit is a representative subset of the
  real data, not the full live dataset.
