# Zaylist five-mode map migration · 2026-11-07

## Source and release pins
- Repository: https://github.com/maxmackpdx-pride/zaylist-maps (private)
- Original immutable launch tag `v1.0.0`: `b6b7013dce8854c8f225d4f2e7aca421beca3af0` (unchanged)
- Immutable corrective release `v1.0.1`: `2c484d9ade336b475e1eb821aa7f7f893a5d1003`
- Pinned browser artifact SHA-256: `930323c9180eba8c54d9863c099b258f3f1afe7cd4faf08240fac404ce418b7a`
- Pin is checked by the ordinary website build. No unpinned branch or latest release is fetched at runtime.
- v1.0.1 fixes the embedded picker teardown null callback and makes browser-production compilation explicit. Host integration shields embedded cards/pickers from full-page CSS resets.

## Live-before-delete gate
The native five-mode cutover was deployed as site commit `ff65ac43b23efdf30d5b5f53292a8ed07886fb28`, Railway deployment `0767e59b-db9b-46a5-a37f-f86e0fd48663`. Deploy and verify jobs in Actions run `42374087348` completed successfully. Health confirmed that exact commit and deployment.

Before the following deletions, live phone-width Chromium checks confirmed all five modes load/switch in one MapLibre 6.16.0 instance without JavaScript exceptions; Mapz pans and touch-pinches; Outzide opens on metro, holds zoom 6.5, renders elevation in a fresh near view, and falls back flat when elevation tiles fail; Boardz pins open centered closed previews and then full posts; ZayDark shows the adult gate and its anonymous content API returns 403.

Rollback tag `pre-five-mode-map-v1.0.0-20261107` was verified remotely at the preceding actual production commit `4bc990e0599ca5629d1336767c0452d1cd3b33a9` before any deletion.

This is Chromium phone-width verification, not a physical iPhone/Safari test. Expected unauthenticated `/api/auth/me` 401 responses and missing ocean elevation tiles were observed; they are not JavaScript exceptions. Separate pre-existing Placez/Needz card-continuity failures remain outside this map migration and were not modified.

## Content sources
- Mapz: `/api/events` and `/api/directory`, using public LIVE event records, source venue colors/posters, and Pacific date/time semantics. Food/Needz projections use current directory records and source links.
- Outzide: `/outzide-map/places.json`, `/outzide-map/details.json`, `/outzide-map/routes.json`, `/api/outz/closures`, and `/api/nude-beaches`; existing weather/fire provider adapters remain in the native engine.
- Boardz: `/api/board-map-locations`, `/api/housing`, `/api/gigs`, `/api/gifting`, `/api/sellz`, `/api/missed-connections`.
- Afterz: `/api/maps/v1/social/afterz`, persistent `map_social_content` data seeded from sanitized existing fictional demos. Labels remain visible; no private address or directions are exposed.
- ZayDark: `/api/maps/v1/social/zaydark` protected by real active-user session plus explicit adult self-attestation at `/api/maps/v1/zaydark/consent`. Fictional profiles remain labeled; self-attestation is not verified age assurance. Demo invitations/chat are explicitly local simulations, not sent communications.

## Bookmark redirects
Only retired standalone entry routes redirect (308). Queries, including camera/bookmark selections, are retained; `guestPlace` normalizes to `place`.
- `/mapz-map`, `/mapz-map/`, `/mapz-map/index.html` → `/map?mode=mapz`
- `/outzide-map`, `/outzide-map/`, `/outzide-map/index.html` → `/outzide`
Existing `/map`, `/map-demo`, `/outzide`, and `/outzide/share/:placeId` use the native engine. Public place/event bookmarks open their current source record. Catalog/data/image URLs and destination detail routes do not redirect.

