# Live design standard (implementation checklist)

**Design guide (written standard + specimens):** it is **not in this repo.** There is no
`design-system/` directory here. The guide lives in `maxmackpdx-pride/zaylist-foundation-library`
under `public/design-system/`, published at
https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/. That package is the
**source of truth for design rules**. Do not maintain a second kit.

**This file** is the **production trap list** for agents shipping React/CSS: what not to re-introduce, and where chrome lives in code. It must **not contradict** the design guide. If it does, fix this file (or product), not invent a third guide.

| Priority | What | Path |
|----------|------|------|
| **1 - Design guide** | Written standard + specimens | `zaylist-foundation-library` `public/design-system/` · https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/ |
| **2 - Implementation** | Production React + CSS | `client/src/components/ds/**`, page CSS, adapters |
| **3 - Token modules (code)** | Live token files used by the app | `client/src/components/ds/tokens/` especially **`glass.css`** and **`chrome.css`** |
| **Archive** | Migration package + screenshots | `docs/handoffs/deep-glass-2026-07-16/` |

If an old handoff, sandbox, or removed portable preview **disagrees with the design guide**, **the design guide wins**. If product code disagrees with the guide, either ship product to match or mark the guide panel **queued**.

### The guide lives in two repos and must match

The design guide has two checked-in homes plus a published surface, and they are one
document. Change one, change the other in the same ship.

| Copy | Where |
|------|-------|
| Trap list (this file) | `pdx-pride-guide` `docs/LIVE_DESIGN_STANDARD.md` |
| Written guide + specimens | `zaylist-foundation-library` `public/design-system/` |
| Published guide | https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/ (Cloudflare Worker, deployed from that repo) |
| Design surface | the Zaylist Claude Design project |

**Branches differ.** `pdx-pride-guide` ships on `master`. `zaylist-foundation-library`
ships on `main`. Check the branch before every push. Pushing to the wrong one is a live risk.

### The five sources of truth

For design work these five win, in addition to Tucker's current instructions. Paths are
relative to `zaylist-foundation-library` `public/design-system/`.

| # | Source of truth | Path |
|---|-----------------|------|
| 1 | Card system and deep glass | `guidelines/card-system.html` + `guidelines/card-system-authority.md` |
| 2 | Glow treatment proposal | `templates/glow-proposal/GlowProposal.dc.html` |
| 3 | Desktop nav, corrected | `templates/nav-compliance/DesktopNav.dc.html` |
| 4 | Mobile nav, corrected | `templates/mobile-nav-compliance/MobileNav.dc.html` |
| 5 | Logo letter library | `guidelines/master-letter-library.html` |

Where a specimen page disagrees with one of these, the source of truth wins and the page
is stale. Where a source of truth disagrees with what ships and has been verified live,
the live implementation wins and the source of truth needs correcting.

---

## Do not re-introduce (global traps)

These used to be “the rules.” They are **retired** as defaults. Agents must not restore them sitewide.

