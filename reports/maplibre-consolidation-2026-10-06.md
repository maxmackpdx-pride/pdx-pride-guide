# Mapz + Outzide consolidation, 6 October 2026

Tucker authorized the full architecture, cleanup, measurement, Foundation publication
and production release. Baseline: `619d8a763d9ee7fab5b93802f599658474457a8f`.
Architecture and recovery instructions: [MAP_RENDERING](../docs/MAP_RENDERING.md).
Raw measurements: [metrics JSON](maplibre-consolidation-2026-10-06.metrics.json).
Production and Foundation publication evidence belongs in Foundation decision
`ZF-MAPLIBRE-CONSOLIDATION-2026-10-06`; local test results are not deployment evidence.

## Delivered boundary

Both scenes share `map-foundation/` construction, geographic style, readiness,
camera helpers, motion/visibility, resize, source/layer/image reuse and interaction
state. Ordinary destination-card and community pins use native symbols with the
existing pin artwork. Geographic labels, contours and route highlights are native.
Mapz and Outzide retain their holograms, authored heads, cluster artwork, lighting,
materials, water, snow, steam, landmarks, bridges and other signature effects.

Outzide creates its vector shell before requesting the catalog. Catalog waypoints
appear independently of details, routes, beach snapshots and feeds. I-5 loading
is independent. Grok's stamp-based reuse remains; an additional presentation key
avoids constructing temporary DOM when the retained artwork is unchanged.
Stationary marker geometry is cached, with invalidation for camera, size, source,
visibility and presentation changes. Animated branch heads keep live measurements.
Fresh reads precede marker writes. Camera rendering drives moving effects; retained
offscreen and document-hidden scenes stop custom effects.

Native tile-space clustering was evaluated against pitched screen-distance,
phone/zoom radii, activity mixing, selected-item exclusion and bounds expansion.
It would change current behavior, so custom clustering and signature heads remain
deliberately. OpenFreeMap and Mapterhorn remain; MapTiler was not reevaluated.

## Measured results

Chrome 154 used software SwiftShader WebGL, 10 Mbps/40 ms network emulation,
desktop 1280×800/CPU 1× and an iPhone 13 viewport/CPU 4×. These are single
exploratory samples, with some concurrent local checks, not physical phone results
or statistically established speedups. Real Safari automation was unavailable
because Remote Automation is disabled. WebKit native-pin behavior was checked
separately and must not be called a Safari performance measurement.

Mapz first usable vector frame / major scene, seconds:

| Profile/cache | Before | After |
|---|---:|---:|
| Desktop cold | 5.53 / 25.41 | 6.10 / 23.04 |
| Desktop warm | 2.30 / 19.33 | 4.08 / 20.53 |
| Phone cold | 1.40 / 11.28 | 1.65 / 10.99 |
| Phone warm | 1.13 / 6.53 | 1.63 / 6.38 |

Mapz startup remains broadly similar; this evidence does not establish a faster
first frame. Stationary effect draws in requested three-second samples were
5/5/21/20 before and 5/4/17/21 after. Settled two-second offscreen samples fell
from 14/15/25/26 effect draws to **zero in all four profiles**. Stationary Mapz
marker layout reads were already zero and remain zero.

Outzide first geographic frame / catalog marker appearance, seconds:

| Profile | Before | After |
|---|---:|---:|
| Desktop | 8.14 / 4.23 | 8.80 / 4.68 |
| Phone | 3.19 / 2.78 | 4.61 / 2.94 |

The ordinary-data timing sample does not demonstrate faster startup. The separate
gated-data browser tests establish the architectural improvement: the map canvas
exists with the catalog held, and markers appear with detail/route/feed/beach
requests still held. Optional API feeds returned 503 in both measurement fixtures.
The baseline source had a missing closing brace before the controls binding; the
comparison repairs only that syntax defect and does not pretend the original
malformed module was a functional performance baseline or establish CDN behavior.

At the same settled Outzide camera (Portland, zoom 9, pitch 35), repeated layout
reads fell from **8,764 to 2,527 desktop** and **3,648 to 289 phone**. Corresponding
effect draws were 14→15 and 76→49. Requested three-second windows actually took
40.08→21.25 seconds desktop and 4.71→4.14 seconds phone because main-thread work
delayed timers. All rectangles count browser-wide reads, including MapLibre.
Offscreen transition samples (2.3 seconds requested, including in-flight work)
recorded 5→3 desktop and 27→4 phone custom draws. Shared lifecycle tests verify
both document-hidden and retained-offscreen cancellation.

Pan/zoom RAF intervals and every observed long-task duration are in the raw JSON.
Software WebGL yielded too few desktop frames to claim smooth interaction; phone
intervals include long gaps before and after. Negative first RAF deltas reflect
the previously queued frame timestamp and are not valid frame durations. Long
tasks remain substantial: preserving custom scene rendering does not remove its
cost. No physical-device FPS or invented percentage is reported.

Sampled stationary JS heap: Outzide desktop 81.36→81.00 MB, phone 63.27→128.53 MB.
Mapz cold desktop 92.40→136.01 MB and cold phone 107.51→86.68 MB; warm desktop
220.69→134.63 MB and warm phone 123.09→115.49 MB. These changing samples and GC
timing do not establish a general memory reduction; the higher phone Outzide
sample remains a limitation of the evidence.

## Deliberate cleanup and verification

Static imports, dynamic paths, host prefetches, service-worker precaches, build
scripts, tests and fallback consumers were inspected before and after deletion.
Removed duplicate Outzide geographic/bridge/material utilities, old camera/motion
copies, duplicate vendored MapLibre/contour bytes, disconnected `LivingMap.tsx`
and unused `MapzFallback.tsx`. Active `LivingMap.css`, `livingMapWaypoints.ts`,
embedded Leaflet/CARTO consumers, licenses and existing shared vendors remain.
Homepage and standalone Demo C files were not edited or synchronized.

Verification: 196 focused foundation/Mapz/Outzide tests pass; native artwork,
popup/source reuse passed Chromium and WebKit browser checks; desktop/phone
delayed-data and controls checks pass. Typecheck, build and deploy-bundle checks
pass. Built product routes have no observed JavaScript errors; Outzide's regional
terrain, I-5, clustered artwork and beams were visually inspected. Full Mapz
scene runs preserve custom layers. The master production `npm run ship` gate
must pass before push. Foundation's build and 213 tests pass; its existing
protected-content drift is advisory baseline drift, not reseeded by this work.
