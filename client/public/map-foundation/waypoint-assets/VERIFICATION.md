# Verification and limits — November 1, 2026

## Passed

- All 345 compatibility exports accounted for: 95 model identities with three LODs plus 60 badges; 155 unique identities.
- Browser/Three.js shared-builder check loaded all 345 recipes, applied motion at t=0 and t=3, applied reduced motion, and disposed the temporary instances. Zero failures or browser console errors. The four comparison instances remained; no temporary instance survived. See `previews/catalog-check.txt`.
- Shared geometry and material reference identity, distinct instance parents, surviving instance after peer disposal, pre-aborted build rejection, no instance leak, and no CRT node presence passed. See `previews/sharing-check.txt`.
- All declared token base-color factors match their resolved sRGB values converted to glTF linear factors: zero mismatches. Pride materials are protected multicolor, not falsely assigned a single token.
- All 345 compatibility GLBs have no external buffer/image dependency. Shared delivery intentionally references its local content-addressed components through the catalog; no third-party runtime service is used.
- No CRT/static geometry remains in the exported models. Solid-black curved glass follows the latest direct owner request, which supersedes the earlier scanline instructions.
- Fifty non-badge near assets with both glass and icon bounds have positive front separation: minimum icon Z is ahead of maximum glass Z.
- Browser-rendered front, oblique, rear, animation-frame, small/distant and selected-size samples on busy backgrounds are included. Reduced motion is the default stable pose. The foreground test cube verifies ordinary opaque depth overlap in the standalone Three.js scene. No rectangular CRT panel appeared in the inspected views.
- Original ZIP SHA-256 matches the untouched copy supplied in the editor handoff. See `original-package.sha256`.

## Measured improvements

- Shared geometry: 6,094,480 bytes versus 19,698,280 bytes of repeated component geometry (about 69% less). Geometry is separated from materials and category recipes.
- All near GLBs including badges total 10,898,452 bytes, versus the original package's roughly 41.69 MiB GLBs.
- Money: 56,056 original triangles → 4,498 near / 2,180 middle / 892 distant.
- Typical family-looking pin: 157 original primitives → 9 draw submissions before runtime batching, 2,262 near triangles.
- Example venue mini: 2,382 original triangles → 1,036 near / 668 middle / 412 distant, seven submissions.
- Recipes preserve the individual icons/effects and separate animation state. Sharing reduces storage/GPU duplication; it does not automatically batch all instances into one draw call.

## Explicit exceptions and remaining integration work

Nine LOD entries exceed the package's 20-submission threshold: `placez-needz` (26/26/25), `outzide-stay` (27/27/24), and `family-ride-offer-car` (21/21/21). They preserve multicolor or separately materialed details. Do not display hundreds of those full heads at once; use existing clustering/far minis and measure visible draw cost. `costs.csv` contains every asset rather than hiding these exceptions.

Standard GLB clips retain the authored timeline; endpoint differences are reported per clip in `manifest.json`. The shared builder adds a 0.25s continuous return segment; this differs slightly from a raw GLB player's hard wrap. STEP wire flashes remain discrete. Car, nude-recreation primary and its mini have no exported clips; the shared builder supplies optional subtle hover/sway. Animated sky/weather/glass effects are simplified portable mesh/material approximations, not Blender procedural ray behavior. No full-screen bloom is included.

The focused browser review uses desktop Chrome with a local server, not physical iOS. Front/oblique/back assets and ordinary opaque depth were checked; production MapLibre projection, terrain placement, selection transition, touch targets, hologram hit occlusion, navigation lifecycle and scene-wide draw cost must be checked by the implementation owner. Keep existing projected opaque-surface clipping until equivalent rendering AND hit-test behavior are demonstrated. A transparent surface must never become an invisible rectangular hit target.

No physical iPhone 14 Pro Max / 17 Pro Max validation or long endurance run was performed. Earlier product WebKit testing crashed after 64 movements/~94 seconds; that remains a failed short run, not a safe limit or passing benchmark. Deeper endurance is owner-deferred. Startup, gesture FPS, memory, battery and production stability targets remain unverified.

The actual map integration must retain different Mapz/Outzide sizing, clusters/counts, closed overlays, current coastcamp/watercamp/mixed fallbacks, existing cleanup/cancellation, static asset hosting, and DPR cap. It must not load every recipe/component upfront. No product files were edited by this asset-only pass.

The Blender source is desktop-editable. JPG previews open on iOS; the included web viewer can display the models in an iOS browser once served. This release does not include native USDZ Quick Look exports.