| Retired default | Live rule instead |
|-----------------|-------------------|
| Brutal magenta offset as **default CTA** (`4px 4px 0` magenta) | **Glow-treatment buttons** - `.pdx-glass-btn` / `.pdxBtn`: dark plate, accent rim and ink, lit top edge, dark inner floor, and the **8% outer bloom**, composed from `--btn-glow-bg` + `--btn-glow-shadow` (which carries `--neon-bloom`). The solid accent fill is reserved for the one primary action |
| Lite-glass translucent cards + hard `#2b2b2b` only | **Deep-glass** - `--glass-card*`, black ring + neon edge, sheen, poster-well |
| Cardifying ordinary prose, headings, or document metadata because content needs visual separation | **Editorial composition first** - related writing stays in one continuous document bundle; use type, rules, spacing, and chapter bands. A card exists only when the content is an independent object |
| Map outer neon bloom / thick glow frame | **Debossed map well** - thin black rim + inward hole (`--map-frame-shadow`); no outer bloom |
| Sitewide cyan “pull” above bottom nav | **Removed**; hub drawer grip only |
| Claim chip = yellow rim + magenta offset brutal sticker | **Claim this event** = pure `#00FFFF` fill, dark type `#050506`, soft cyan offset `3px 3px 0 rgba(0,255,255,.35)` (no yellow border) |
| “Event details →” dead text on grid cards | **Omit**; card click opens modal |
| Board “past” = missed-connection 7-day window | **Past** = scheduled `dateEnd` passed (`isEventSchedulePast` / `getEventScheduleTiming`) |
| Mr. S ad primary `#ff0033` (red) | Mr. S = **cyan** `#19e3ff`; CockBlock = **red** `#ff1f1f` |
| Ads that don’t match grid/feed | Builder must use **`PosterAdCard` / `FeedAdCard`** + live templates in `lib/adTypes.ts` |
| Day color on primary RSVP | RSVP / primary action accent stays **lime** `#CCFF00` where reserved; day colors are data only |
| General-purpose green | **Acid Green `#39FF14` only.** `--green` and legacy `--neon-green` resolve to `--green-acid`; retired `#00EE44` is accepted only as legacy profile input and normalized on save/read. |
| Touch nav chrome without explicit ask | **Nav locked** unless user requests. When it is requested, ship the glow-pill standard below, not a new treatment |
| Nav links as bare text with a gradient underline; board-folder dropdown (9px pill trigger, 236px panel, rainbow seam, per-index hover rails) | **Glow pills** - see *Site navigation* |
| Persistent glow on the current nav pill (`siteNavPillPulse`) | **Glow is hover only.** The current page holds its accent on rim and label, with no bloom and no pulse |
| Z/Space "mega" dropdown with a Featured card beside the item column | **One plain column** of pills under a line of descriptive copy; `z/ all boards` carries the `/z` link |
| Hub as an outlined pill with a standing cyan glow (plus a decorative pulsing cyan dot) | **Solid fill primary** - cyan plate, dark ink, composed from `--chrome-keyline` + `--chrome-bevel` + `--chrome-floor` + `--neon-bloom` |
| Global Hub tab opening a Member/Admin or administration drawer | **Hub is navigation** - signed-in Hub goes directly to `/dashboard`; admin controls live inside the Hub experience |
| Hand-rolled glass shells that restate `--glass-card-shadow` behind `!important` (promoter ActionRow) | **Compose `.pdx-glass-card`**; set only `--c` and `--dir-gm` locally |
| Generic `PageHero` billboard on new pages (wallpaper, giant centered title, boxed lede, decorative slug, automatic CTA row) | **Use the closest existing product composition.** For ordinary utility, detail, legal, empty, and error pages use the compact nav-aligned `PageHeader`; a large authored hero is an explicit page-specific decision, never the default scaffold. |

**Outer neon bloom is 8%, and it is NOT retired.** The card guide retired the
full-strength halo and the glow proposal wanted bloom back; 8% is the settled value,
carried by `--neon-bloom` (`client/src/components/ds/tokens/chrome.css`) and composed,
never hand-rolled, by tags, tape, kickers, pills, badges, seams and buttons. **Maps are
the sole exception** and keep the debossed well with no bloom at all.

`--brutal-shadow*` tokens may remain for **intentional stickers** only. Never wire them as the default for buttons, tickets, Shop Now, or “I’ll be there.”

---

## Canonical surface recipes (implementation)

