# Homepage panel 1: October 2026 vines

The original October 10 Portland globe is restored from baseline commit
`1c837c7ebced32059149ed947d82efe2616796da`, including its map texture,
white-dot rules, river labels, holograms and original waypoint rotation.
Pumpkin faces and Halloween symbol waypoints are removed.

Thirty overlapping Pink Ponies vine clusters are spread around the globe. The original
ten anchors remain; twenty new anchors fill the largest gaps by spherical distance,
including the upper and lower hemispheres. Each cluster uses the texture's native aspect ratio,
with a width of 1.04 radians and height derived from its source crop. Each cluster
is twice its previous width and height, creating an overgrown canopy while keeping
the leaves naturally shaped instead of stretching them into tall strips.
Each cluster bends onto the sphere from its local tangent plane to preserve leaf
proportions near the poles. All thirty appear fully formed as soon as the texture loads.
Stems sit directly on the globe surface; leaf lift is confined to the silhouette.
The original texture, gentle leaf movement, leaf overhang,
opaque-pixel event taps and keyboard event action remain. Reduced motion shows
stationary vines.

Surface vertices and leaf masks are built once. A smaller mesh discards hidden
rear triangles, and two transparent canvas layers cache the vine artwork at
up to 20 updates per second. Supported browsers paint those layers in a worker,
with only one job in flight and no backlog. Other browsers use the same cached
layers on the main thread. The globe composites two images at its normal frame
rate. The worker path creates hit-test geometry only when a vine is tapped.
Rotation follows visible elapsed time rather than slowing down when a
frame takes longer than 64 milliseconds; returning from a hidden tab resets
the frame clock to avoid a rotation jump.

The vines expire at Portland midnight on November 1, 2026
(`2026-11-01T00:00:00-07:00`). Open pages check every 30 seconds and on
focus/visibility changes; the original globe continues without vines.
