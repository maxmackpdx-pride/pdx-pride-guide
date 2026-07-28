# Handoff: ZAYLIST HAÜSING (Housing board)

## Overview

HAÜSING is ZAYLIST's Housing board: a trusted community board where queer Portland finds rooms, roommates, and households. Four post types, feed-first discovery, consent-based first contact, and the flagship "Forming a HAÜS" workspace where people build a household together before they have a place.

Target repo: `maxmackpdx-pride/pdx-pride-guide` (branch `master`). The product docs this was built from live in that repo at `docs/HAUS_ENGINEERING_HANDOFF.md` (what to build, complexity ratings, repo map) and `docs/HAUS_HOUSING_SPEC_v0.2.md` (the why). **Read those first.** This README covers only what the prototype adds: the visual and interaction decisions the docs left open.

## About the design files

Everything in this bundle is a **design reference built in HTML/JSX**, not production code. It runs standalone in a browser with in-page Babel and no build step, which is exactly what production must not do. Your task is to **recreate these designs inside the existing client** (React + Vite, TypeScript, `client/src/`), using the repo's established patterns:

- new board of the same shape as Gifting / Missed Connections / Gig Board: table + insert schema in `shared/schema.ts`, storage methods in `server/storage.ts`, routes in `server/routes.ts`, page in `client/src/pages/`, card in `client/src/components/board/`
- feed integration through `getHubFeed` (`server/storage.ts`), `shared/hubFeed.ts`, `HubFeed.tsx` / `HubFeedCard.tsx`
- messaging through the existing `messages` / `thread_id` model and the floating inbox (`useInboxSheet` / `InboxOverlay`), plus a pending-request state
- listing create/edit modeled on `AdBuilder.tsx` (form beside a live card preview)
- managed-property auto-ingest modeled on the trusted event scrapers (`shared/trustedVenues.ts`, `server/ingest/adapters/`, `server/qsearch/scanJob.ts`, a new tab in `QSearchDashboard.tsx`)

Do not port the prototype's local state store, hash router, or `window.HAUS` data module.

## Design standards: this is built on the Zaylist design system

**All styling comes from the Zaylist design system. Do not invent colors, type, radii, or components.** In the repo that means:

- tokens: `client/src/index.css`
- deep-glass card system: `client/src/components/ds/tokens/glass.css`
- components: `client/src/components/ds/`
- the live-is-truth rule: `docs/LIVE_DESIGN_STANDARD.md`
- the 32-icon line set: `assets/icons/` (inline SVG, 24px grid, 2.2 stroke, round caps, inheriting `currentColor`)

Housing cards are **variants of the existing deep-glass card**, not new components. The bundled `_ds/` folder is a copy of the design system used to author the prototype; it is there so the HTML runs. Build against the repo's own `ds/` tree, not this copy.

**Footgun that will bite you:** any element that sets its own accent (`--c`) must also carry `.pdx-glass-rebind`, or it silently falls back to root cyan. Every accent-scoped surface in the prototype does this.

**Content rules:** no em dashes anywhere in user-facing copy. Keep the Zaylist voice: plainspoken, short sentences, UI chrome in ALL CAPS condensed, body in sentence case. "Trans affirming," not "trans safe," in the platform's own voice.

## Fidelity

**High fidelity.** Colors, type, spacing, motion, and interaction states are final and should be matched. Copy in the prototype is production-intent for chrome and labels; the listing content is plausible PDX sample data, not real.

## Board accents (the one thing to get right first)

The board runs on `--board-housing` softened cyan, and each post type rebinds `--c` for its own subtree:

| Type | Accent | Token |
| --- | --- | --- |
| Board chrome, Looking for housing | `#19e3ff` | `var(--panel-cyan)` |
| Offering a room | `#ff8c00` | `var(--panel-orange)` |
| Forming a HAÜS | `#39FF14` | `var(--green-acid)` |
| Managed property | `#b06bff` | `var(--panel-purple)` |

Every card, detail view, and composer sheet sets all three of `--c`, `--_c`, `--hz-accent` to its type accent and carries `.pdx-glass-rebind`. Chips, buttons, borders, glows, and the photo-well radial all `color-mix` off `--c`, so nothing downstream hard-codes a color.

## Screens

### 1. Board landing (`Board` in haus-feed.jsx)

Top to bottom:

