# Mapz rising layer drawer and Houz

final result: blocked

## Scope and source

- Approved visual: `/workspace/scratch/0de7547360b8/generated_images/exec-9bf35c4a-c320-474e-b72c-d741e10d3994.png`.
- Source image opened and inspected: 853 × 1844 pixels, portrait. Intended density-normalized comparison: approximately 393 × 850 CSS pixels.
- Implementation: existing `/map` and `/map-demo` routes, branch `feature/mapz-houz-rising-drawer`.
- Implementation screenshot: unavailable. No full-view or focused comparison was possible.
- Intended state: Eventz open, Houz fourth, navigation dock collapsed, map controls visible. Also verify every layer, compact dock states, and desktop/tablet widths.
- No production deployment or push has been performed.

## Implemented

- Rising bottom sheet, four continuous layer controls, persistent View more and collapse actions, compact rail between the Z dock and right-hand map controls.
- Houz replaces ZayDark. Housing has its own visibility and All Houz / Rooms / Looking / Forming / Rentals filters. Housing is no longer part of Boards.
- All four panels use existing APIs and existing product images, logos, fonts, and icon components. Mock event names, times, and artwork were not substituted for real records.
- First five matching event results include poster, venue, date/time and a working event-detail action. RSVPs remain available in a secondary disclosure.
- Event filters now drive both results and event pins. Tonight means Portland's current day, Soon means live or starting within 90 minutes. Place categories no longer silently hide event pins.
- Each panel retains a separate Show pins checkbox, loading/error/empty states, and its existing destination for View more.
- Escape restores focus to the active layer control. Handle supports tap and downward swipe. Switching layers resets the result scroll. Closing retains the collapsed navigation dock; restoring navigation closes the sheet. Scrolling sheet content does not expand navigation over it.
- Housing/board marker keys are namespaced, avoiding collisions between equal numeric ids from different APIs. Null/empty listing coordinates are not converted to zero.

## Findings

- [P1, verification blocker] The local preview exits before the app opens. The bundled Node 24 runtime crashes in the existing `better-sqlite3` native dependency with `RemoveEnvironmentCleanupHook` / `Statement::~Statement()`. This checkout declares Node 20. Initial startup lacked a native module; rebuilding it allowed database startup but exposed the runtime crash. Two supervised preview attempts were made, then stopped. Browser navigation returned connection refused.
  - Impact: no browser-rendered screenshot, interaction run, or console inspection is available. Build success is not visual verification.
  - Next step: run the existing app in its supported Node 20 environment, preferably the repository's authorized temporary Railway Sandbox workflow after Tucker approves staging, then perform the checks below.

## Required fidelity surfaces

- Typography: existing Barlow Condensed display face and Inter body face reused. Large active-layer title, compact uppercase rows. Browser wrapping and rendering remain unverified.
- Spacing/layout: full-width rising mobile sheet, safe-area-aware footer, independently scrolling results, compact rail avoids fixed dock/control columns. Desktop breakpoint matches the 960px mobile navigation boundary. Real viewport overlap and five-row density require browser verification.
- Colors/tokens: approved magenta Eventz, cyan Placez/Houz, purple Boards; existing glass optical layers retained. Actual contrast and composited appearance require capture.
- Image quality: existing event posters, housing photos, directory logos and supplied fallback assets reused. Existing map renderer and waypoint imagery preserved. Actual image loading/crops remain unverified.
- Copy/content: approved four labels implemented; fictional reference event records replaced with API records. Location note distinguishes neighborhood housing pins from exact addresses. Empty states and retry controls supplied.

## Comparison history

No visual comparison completed. There is no claim of a passed iteration or pixel match.

## Verification and remaining checklist

- PASS: `npm run typecheck`.
- PASS: `node --import tsx script/build.ts` (complete client, service worker and server production build).
- PASS: `node --import tsx --test client/src/lib/mapLayerFilters.test.ts`, 8/8 tests. Covers Tonight, Soon, tags, date ranges, malformed dates, Portland/UTC day boundaries, DST, the upcoming horizon, and marker-key collisions.
- PASS: `git diff --check`.
- [ ] Capture Eventz at 393 × 850, normalize the approved image, and compare together.
- [ ] Capture compact/expanded Z navigation with closed drawer at 320, 393, 768 and 960+ widths.
- [ ] Open all four layers, change filters and pin visibility, verify list/pin consistency in both 3D and 2D.
- [ ] Open actual event/place/housing details and all View more destinations.
- [ ] Verify swipe, close, Escape focus return, reduced motion, keyboard navigation, long titles and empty/error states.
- [ ] Check console errors, actual poster loads, no overlapping touch targets, and no horizontal page overflow.
- [ ] Fix any P0/P1/P2 findings and repeat visual comparison before marking passed.

## Unrelated pre-existing checkout changes

These were present before this task, remain untouched and are excluded from the drawer commit. Their original owner is not established in this session:

- `.claude/skills/zaylist-design`: already deleted.
- `client/public/posters/lets-get-wild-pride-drag-show.jpg`: already modified.
- `tmp/`: existing untracked sandbox patches.