| Recipe | Token / class | Used for |
|--------|---------------|----------|
| Accented card | `--glass-card-*` + `.pdx-glass-rebind` + local `--c` | Event board, places, boards, ads |
| Neutral card | `--glass-card-neutral-*` | Work rows, neutral panels |
| Poster media | `--poster-well-*` / `.pdx-poster-well` | Flyer wells, ad media |
| Primary CTA (one per surface) | `.pdx-glass-btn--solid` or `.pdxBtn--solid` | Tickets, Shop Now, filled actions |
| Default glow-treatment button | `.pdx-glass-btn` / `.pdxBtn` (`--btn-glow-bg` + `--btn-glow-shadow`) | Every other control |
| Map frame | `--map-frame-shadow`, mapTheme | Events / directory / beach maps |
| Map key / legend | `.map-legend` / `.directory-map-key` / `.pdxLegend` → **neutral deep-glass** (`--glass-card-neutral-*`) | All maps; pin swatches unchanged; no lime/cyan panel bloom |
| Claim sticker | `.pdxBoard__claim-tag` / `.event-card-meta-tag--claim` | Unclaimed listings only |
| Rainbow top seam | `.pdx-rainbow-rule` / card `::before` | Clickable cards (see board standard) |

**Accent contract:** set `--c` (and rebind with `.pdx-glass-rebind`) per instance. Day colors → event cards; board accents → gigs/gifts/spotted; brand accents → ads.

**Composition contract:** the card recipe applies only after an independent object boundary exists. Related prose and document structure remain continuous until meaning, action, comparison, selection, or state creates a real object boundary.

---

## Events board (behavior + chrome)

- **Main grid / map** = upcoming + live only (`!isEventSchedulePast`).
- **PAST chip** = ended listings only.
- **No** decorative Event details row on grid.
- Share = icon control, not a fake link chip.
- Open event: Flags / Tags / About glass panels; tickets = solid glass.

## Ads (grid + feed)

- Live components: `PosterAdCard`, `FeedAdCard` (+ legacy hard-coded affiliate cards must match them).
- Templates: `templateDraft()` in `client/src/lib/adTypes.ts` - CockBlock red, Mr. S cyan.
- Builder preview must render those same components (WYSIWYG).
- Shop Now = solid brand fill; **dark type on cyan/lime**, **white type on CockBlock red**.

## Boards (gigs / gifts / spotted)

- Structure + overlay triad still in `docs/BOARD_CARD_STANDARD.md`.
- Chrome = deep-glass (not old flat zine slabs).
- Motifs sit **above** sheen, visible; ISO/Looking dashed edges per live CSS.

## Dynamic Text (title-over-photo motif)

- Canonical spec: `zaylist-foundation-library/public/design-system/guidelines/dynamic-text.html`. This section is the product mirror, not the source — if the two disagree, treat it as drift to resolve, not a choice to make silently.
- Implementation: `client/src/lib/dynamicText.ts` (general-purpose, any surface can adopt it) + `client/src/components/housing/HousingWell.tsx` (the one current caller). Full contract, algorithm, and gotchas: the `zaylist-dynamic-text` skill.
- **Readable band is 24-220px, not 28-180.** Height math includes a diacritic-gap term (`rowGapAbove`) — an accented row needs more headroom than a plain one, or it clips.
- **Three HAÜZ-only opt-ins, all default off:** `HOUSING_FIT_WITHIN_FRAME` (shrink to fit, exact, down to the floor only if required), `HOUSING_PREFER_TWO_ROWS` ("almost always two lines except with one word"), `HOUSING_MAX_NEIGHBOR_RATIO` (3x - softly discourages an extreme size gap between adjacent rows, verified against the real regression set before shipping). Do not assume these transfer to a new surface without the same verification.
- **Never use letter-spacing, `scaleX()`, or per-character positioning as a fitting mechanism.** Tracking is fixed and uniform (`-.02em`), folded into the width measurement so measured and rendered widths match - it never varies to force a row to fit.
- Scope: short authored display names and title motifs that own a fixed visual field. Not event names, interface copy, paragraphs, controls, or changing system titles - those get the normal type scale. An exception needs an explicit decision, the same way HAÜZ earned its opt-ins.

## Maps

- Debossed OLED frame; keys = OLED panel chrome, pin **shapes** preserved.
- No sitewide outer map bloom.

## Motion