1. **Running head** — mono LIVE dot + "HAÜSING · Housing board", then a **thick rainbow seam** (`--seam-h-thick`, 2.7px) underneath. Matches every live page.
2. **Hero** — `HAÜSING` at `clamp(4.5rem, 11vw, 7.5rem)` in Barlow Condensed 900, with an **acid-green BETA sticker** beside it (lit plate: `--green-acid` fill, `--chrome-keyline`, `--chrome-bevel`, floor bloom, rotated -7°). Lede at `--body-lg` capped to `min(50%, 54ch)`, mono mantra "Find a room · find people · find a home". Behind it, four scattered outlined signs (FOR RENT cyan, NEED ROOMMATES orange, FORMING HOUSE violet, LOOKING FOR ROOM lime) at varied tilt and opacity.
3. **How it works** — three panels on `--panel-band`, each with a 3px top rule in one of the type accents (orange / cyan / acid green), a mono step numeral, a DS icon (add / boards / message), a display title and a line of body.
4. **Thin rainbow seam**, full bleed, flush on top of the stats band.
5. **Stats band** — 3 columns on `--panel-band` with `--panel-border` block borders, huge tabular numerals, mono labels.
6. **Post to the board** — panel with a 2-column grid of four type cards, each accent-scoped. Fourth is Managed property (see below). Footnote: Zaylist never handles rent, deposits, or fees.
7. **Show me** filter row — mono label plus a tab bar (All / Offering a room / Looking for housing / Forming a HAÜS / Managed property / Saved), 4px underline in the board accent when selected, separated from the compose panel by a hairline.
8. **Feed** — 2-column grid on desktop (`repeat(2, minmax(0, 1fr))`, `grid-auto-rows: 1fr`, 18px gap), 1 column on mobile. Forming cards span both columns (`grid-column: 1 / -1`).
9. **Close seam** — full-bleed rainbow seam then the mantra "Post it. Scroll it. Chat." and `zaylist.com/hausing`. Mirrors `BoardCloseSeam.tsx`.

### 2. Cards (four variants, one shell)

Shared anatomy, in order: type label (mono kicker) → photo well → meta line → body line → facts grid → chips → community context → actions.

**Photo well** is the signature. `position: relative`, `--chrome-radius-md`, 4px bottom border in `--c`, radial background, a photo layer that cross-fades over 0.35s, a bottom-weighted scrim (`rgba(5,5,6,.15)` → `.86`), a scanline overlay at 0.18, prev/next arrows when there is more than one photo, and a flex-column content stack: **title band, spacer, caption row**. The caption row holds the avatar cluster on the right and the position dots on the far left.

**Title motif** — the household or person name set bold across the cover photo, one word per line, every line scaled to the same width. This is the most detailed piece of the design; its full algorithm, the height budget, the per-surface width caps, and the character limit to enforce in the composer are documented in **`TITLE_MOTIF.md`** in this bundle. Read that before implementing the card.

**Avatar cluster** — DS `Avatar` with flag rings, overlapping about -8px, wrapping in rows of three and scaling down after the third row. Open spots render as dashed "Open" slots. Pets render slightly smaller than people. Off-platform housemates carry a "Not on Zaylist" badge and open an invite card rather than a profile; pets open a playful "Zay-VIP-List" mini profile.

Per variant:

- **Looking for housing** (cyan) — person's name over their photos, "Meet <first name>", facts: Budget / Move / Areas, chips: "Open to a HAÜS" when flagged, plus self-described living style. Actions: Save, Share, Chat.
- **Offering a room** (orange) — house name over the house photos, "Meet the household", facts: Rent / Move in / Where, culture chips. Actions: Save, Share, Chat. No openness flag: an offering post is just offering a room.
- **Forming a HAÜS** (acid green) — full width, house name (or "BUILD A HAÜS" when no place is picked yet), cluster with open slots, facts: Combined budget / Move in / Looking in, chips: "Looking for N more" or "We are full", plus flavor. Actions: Save, Share, Ask to join (or Join the waiting list when full). Optional "Forming around <property> · managed by <manager>" link when it was built from a managed listing.
- **Managed property** (purple) — same shape as Offering, but a "Property manager" verified badge where the household would be, no avatar stack, open slots, pets, openness chip, or community context. Meta line shows freshness ("Updated 2 hours ago"), chips are unit facts plus affirmative affordability badges (Accepts Section 8, Income restricted, Accessible unit). Actions: Save, **Build a HAÜS**, **Details**. No chat.

### 3. Detail views

Shared: back link, photo well with the title motif at a 35% width cap, chip row with type + verification, display title, meta line, body, then sections (`SectionTitle` = mono kicker + display line + optional right-aligned mono), and a sticky action bar.

