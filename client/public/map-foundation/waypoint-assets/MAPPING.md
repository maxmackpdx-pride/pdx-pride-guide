# Integration mapping and placement

`integration.json` enumerates every identity/LOD. `shared/catalog.json` resolves each to a recipe. A missing builder lookup returns `null`: retain the working existing renderer/fallback instead of substituting an unrelated asset.

| Product category | Asset / handling |
|---|---|
| Mapz bar, venue, adult, needz, shop, cafe, restaurant, service | `placez-{kind}` via Mapz builder |
| NEEDZ subcategories | `needz-health`, `needz-safety`, `needz-legal`, `needz-youth`, `needz-community`, `needz-family`, `needz-money`, `needz-arts`, `needz-mental-health`, `needz-harm-reduction` |
| Service subcategories | `services-graphic-design`, `services-hair`, `services-massage`, `services-tattoo`, `services-web-development` |
| Board/Hoüz pin families | `family-looking`, `family-forming`, `family-offering`, `family-managed`, `family-gigz`, `family-giftz`, `family-sellz`, `family-mizzed`, `family-outside-post` |
| Ride offer | `family-ride-offer-car`; no exported clip; runtime-only subtle hover |
| Outzide trail, stay, beach, camp, spring, fishing, boating, atv, winter | `outzide-{kind}` via Outzide builder |
| Outzide `dayuse` | Explicit alias to `outzide-day-use` (yellow #CCFF00) |
| Outzide `coastcamp`, `watercamp` | Keep current distinct icons/renderer; no matching combined asset is invented. Build shared camp parts only if retaining the correct coastal/water icon and existing behavior. |
| Outzide `mixed` and clusters | Keep current mixed-kind logic and counts; homogeneous clusters can use the corresponding base with the existing count overlay. Never replace counts with an unlabelled individual marker. |
| Closed status | Separate `status-closed` #FF2400 layer. `outzide-winter-closed` is the provided winter example, not a universal category replacement. |
| Nude recreation | `outzide-nude-recreation`, yellow; explicit owner-requested primary. Connect to the current product field; do not invent a new API enum. |
| Swimming and other secondary indicators | `secondary-swimming`, `secondary-*`, or `badge-secondary-*`; attach as secondary pieces instead of silently changing the main place kind. |
| Small/far markers | `mini-{primary id}` where present; use the catalog, not string concatenation without existence checks. Minis omit detailed icons intentionally. |
| Removable square icon badges | `badge-{id}` where present; 60 explicit badge identities. Load through `store.build` for generic badges/secondary parts. |

Tokens are resolved in `tokens.json` and per-entry metadata. Category token overrides touch only named material slots; intentional Pride ramps and inserts are protected. NEEDZ gray outer metal/neutral primary is intentional and does not replace its colored subcategory accent. The full Pride insert and mini Pride rim gradient are distinct authored representations.

## Placement and size

The exported coordinate system is right-handed glTF: Y up, front +Z; Blender source Z-up was converted at export. Design-unit measurements are not metres. Source gallery offsets are removed. Wrapper origin `[0,0,0]` is the terrain-placement anchor; retain the authored hover offset, rather than pushing every visible shield tip to zero. Pin steel point reaches Y=0. Other waypoint tips hover above it. `headBounds` measures the rest-pose visible head, excluding ground/steam/smoke/snow/particles; `iconBounds`/`glassBounds` are separate. Bounds do not include the full animation envelope.

Scale = `worldUnitsPerCSSPixel * desiredHeadCSSWidth / headBounds.size[0]`. Keep aspect ratio. Use the map projection at the marker's depth, not a constant world scale. `setHeadWidth` applies this scale to the placement wrapper. Keep at least a 44 CSS px interactive target independently of visible size. Anchor hit tests to projected geometry and preserve existing opaque-hologram clipping.

Mapz: 31→36 px unselected across zoom 12→16; 57→49 px selected; selection transition 180ms. `mapzHeadPixels()` implements these endpoints. Selection lift belongs on the placement wrapper and must not overwrite exported animation nodes.

Outzide is separate: current CSS ordinary width 28px, special 34px, selected 44px; height ratio 68/46. Existing vertical head offsets are 25×2/3, 39×2/3 and 70×2/3 px respectively. Clusters remain 40×54px at 27px bottom offset with their count overlay. Verify final projected alignment in the actual map; do not blindly add those legacy DOM offsets to an already terrain-anchored 3D assembly. Preserve Outzide's existing gentle sway or the authored clip, never both.

LOD distances remain the integrating map's named constants. Use screen-size/category context; do not hard-code the unsettled same-day vortex overview/close-state decision into this asset package. Do not conflate waypoint LOD with E3 hologram behavior steps.
