# Shared waypoint asset integration — November 1, 2026

Owner authorized implementation/publication and focused credit-conscious checks, deferring exhaustive map endurance testing. The prior browser crash after 64 movements remains a recorded baseline limitation, not a guarantee that 64 movements are safe.

Source archive: Mapz-Outzide-Waypoints-Revised-2026-11-01.zip.
SHA-256: 1982c13916efd5c0c6f5d8834165a9f1423dfc8adf0c160f501412ea528b0c0f.
Only the shared static runtime representation is shipped; no Blender source, duplicate compatibility GLBs, or viewer dependencies are loaded in production.

Both maps use their existing MapLibre WebGL context. Common geometry/materials are instanced into draw batches while retaining independent animation transforms. Visible head sizes, DOM/canvas hit targets, labels, counts, venue logos, reduced motion, and static asset delivery are preserved. Source categories without a matching approved asset retain their current marker fallback. OutZide coastal/water camping and mixed clusters remain distinct. Special beaches use the provided nude-recreation asset. No new API enum is introduced.

Focused evidence: Chrome rendered both map routes at a mobile viewport, with 155 visible Mapz objects in 61 batches and two close-up OutZide objects in nine batches. No asset-load/page errors occurred; the local guest fixture logs its expected unauthenticated-user and absent attendance-WebSocket responses. Desktop WebKit pixel checks confirmed opaque-screen masks suppress all covered model pixels, two identical objects share seven draw batches, disposing one preserves the other, and full removal releases all instances/geometries/materials without adding a second canvas. Existing clipping, marker-depth, and bitmap lifetime checks passed.

Not certified: physical iPhone performance, 30-minute stability, all speed targets, or full-scene compositor FPS. The owner's phone is a 17 Pro Max; older-device target remains 14 Pro Max Safari. Nine source LODs exceed the editor's 20-submission budget; integration batches shared parts, but that is not a measured universal FPS guarantee. Further performance work requires a separate follow-up; do not restart a broad audit from this document.

Production-bundle verification caught and corrected a relative model-base URL after bundling relocated the renderer. The WebKit regression now compiles the renderer under an assets subdirectory, ensuring static model requests resolve to the shared public asset root.

The final compiled-production fixture rendered both routes successfully: Mapz 155 visible / 61 batches, OutZide two visible / nine batches, zero model failures in either route. The source-only fixture is not the publication gate.
