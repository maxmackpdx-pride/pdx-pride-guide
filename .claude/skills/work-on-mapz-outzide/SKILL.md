---
name: work-on-mapz-outzide
description: Locate and edit the real Zaylist Mapz and Outzide map sources. Use for requests about either map's controls, 3D terrain, bridges, lights, markers, styling, behavior, mobile layout, or deployment, especially when working without Tucker's local checkout.
---

# Work on Mapz and Outzide

## Map engine rule

- Leaflet was removed from Mapz. Do not reintroduce Leaflet, its plugins, CSS, or a fallback renderer. Trace and extend the current MapLibre stack in the live source. Treat old Leaflet instructions as obsolete.
- Mapz and Outzide share `client/public/map-foundation/` for lifecycle, geographic style, camera, motion, source/layer/image registration, and ordinary native pins. Switching rooms changes palette and objects only. Do not replace holograms, landmark models, building chrome, waypoint heads, waypoint height, or the zoom-out sparkle field with generic symbols or a new basemap.
- Maps use the debossed well without outer neon bloom. Keep Mapz color and shader experiments off `master` unless Tucker explicitly ships them. See `docs/MAP_RENDERING.md` and `docs/LIVE_DESIGN_STANDARD.md`.

## Find the source

- Use the GitHub repository `maxmackpdx-pride/pdx-pride-guide`, production branch `master`. In Tucker's local environment the checkout is `/Users/tuckercasey/pdx-pride-guide`; that path is not necessarily mounted here. Find an available checkout or use the connected GitHub integration. Fetch the current branch and files before editing. Read `AGENTS.md` and `CLAUDE.md` for current project rules.
- There is no `zaydar-map/` tree. Retired names (`ZaydarMapDemo`, `ZaydarCanvas`, `zaydar-map`) point at the current Mapz files below.

### Mapz (`/map`)

- React page and outer controls: `client/src/pages/MapzMapDemo.tsx`, `MapzMapDemo.css`, and shared map chrome in `LivingMap.css`.
- Iframe bridge / host: `client/src/components/MapzCanvas.tsx` (loads `/mapz-map/index.html`).
- Scene: `client/public/mapz-map/`, starting at `index.html` → `river-flight.js` and its imports (waypoints, roofs, bridges, nightlife materials, holograms).
- Waypoint shell/front-end ownership: keep `client/src/lib/livingMapWaypoints.ts` and `client/public/mapz-map/waypoint-markers.js` `shellPath` copies in sync. Accents: `client/src/lib/needzAccent.ts`.
- Back-end placement fields: `server/boardMapPlacement.ts` (`category`, `secondary`, `closed`, `kind`, `venueId`).

### Outzide (`/outzide`)

- React shell: `client/src/pages/Outz.tsx` (and place routes such as `OutzPlace.tsx`).
- Standalone map: `client/public/outzide-map/`. `index.html` holds control markup; `app.js` wires the MapLibre map and interactions; `style.css` plus `assets/*.css` style it.
- Map controls include `.map-controls`, `#terrain-toggle`, `#locate`, `#zoom-in`, and `#zoom-out`. The custom `3D` / terrain button is distinct from any MapLibre `NavigationControl` pitch/compass control; trace both when a user reports two 3D controls.

### Shared

- Infrastructure: `client/public/map-foundation/` (`lifecycle.js`, `camera.js`, `mode-camera.js`, `motion.js`, `surface.js`, `layers.js`, `native-pins.js`, `location.js`).
- Shared furniture CSS: `client/public/outzide-map/assets/map-continuity.css` is also imported by the Mapz React page. Check both maps when changing shared files.
- Authority doc: `docs/MAP_RENDERING.md`.

## Work from the correct layer

1. Identify which map and route the user means. For a screenshot, match its visible controls and geography to `/map` or `/outzide`, then follow the rendered element or effect back through the source. A screenshot is evidence, not an editable source file.
2. For Mapz outer controls, edit the React page/CSS. For scene geometry, shaders, lights, bridges, holograms, and markers, inspect the `mapz-map` iframe scripts and their imports. For Outzide controls, inspect its HTML, `app.js`, and effective CSS order. Do not assume a MapLibre control belongs to Mapz merely because both maps use MapLibre assets.
3. Search for duplicate controls and CSS overrides before changing them.
4. Make the smallest requested change against the current branch. Check desktop and mobile states, including overlays, safe areas, and map attribution. Verify the affected code and rendered route when practical. Prefer `node --test script/map-foundation*.mjs script/mapz-*.test.mjs script/outzide-*.test.mjs` for map-focused checks; known flaky Chrome-path `test:mapz` browser failures on `master` are not regressions.
5. Follow `AGENTS.md` and the user's authorization for publishing. Only an explicit typed push / ship / go authorizes advancing `master`. Report commit and actual deployment status accurately. Do not leave a patch in scratch as if it were published.

Live site: `https://www.zaylist.com`. Routes: Mapz `/map`, Outzide `/outzide`. Do not guess URLs from folder names alone.
