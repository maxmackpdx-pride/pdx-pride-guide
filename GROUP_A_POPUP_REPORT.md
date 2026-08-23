# Group A: event popup (A1 + A2)

Worktree: `/Users/tuckercasey/pdx-pride-guide-group-a-event-popup`  
Branch: `fix/group-a-event-popup` (from `origin/master` @ `331b7773`)  
Not pushed. Parent checkout `/Users/tuckercasey/pdx-pride-guide` was left dirty.

## Diagnosis

The live popup is `EventModal` (not `EventDetailPopup`). `fluent2-m3` is always on (`main.tsx` sets `html[data-zaylist-cards="fluent2-m3"]`).

### A1: scrolling felt broken

1. **Poster ate the viewport.** Fluent2 set `.event-modal__poster-img { height: clamp(360px, 52vh, 520px) }` (desktop `min(60vh, 620px)`). Base CSS was already `min(48vh, 480px)`. On a 360px-wide phone the 360px floor can fill the remaining modal after chrome/footer, so nested overflow never gets a usable remainder.
2. **Header lived in the scroll region.** Poster + title sat inside `.event-modal__scroll`, so close/share (absolute over the art) and the title scrolled away. Spec wants header + primary action fixed.
3. **Overlay did not clear the dock.** Overlay padding was `16px + safe-area`. `--site-mobile-nav-height` is `98px` and the dock is `position:fixed; z-index:80`. Overlay is `z-index:3000` so it covers the dock, but `92dvh` height + 16px pad still lets the sheet collide with dock space at 360px. Place modal already pads `76px` bottom; events did not.
4. **Body lock is not the primary bug.** `useModalA11y` → `lockBodyScroll()` pins `body { position:fixed; top:-scrollY }` (iOS-safe; `overflow:hidden` detaches the dock). Unlock restores `scrollY`. Nested `AuthModal` shares the ref-count. Inner scroll already had `-webkit-overflow-scrolling: touch` and `overscroll-behavior: contain`; those were not enough while the poster stole height.

### A2: external URL buried

Tickets used raw `event.ticketUrl` (not `publicHttpUrl`) in two places: after About (`button-event-tickets-mid`) and the sticky footer. That mid-body control is below the fold at 360px. Venue website existed only as a text link in meta. `event.source` is provenance (`url_ingest`, `trusted:*`), not a page URL; `sourceUrl` is not on the Event schema (API may still attach extras).

## Fix

Recommended structure, reused the existing deep-glass modal (no second overlay):

```
overlay (overflow hidden, dock-safe pad on phones)
  dialog.event-modal.pdx-glass-rebind
    rainbow seam
    chrome (flex-none): close + share, title, primary URL
    scroll.event-modal__scroll (flex 1, min-height 0, overflow-y scroll, touch, contain)
      poster (capped) + body
    sticky-cta: same URL (if any) + I'll Be There
```

- Overlay bottom pad: `var(--site-mobile-nav-height, 98px) + safe-area + 8px` below 641px; desktop drops dock pad.
- Modal height: `min(92dvh, 920px, 100%)` so it is bounded by the padded overlay box.
- Poster cap: `clamp(120px, 22vh, 200px)` (desktop `min(40vh, 380px)`), including the fluent2 override that was the 360px floor.
- Primary URL (hidden if blank), first match:
  1. `ticketUrl` via `publicHttpUrl` if public `http(s)` and not a feed/API
  2. `venueWebsite` or `resolveVenueWebsite(venueName)` same rules
  3. `sourceUrl` or `source` if it is a public `http(s)` page (not feed/API)
- `--c` on the dialog now also carries `.pdx-glass-rebind`. Send-message button that sets `--c` got the class too.

## Files changed

- `client/src/components/EventModal.tsx`
- `client/src/index.css` (`.event-modal*` layout)
- `client/src/fluent2-m3-cards.css` (poster cap, chrome, share no longer `right: 68px`)

Inspected, no code change: `client/src/hooks/useModalA11y.ts`, `client/src/lib/scrollLock.ts`.

## tsc

- Before (this worktree, `npx tsc --noEmit --pretty false --incremental false`): **0 errors**
- After: **0 errors**
- Did not increase. (Doc baseline of ~9 is stale on current `origin/master`.)

## Verified (static)

- Chrome + primary action are siblings of the scroll region, so they stay on screen without scrolling.
- Scroll region: `flex: 1; min-height: 0; overflow-y: scroll; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y`.
- 360x568 / 360x640 with 98px dock: overlay content box is shorter than 92dvh, so `100%` wins; capped poster leaves remainder in the scroll pane.
- Sticky tickets only render when `primaryLink` exists (same href). No dead button when URL is missing.
- Body lock still ref-counted; close path still `unlockBodyScroll()` + `window.scrollTo(0, savedScrollY)`.
- No type-scale, title-contract, hero, or nav restyle. No em dashes in new copy (`Visit venue`, `Event page`).
- `node_modules` symlink in the worktree was not staged.

Not device-tested (no local preview unless asked). Ready to push after explicit yes.

## Remaining risks

- **iOS close jump:** lock/unlock is the existing iOS-safe path; a visual-viewport glitch is still possible on Safari. Not reproduced here.
- **Source URL fallback rarely fires:** Event rows do not store `sourceUrl`; `source` is ingest provenance. Tickets + venue cover almost all live listings.
- **Overlay covers the dock** (z-index 3000 vs 80). Pad still reserves dock height so the sheet does not sit under it. Dock is not tappable while the popup is open.
- **Long titles** clamp to 3 lines in chrome so the primary action cannot be pushed off the modal.
- **Desktop `overflow-y: scroll`** can show a gutter on some browsers; needed to force an iOS scroll layer.
