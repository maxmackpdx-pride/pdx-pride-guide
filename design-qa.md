# Placez and ReZources — Eventz design review

final result: passed

## Reference and scope

Eventz is the primary visual reference, as requested. Existing design-system tokens, brand assets, accessible controls, and detail interfaces fill the remaining decisions. This is a local product change; Eventz, navigation, Foundation, and production are unchanged.

Source visual truth: `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/eventz-desktop.png` (local `/events`, the unchanged Eventz implementation at `76b046af`).

Implementation captures:
- `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/placez-desktop.png`
- `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/rezources-desktop.png`
- `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/placez-mobile.png`
- `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/rezources-mobile.png`
- `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/placez-mobile-grid.png`

Full comparison: `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/comparison.png`.
Focused controls, sidebar, typography, and card comparison: `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/comparison-detail.png`.

Desktop captures use the same 1280px CSS width, 900px viewport, and explicit 1280 × 1000px capture region. Each image is 1280 × 1000px; the combined comparison is 3840 × 1000px. No density rescaling was applied to the saved evidence. Mobile captures are 390 × 844px at a 390 × 844px CSS viewport. Default browse state, dark theme, signed-out local preview with seeded content. Category data deliberately differs from Eventz time-based content; this is a shared composition, not an identical content clone.

## Findings and iteration history

No actionable P0/P1/P2 findings remain.

1. Header wordmarks initially appeared too small. Changed intrinsic logo sizing while retaining the source family assets and compact header. Initial evidence: `/Users/tuckercasey/Projects/Zaylist/Website branches/placez-rezources-eventz/.local/design-review/placez-initial.png`; post-fix evidence: both final desktop captures and the combined comparison.
2. Some organization logos needed their declared light surface. Preserved each resource's existing `logoSurface` setting; verified the final ReZources capture, including Oregon State Bar.
3. At 390px, the original grid minimum produced one column. Reduced the flexible minimum from 160px to 150px. Post-fix evidence: `placez-mobile-grid.png` shows two cards without horizontal page overflow.
4. Resource drawers now focus their close button when opened and retain the existing focus-restoration handlers. Confirmed the active element is inside the Prism Health dialog. The 21st checker flags the two explicit drawer autofocus props; these are intentional modal focus management, not page-load autofocus.

The initial development preview's missing font requests were caused by a shared dependency symlink and Vite file restrictions. Final evidence uses the completed production build with loaded fonts. That preview repair is not counted as a design iteration.

## Required fidelity surfaces

- **Typography:** Existing Barlow Condensed display, Barlow body, and monospaced metadata render successfully. Bold uppercase controls and lane headings follow Eventz. Long organization names remain readable instead of truncating identifying service names.
- **Layout:** Shared frame, compact identity, category/count dock, search row, 248px desktop sidebar, 136px compact cards, and two-card lanes follow the Eventz composition. Mobile uses horizontal lanes and a two-column flexible grid. More descriptive resource categories may wrap onto two lines; result counts add a small vertical offset. These are accepted content adaptations.
- **Colors:** Existing semantic category colors and glass tokens are retained. Saturated category text is mixed with the existing high-emphasis text color for legibility. Selected states use a filled category tab; view controls use the source cyan accent.
- **Imagery:** Existing family marks, venue logos, organization logos, fallback logos, and resource motifs are reused. Logo backgrounds are preserved where required. No replacement brand artwork or fabricated organization assets were introduced.
- **Copy/content:** Search, category counts, place follow actions, maps, contact details, resource services, talk options, and safety information remain available. The old introductory gates are replaced by immediate browsing, as in Eventz.

## Interaction checks

- Place search, category filters, empty state/reset, grid/list/browse controls, detail modal, and add-place authentication entry passed.
- Place category plus list layout survived reload (`type=cafe&layout=list`, six seeded results).
- Resource category plus grid layout survived reload (`cat=arts&layout=grid`, sixteen results).
- Resource search, empty state/reset, expanded lane, Prism Health detail, talk options, and immediate safety drawer passed.
- Mobile browse and grid were inspected at 390px; page width equals viewport width.
- Existing Spaces branch was preserved in Directory; no source edits to its layout.
- No application console errors or warnings were returned in the final browser check. Signed-out auth requests and existing browser install/preload notices were visible during earlier preview checks.

## Validation

- TypeScript: passed.
- Production build: passed, including bundled map startup/tile checks, navigation tripwire, and token guard. Existing large-bundle warning remains.
- Whitespace/diff validation: passed.
- 21st review: four implementation files checked; only the two intentional modal-focus warnings described above.
- Focused manual review: route state, multi-select restoration, existing detail actions, data coverage, and CSS scoping checked.

## Remaining limits

Authenticated follow/submission mutations were not executed. No server behavior changed. Visual verification used Chromium desktop and phone-sized emulation, not physical Safari.

## Implementation checklist

- [x] Rebuild Placez and ReZources around Eventz.
- [x] Preserve page-specific actions and existing detail interfaces.
- [x] Verify responsive composition and primary interactions.
- [x] Build and typecheck.
- [x] Keep the change local for review.