- **Looking for housing** — about, what they are looking for, community context, and a poster-side panel offering "Turn this into a HAÜS" (same post, same replies, plus a workspace).
- **Offering a room** — Meet the household (people, off-platform members, pets), house culture chips, honest numbers (two panels, monthly vs move-in, "paid to the household, off Zaylist"), access as standard information, approximate map, the room.
- **Managed property** — unit tiles (bedrooms / bathrooms / parking / outdoor) plus affordability badges, honest numbers ("paid to the manager, off Zaylist"), access, approximate map, a "Renters organizing" section (below), and who is renting it with the link out. Source line states which manager site the listing was pulled from.
- **Forming a HAÜS** — see the workspace below.

Action bars: Save on the left, primary on the right. Chat labels name who you are talking to. Managed property replaces chat with the manager's listing URL in mono plus a **View listing** button.

### 4. Forming a HAÜS workspace

Warm and social, not project management. A tab bar (House chat / Places / Dates / People, each with a DS icon) over an ink panel.

- **House chat** — the normal group thread.
- **Places** — external links the group bookmarks, each a row with title, rent, neighborhood, source domain, who added it, reactions and comments, and a status (Interested → Touring → Applied → Passed / Chosen). Note that Zaylist is not listing these places.
- **Dates** — a few key dates with a mono reminder line and the alerts icon. No Gantt, no tasks.
- **People** — members with roles, open slots, and the Lead's pending join requests with accept / decline.

### 5. Build a HAÜS from a managed listing

The bridge between the fourth type and the flagship.

- "Build a HAÜS" creates a **place-in-mind** Forming post pre-seeded from the listing: name derived from the property (unit numbers and words like ADU stripped, locked HAÜS suffix appended), photos, rent as combined budget, neighborhood, and the body line describing the unit.
- The workspace is seeded too: the unit is the shortlist **target** (status Interested), and the listing's availability date plus a "talk to the manager" beat land in Dates.
- **No claim, non-exclusive.** The listing stays live. Model it as many forming posts → one managed listing, not a status flip.
- **Interest indicator** on the listing: "<Lead> is putting together roommates to secure this place" or "N groups are putting together roommates for this place", linking through.
- **Group stack** in the listing's "Renters organizing" section: each Lead, member count, open slots, and Ask to join.
- **One per person per property.** If you already lead one, the button becomes "Open your HAÜS."
- **Graceful teardown.** When the manager removes the listing it leaves the feed and reads off market; every attached HAÜS is rewritten to the find-a-place-together flavor (title, body line, and about all updated), its shortlist target flips to Passed and loses the "· the target" suffix, and the seeded manager dates are replaced by "Keep hunting together". The group survives the listing.

### 6. Composer (one question)

Type picker sheet: four accent-scoped cards. Then per type, a short field set: name, headline, own words, rent or budget, available or move timeline, neighborhoods, and a called-out photo upload whose copy states that the first photo is the cover the name sits over.

