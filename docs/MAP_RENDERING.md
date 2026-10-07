# Map rendering

Mapz and Outzide use one MapLibre foundation under `client/public/map-foundation/`.
This is infrastructure consolidation, not a visual redesign. OpenFreeMap provides
vector geography; Mapterhorn provides terrarium elevation and contour data.
MapTiler was evaluated and rejected. No paid replacement provider is authorized.

## Entry points and ownership

| Surface | Active entry point | Product renderer |
| --- | --- | --- |
| Mapz `/map` | `client/src/pages/MapzMapDemo.tsx`, `client/src/components/MapzCanvas.tsx` | `mapz-map/river-flight.js` |
| Outzide `/outzide` | `client/public/outzide-map/index.html` | `outzide-map/app.js` |
| Shared infrastructure | `client/public/map-foundation/` | lifecycle, camera, motion, geographic style, sources, layers, images and native pins |

The homepage and standalone Demo C remain independent editing spaces. Their files
are not synchronized by map work. Existing shared dependencies are consumed without
copying a demo into production or editing the homepage composition.

## Shared responsibilities

- `surface.js`: the geographic style, land/water/building treatments and provider sources.
- `lifecycle.js`: MapLibre construction, vector-first boot, readiness across style
  replacement, coalesced element resize and a batch of marker geometry reads.
- `camera.js`: camera capture, validated restoration and persistence with disposable
  listeners. Mapz keeps its host-driven flight/exploration behavior; Outzide keeps its
  existing saved-camera key and restoration rules.
- `motion.js`: cached OS reduced-motion and host Calm Mode preference, including updates.
- `layers.js`: source registration, unchanged-data suppression, layer registration,
  deduplicated image loading with retry and feature selection/hover transitions.
- `native-pins.js`: ordinary destination-card and community pins in symbol layers,
  using rasterized MapLibre pin artwork, stable IDs, popup text and pointer behavior.

Mapz's `natural-surfaces.js` owns custom water/reflection and cached building-occlusion
rendering and exports the shared style. Outzide's `assets/outzide-surface.js` adds its
contour signal layers. `brightenOutzideTerrain` remains its palette adapter. Terrain
and hillshade use independent source state while sharing elevation data.

## Native and custom rendering boundary

| Rendering | Owner | Reason |
| --- | --- | --- |
| Geography, place labels, terrain, hillshade, contours, trail highlights, I-5 spectrum | MapLibre native layers | Geographic primitives and style expressions |
| Ordinary card destination and community pins | Shared MapLibre symbol renderer | Existing default pin artwork, cached per color |
| Mapz waypoint heads, animated logos, hologram labels, beams, projector disks, roofs, reflections, buildings, bridges and landmarks | Mapz custom scene | Height, perspective, animated artwork, occlusion and interactions are coupled |
| Outzide activity heads, closure pulses, winter signals, check-in faces, cluster heads/counts, snow, steam, coastal beams and fire | Outzide custom scene | CSS artwork and effects are part of the current experience |

Do not replace signature artwork with generic pins or relocate animated labels into
flat text layers. Mapz's roof lift, tonight multiplier and waypoint height remain
unchanged. City sparkles retain `CITY_SPARKLE_MAX_ZOOM=16` and the 30 white sparkles.

## Startup and failure

Outzide constructs its vector map before requesting its destination catalog. The
catalog hydrates independently and immediately renders cards and reused waypoint
nodes. Details, routes, feed and beach snapshots hydrate separately. Optional data
failure does not block the base map or destination list. Routes with no loaded
geometry do not attempt to fit empty bounds. Detail hydration preserves the
community editing tab. Terrain, contours and effects remain a later phase; I-5 geometry installs independently.

Mapz presents its vector city before optional scene assets and terrain. Both use
shared readiness and resize infrastructure. The product-specific recovery UI stays
in place. Outzide's basemap banner responds to OpenFreeMap source failure/recovery;
optional API failures remain local to their panels. Catalog failure keeps a usable
map and a retryable field-guide error. Mapz retries its 3D renderer through
`MapBootLoader`; the unused 2D fallback and disconnected old map have been removed.

## Clustering decision

Retain the current custom clustering calculations. Outzide projects coordinates
through the pitched camera, uses a different radius by zoom and phone size, mixes
activities below zoom 7, excludes the selected destination, and expands to the
member bounds. Mapz's cluster/separation behavior is coupled to hologram geometry
and protected venue/selection rules.

Native clustering uses tile-space point clusters, a numeric radius/max zoom and
aggregate properties. It does not reproduce this camera-dependent grouping and
selection exclusion without repeated source rebuilding and behavior changes.
See [MapLibre source specification](https://maplibre.org/maplibre-style-spec/sources/)
and `script/outzide-clusters.test.mjs`. Custom cluster heads remain MapLibre Marker
objects on the shared lifecycle; ordinary pins use native symbol layers.

## Performance and assets

Grok's stamp-based Outzide marker reuse remains intact. A presentation key now skips
constructing temporary DOM for unchanged artwork, including closure, winter and
check-in state. Holograms cache stationary marker geometry and invalidate it when the camera,
size, source or marker presentation changes. Fresh geometry reads are batched
before effect writes; animated branch heads retain their live measurements. Hidden or offscreen retained maps do not draw effects;
visibility and motion changes cancel/restart the existing timer. During camera movement the map render lifecycle drives effects without a competing animation timer. Resize notifications
are coalesced and disposed. Selected route geometry is cached and sources/layers are
updated rather than removed and recreated. Native images are registered once per
map/color; unchanged community rows do not rebuild their source.

Both scenes use the same authored MapLibre 5.6.2 runtime at
`home-flight/vendor/maplibre-gl-5.6.2.{js,css}` and contour runtime at
`mapz-map/vendor/maplibre-contour-0.1.0.js`. Mapz production still bundles and
content-addresses its scene through `script/mapz-build.ts`. No dependency upgrade is
part of this change. Duplicate Outzide style/provider/bridge copies and redundant
vendored runtime files were removed after static and dynamic-path inspection.
Embedded CARTO/Leaflet maps remain active independent consumers; their dependencies
and attribution must remain. `LivingMap.css` and `livingMapWaypoints.ts` remain
because active product/homepage consumers still use them.

## Verification and troubleshooting

Run `node --test script/map-foundation.test.mjs script/mapz-*.test.mjs script/outzide-*.test.mjs`
and `node --test script/map-foundation-browser.test.mjs`, then the production
`npm run ship` gate on master. Build-time Mapz tests exercise the shared constructor.

For startup failures, validate Outzide's module syntax first. For a stalled style
replacement, use `whenStyleReady`, not a late one-shot `load` listener. For an empty
route, check geometry availability before fitting bounds. For missing symbols,
check image decoding, source identity, source/layer registration and optional-feed
status. Terrain tile errors must not be reported as destination-catalog failures.

Measured results and environment limits are recorded in
`reports/maplibre-consolidation-2026-10-06.md`. Performance evidence must identify
software WebGL, CPU/network emulation, unavailable real Safari automation and any
syntax-only baseline repair. Never invent improvements from file-count reduction.
