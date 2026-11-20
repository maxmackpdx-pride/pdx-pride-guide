> Historical November 11 format contract, preserved 2026-11-18. This is a reference snapshot, not a claim that these dimensions supersede current owner-approved implementation. The original CSS files could not be read through the available skill-resource interface and are NOT included. Their original recorded SHA-256 hashes appear in PLACEZ_KIT_PROVENANCE.json; those hashes are provenance, not verification of copied files.

# Current PlaceZ formats and spacing contract

Verified source: **PlaceZ-Spacing-Review-Kit.zip**, Space file `[private reference ID omitted]`, saved November 11, 2026. Its interactive review is `[private reference ID omitted]`. This spacing kit validates the five completed examples; carry its shared rules forward into the sixth-location kit without replacing that kit's venue data or assets. Snapshot filenames and checksums are in current-kit/source-manifest.json (source-bundle file: `current-kit/source-manifest.json`).

## Baseline and precedence

Match the current PlaceZ all-formats kit, not a new approximation of the older flattened card references. The shared visual/layout baseline is the **five completed examples: Holocene, Stag PDX, Alberta Rose Theatre, Eagle Portland, and Darcelle XV**. **Pizza Thief, location #6, is still in progress**; its placeholder artwork is not an approved finished style reference. Apply the same shared component layout to #6 without treating its unfinished art as the baseline.

Tucker's November 11, 2026 instruction was: “Make sure the receipy has the card sizes spacing should be identical to the 6 we just made #6 still in progress”. Keep the existing five-format geometry, typography roles, gaps, padding, image bounds, control sizes, title/logo placement, and responsive rules identical across venues. Change venue data/assets, not the shared design. Do not remeasure CSS from a generated bitmap, globally scale a square card, or redesign a format to fit new art.

Use the latest approved kit when available; the bundled CSS snapshots below preserve this revision's exact layout. A later explicit user-approved change overrides the snapshot. Current kit dimensions and spacing override older approximate half-card composition or generic radius guidance; those earlier images remain treatment references.

## Exact sizes and shared spacing

All values are CSS pixels at intended display size, not generated raster pixel dimensions.

| Format | Size | Standard side padding | Outer radius |
| --- | --- | --- | --- |
| Square | 250 × 250 | 15 | 20 |
| Tall | 200 × 403 | 14 | 16 |
| Small | 136 × 170 | 9 | 16 |
| Wide-Map | 360 × 216 | 16 | 16 |
| Expanded | Responsive, normally 360 wide; viewport-bounded height | 20 | 14 |

Expanded uses `height: min(960px, calc(100dvh - 24px))` in the component. The preview dialog uses `width: min(360px, calc(100vw - 30px))` and `height: min(960px, calc(100dvh - 30px))`. The preview's viewport-at-most-400px rule sets wide/expanded width to `min(360px, calc(100vw - 26px))` and gives the expanded body an 18px side-padding variable; the later dialog selector supplies its own 30px bounds. Preserve cascade and container context. Do not invent one fixed expanded height or label it a 360 × 960 fixed card. Height breakpoints at 700px and 480px reduce expanded artwork and header sizing as already defined in the CSS.

### Approved footer and heart adjustments

- **Square and Tall:** move the existing 44px-high action row upward by 4px, from `bottom: 12px` to **`bottom: 16px`**. Leave left/right padding and control sizes unchanged. “4px” means the added bottom clearance, not a replacement 4px absolute inset.
- **Small:** inset the action/heart wrapper **2px from the right and 2px from the bottom**, previously 0/0. Preserve its 44px touch target and existing 29px visible ring/17px heart SVG. Do not shrink the tap target to the visible icon.
- **Expanded:** add 4px below the save/follow footer by changing padding from `8px var(--pz-pad)` to **`8px var(--pz-pad) 12px`**. Keep top and side padding unchanged. Preserve the header, pager, and body-scroll layout.
- **Wide-Map:** leave its action rail and spacing unchanged. Do not propagate the Square/Tall override to it.

These changes apply through shared format rules, consistently for all venue records, including #6 when its artwork is finished. No per-venue CSS exceptions.

## Exact layout references and verification

Read the complete bundled PlacezQuickCard.css (source-bundle file: `current-kit/PlacezQuickCard.css`) and preview.css (source-bundle file: `current-kit/preview.css`) before making or reviewing a complete-card layout. They are reference snapshots, not a complete runnable app. Inspect the current kit's `src/PlacezQuickCard.tsx`, `src/ExpandedPager.tsx`, presentation data, font definitions, and assets as needed to preserve markup roles and behavior. Do not claim that copying CSS alone implements the app or live integrations.

Keep all unrelated layout rules from the kit: image heights/crops, typography, identity/content gaps, category spacing, button/heart geometry, art-versus-information balance, expanded header placement and responsive bounds. Preserve the existing separate exact logo asset. For complete cards, use the shared source component/stylesheet or a genuinely matched layout, not image generation for precise labels and controls.

Compare every requested format at its actual display size with the five completed examples, using the same viewport and data state. Check computed sizes, padding, action-row positions, visible rings versus touch targets, header/footer bounds, and any conditional event/content layout. Check short/tall viewports and narrow screens for Expanded. Report CSS checks and visual checks separately; a build or a plausible raster is not proof of exact spacing. Keep source-photo fidelity checks independent of layout consistency.

## Preserve treatment inside the fixed artwork bounds

Keep the shared dimensions, art-area heights, typography, controls, and spacing unchanged while correcting artwork framing. Adjust the source composition uniformly within those bounds so visible torn-paper texture/fibers and fine **3D wireframing** in the sky and around the building survive each final crop, mask, logo overlay, and fade. Do not use tighter cover-cropping that removes most of these features, a taller photo header, stretched architecture, or smaller controls as a shortcut. Use authentic wider source coverage when a wider building view is needed.

Compare Square, Tall, Small, Wide-Map, and responsive Expanded with the five completed examples at equal intended display size. Check the actual rendered crop, including Expanded's narrow/short viewport states, not only the uncropped source. Treat missing visible collage or sky/building mesh as a failure even if the glass body is etched correctly. Keep that body near-black with restrained sheen and fine category/complement geometry, mainly right/bottom; reject broad opaque color panels, filled polygons, and brown-orange patches.
