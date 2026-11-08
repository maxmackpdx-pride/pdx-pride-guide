# Pinned map release artifact

`v1.0.10.tar.gz` is the immutable build of maxmackpdx-pride/zaylist-maps tag v1.0.10.
The exact source commit, bundle entry and SHA-256 are locked in shared/mapReleaseLock.json.
The ordinary site build verifies and extracts it to /map-assets/v1.0.10/.
No runtime fetch of an unpinned latest branch is permitted. No private address notes
or captured user data are included. This archive is installed only once the source
release is tagged and its corresponding build is verified.

The deterministic release archive is stored as ordered 2 MiB parts to keep connector uploads bounded. Build reassembles the exact bytes and verifies the full SHA-256 before extraction. Parts are never selected via latest/main.

Browser-target compilation of the exact tagged source uses the explicit Vite define `process.env.NODE_ENV = "production"`. The v1.0.10 source configuration includes this define; the native ESM browser must not depend on a global Node process shim. Reproduce after checking out the exact lock commit and `npm ci`:

```sh
node --import tsx --input-type=module -e 'import {build} from "vite"; await build({configFile:"vite.release.config.ts",define:{"process.env.NODE_ENV":JSON.stringify("production")}})'
node scripts/namespace-release-assets.mjs
tar --sort=name --mtime='UTC 2026-11-07' --owner=0 --group=0 --numeric-owner -czf release.tar.gz -C dist-release .
```
The host rejects unresolved Node environment globals before serving the checksum-verified bundle.

The original v1.0.0 source tag is unchanged. v1.0.1 is a tested cleanup-race patch; the preceding production commit retains the earlier verified artifact for redeployment.

v1.0.3 swaps the Mapz waypoint and hologram rendering to Muse's kit waypoints and E4 holograms; cards summoned from the Mapz map open as a standalone overlay, never in the drawer, and the Mapz drawer scrolls as one single field. The v1.0.1 parts remain in this folder for rollback.

v1.0.4 fixes the Mapz hologram card: a hologram tap threads the representative event's id into the opened card, so the card features the exact event the hologram advertises, and card adapters now lead with the representative/next-upcoming event instead of the first listed event. The v1.0.3 parts remain in this folder for rollback.

v1.0.5 fixes the Mapz hologram layout: plaques are placed by a screen-space layout solver at the E4 presentation scale instead of rendering at one fixed size on their waypoints — every plaque sits fully inside the viewport, plaques tile beside or stack on each other without overlapping, overflow demotes to the far disc by priority (selected, then soonest event), beams are narrower and fainter, and below zoom 14.1 holograms are far discs only. The v1.0.4 parts remain in this folder for rollback.

v1.0.6 fixes the Mapz hologram layout: plaques are placed by a screen-space layout solver at the E4 presentation scale instead of rendering at one fixed size on their waypoints — every plaque sits fully inside the viewport and clear of the floating mode-tab bar, plaques tile beside or stack on each other without overlapping, overflow demotes to the far disc by priority (selected, then soonest event), beams are narrower and fainter, and below zoom 14.1 holograms are far discs only. (v1.0.5 carried an earlier layout cut without the tab-bar clearance and was superseded the same day.) The v1.0.4 parts remain in this folder for rollback.

v1.0.7 fixes the map cards and drawer on phones: closed Mapz and Boardz cards are a single native button wrapping the card face (no stacked overlay, no CSS zoom), so tapping a closed card opens it on iOS Safari; cards are bare objects — the "Tap card to open" caption, floating close button, opened-state dialog panel and the read-only preview bar are gone, and the close chip sits on the card itself. The mode switcher now sits at the top of the drawer instead of a floating bar over the map, and the hologram layout solver's top inset drops from 158 to 16 so plaques can use the top of the screen. Outzide region cards carry a relevant background photo from the site's own catalog collection, with a legibility scrim and the photographer's credit. The v1.0.6 parts remain in this folder for rollback.

v1.0.8 refines all five map modes with more legible map labels and selections, outdoor activity imagery, a monochrome Afterz palette and selected demo lighting, paper neighborhood labels for Boardz, and clearer ZayDark entry states. Existing demo and source boundaries remain in place.

v1.0.9 aligns the place category accent colors with the kit-assigned waypoint colors: venue moves from cyan to violet, cafe from green to Afterz Yellow, service from violet to cyan, and shop from yellow to cyan. Bar, restaurant, hotel and adult already matched the kit and are unchanged; healthcare is unchanged pending a separate ruling. The v1.0.8 parts remain in this folder for rollback.

v1.0.10 restores the Outzide landscape treatment that v1.0.8 muted: water returns from the muted teal to the deep-navy luminous token, Outzide place labels return from pale near-white to the guide sage, and a selected Outzide waypoint's label again renders in its assigned accent colour instead of white. Contour emphasis from v1.0.8 is retained. The v1.0.9 parts remain in this folder for rollback.
