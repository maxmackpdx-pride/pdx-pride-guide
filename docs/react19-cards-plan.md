# React 19 card plan

Baseline: `4d9c4a47` moved the app to React 19. This work targets the installed build, React `19.3.1` and `react-dom` `19.3.1`. The anchored expansion from `0cc4c9ed` stays the layout authority. Colors, accent tokens, and `client/public/outzide-map` are unchanged. Beach stays `var(--neon-magenta)`.

Export check (Node, the installed packages):

| Feature | Installed? | How cards use it |
|---|---|---|
| `ViewTransition` | Yes. Exported symbol, typed since 19.3.0. | Used directly. Not a canary-only export, so there is no `document.startViewTransition` wrapper. |
| `Activity` | Yes. Exported symbol, typed since 19.2.0. | Used directly. |
| `use` | Yes. | Suspense on async card engines. |
| `useOptimistic` | Yes. | Hearts, follow, event save. |
| `preload`, `preinit`, `preloadModule`, `preinitModule` | Yes, from `react-dom`. | Images and blend/wide styles. |
| ref as a prop | Yes, in 19. | Card shell, heart control, and the morph host take `ref` without `forwardRef`. |
| `<title>` and `<meta>` | Yes. | Open cards hoist them while visible. |

`ViewTransition` only animates updates inside `startTransition`, an Action, or a Suspense reveal. Card open and close go through `openCardFromEvent` / `closeOpenCard`, which call `addTransitionType("card-open")`. The morph class is bound only to that type. Hearts and follow use their own transition and do not morph the card. `prefers-reduced-motion`, calm mode, and `data-calm="true"` set the class to `none` and zero the pseudo-element duration.

Shared helpers live in `client/src/components/cards/react19CardModel.ts` and `react19Card.tsx`.

## Per card

### Outzide: TodayLocationCard, OutzSmallCard, featured/tall, OutzWideCard, OutzCardModal

- **ViewTransition.** The closed face and the in-place detail share one morph name. Featured and tall are `TodayLocationCard` sizes. Wide and compressed are `OutzWideCard`.
- **Activity.** After the first open, the modal stays mounted and `mode="hidden"` while closed. It is not mounted for every card on first paint, so the destination iframe does not boot until someone opens that card.
- **use() + skeleton.** `OutzWideCard` suspends on the wide-card engine. `OutzBlendArt` suspends on the blend engine. The fallback keeps the fixed card box.
- **useOptimistic.** Outz hearts go through `HeartButton` / `useHeart`.
- **preload / preinit.** Blend cutout photos preload at high priority. Wide-card and blend styles use `preinit`. The engine module is `preloadModule`, then one script tag evaluates it. `preinitModule` is available but unused here: evaluating the module twice would mount the engine twice.
- **Document metadata.** The open destination sets `<title>` and `<meta name="description">` outside `Activity`, so a paused modal does not keep the title.
- **Reduced motion.** The morph class is `none`, and the stylesheet duration is 0s.

`client/public/outzide-map` is not edited. React only preloads the existing CSS, JS, and photos.

### Eventz: TonightEventCard

- **ViewTransition** on the tall and wide (row) face. Home keeps the last opened event in `Activity` so closing pauses `EventModal` instead of dropping it. The events page still clears its route-owned selection on close. That modal is not paused, because the page ties the open event to the URL.
- **useOptimistic** on the Save control, separate from the card-open transition.
- **preload** of the poster image.
- **Document metadata** while the home event card is open. Other `EventModal` callers get the same title from the modal itself.

### Placez

- Tall and wide faces are `TodayLocationCard` (above).
- The small face is `PlaceDiscoveryCard` inside `cards/PlaceCard.tsx`, and the directory face is `ds/PlaceCard`. Both sit in a morph host.
- **Activity** pauses `PlaceModal` after the first open from those cards.
- **useOptimistic** on `VenueFollowButton` (card, small-card, and modal).
- **preload** of the directory logo.
- **Document metadata** for the open place. Callers that already render the title pass `documentMeta={false}`.

### NEEDZ

- `NeedzCard` renders `ResourceCard`, which renders `ds/PlaceCard`, so the morph host, heart action, and logo preload apply.
- The resource detail is a Radix dialog. Its content still mounts with `open`. Wrapping that tree in `Activity` would fight the dialog focus contract, so the detail is not paused. It does set the open-card title and description.
- The urgent-help drawer is not Radix. It uses `Activity` after the first open.

### Boardz

- `BoardBrowseCard` is the morph host. Punk open clicks start a `card-open` transition.
- **useOptimistic** applies where the card uses `CardHeartButton` / `HeartButton`.
- `OpenBoardCard` sets the document title while the board card is open. It is portaled by its owner, so this pass does not force every board page to keep it paused.

### Poster and ad cards

- `PosterCard`, `PosterAdCard`, `AffiliatePosterCard` (same renderer), and `FeedAdCard` preload their primary image.
- They do not grow in place. They are not given a morph trigger, so a heart or a click cannot cross-fade a card that did not change size.
- Ad colors are untouched.

### Perspective tunnel

- Flying cards already honor reduced motion and calm mode. A view-transition morph would fight the scroll pose, so these cards are not wrapped in `ViewTransition`.
- Above-the-fold images, including blend photos, preload at high priority.
- No drawer, so no `Activity`. The assortment is already synchronous props, so there is no `use()` boundary.
- The anchor `ref` was already a normal prop.

### Unified card API (`CardAPI`, `0cc4c9ed`)

- `CardShell` takes `ref` as a prop.
- `CardDetails` still owns the grid measurement and the anchored slot. It records the source element so close can signal that same node, and it clears the morph phase when the detail unmounts.
- Fixed sizes stay on `[data-card-size]`. The morph runs on the view-transition snapshot, not by scaling the live card.

## Explicitly skipped

Nothing in the requested set was missing from React 19.3.1. `ViewTransition` and `Activity` did not need a fallback wrapper. `preinitModule` is exported and was not used for the Outzide engines, because those modules must evaluate once.