- Prefer existing tokens + `pgDirCardIn` entrances.
- Calm / `prefers-reduced-motion` kill ambient pulses and seam animation (bar may stay static).
- See archive `GROK_ANIMATION_MIGRATION.md` only for inventory - do not re-migrate.

## Site navigation

Source: Claude Design handoff *Top Nav Bar Mockups*, project `8c680e88`, 2026-08-21.
Code: `client/src/lib/siteNav.ts` (model + accents), `client/src/components/Nav.tsx`,
`.site-nav-link` / `.site-nav-dropdown__*` in `client/src/index.css`.

- Every entry is a **hairline pill** (`999px`, `2px solid #333`) on a plain dark bar. It lights in **its own accent** on hover, and **on hover only**. The current page keeps its accent on the rim and the label but carries **no standing glow and no pulse**: glow is an affordance, not a state.
- Accents are per destination and live in the nav model, not in CSS forks: Home lime, About magenta, Eventz cyan, Placez blue, Outz orange, Z/Space violet. Board items inside Z/Space carry their own board accent.
- Accents resolve through the shared tokens (`--panel-*`, `--neon-*`, `--green-acid`) via a `data-accent` attribute, so Calm Mode desaturates the nav with no nav-specific overrides. `#0044ff` and `#8800ff` are too dark to read as label ink: the glow keeps the token and the text lifts to a tint (`--nav-c` vs `--nav-c-ink`).
- Pills are `.88rem`. They must **not** inherit `--site-nav-size` (16.8 to 21.6px) - six bordered pills at that size run off the bar. Padding, pill gap, brand lockup width, and the search trigger's label all step down between 1024 and 1439 so the full set fits without the nav scrolling.
- Dropdowns are dark rounded panels of the same pills, **one plain column each**. A list may carry a mono **eyebrow**, used either as a section label (Outz: "Most Visited") or as plain descriptive copy (Z/Space: "Every board, one place"). There is no featured card. Z/Space opens leftward because its trigger is the last pill.
- Outz lists `All OUTZ` (`/z/out`, a real index page) above the two OUTZ addresses. Z/Space leads with `z/ all boards`, which carries the `/z` link the retired featured card used to own, then `THE HAÜZ`, `Gigz`, `Sellz`, `Mizzed`, `Giftz`.
- The desktop right cluster reads **search → notifications bolt → Hub → seam → avatar + caret**, in that order. The bolt is the same component as the mobile top bar's, so its panel styles are global, not trapped in a phone media query.
- **Hub is the one primary action** in the bar, so it takes the solid fill the standard reserves for primary: cyan plate, dark ink, and `--chrome-keyline` + `--chrome-bevel` + `--chrome-floor` + `--neon-bloom` composed as the whole shadow. No border, no standing dot. Log in / Join is the signed-out control in the same slot and is built the same way.
- The wordmark keeps the glitch treatment: the real logo asset plus two RGB-split ghost layers (cyan and magenta, `screen` blend) flashing briefly on a 3.2s loop. Never typeset it.

### Mobile bar and sheets

- Five tabs: **Eventz, Placez, Hub, Z/Space, Messages**, on deep glass with the flowing rainbow seam on the top edge. There is **no pull handle** on the site-wide bar; that remains retired. Any grip belongs to an in-Hub drawer, never the global site bar.
- Tab glow is accent-coloured and **hover/active only**. **Hub is the exception: its glow is white**, never a colour, because it is the centre mark and reads as neutral chrome.
- **Outz opens a drawer, not a navigation.** The phone bar has no Outz tab, so the trigger is the Outz row inside the Z/Space sheet. The drawer pins above the bar with a mono `Outz · Most Visited` kicker, numbered rows, and a `View All Outz →` footer to `/z/out`. It lists the OUTZ addresses that exist; do not pad it with places that have no page.
- **Hub is navigation, not a drawer trigger.** Tapping Hub takes a signed-in visitor directly to `/dashboard`. Admin remains an explicit destination inside the Hub experience. The global Hub tab must never open Member/Admin or administration sheets.
- **Signed out, Hub opens the log-in sheet**, which is the same `AuthModal` component presented bottom-anchored and full-bleed below 640px (`24px` top corners, ~82vh). One auth component, one Google path, one reset path: do not fork a second login form for phones.
- Reduced motion and Calm Mode drop sheet entrances and the seam flow; colors, glow, and every destination stay.

