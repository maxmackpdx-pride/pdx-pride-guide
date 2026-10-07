# Mapz interactive map demo

Local route: http://localhost:5198/map-demo
Current Mapz renderer: the `/map` route mounts `MapzMapDemo` and `MapzCanvas`. The demo route uses the same scene. Read `docs/MAP_RENDERING.md` for the current shared foundation.

Run with the repository dependencies installed:

```sh
node script/prepare-local-db.mjs
npm run build
DATABASE_PATH=.local/data.db SESSION_SECRET=local-mapz-map-demo LOCAL_PREVIEW=1 NODE_ENV=production PORT=5198 node dist/index.cjs
```

The page uses the existing application API and detail cards. Locally, records come from the ignored local seed database; this is not a connection to the production database.

- Page and controls: client/src/pages/MapzMapDemo.tsx and .css
- Map adapter: client/src/components/MapzCanvas.tsx
- Standalone renderer snapshot: client/public/mapz-map/
- Shared infrastructure: client/public/map-foundation/
- Recovery: MapBootLoader retries the 3D renderer.

The original Demo C, homepage map, and existing /map are unchanged. The eight original materials/scene helper modules are retained verbatim. Zoom 14.5–16.5 introduces the holograms from smaller, brighter orbs; a selected listing can reveal its hologram immediately. No automatic return to flight during browsing. No drawer. Results open only when requested.

The metro bounds are a prototype rectangle (longitude -123.15 to -122.15, latitude 45.2 to 45.85), including Portland and nearby metro communities. The map uses existing geographic feeds and does not invent coordinates for listings without them. OutZide and board listings remain in Results as in the current map; inactive coming-soon layers are omitted.

Do not overwrite the source Demo C or homepage files while iterating here. Publishing to the Design Guide or replacing production Mapz is a separate requested step.
