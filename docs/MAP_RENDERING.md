# Map rendering

Portland and OutZide share one geographic surface. Switching maps changes the color treatment and the objects on top. It does not replace the ground.

## What stays custom

These are tuned artwork. Do not replace them with generic MapLibre symbols, default pins, or a new basemap style.

- Mapz holograms, projector beams, and waypoint heads (`client/public/mapz-map/hologram-materials.js`, `waypoint-markers.js`, `river-flight.js`).
- Waypoint height. Lift comes from `waypointHeightScale`, `heightScale`, roof lift, and the tonight multiplier. There is no pin ceiling.
- Building and bridge color, chrome, and occlusion (`nightlife-materials.js`, `natural-surfaces.js`, `building-models.js`).
- Portland landmark models (`portland-landmarks.js`).
- City sparkles. At zoom 16 and below (`CITY_SPARKLE_MAX_ZOOM`) the field spreads to one light per roof, then can fall back to street sparkles under zoom 12.75. Closer zooms use more lights per roof. White sparkle count stays 30.
- OutZide holograms, fire, steam, snow, coastal beams, and the button waypoint heads. Clustering stays screen-distance based in `waypoint-clusters.js`.

OutZide may reuse an existing waypoint button when its class, label, and markup have not changed. That must not change the artwork.

## Surface

- Vector ground: OpenFreeMap dark style and planet tiles (`https://tiles.openfreemap.org`).
- Elevation: Mapterhorn terrarium tiles (`https://tiles.mapterhorn.com/{z}/{x}/{y}.webp`), rendered through `maplibre-contour`.
- Mapz builds that surface in `mapzSurfaceStyle`.
- OutZide starts from the same function and brightens it with `brightenOutzideTerrain`. Contour signal colors in the OutZide copy of the surface are part of that map. Do not collapse the two surface files. Mapz keeps the separate hillshade source and the cached building-occlusion mask.

Fire danger, weather, and closures stay on their own feeds.

## Provider decision

MapTiler can serve vector tiles, terrain RGB, and contour lines, including a Pacific Northwest extract. It was not adopted.

- Free cloud use is non-commercial, shows the MapTiler logo, and is capped (about 5,000 sessions and 100,000 requests a month as of October 2026).
- Flex is about $30 a month and bills extra sessions and requests. 3D sessions cost more than flat sessions. No paid key is authorized.
- A style or terrain swap would move the ground the building colors, holograms, and waypoint heights are tuned to.
- Supplied contour tiles were not substituted for the current Mapterhorn-fed contour lines.

Keep OpenFreeMap and Mapterhorn until a replacement is verified against this artwork.