## NEXT roadmap cards

- This is a scoped roadmap family, not a new default for event, directory, board, or feed cards.
- Sequence: **THE HAÜZ → Z/SPACE → ZAYDARK → AfterZ → Zenegades → OUTZ → submit an idea**. Keep route numbers and DOM reading order synchronized.
- All product cards share one measured box: top-left status, top-right eyebrow, fixed logo region, contained object region, and lower copy/detail/action seam.
- Use approved product-logo assets. Do not typeset substitutes, distort marks, trim their authored transparent margins ad hoc, or change spelling.
- Cards use black deep glass with a black keyline, restrained Fluent 2 undertone, local accent bloom, and a thin rainbow edge/refract seam. Do not use a rainbow fill behind the card.
- App-specific maps, blueprints, notifications, posts, profiles, and symbols are **contained card objects**: clipped inside the card, behind copy, and clear of protected text/action regions.
- Route art, construction geometry, and large background motifs belong to one **fixed wallpaper stage** behind the full stack. Keep them bold at exposed gutters and masked through the reading lane. Do not reset wallpaper per card or convert contained objects into global wallpaper.
- Status labels use the existing small `pdxBlink` dot at top left. Status meaning remains in text; Calm Mode and `prefers-reduced-motion` leave the dot visible but static.
- The final submission card uses a white accent and visitor-facing idea language. It may route into the owner's inbox, but visitor copy must not disclose that internal destination.
- The roadmap is **two columns of cards along the timeline** at every width, not one card per row. Alternating sides left the opposite half of every row empty and ran the section past 5000px.
- At **721px and up** the centre spine stays and the cards flank it, with the markers lifted into the gutter. Two cards share one rail, so the second marker drops to its card's midpoint; level with the first it lands on top of it and only the later number shows.
- **Below 721px** there is no room for a spine: the rail is hidden, the tiles go two-up (matching Spaces and the z/ index), and the step number moves to the tile's top-left corner. That badge is an outlined ring with the digit in the accent, because the blob backdrop is too small to knock a digit out of at 24px.
- The card is drawn for a 490px column. Two-up it is 155 to 205px wide, so chip, mark, and copy step down a register, copy clamps to three lines, and contained card objects (phone mockups, maps, profile stacks) are dropped as illegible at that size. The tablet band needs its own scale: card height is locked by the 17/25 poster ratio, so fixed-size copy runs out the bottom.
- The submission card cannot work in a half-width tile: it takes the full row and sizes to its content.
- Preserve every card and its order, and prevent horizontal overflow at every width.
- Reduced motion stops the blink, rainbow flow, card glow cycle, route charge, and glitch; preserve static edge color, wallpaper, status text, marks, and all actions.

## Homepage front door

- Product-family names are exact: always render `EVENTZ`, `PLACEZ` (page title `OUR PLACEZ`), `OUTZ`, `THE HAÜZ`, `GIGZ`, `GIFTZ`, `SELLZ`, and `MIZZED CONNECTION` with this capitalization in public UI, metadata, accessibility labels, and current documentation. Existing lowercase routes, APIs, code identifiers, analytics keys, and asset paths remain compatibility internals unless a separate migration is approved.

## Z/ address continuity

