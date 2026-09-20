# Mapz layer sheet design QA

**Source visual truth**

- `/workspace/scratch/0de7547360b8/upload/IMG_8166(1).png`
- `/workspace/scratch/0de7547360b8/upload/IMG_8165(1).png`
- `/workspace/scratch/0de7547360b8/upload/IMG_8164(1).png`
- Each source image is 1320 x 2868 pixels. These are written product-spec screens rather than a pixel-complete UI mock, so no density normalization was appropriate.

**Rendered implementation**

- Browser capture: `https://hauz-mapz-7aec2011bf59823b.up.railway.app/map-demo?preview=hauz&tiles=3`
- Cloud browser tab 4, captured in the current browser session.
- Viewport and implementation pixels: 1363 x 936 CSS pixels at device pixel ratio 1, producing a 1363 x 936 capture.
- States checked: 100px peek, expanded desktop sheet, Boards layer on/off, ZayDark coming-soon panel, and closed sheet.

## Full-view comparison evidence

The source is a four-page behavior and content specification, not a same-state rendered composition. The browser-rendered full view was therefore compared against its explicit requirements: four split controls only, no sheet search field, 420px desktop left column, persistent right-side map controls, top Downtown/clock lockup, Boards containing Gigz/Giftz/Sellz/The Haüz, five results plus View more, and ZayDark without inventory. All were visible in the implementation.

## Focused region comparison evidence

The layer sheet was inspected in the browser at its 420px desktop width. Its four controls measured 95.75px each within the sheet; the compact sheet measured 420 x 100px. The expanded sheet measured 420 x 814px. The Boards panel showed its four board filters, five result rows, and View more. The ZayDark panel contained only the coming-soon explanation. No additional focused image crop was required because the source does not provide a pixel-level component mock.

## Required fidelity surfaces

- **Fonts and typography:** Existing Zaylist display and UI font stacks are preserved. Display labels use the condensed uppercase hierarchy; small metadata uses Inter with readable weights and line heights. Long board titles truncate instead of colliding with the sheet edge.
- **Spacing and layout rhythm:** Compact and expanded sheet sizes match the specification. The desktop sheet is left-aligned at 420px, map controls stay on the right, rows are limited to five, and the circular close control remains reachable.
- **Colors and visual tokens:** Existing glass tokens are reused. Board pins use Gigz `#8800FF`, Giftz `#CCFF00`, Sellz `#39FF14`, and The Haüz `#00FFFF`.
- **Image quality and asset fidelity:** Existing application icons and listing imagery are reused. No source logos, illustrations, or icons were replaced with improvised drawings.
- **Copy and content:** Labels are exactly Eventz, Placez, Boards, and ZayDark. The Boards panel includes The Haüz. ZayDark is explicitly marked Coming soon and contains no inventory.

## Interaction and technical evidence

- Clicking the Boards label changed `aria-pressed` from true to false and reduced rendered map markers from 90 to 84; clicking it again restored the layer.
- Clicking the Boards chevron opened the Boards panel. Clicking the ZayDark chevron swapped to its coming-soon panel.
- Closing the sheet returned it to 420 x 100px and cleared the active panel.
- The sheet contains zero search inputs.
- All 28 inspected background tile images loaded successfully at 256px natural width from `/api/mapz/carto-tiles/...`; no Google tile/session code or request path remains.
- Console review found the expected cloud-browser WebGL initialization failure and extension metadata noise. The app recovered to its supported Leaflet fallback, where tiles and interactions remained functional. No application error blocked use.
- Primary interactions tested: layer label toggle, layer chevron open/swap, Boards result rendering, ZayDark empty state, and sheet close.

## Findings

No actionable P0, P1, or P2 differences remain. The source specifies mobile behavior in prose, but the available cloud browser viewport was desktop-sized; mobile behavior is implemented through the same open/close event state and responsive rules, and its final device-specific visual capture remains a residual test gap rather than a visible mismatch in the tested state.

## Comparison history

- Initial browser pass: no P0/P1/P2 visual mismatch found. The first screenshot was taken before the height transition settled; after the transition, the expanded sheet measured 420 x 814px and rendered the complete Boards panel.
- Post-interaction pass: verified compact return at 420 x 100px, correct ZayDark state, successful board-layer toggle, and loaded non-Google tiles.

## Implementation checklist

- [x] Four split layer controls
- [x] No sheet search field
- [x] Boards combines Gigz, Giftz, Sellz, and The Haüz
- [x] Five results maximum plus View more
- [x] ZayDark contains no fake inventory
- [x] Desktop sheet is 420px and map controls stay right
- [x] Downtown plus clock lockup
- [x] Google tile integration removed
- [x] TypeScript check passed with an increased Node heap limit
- [x] Production build passed

final result: passed