- Offering and Forming show the **locked HAÜS suffix** inline: the poster types only the front part, the suffix sits in a joined accent-tinted cap, and the hint explains the rule. Store the front part, append on render.
- Offering has "Who lives here": real housemates, plus off-platform members uploaded as photo and first name (with a note that this needs the roommate's OK), plus pets.
- Looking has "Coming with you" and the "Open to forming or joining a HAÜS" flag.
- Forming picks a flavor: place in mind, or finding a place together.
- Managed property has no household UI. Fields are unit-level plus bedrooms / bathrooms / parking / outdoor, the name field is "Property name" (real name, no suffix), and a note states you are posting as the verified manager.

**The Managed property tile is an entry point, not a form.** Approved managers land on their property-manager page: their own listings (derived from listings whose manager matches the signed-in account, edit-details-only, adding and removing is owner side), their scoped QSearch trusted scan (source domain, last successful scan, units pulled in, adapter health, run and preview actions), the Affirming Housing Partner membership note, and a hand-post fallback. Everyone else gets the application: company, rental website for domain-ownership check, business license, directory match, and a note that verification is free and required and cannot be bought. Applications go to the owner.

Posted confirmation sheet: mono "It is on the board", "You are on Zaylist", share and see-it-in-the-feed.

## Interactions and behavior

- Photo wells cross-fade at 0.35s with `--ease-out`; arrows stop propagation so they do not open the post.
- Cards lift 2px on hover over 0.15s. Buttons lift on hover, press down.
- Ambient pulses about 4s. Entrance: hero fades up 10px over 0.48s, stats +0.07s, feed 0.35s, sheets 0.2s.
- Sheets close on backdrop click and stop propagation inside; max height 92% with internal scroll.
- Toasts confirm state changes and clear after 2.6s.
- Requesting to chat is consent based: the request is pending until the recipient accepts. Asking to join a HAÜS is the same gesture. Declining is quiet.
- **Calm mode** flattens seams to static, kills grain and glow, and keeps flag rings. Reduced motion does the same.

## State

Post: id, type, author, posted, title, line, photos, area(s), plus per type: budget / timeline / living / open (looking), rent / rentNote / deposit / moveIn / room / household / culture / pets / access (offering), house / flavor / seeking / members / full / goals / around + aroundId (forming), manager / site / beds / baths / parking / outdoor / badges / seen / source / gone (managed).

Interaction state: saved, joined (pending requests), waitlist, full override, threads, workspace per forming post (places, dates, requests, chat), compose sheet, filter, toast.

## Design tokens used

All from the design system, referenced by var:

- colors: `--panel-ink`, `--panel-band`, `--panel-card`, `--panel-border`, `--panel-border-2`, `--ink-850`, `--board-text`, `--board-muted`, `--text-hi`, `--text-lo`, `--text-faint`, `--text-inverse`, `--panel-cyan`, `--panel-orange`, `--panel-purple`, `--green-acid`, `--acid-lit-chip`, `--rainbow-bar`
- type: `--font-display` (Barlow Condensed), `--font-body` (Inter), `--font-mono`, `--fw-black`, `--fw-bold`, `--title-md`, `--title-sm`, `--body-lg`, `--body-md`, `--meta`, `--meta-sm`, `--mono-kicker`, `--mono-micro`, `--tracking-display`, `--lh-body`
- chrome: `--chrome-radius-md`, `--radius-panel`, `--radius-tile`, `--radius-sm`, `--radius-pill`, `--chrome-keyline`, `--chrome-bevel`, `--chrome-ink-fill`, `--glass-card-radius`, `--glass-card-border`, `--poster-well-scan`, `--seam-h`, `--seam-h-thick`, `--ease-out`, `--ease-inout`

Two raw values are intentional and not tokens: the photo scrim gradient stops and the title motif's hard drop shadow `0 3px 0 rgba(0,0,0,.55)`.

## Assets

- `uploads/sample-media/` — sample photography for the prototype only (avatars, houses, bedrooms, pets, PDX lifestyle, and a default graphic for a Forming post with no place yet). **Do not ship these.** Replace with real uploads through `POST /api/upload/*`.
- Icons are inlined SVG copies of the design system's line set (`assets/icons/`): message, share, favorite, home, events, venue, verified, community, connection, add, search, boards, safety, navigate, close, profile, alerts, paw. Use the repo's own icon set.
- `_ds/` — a copy of the Zaylist design system so the prototype runs standalone. Reference the repo's `client/src/components/ds/` instead.

## Files in this bundle

| File | What it is |
| --- | --- |
| `HAUS Board.html` | Entry point. Loads React, the design system bundle, then the prototype files. Open this. |
| `haus.css` | Every board surface: hero, signs, steps, stats, cards, photo well, title motif, clusters, workspace, sheets, seams. |
| `haus-ui.jsx` | Shared primitives: context, type accents, Mono, Icon set, Chip, Btn, Trust, Cluster, Person, Pet, Fact, Tile, Row, Well (the photo well and title motif), SectionTitle, Sheet, CloseSeam. |
| `haus-feed.jsx` | Running head, hero, how it works, stats, composer entry, filter row, the four card variants, feed. |
| `haus-detail.jsx` | Looking, Offering, and Managed detail views, the action bar, community context, safety, chat. |
| `haus-workspace.jsx` | The Forming a HAÜS detail and its workspace tabs. |
| `haus-app.jsx` | Prototype-only: state store, hash routing, composer and property-manager sheets, viewport toggle, tweaks. Reference for behavior, not structure. |
| `haus-data.js` | Sample content. Not production data. |
| `TITLE_MOTIF.md` | How the name-over-photo motif is computed. Required reading for the card. |
| `ios-frame.jsx`, `tweaks-panel.jsx` | Prototype scaffolding for the phone frame and the tweak panel. Do not port. |

## Tweaks in the prototype

Toggles that exist to show alternatives, not features to build: avatar prominence (subtle / standard / hero), community context on or off, Lead workspace on or off, calm mode, and verified manager account (flips the Managed property entry point between the manager page and the application).

## Before you commit

- `npx tsc --noEmit` reports pre-existing errors unrelated to Housing. Record the baseline first; do not increase it.
- The server bundles to one CJS file, so anything read from disk at module load works in dev and crashes the deploy. Import assets or serve them from `client/public/`.
- Ship the first vertical slice as "Looking for Housing" end to end, then Offering a Room, then the Forming workspace last.
- Do not build dropdowns or filters that rank, hide, or steer by protected characteristics. Preferences stay user authored. Fair Housing review by an Oregon or Portland attorney is required before public launch.