- Existing indexed board URLs remain canonical. The Z/ index provides address discovery; established board pages do not add a second Z/ address strip or a separate board-switching navigation beside their hero.
- Primary site navigation remains the only page-level navigation on GIGZ, GIFTZ, MIZZED CONNECTION, and SELLZ. Each board keeps its identity and actions in the hero, then follows the shared stats, explainer-cell, active-board, and closing-seam rhythm.
- Approved product-family artwork uses a shared 1000×500 transparent canvas. Hero/header placements render that canvas at the same 620px maximum width, while repeated product cards use one shared optical frame per card system. Preserve the artwork's authored transparent margins; do not add per-logo shrinking, stretching, or compensating offsets. The Z/ index hero begins with Z/SPACE, and its board cards share one 460px optical frame. Fallback board names occupy the same structural slot; image alt stays empty where the adjacent heading already names the board.
- Places is the full-width center hub on the Z/ index and renders the public Directory categories with real counts. MY SQUADZ is not a Places category on this surface: the complete board owns `z/spaces`, with its own top-level card and logo, and resolves to the existing group-filtered Directory implementation.
- OUTZ is one top-level board card. Rooster Rock and Sauvie Island are nested destinations inside it, never peer cards or duplicate top-rail addresses.
- Board totals and the top address rail count top-level boards only. Nested address labels show only their terminal segment while links retain the full canonical route.
- `z/spaces` must preserve Directory listing identity end to end: real group records, existing detail pages, and the same persistent follow relationship used elsewhere in Places.
- User-facing address slugs are lowercase ASCII. When normalization repairs a shipped malformed slug, keep the old path as a compatibility alias rather than breaking saved links.
- Never fabricate listings, member totals, marketplace stock, or counts for pending Z/ boards. Loading, failure, unknown, empty, and not-built are distinct states.

