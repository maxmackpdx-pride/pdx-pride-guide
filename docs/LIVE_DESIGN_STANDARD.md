# Live design standard (implementation checklist)

**Design guide (written standard + specimens):** [`design-system/`](../design-system/) and the public site [Zaylist Design System](https://maxmackpdx-pride.github.io/zaylist-design-system/). That package is the **source of truth for design rules**. Do not maintain a second kit.

**This file** is the **production trap list** for agents shipping React/CSS: what not to re-introduce, and where chrome lives in code. It must **not contradict** `design-system/`. If it does, fix this file (or product), not invent a third guide.

| Priority | What | Path |
|----------|------|------|
| **1 - Design guide** | Written standard + specimens | `design-system/` · https://maxmackpdx-pride.github.io/zaylist-design-system/ |
| **2 - Implementation** | Production React + CSS | `client/src/components/ds/**`, page CSS, adapters |
| **3 - Token modules (code)** | Live token files used by the app | `client/src/components/ds/tokens/` especially **`glass.css`** |
| **Archive** | Migration package + screenshots | `docs/handoffs/deep-glass-2026-07-16/` |

If an old handoff, sandbox, or removed portable preview **disagrees with the design guide**, **the design guide wins**. If product code disagrees with the guide, either ship product to match or mark the guide panel **queued**.

---

## Do not re-introduce (global traps)

These used to be “the rules.” They are **retired** as defaults. Agents must not restore them sitewide.

| Retired default | Live rule instead |
|-----------------|-------------------|
| Brutal magenta offset as **default CTA** (`4px 4px 0` magenta) | **Glass buttons** - `.pdx-glass-btn` / `.pdxBtn` / solid fill, black ring, **no outer neon bloom** |
| Lite-glass translucent cards + hard `#2b2b2b` only | **Deep-glass** - `--glass-card*`, black ring + neon edge, sheen, poster-well |
| Map outer neon bloom / thick glow frame | **Debossed map well** - thin black rim + inward hole (`--map-frame-shadow`); no outer bloom |
| Sitewide cyan “pull” above bottom nav | **Removed**; hub drawer grip only |
| Claim chip = yellow rim + magenta offset brutal sticker | **Claim this event** = pure `#00FFFF` fill, dark type `#050506`, soft cyan offset `3px 3px 0 rgba(0,255,255,.35)` (no yellow border) |
| “Event details →” dead text on grid cards | **Omit**; card click opens modal |
| Board “past” = missed-connection 7-day window | **Past** = scheduled `dateEnd` passed (`isEventSchedulePast` / `getEventScheduleTiming`) |
| Mr. S ad primary `#ff0033` (red) | Mr. S = **cyan** `#19e3ff`; CockBlock = **red** `#ff1f1f` |
| Ads that don’t match grid/feed | Builder must use **`PosterAdCard` / `FeedAdCard`** + live templates in `lib/adTypes.ts` |
| Day color on primary RSVP | RSVP / primary action accent stays **lime** `#CCFF00` where reserved; day colors are data only |
| Touch nav chrome without explicit ask | **Nav locked** unless user requests - black outlines; cyan for active/handle only |

`--brutal-shadow*` tokens may remain for **intentional stickers** only. Never wire them as the default for buttons, tickets, Shop Now, or “I’ll be there.”

---

## Canonical surface recipes (implementation)

| Recipe | Token / class | Used for |
|--------|---------------|----------|
| Accented card | `--glass-card-*` + `.pdx-glass-rebind` + local `--c` | Event board, places, boards, ads |
| Neutral card | `--glass-card-neutral-*` | Work rows, neutral panels |
| Poster media | `--poster-well-*` / `.pdx-poster-well` | Flyer wells, ad media |
| Primary CTA | `.pdx-glass-btn--solid` or `.pdxBtn--solid` | Tickets, Shop Now, filled actions |
| Default glass CTA | `.pdx-glass-btn` / `.pdxBtn` | Secondary glass controls |
| Map frame | `--map-frame-shadow`, mapTheme | Events / directory / beach maps |
| Map key / legend | `.map-legend` / `.directory-map-key` / `.pdxLegend` → **neutral deep-glass** (`--glass-card-neutral-*`) | All maps; pin swatches unchanged; no lime/cyan panel bloom |
| Claim sticker | `.pdxBoard__claim-tag` / `.event-card-meta-tag--claim` | Unclaimed listings only |
| Rainbow top seam | `.pdx-rainbow-rule` / card `::before` | Clickable cards (see board standard) |

**Accent contract:** set `--c` (and rebind with `.pdx-glass-rebind`) per instance. Day colors → event cards; board accents → gigs/gifts/spotted; brand accents → ads.

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

## Maps

- Debossed OLED frame; keys = OLED panel chrome, pin **shapes** preserved.
- No sitewide outer map bloom.

## Motion

- Prefer existing tokens + `pgDirCardIn` entrances.
- Calm / `prefers-reduced-motion` kill ambient pulses and seam animation (bar may stay static).
- See archive `GROK_ANIMATION_MIGRATION.md` only for inventory - do not re-migrate.

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
- Mobile is a single vertical stack: hide the center rail/number medallions, preserve every card and its order, scale or relocate contained objects intentionally, and prevent horizontal overflow.
- Reduced motion stops the blink, rainbow flow, card glow cycle, route charge, and glitch; preserve static edge color, wallpaper, status text, marks, and all actions.

## Homepage front door

- Product-family names are exact: always render `GIGZ`, `GIFTZ`, and `MIZZED CONNECTION` with this capitalization in public UI, metadata, accessibility labels, and current documentation. Existing lowercase routes, APIs, code identifiers, analytics keys, and asset paths remain compatibility internals unless a separate migration is approved.

## Z/ address continuity

- Existing indexed board URLs remain canonical. The additive Z/ address layer is visible as a compact, 44px-tall board marker; it never replaces the primary site navigation or duplicates it inside a hero.
- The marker links back to `/z`, labels the current lowercase ASCII Z/ address, keeps calm-mode and keyboard focus behavior, and must not create horizontal overflow on compact screens.
- On the Z/ index, family wordmarks use the owner-approved 144px height. Fallback board names occupy the same structural slot; image alt stays empty where the adjacent heading already names the board.
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
- Current founder order starts with Nude Beaches, then Events, Places, Haüsing, GIFTZ, GIGZ, and MIZZED CONNECTION.
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
design-system/  (+ public Pages guide)
        = written standard + specimens (SoT for design)
        ↓  implement in product
client/src/components/ds/tokens/*   ← live token modules (glass, colors, …)
client/src/components/ds/*          ← React components
client/src/pages/*.css              ← page chrome
        ↑  if product drifts, fix product or mark guide "queued"
npm run sync:design-system          ← mirror from zaylist-design-system checkout only
```

Before inventing a new global rule:

1. Check **`design-system/guidelines/`** and **`design-system/tokens/`**.
2. Look at **production component CSS** for that surface.
3. Prefer a token in `glass.css` / `effects.css` over a one-off.
4. If you change a global default, update the **design guide** (and this trap list if needed) in the same ship.

---

## Related docs (role)

| Doc | Role |
|-----|------|
| `design-system/` | **Design guide** - source of truth for the system |
| `docs/LIVE_DESIGN_STANDARD.md` | **This file** - production trap list / implementation notes |
| `docs/DESIGN_SYSTEM_INTEGRATION.md` | How product maps to the guide |
| `docs/BOARD_CARD_STANDARD.md` | Board triad / rainbow seam / feed structure |
| `docs/handoffs/deep-glass-2026-07-16/` | **Historical** migration package - not active work orders |
| `AGENTS.md` | Ship rules + points at the design guide |

---

## Quick agent checklist

- [ ] CTA uses glass-btn / pdxBtn - **not** default brutal offset  
- [ ] Card uses glass-card + sheen + rebind - **not** flat `#0b0b0b` + only `#2b2b2b`  
- [ ] Map frame debossed - **no** outer bloom  
- [ ] Claim sticker cyan soft-offset - **no** yellow rim  
- [ ] Grid ads/events match live components  
- [ ] Past events only under PAST  
- [ ] Nav untouched unless asked  
- [ ] NEXT cards keep approved order, fixed wallpaper, contained objects, static reduced-motion equivalents, and final white idea card
- [ ] Docs updated if a global default changes  