## Exact retired implementation files deleted (85)
```text
client/public/mapz-map/board-pins.js
client/public/mapz-map/bridge-fit.js
client/public/mapz-map/bridge-water-glow.js
client/public/mapz-map/building-models.js
client/public/mapz-map/e3-blender-model.js
client/public/mapz-map/e3-lod.js
client/public/mapz-map/e3-transitions.js
client/public/mapz-map/e3-venue-stack.js
client/public/mapz-map/e3-vortex-stack.js
client/public/mapz-map/event-card-artwork.js
client/public/mapz-map/event-card-motion.js
client/public/mapz-map/event-countdown.js
client/public/mapz-map/event-hologram-card.js
client/public/mapz-map/event-hologram-model.js
client/public/mapz-map/event-light-film.js
client/public/mapz-map/event-projection.js
client/public/mapz-map/ground-light-pools.js
client/public/mapz-map/hologram-materials.js
client/public/mapz-map/hologram-occlusion.js
client/public/mapz-map/hologram-presence.js
client/public/mapz-map/housing-holograms.js
client/public/mapz-map/index.html
client/public/mapz-map/label-visibility.js
client/public/mapz-map/logo-focus.js
client/public/mapz-map/logo-mask.js
client/public/mapz-map/map-exploration.js
client/public/mapz-map/map-hover.js
client/public/mapz-map/mapz-perf-preload.js
client/public/mapz-map/mapz-roof-boot.js
client/public/mapz-map/model-priority.js
client/public/mapz-map/portland-landmarks.js
client/public/mapz-map/projection-cache.js
client/public/mapz-map/radix-map.js
client/public/mapz-map/river-flight.js
client/public/mapz-map/screen-neighbors.js
client/public/mapz-map/settling.js
client/public/mapz-map/spatial-index.js
client/public/mapz-map/st-johns-bridge.js
client/public/mapz-map/standalone-demo.js
client/public/mapz-map/studio.css
client/public/mapz-map/surface-work.js
client/public/mapz-map/venue-attachments.js
client/public/mapz-map/venue-hologram-types.js
client/public/mapz-map/venue-roofs.js
client/public/mapz-map/waypoint-markers.js
client/public/outzide-map/app.js
client/public/outzide-map/assets/basemap-status.js
client/public/outzide-map/assets/cascadia-reveal.js
client/public/outzide-map/assets/coastal-hologram.js
client/public/outzide-map/assets/community-ui.js
client/public/outzide-map/assets/demo-feed.js
client/public/outzide-map/assets/directions.js
client/public/outzide-map/assets/feed-identity.js
client/public/outzide-map/assets/filter-state.js
client/public/outzide-map/assets/fire-danger.js
client/public/outzide-map/assets/fire-hologram.js
client/public/outzide-map/assets/hologram-materials.js
client/public/outzide-map/assets/hot-spring-steam.js
client/public/outzide-map/assets/i5-spectrum.js
client/public/outzide-map/assets/map-perf-preload.js
client/public/outzide-map/assets/opaque-waypoint.js
client/public/outzide-map/assets/outzide-night-palette.js
client/public/outzide-map/assets/outzide-surface.js
client/public/outzide-map/assets/summit-sweep.js
client/public/outzide-map/assets/waypoint-access.js
client/public/outzide-map/assets/waypoint-clusters.js
client/public/outzide-map/assets/waypoint-palette.js
client/public/outzide-map/assets/winter-hologram.js
client/public/outzide-map/index.html
client/public/outzide-map/style.css
client/src/components/MapSwitch.css
client/src/components/MapSwitch.tsx
client/src/components/MapzBootNotice.css
client/src/components/MapzCanvas.tsx
client/src/components/MapzLayerSheet.css
client/src/components/MapzLayerSheet.tsx
client/src/components/MapzSearchDrawer.tsx
client/src/components/MapzUpcomingRsvps.tsx
client/src/components/RetainedMapzRoute.tsx
client/src/lib/mapzAssets.ts
client/src/pages/MapzMapDemo.css
client/src/pages/MapzMapDemo.tsx
client/src/pages/Outz.css
client/src/pages/Outz.tsx
script/mapz-build.ts
```

All catalog JSON, conditions/access APIs, photos, demos, user content, shared homepage flyover terrain/material helpers, map-foundation assets, and incidental OutzPlace/OutzMap location maps were retained. The 17 superseded v1.0.0 vendored archive parts were replaced by ordered checksum-verified v1.0.1 parts; the earlier production commit retains their exact copy for redeployment.
