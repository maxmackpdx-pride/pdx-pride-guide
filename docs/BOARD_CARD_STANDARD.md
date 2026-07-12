# Board card + feed overlay standard

The reusable pattern behind Missed Connections, the Gifting/free board, and
Pride Werk. Follow this when adding a **new board category** so it looks and
behaves like the others: a colored card on its own board page, a matching card
in the hub feed, and a tap-to-open overlay that shows the real, interactive
card on top of the feed (close = back to your exact scroll spot).

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
| Pride Werk (`gig`) | purple `--panel-purple` / `#b06bff` | POSTING_GIG `#b06bff`, LOOKING_FOR_WORK (talent) `#19e3ff` |

Badge/tag colors are centralized in `hubFeedBadgeColor()` in
`shared/hubFeed.ts` — add your new kind there.

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
  connections) use a dedicated layout instead — see `isSpotted`.
- **Opening the overlay:** `HubFeedCard` treats a card as `isBoard` when
  `boardPostId != null`; tapping opens `BoardPostOverlay`. Anonymous boards use
  `isSpotted` → `SpottedDetailModal`.

## Checklist: adding a new board category

1. **Schema + storage** — table, `get<Board>Posts()`, create/action endpoints
   (mirror `getGiftingPosts` / `getGigPosts`).
2. **Board page** — `pages/<Board>.tsx` with hero/stats/filters + a grid that
   renders your card component. Support `?post=<id>` auto-expand (see the
   `deepLinkHandled` effect in `Gifting.tsx` / `PrideWork.tsx`).
3. **Card component** — `components/board/<Board>ListingCard.tsx`,
   self-contained (owns its own state + mutations). The board page and the feed
   overlay both render it.
4. **Accent** — pick the signature color; export a `cardAccent(post)` if
   sub-types vary. Add the feed glow to `BOARD_ACCENTS` and the badge color to
   `hubFeedBadgeColor()`.
5. **Feed kind** — add to `HubFeedKind` in `shared/hubFeed.ts`, build the item
   in `getHubFeed()` with `title`, `text`, `link`, `boardPostId`.
6. **Feed overlay** — extend `BoardPostOverlay` (new `kind`) or add a dedicated
   modal for anomalous flows (anonymous, no author). Reuse the locked overlay
   look above.
7. **Feed tab** (optional) — `HUB_FEED_TABS` / `TAB_PREDICATES` in
   `shared/hubFeed.ts` if the category needs its own filter.
8. **Verify** — `npx tsc --noEmit` + `npm run build`, then drive it: board card
   expands, feed card shows the subject + glow, tap opens the overlay with the
   full accent border + glow and the real actions, close returns to scroll spot.
```
