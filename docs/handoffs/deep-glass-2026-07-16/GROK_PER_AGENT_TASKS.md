# Zaylist - Per-Agent Migration Tasks

**How to use this file:** spin up **one agent per section below**. Each block is a self-contained work order: the surface it owns, the source files to edit, exactly what changes, which universal tokens to point at, the screenshot to match, and where in the reference build (`Card System.html`) to look. Every agent shares the same token contract from `GROK_MIGRATION_PROMPT.md §1` - read §1 first, then only touch your section. Do not redefine tokens; point at them. Do not change layout, spacing, radii, fonts, or type scale - this is a **surface/edge/glow** migration only.

Shared inputs every agent gets:
- `GROK_MIGRATION_PROMPT.md` - §1 is the token contract (the source of truth for values).
- `Card System.html` - the built reference. Search it for the section's anchor label (the mono uppercase heading) to find the exact markup + inline values.
- `screenshots/<file>.png` - the intended output for your section.
- Repo: `maxmackpdx-pride/pdx-pride-guide`.

**Definition of done (all agents):** your surface matches its screenshot; every color/edge/glow value resolves to a §1 token (no hard-coded one-offs); calm-mode + `prefers-reduced-motion` disable all glow/animation; layout diff vs. old is zero.

---

## AGENT 1 - Event Cards
- **Owns:** `client/src/components/ds/EventCard.tsx`
- **Reference:** screenshot `01-event-cards.png`; in `Card System.html` search **"EVENT CARDS"**.
- **Change:** replace the translucent `.pdxBoard` fill with `--glass-card` (`--c` = the event's day color). Add the corner sheen overlay and the prismatic refraction seam. Move the poster into the poster-well (radial + `border-bottom:4px day` + scanline). Convert the CTA to a primary glass button. Tag pills stay as-is. "Claim this event" may keep the hard magenta offset as an intentional sticker - everything else loses it.
- **Tokens:** §1.1 card, §1.2 sheen, §1.3 seam, §1.4 poster-well, §1.5 button.

## AGENT 2 - Open Event (detail modal)
- **Owns:** `client/src/components/EventModal.tsx` (+ shared `Overlay.tsx`)
- **Reference:** `02-open-event.png`; search **"OPEN EVENT"**.
- **Change:** panel becomes `--glass-card` (day accent) + refraction seam; poster header uses the poster-well. Tickets button + host actions (Edit / Add to Calendar / Message) become glass buttons - primary = day color, secondary = outlined glass. "3 Going" pill and RSVP pills become outlined-glass.
- **Tokens:** §1.1–1.5.

## AGENT 3 - Directory Cards
- **Owns:** `client/src/components/ds/PlaceCard.tsx`
- **Reference:** `03-directory-cards.png`; search **"DIRECTORY CARDS"**.
- **Change:** `--glass-card` with `--c` = category color; logo into a poster-well; card carries the accent bloom **at rest** (not just hover). Category chip + open-in-maps link keep accent. Nonprofit keeps the conic-rainbow swatch rule.
- **Tokens:** §1.1, §1.2, §1.4.

## AGENT 4 - Board Cards + Open Board
- **Owns:** `client/src/components/EventBoardCard.tsx`, `client/src/components/board/BoardPostOverlay.tsx`
- **Reference:** `04-board-cards.png`; search **"BOARD CARDS"**.
- **Change:** `--glass-card` keyed to board color (Missed Connections `#FF00CC`, Gifting `#CCFF00`, Gigs `#6E3DFF`), with a **stronger** sheen. Add a faint backdrop motif per type: quote-marks (Missed Connections), gift-box (Gifting "give"), magnifier (Gifting "ISO"), `$` (Gigs "offering"), binoculars (Gigs "looking") - decorative SVG at ~4–12% accent opacity. Open-board overlay uses the same recipe, magenta accent.
- **Tokens:** §1.1, §1.2.

## AGENT 5 - Map Surfaces  *(biggest change - start here if sequencing)*
- **Owns:** `client/src/components/ds/MapPanel.tsx`, `DirectoryMap.tsx`, `EventsMap.tsx`; rewrite `ds/mapTheme.ts` + map CSS in `index.css`.
- **Reference:** `05-map-surfaces.png`, `06-directory-map.png`; search **"MAP SURFACES"**.
- **Change:** rebuild around `--map-surface` - OLED `#06060A`, **2px black outline** + inset top-shadow (debossed), grid plate, **reduced** inward hole-rim vignette (~60% lighter), keep the diagonal light-shaft. Pins: per-day color, black core, tight 12px bloom; multi-day = conic rainbow + white bloom. The directory map island uses the same recipe but a **neutral grey** glow. Legend + Expand chips keep lime outline + glow.
- **Tokens:** §1.6.

## AGENT 6 - Floating Inbox
- **Owns:** `client/src/components/inbox/InboxShell.tsx`
- **Reference:** `07-floating-inbox.png`; search **"FLOATING INBOX"**.
- **Change:** drawer becomes `--glass-card` (blue/violet accent). FAB: glossy radial (`linear-gradient(160deg,rgba(255,255,255,.35)…)` over `radial-gradient(#0d1224,#050506)`) + `inset 0 1.5px 0 rgba(255,255,255,.3)` top gloss + `0 0 22px -6px accent` bloom. Search pill + rows keep layout.
- **Tokens:** §1.1, §1.5.

## AGENT 7 - Work Card + Project Rows
- **Owns:** `client/src/components/profile/HostingPanel.tsx`, `dashboard/DashboardVenueSection.tsx`
- **Reference:** `08-work-project-rows.png`; search **"WORK CARD"** / **"PROJECT ROWS"**.
- **Change:** Work card = `--glass-card` (cyan). Project rows = the **neutral/grey** card variant (`glassGrey`) + sheen + refraction seam; thumbnail in a rounded accent-bordered well. "View resume" / "Pitch me" = glass buttons. **Add a `--glass-card-neutral` variant** (grey `--c`, white-based bloom) for any surface with no semantic color.
- **Tokens:** §1.1 (+ neutral variant), §1.2, §1.3, §1.5.

## AGENT 8 - Navigation (drawer + folder + mobile bar)
- **Owns:** `client/src/components/dashboard/DashboardDrawer.tsx`, `hub/HubShell.tsx`, `hub/hubIcons.tsx`
- **Reference:** `09-navigation.png`; search **"NAVIGATION"**.
- **Change:** drawer + folder sheet get an **inward-debossed edge** (`inset 0 0 34px -10px rgba(0,0,0,.95), inset 0 2px 3px rgba(0,0,0,.6)`) + half-strength cyan outward glow. Mobile bar: active tab = neon accent color + tinted fill + glow; add the glowing-cyan pull handle (`pullHandle` keyframe). Member/Admin segmented toggle keeps inset pill shadows.
- **Tokens:** §1.1 + add `--edge-deboss` (the inset pair above).

## AGENT 9 - Islands / River Brats / Nude Beaches
- **Owns:** `client/src/components/river-brats/*`, `NudeBeachesHubPanel.tsx`, `client/src/pages/NudeBeaches.tsx`
- **Reference:** `10-islands.png`; search **"ISLANDS · RIVER BRATS"**.
- **Change:** every tile = `--glass-card` (thin black outline + corner sheen). Accent per card: Rooster Rock `#FF6600`, Sauvie/Collins `#39FF14`, river-level cyan `#19E3FF`. Check-in tab card = orange top like live conditions. Check-in CTA + tickets = glass buttons. Keep the island grouping (Rooster Rock, Sauvie Island) with live-conditions + logistics (parking / rules / farm stores) sub-cards.
- **Tokens:** §1.1, §1.2, §1.5.

## AGENT 10 - Promoter Intake
- **Owns:** `client/src/components/promoter/PromoterIntake.tsx`, `promoter/ActionRow.tsx`
- **Reference:** `11-promoter-intake.png`; search **"PROMOTER INTAKE"**.
- **Change (new surface):** Verified-promoter banner = **neutral** dark card (lime label + dot, no green fill/glow). Three action rows (Submit=lime, Claim=cyan, Spotted=magenta) each `--glass-card` keyed to that accent + project-row edge (sheen + seam) + a number + an outlined status badge.
- **Tokens:** §1.1, §1.2, §1.3.

## AGENT 11 - Infrastructure Grid
- **Owns:** `client/src/components/home/InfrastructureGrid.tsx`
- **Reference:** `12-infrastructure-grid.png`; search **"INFRASTRUCTURE GRID"**.
- **Change (new surface):** 2×2 cards (Gigs `#6E3DFF`, Gifting `#CCFF00`, Missed Connections `#FF00CC`, Nude Beaches `#FF6600`) - each `--glass-card` with the `border-left:4px solid var(--c)` variant, **no** title glow.
- **Tokens:** §1.1 (left-accent variant).

## AGENT 12 - Support (keep-alive / affiliate / sponsors)
- **Owns:** `client/src/components/support/SupportPanel.tsx`, `support/AffiliatePartners.tsx`, `support/SponsorsPanel.tsx`
- **Reference:** `13-support.png`; search **"SUPPORT"**.
- **Change (new surface):** Keep-This-Guide-Alive + Sponsors = **neutral** glass cards (thin black edge, corner sheen, `rgba(255,255,255,.15)` bloom, no accent). Affiliate card keeps cyan left accent but neutral glow. Venmo / Pitch = lime glass buttons. Sponsor qualifier rows = lime-left-accent glass cards. Real partner logos (CockBlock, Mr. S Leather) on `#050506` wells.
- **Tokens:** §1.1 neutral, §1.2, §1.5.

## AGENT 13 - Hub Items (keys / scene feed / rails)
- **Owns:** `client/src/components/hub/AdminKeysCard.tsx`, `hub/SceneFeed.tsx`, `hub/NextMovesRail.tsx`, `hub/WhoToFollow.tsx`
- **Reference:** `14-hub-items.png`; search **"HUB ITEMS"**.
- **Change (new surface):** "You hold the keys" = magenta-accent glass card + magenta glass button. Scene-feed items = **neutral** glass cards (corner sheen applied as a *background* layer so text stays legible); status badges (RSVP/Submitted/Looking/Check-in/Event) = outlined-glass pills in the status color; a "Looking" post gets a full rainbow top bar. Rails = neutral glass cards; Follow buttons = cyan glass; avatars use conic-rainbow rings.
- **Tokens:** §1.1 neutral, §1.2 (background layer for text-heavy cards), §1.5.

## AGENT 14 - Ads (grid slot + in-feed)
- **Owns:** `client/src/components/ads/PosterAdCard.tsx` (→ `GridSlotAd`), `ads/FeedAdCard.tsx` (→ `InFeedAd`)
- **Reference:** `15-ads.png`; search **"ADS"**.
- **Change:** **both ads must be indistinguishable from a real event card** - `--glass-card` (green grid slot / red in-feed) + sheen + refraction seam + poster-well header (radial accent + `border-bottom:4px`). Grid slot: AFFILIATE lime tag, LOGO well, PARTNER/LOCAL tags, "SHOP NOW" green glass button, AD dot. In-feed: transparent AFFILIATE badge with glowing-red text, close ✕, logo well, red title, mono subcopy, code line.
- **Tokens:** §1.1, §1.2, §1.3, §1.4, §1.5.

---

## Coordination notes for the orchestrator
- **Run Agent 5 (maps) and Agent 7 (which adds `--glass-card-neutral`) and Agent 8 (which adds `--edge-deboss`) first or in tight coordination** - they introduce shared token variants the others consume. Land those variants in `glass.css`/`glass.ts` before the neutral-card agents (11, 12, 13) start.
- All agents import the same `glass(accent)` helper - no per-file copies of the recipe.
- Each agent's PR should show a **zero layout diff** and only touch background/border/box-shadow/overlay/button styling for its files.