- The homepage uses one full-bleed Welcome scene followed by a single horizontal, no-wrap rail of seven destination cards. It is not a wrapping grid, multi-row gallery, or full-page carousel.
- The counter strip occupies the seam immediately after the main Zaylist hero and before the destination rail. Its bottom edge aligns exactly with the hero end; do not float it deeper into the hero or leave a separate spacer before the rail.
- Keep the counter strip and every counter cell transparent, with no per-cell fill. Place one vertical gradient behind the full strip with exact endpoints: 100% transparent at the top and 80% black (`rgba(0,0,0,.8)`) at the bottom. Place the rainbow divider directly below the counter, with no extra band, gap, or duplicate divider.
- On mobile, counter cells share the available width equally and keep values and labels readable. Verify cell bounds, hero copy, divider, and the following rail do not overlap at compact widths.
- The destination rail owns its section padding, modest consistent gaps, top/bottom dividers, and horizontal overflow. On motion-capable desktop it flows seamlessly from right to left at exactly **68.4 seconds per cycle** (10% faster than the prior timing).
- Keep one semantic seven-card sequence. If seamless looping requires presentational clones, mark them `aria-hidden`, unfocusable, inert, and exclude them from analytics; never add a second visible rail or expose repeated destinations to assistive technology.
- Mobile, Calm Mode, and `prefers-reduced-motion` disable rail autoplay and keep the same order in a manual touch-scroll rail with card snap points, readable peek, 44px actions, contained overscroll, and no document/page horizontal overflow.
- Current founder order starts with OUTZ, then EVENTZ, PLACEZ, THE HAÜZ, GIFTZ, GIGZ, and MIZZED CONNECTION.
- The Nude Beaches world shows live Rooster Rock air, water, wind, and river conditions over its neutral gray topographic motif.
- The existing site navigation remains outside the homepage pattern and must not be duplicated inside it.
- Each world uses the deep-glass shell with one `--c` accent. Calm Mode removes ambient video and bloom while preserving every route and label.
- Every destination world uses a near-black backdrop. Restrained static/scan or brief glitch texture sits beneath its contained object motif, never above copy, controls, metadata, or focus rings.
- The destination rail uses grain/static only, not a drafting grid. Each card is an isolated object: all internal UI stays fixed to its shell, and environmental bloom/shadow responds to the outer card silhouette.
- The destination rail always supports direct manual horizontal scrolling. Pointer/touch grab immediately pauses autoplay for the session so animation never fights the person’s movement.
- The homepage Beaches object shows matching live-stat rows for Rooster Rock and Sauvie Island from the shared `/api/nude-beaches` snapshot. The Sauvie Island title is green; do not add a Collins Beach title or sublabel.
- The Places object may carry the approved Portland drafting reference behind—not over—the directory matrix. The Flyers destination uses its active flyer edge-to-edge as the full card background with metadata layered inside the same contained object.
- All seven destination shells keep the same height and bottom action datum. Scale dense Beaches and Missed Connections internals—not the outer cards—until copy, sample, divider, action height, and bottom padding align with their siblings.
- Homepage world cards carry only a restrained Fluent 2 undertone: quiet inner highlight, composed corner, low elevation, and one-pixel hover lift. Do not import Fluent palette or replace deep glass.
- The outer Events world is the flyer stage, with no inset card or reserved bands. The flyer covers the full surface from top edge to bottom edge; header, event information, and position controls overlay that single image. It advances through upcoming events unless Calm Mode or reduced motion is active.
- The Events flyer stage always shows its active position counter and rail. When local upcoming data is empty, it uses the canonical `HOME_STAGE_DEMO_SAMPLES.events` fallback from the repository.
- The Places world uses a low-contrast Portland street-and-river map motif behind the directory story.
- Places uses a reduced app-tile launcher sourced from `/api/directory`, with two fewer rows than the former layout: 8 columns by 3 rows on larger screens and 5 columns by 6 rows on phones. Render only the visible capacity in stable source order so the footer/action aligns with sibling cards.
- Haüsing, GIFTZ, GIGZ, and MIZZED CONNECTION use full-card object motifs at a stronger register than the river and Places maps: house floor plan, gift-box blueprint, pinned bulletin board, and lost/found/looking notices respectively.
- The homepage NEXT preview uses one six-card set. Three cards enter from the left and three from the right at the same time, collide at center, overshoot, rebound once, make one short restrained wiggle, and settle into a centered overlapping stack. After landing, a staggered 1–2px slow float may keep the stack alive; Calm and reduced-motion stay perfectly still.
- Put the rainbow divider immediately above the NEXT preview section. Its heading is exactly **“SEE WHAT I’M BUILDING NEXT.”** Only **“NEXT.”** is red; keep every preceding word in the standard high-contrast heading color.
- The full NEXT section uses a distinct cool-navy clipped topographic/trail-map blueprint field plus exactly three scattered copies of each of the two approved drafting references. The six motifs cannot touch. Keep every form monochrome, low opacity, non-parallax, and behind the heading and card stack; mobile may reduce the count.
- Add exactly three low-opacity ambient orbs behind all NEXT content: cyan, navy, and orange. They may drift independently but never move the map/logo field or create scroll-linked parallax. Mobile may hold them still; Calm Mode and `prefers-reduced-motion` always freeze them.
- Protect the section's copy and card faces with quiet negative space or masking. Logo ghosts may crop at section edges but must not compete with card identities, status labels, actions, or focus rings, and must not imply an additional product.
- The NEXT panel background has **no parallax at any breakpoint**. Its map and oversized logo ghosts remain stable while cards animate above them. Mobile uses a simplified authored crop with fewer ghosts; Calm Mode and `prefers-reduced-motion` preserve the same still field.
- The NEXT six-card crash stack is separate from the looping seven-destination rail and never loops, auto-advances, or clones cards.
- NEXT preview cards retain their individual logos, accents, statuses, and contained objects. Shared dimensions and coordinated motion provide continuity; never clone one product identity across the set or duplicate cards to fake depth.
- Calm Mode and `prefers-reduced-motion` skip the off-screen arrival and impact, rendering the final six-card stack immediately. The final stack remains fully labeled and does not become a static marquee.
- A single light transparent static/scan overlay may sit on the homepage wallpaper behind every content object. It is decorative, `pointer-events: none`, hidden from assistive technology, and must not reduce the legibility of type, logos, controls, imagery, statuses, or focus rings.
- The wallpaper overlay may occasionally make one short, subtle displacement. Move only the texture, never the content; do not run a continuous glitch or add a duplicate noise/marquee layer. Calm Mode and `prefers-reduced-motion` preserve the texture as a still layer and remove displacement.
- Homepage background depth uses a restrained set of black and dark-gray shadow planes. Stack them behind the static/scan texture and behind every content object; they remain decorative and pointer-free.
- On capable desktop, only those shadow planes may use subtle, low-distance differential parallax. Never move cards, headings, body text, controls, focus rings, logos, contained objects, or the texture with them.
- Mobile uses a stable lightweight still version of the shadow planes. Calm Mode and `prefers-reduced-motion` retain the tonal layers but remove all parallax.
- On mobile, the homepage hands directly into the footer. The footer owns dock clearance; do not insert a second dock-height spacer after the final homepage seam.

