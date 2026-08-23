# Board card + feed overlay standard

The reusable pattern behind Missed Connections, the Gifting/free board, and
Gig Werk. Follow this when adding a **new board category** so it looks and
behaves like the others: a colored card on its own board page, a matching card
in the hub feed, and a tap-to-open overlay that shows the real, interactive
card on top of the feed (close = back to your exact scroll spot).

**Surface chrome (fill / edge / bloom / CTA):** owned by the **live design
standard** - [`docs/LIVE_DESIGN_STANDARD.md`](./LIVE_DESIGN_STANDARD.md),
`client/src/components/ds/tokens/glass.css`, and `chrome.css` (8% `--neon-bloom`,
`--btn-glow-bg` / `--btn-glow-shadow`). The deep-glass handoff under
`docs/handoffs/deep-glass-2026-07-16/` is **historical migration** only.

This doc still owns structure (board triad, feed vs glowing cards, `?post=`,
overlay behavior, accents as semantic colors). Pixel values for slabs / rings /
sheen / buttons come from **live production CSS**, not old brutalist defaults.

## Feed posts vs. glowing cards (important distinction)

Not everything in the Scene Feed is a "card." Keep these separate:

- **News-feed posts** - plain activity rows: RSVPs, beach check-ins, member
  text/photo posts, event announcements/updates, the feedback prompt. These do
  **not** glow and don't open an overlay; they're just posts in the stream.
- **Glowing cards** - accent-bordered, glowing, tap-to-open things. In the feed
  these are the board posts (gig purple, gift lime, missed-connection magenta)
  and the **Featured event ad** (day color). Elsewhere: the board pages, the
  board overlays, and the event modal. Only these carry the border + glow +
  tap-to-open behavior.

## Rainbow top divider (required on every clickable card)

**Rule (locked):** Every **clickable card** - Events, Boards (gigs / gifts /
missed connections), Places, featured event ad, glowing hub-feed board cards -
must show the **same animated rainbow divider across the top**, the way
**Place cards** do. This is not optional chrome and not a per-board stripe.

Plain hub-feed activity rows (RSVP, check-in, member text/photo posts) do
**not** get it.

### Visual reference - PlaceCard

Directory `PlaceCard` is the canonical look:

- 3px bar flush to the top edge of the card
- Gradient: cyan → yellow → magenta → orange → cyan
- **Motion:** colors flow left→right (`pdxSeamFlow`), soft rainbow glow pulse
  (`pdxSeamGlow`), white glint sweep (`pdxSeamGlint`) - ~3.4s loop
- **Calm mode / `prefers-reduced-motion`:** bar stays visible but **static**
  (no flow, glint, or glow) - see `effects.css`

PlaceCard implements it as an explicit element:

```html
<div class="pdxPlace__seam pdx-rainbow-rule" aria-hidden="true" />
```

(`client/src/components/ds/PlaceCard.tsx` · specimen
`zaylist-foundation-library` `public/design-system/guidelines/card-system.html`.
The old `design-system/previews/*.html` portable kit is removed; do not recreate it.)

Place detail uses the same class on the modal logo well (`PlaceModal`).

### Shared system (do not fork)

| Piece | Where |
|---|---|
| Element form (`.pdx-rainbow-rule` / `.pdx-seam`) | `client/src/components/ds/tokens/base.css` |
| Pseudo form (card `::before` seams) | same `base.css` - “Card top rainbow seam” block |
| Calm / reduced-motion flatten | `client/src/components/ds/tokens/effects.css` |
| Gradient tokens | `colors.css` (`--rainbow-bar`, neon stops) |

**Two valid ways to attach it** (same animation system - pick one per surface):

1. **Explicit element** (PlaceCard / PlaceModal style) - child with
   `pdx-rainbow-rule`, positioned absolute top 0 / full width / height 3px.
2. **Root `::before`** (most board + event cards) - add the card’s root class
   to the shared selector list in `base.css` so the pseudo-element draws the
   bar. Root needs `position: relative` and usually `overflow: hidden`.

Do **not** invent a one-off top stripe, solid day-color cap, or static
non-rainbow line. New clickable cards must join this system.

### Surfaces that must carry the rainbow top divider