---

## Source chain for agents

```
zaylist-foundation-library  public/design-system/   (branch: main)
        = written standard + specimens (SoT for design)
        published at .../design-system/ by the Cloudflare Worker
        ↓  implement in product
pdx-pride-guide  docs/LIVE_DESIGN_STANDARD.md       (branch: master)
        = this trap list, kept in step with the guide
        ↓
client/src/components/ds/tokens/*   ← live token modules (glass, chrome, colors, …)
client/src/components/ds/*          ← React components
client/src/pages/*.css              ← page chrome
        ↑  if product drifts, fix product or mark guide "queued"
```

There is no mirror script and no `design-system/` directory in this repo. Read the guide
from the `zaylist-foundation-library` checkout or the published site.

Before inventing a new global rule:

1. Check **`public/design-system/guidelines/`** and **`public/design-system/tokens/`** in `zaylist-foundation-library`, starting with the five sources of truth above.
2. Look at **production component CSS** for that surface.
3. Prefer a token in `glass.css` / `chrome.css` / `effects.css` over a one-off.
4. If you change a global default, update the **design guide** in `zaylist-foundation-library` and this trap list in the same ship.

---

## Related docs (role)

| Doc | Role |
|-----|------|
| `zaylist-foundation-library` `public/design-system/` | **Design guide** - source of truth for the system (not in this repo) |
| `docs/LIVE_DESIGN_STANDARD.md` | **This file** - production trap list / implementation notes |
| `docs/DESIGN_SYSTEM_INTEGRATION.md` | How product maps to the guide |
| `docs/BOARD_CARD_STANDARD.md` | Board triad / rainbow seam / feed structure |
| `docs/handoffs/deep-glass-2026-07-16/` | **Historical** migration package - not active work orders |
| `AGENTS.md` | Ship rules + points at the design guide |

---

## Quick agent checklist

- [ ] CTA uses the glow treatment (`--btn-glow-bg` / `--btn-glow-shadow`) - **not** default brutal offset; solid accent fill only on the one primary action  
- [ ] Card uses glass-card + sheen + rebind - **not** flat `#0b0b0b` + only `#2b2b2b`  
- [ ] Related writing stays continuous; cards are reserved for independent objects  
- [ ] 8% `--neon-bloom` composed, never hand-rolled  
- [ ] Map frame debossed - **no** outer bloom (maps are the sole exception)  
- [ ] Claim sticker cyan soft-offset - **no** yellow rim  
- [ ] Grid ads/events match live components  
- [ ] Past events only under PAST  
- [ ] Nav untouched unless asked; if asked, glow is **hover only**, there is no bottom-nav pull handle, and Hub navigates to `/dashboard` instead of opening an admin/member drawer  
- [ ] NEXT cards keep approved order, fixed wallpaper, contained objects, static reduced-motion equivalents, and final white idea card
- [ ] Docs updated if a global default changes  