| Surface | Selector / component | How |
|---|---|---|
| Events grid | `.pdxBoard` (`PosterCard` via ListingCard) | `::before` |
| Events list | `.pdxRow` (`EventCard`) | `::before` |
| Schedule cells | `.schedule-event-card` | `::before` |
| Legacy event board cards | `.event-board-card` | `::before` |
| Gigs / Gifting / SELLZ boards | `.board-listing-card` | `::before` |
| Missed Connections boards | `.board-spotted-card` / `.spotted-card` | `::before` |
| Hub feed **board** cards only | `.card.fitem.fitem--glow` (gig / gift / MC) | `::before` |
| Featured event ad | `.featured-event-ad` | `::before` |
| Directory / home places | `PlaceCard` - `.pdxPlace__seam.pdx-rainbow-rule` | explicit |
| Place detail modal | `PlaceModal` - `.pdx-rainbow-rule` on logo well | explicit |
| Event detail modal | `EventModal` - `.event-modal__bar.pdx-rainbow-rule` (day color stays on border glow / meta) | explicit |

When adding a new clickable card: either mount a `.pdx-rainbow-rule` seam or
add its root class to the `::before` list in `base.css` **and** the calm rules
in `effects.css`.

## Directory place cards (related chrome)

Directory venues use `PlaceCard` (`client/src/components/ds/PlaceCard.tsx`), not
the board-listing card. Anatomy:

- **Top rainbow divider** on *every* place card - required (see section above).
- **Category neon edge + outer glow** (`--_c` / `--cat-*`); nonprofits use a
  full-spectrum rainbow border instead of a single category color.
- Logo media well, badges, meta rows, links, upcoming events, share.

Also used on the home places scroll (same component).

## Featured event ad (`FeaturedEventAd`)

A standalone, glowing **ad** pinned as the top post of the Scene Feed - its own
thing, not a member post. `client/src/components/hub/sections/FeaturedEventAd.tsx`,
wired up in `HubFeed.tsx` (finds the event, passes the slide list).

- **Glow** in the event's **day color** (SAT → green), rounded border, dismissible.
- **Hero slideshow**: the event poster (4s) then extra promo images (2s each),
  cross-fading and looping; each frame is full-width and top-anchored (never
  crops left/right; crops the bottom). Slides live in
  `/public/posters/<event>-slides/`, listed in `HubFeed.tsx`.
- **Live countdown** to the event's Pacific start (cyan) · "Kickoff in".
- **Stacked CTA rows** with neon-glow labels: "Buy tickets" (green) → ticket URL,
  "RSVP" (orange) → opens the real event card (`EventModal`) in place.
- Reusable: it takes an `event` + `slides`, so any event can be featured this way.

## The three surfaces every board has

| Surface | Where | What it is |
|---|---|---|
| **Board page** | `client/src/pages/<Board>.tsx` | Hero + stats + filters + a grid of cards. Tapping a card expands it in place. |
| **Feed card** | `client/src/components/hub/sections/HubFeedCard.tsx` | The board post as it appears in the hub Scene Feed. Glows its category color. |
| **Feed overlay** | `client/src/components/board/BoardPostOverlay.tsx` (or `SpottedDetailModal.tsx`) | The real board card, portaled on top of the feed. Same actions, no navigation. |

**Golden rule: one card component, reused everywhere.** The board page and the
feed overlay render the *same* component so they can never drift. Never
re-implement a card's markup or actions in the overlay.

- Gifts → `client/src/components/board/GiftListingCard.tsx` (self-contained: owns
  its own note/report state + interest/owner mutations).
- Gigs → `GigListingCard`, exported from `client/src/pages/PrideWork.tsx`.
- Missed Connections → `SpottedDetailModal.tsx` (anonymous reply flow).

## Accent color per board

Each board owns a signature color; sub-types within a board can vary it.

| Board | Feed glow (`BOARD_ACCENTS` in `HubFeedCard.tsx`) | Per-card accents |
|---|---|---|
| Missed Connections (`spotted`) | magenta `--panel-magenta` / `#ff1fa0` | event cyan, beach orange, around-town `#ff8c00` |
| Gifting (`gifting`) | acid-yellow / lime `--panel-lime` / `#ccff00` | GIFT `#ccff00`, ISO `#19e3ff`, open-grab `#ff8c00` |
| Gig Werk (`gig`) | purple `--panel-purple` / `#b06bff` | POSTING_GIG `#b06bff`, LOOKING_FOR_WORK (talent) `#19e3ff` |

Badge/tag colors are centralized in `hubFeedBadgeColor()` in
`shared/hubFeed.ts` - add your new kind there.

## The overlay look (locked)

The overlay panel must read like the Missed Connections card: the **accent
wraps the whole card including the top**, and the card has an outer **glow**.
Because the reused board card has a thumbnail that bleeds to its edges, the
*wrapper* carries the frame and clips the card, not the card itself.

`BoardPostOverlay.tsx` wrapper style (accent = the post's card color):

```jsx
style={{
  width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto",
  position: "relative", background: "#0c0c0f",
  border: `2px solid ${accent}`,
  borderRadius: 14,
  boxShadow: `0 0 50px -10px ${accent}`,   // the glow
}}
```

And in `index.css`, neutralize the inner card's own chrome so the frame is one
clean panel:

```css
.board-post-overlay > .board-listing-card {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
}
```

Portal the overlay to `document.body` (via `createPortal`) so the fixed
backdrop escapes the feed's transformed wrappers and centers on the viewport.
Reuse `.board-detail-backdrop` for the dimmed background.

## Feed item shape (`shared/hubFeed.ts` + `server/storage.ts`)

The hub feed is built in `getHubFeed()` in `server/storage.ts`. Each board post
pushes a `HubFeedItem`:

```js
{
  id: `<kind>-${post.id}`,
  kind: "<kind>",                 // add to HubFeedKind union in shared/hubFeed.ts
  badge: "<Short label>",         // colored by hubFeedBadgeColor(kind)
  action: "Posted on <Board>",    // the "did X · when" line
  title: post.title,              // bold subject line (display font) on the card
  text: post.description || null, // body under the subject
  createdAt: post.createdAt,
  author: hubFeedAuthorFromUser({ ... }),  // omit / anonymize if the board is anonymous
  link: `/<board>?post=${post.id}`,        // deep-link fallback (also drives ?post= auto-expand)
  boardPostId: post.id,           // used by the feed overlay to look the post up
}
```

- **Subject line:** `HubFeedCard` renders `item.title` in the display font for
  author-attributed boards (`showSubject`). Anonymous boards (missed
  connections) use a dedicated layout instead - see `isSpotted`.
- **Opening the overlay:** `HubFeedCard` treats a card as `isBoard` when
  `boardPostId != null`; tapping opens `BoardPostOverlay`. Anonymous boards use
  `isSpotted` → `SpottedDetailModal`.

## Checklist: adding a new board category

1. **Schema + storage** - table, `get<Board>Posts()`, create/action endpoints
   (mirror `getGiftingPosts` / `getGigPosts`).
2. **Board page** - `pages/<Board>.tsx` with hero/stats/filters + a grid that
   renders your card component. Support `?post=<id>` auto-expand (see the
   `deepLinkHandled` effect in `Gifting.tsx` / `PrideWork.tsx`).
3. **Card component** - `components/board/<Board>ListingCard.tsx`,
   self-contained (owns its own state + mutations). The board page and the feed
   overlay both render it.
4. **Rainbow top divider** - same animated bar as PlaceCard. Prefer joining the
   shared `::before` list in `base.css` (root class + calm rules in
   `effects.css`), or an explicit `.pdx-rainbow-rule` seam. No custom stripe.
5. **Accent** - pick the signature color; export a `cardAccent(post)` if
   sub-types vary. Add the feed glow to `BOARD_ACCENTS` and the badge color to
   `hubFeedBadgeColor()`.
6. **Feed kind** - add to `HubFeedKind` in `shared/hubFeed.ts`, build the item
   in `getHubFeed()` with `title`, `text`, `link`, `boardPostId`.
7. **Feed overlay** - extend `BoardPostOverlay` (new `kind`) or add a dedicated
   modal for anomalous flows (anonymous, no author). Reuse the locked overlay
   look above.
8. **Feed tab** (optional) - `HUB_FEED_TABS` / `TAB_PREDICATES` in
   `shared/hubFeed.ts` if the category needs its own filter.
9. **Verify** - `npx tsc --noEmit` + `npm run build`, then drive it: rainbow
   top divider animates (static in calm), board card expands, feed card shows
   the subject + glow, tap opens the overlay with the full accent border + glow
   and the real actions, close returns to scroll spot.
```
