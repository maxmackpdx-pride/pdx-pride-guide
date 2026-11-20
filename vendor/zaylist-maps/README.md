# Pinned map release artifact

`v1.0.20.tar.gz` is the immutable build of maxmackpdx-pride/zaylist-maps tag v1.0.20.
The exact source commit, bundle entry and SHA-256 are locked in shared/mapReleaseLock.json.
The ordinary site build verifies and extracts it to /map-assets/v1.0.20/.
No runtime fetch of an unpinned latest branch is permitted. No private address notes
or captured user data are included. This archive is installed only once the source
release is tagged and its corresponding build is verified.

The deterministic release archive is stored as ordered 2 MiB parts to keep connector uploads bounded. Build reassembles the exact bytes and verifies the full SHA-256 before extraction. Parts are never selected via latest/main.

Browser-target compilation of the exact tagged source uses the explicit Vite define `process.env.NODE_ENV = "production"`. The v1.0.20 source configuration includes this define; the native ESM browser must not depend on a global Node process shim. Reproduce after checking out the exact lock commit and `npm ci`:

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

v1.0.11 moves the mode switcher back to the top of the map as floating chrome, rebuilt as Expanding Icons: icon-only circles where only the active mode expands into a pill revealing its label, tinted in its mode colour. The Mapz hologram layout solver's top inset is now chrome-aware, measured live from the rendered header and switcher edges, so no plaque can render under the chrome. Bare arrivals at /map are met by the Worlds Dial entry moment — a glowing globe with the five worlds as nodes on circuit traces; picking a node enters that world, and deep links with ?mode= still land directly in their mode with no dial detour. The drawer returns to pure discovery and remains exactly one scroll field. The v1.0.10 parts remain in this folder for rollback.

v1.0.12 gates the Worlds Dial to a visitor's first arrival only: the seen flag persists, returning visits land straight in the map, and deep links never consumed the first visit. Mode icons change to a folded-map glyph for Mapz and a cyan push pin on black for Boardz. Outzide waypoints now resolve their accent from the guide kind table (beach cyan, stay magenta, winter violet, day-use acid yellow, water kinds cyan, atv red) instead of stale per-record fields; the minor-road grid and neighbourhood labels are hidden in Outzide only; topographic contours are roughly twice as wide in token Safety Orange #FF7B00. The Mapz drawer is simplified to search, filters and a link to the Eventz page — the glance summary and teaser card list are gone — and it remains exactly one scroll field. The v1.0.11 parts remain in this folder for rollback.

v1.0.13 fixes the Outzide street suppression on the OpenFreeMap fallback style: its minor-road layer is named highway_minor, which the v1.0.12 matcher missed, so fallback sessions kept the residential grid (CARTO bridge/tunnel minor roads are covered too). Highway shields now render on both provider styles — neither style draws them, so they are built from the tiles' own route data (shield_text/network on CARTO, route refs on OpenFreeMap) as upright canvas shields. Contours are raised again to decisively bold widths (index 3.0px at z12, minors 1.4px, at least 1.8px across the z9-10 metro band) in token Safety Orange. The Outzide drawer header shows a loading state instead of a fabricated 0 destinations while the catalog fetch is in flight. The v1.0.12 parts remain in this folder for rollback.

v1.0.14 completes the Outzide street-fabric removal: the road lines were already suppressed in v1.0.13 (verified against the assembled styles — zero minor-road features render on either provider style), but the grid still read as present on OpenFreeMap-fallback sessions because that style's `building` fill keeps its provider fill-outline-color (rgb(27,27,29)) through the app's palette repaint, tiling every block with building-footprint outlines. The provider footprint fills (building, building-top) are now suppressed in Outzide only, through the same save/restore mechanism as the road layers, and return in every other mode. Contours are raised again with margin over the rendered targets — index ~3.8px and minors ~1.9px at the z13.5 working framing, index ~2.8px at the z9.6 metro framing — pixel-measured in before/after captures, still solely token Safety Orange #FF7B00. The v1.0.13 parts remain in this folder for rollback.

v1.0.15 fixes Outzide on phones, from Tucker's device reports. Elevation: the phone terrain gate ignored pitch, so the pitched regional landing (z8.4) never engaged the terrain mesh and the 3D toggle tilted a flat map (its first press even flattened the landing pitch); pitch now counts as elevation intent, and the DEM fallback no longer lets a single transient tile error strip terrain, contours, hillshade and shields for the whole session — it trips only when the DEM is effectively absent (consecutive errors across a success-free grace period), still with the honest banner and retry. Shields are decoupled from elevation availability, and primaries are shielded on the fallback style too. Roads: the "minor roads still obvious, some highways missing" report traced to repaint/filter vocabulary — CARTO abbreviates classes (road_mot_*/road_pri_* were painted muted like minor roads, and bridge_*/tunnel_* segments were never repainted, breaking highways at every river crossing), while the OpenFreeMap fallback bundles secondary+tertiary collectors into highway_major layers that the word "highway" painted bright major green. Classes are now read as whole id tokens; collectors join the suppressed fabric; the bundled fallback layers (and the minor road-name/oneway residue) are filter-narrowed to motorway/trunk/primary in Outzide with save/restore. The v1.0.14 parts remain in this folder for rollback.

v1.0.16 fixes Outzide's highway hierarchy at metro zooms, from Tucker's report that freeways read no bigger than arterials and I-84 had no shield at zoom 10. Shields: interstate routes get their own symbol layer — denser anchors, tight collision padding — inserted above the road-name layers (OpenFreeMap draws the "I 84" ref as line text that starved every shield anchor, and CARTO's sparse anchors lost to place labels), so I-84 shields place by zoom 10 wherever I-5/I-205 do, on both provider styles. Both shield layers are also re-added once after their source loads: symbol buckets parsed before a layer existed never gain its symbols, so placements from the first tiles silently went missing. Roads: motorway and freeway-grade trunk now take explicit casing/fill width stops (about 2x primary at zoom 10) with a dark minor-green casing edge, OpenFreeMap's bundled multi-class layers get class-split widths the same way, and primaries keep their provider weight — hierarchy by weight and casing only, in the two standing road greens (#91B834 / #35551D); everything below primary stays suppressed. The v1.0.15 parts remain in this folder for rollback.

v1.0.17 is the Mapz hologram defect pass from Tucker's phone screenshot (Nov 10): at metro zoom the Pearl/Old Town far discs piled onto each other boxless, a magenta star artifact splayed behind the Studio 201 disc, the debug stack strip rendered for production visitors, one disc clipped above the nav, the wide ground rings overlapped the waypoints, and Sanctuary's disc kept flipping to the generic adult flame. The solver (src/map/hologram-layout.ts) now places discs as first-class boxes — collision-solved against plaques and each other inside the chrome-aware viewport, beam held to [30,190]px inside the 26-degree lean cap — and hides what cannot fit, by the standing priority. The hologram's ground ring and light pool are removed at every zoom (the waypoint's own tight E4 dot stays), the disc-state beam renders its core only (the rotated planes were the star), logo-bearing adult venues always show their logo (name fallback if the asset fails), and the stack strip plus non-private prototype label sit behind dev/?debug only — the FICTIONAL DEMO disclosure still always renders. The v1.0.16 parts remain in this folder for rollback.

v1.0.18 is the beam/countdown/watermark pass from Tucker's phone verdict on v1.0.17 (Nov 10): the plaque beams had fanned into wide glassy shards, the disc beams read thin and several crossed in an X, and the translucent mode name sat mid-frame. The beam box now clips its planes (overflow hidden), so the rotated facets read as texture inside a narrow shaft column; the cone trapezoid is cut to the E4 mouth (~19px at the plaque, ~4px at the source), the facets dim to half, and the core brightens with a contained glow. The disc-state beam stays core-only for the planes (they were the v1.0.17 star artifact) but the core widens to a glowing 6px shaft. The solver registers every beam segment and rejects placements whose beams would cross, in both states. Far discs gain a small countdown line under the circle — the representative event's countdown on the plaques' live clock — in the true complementary colour of the assigned colour (magenta -> #33FF8A, red -> #33FFFF, violet -> #9DFF33, cyan -> #FF3333, Afterz Yellow -> #334EFF); the strip is part of the disc's solver footprint. The world caption moves to the bottom-right corner on all modes and viewports, above the attribution and the phone drawer tab; an open drawer covers it. The v1.0.17 parts remain in this folder for rollback.

v1.0.19 is the beam skew sign fix from the parent live check of v1.0.18 (Nov 10): at the framing the app itself loads for lng -122.68, lat 45.525, z12.5 (pitch 45, bearing -12), Camp's magenta beam and a red beam crossed in an X over Old Town even though the solver's no-crossing tests passed. The red beam was Sanctuary's far disc. The solver's segments were honest — the rendered beams were not the solver's segments: the hologram component drew each beam as a CSS box skewed by +atan2(dx, beamH), and skewX displaces the box's top by -tan(angle) x height, so every leaning beam rendered as the mirror image of its solved segment. Sanctuary's beam, solved leaning up-right, rendered leaning up-left through Camp's vertical beam; a second mirrored beam landed on Camp's disc, which is why visual checks kept passing them as connected. The component now takes its skew from beamSkewDeg in the solver module (the negated -atan2 convention, clamped to 26 degrees — the same convention the selected-card beam attachment already used), so the rendered beam is the solved segment for discs and plaques alike. Regression coverage models the CSS mapping directly (rendered-top landing tests over the Pearl geometry, a rendered-crossing test on the measured production anchors, and a source contract pinning the component to the helper; the contract fails on the v1.0.18 inline math). Rendered gates on the shipped bundle, measured from the beam cores' bounding boxes and computed skew rather than solver state: the parent framing shows 0 crossings with every beam landing on its own form (the same measurement on a byte-identical rebuild of v1.0.18 shows the Camp x Sanctuary crossing and landing errors up to 160px); the v1.0.18 gate framings re-run in rendered space also show 0 crossings. The v1.0.18 parts remain in this folder for rollback.

v1.0.20 is the waypoint redesign release, from Tucker's report (Nov 10) that Blender-package waypoints were rendering in production. Outzide waypoints are now a new Muse design set in the hybrid/E4 style: thirteen identities under waypoints/outzide-new, drawn on the package canvas so the scene system is untouched and every scene animation carries over identically (camp fire and sparks, fishing story, ATV mud, boating wake, spring puffs, winter flurry), with the selected waypoint rendered as the enlarged animated design itself at 44px and special places at 34px. The Blender GLB path is retired outright: the Three.js model layer and waypoint store are deleted, the public/waypoint-assets model tree (495 geometry files plus materials) no longer ships, and the packaged bundle contains zero .glb files and zero GLB loader references. The release also adds the Mapz shield icon scenes (bar bubbles, venue notes, cafe steam, restaurant glint, shop hop, Needz heartbeat, adult steam), the adult logo/flame timed alternation on the Mapz shield (logo first, never co-visible, rest on logo under reduced motion), and the Ken Burns treatment on hologram teaser posters only. Tests 420/420 on the tagged source; the v1.0.19 parts remain in this folder for rollback.


## v1.0.23: React Compiler across all five modes

Source: `7df02f2cd8930a5e374cfdc3a2e8249d4ccaae8a` (immutable `v1.0.23`).
Archive SHA-256: `7165d2fea1129edd85f132ac5af1ebbe9e9bcb5236e51d1c72a7f7ef9621baa3`.
React Compiler 1.0.0, React 19 target, infer mode; shared development/release
configuration covers Mapz, Outzide, Afterz, Boardz and ZayDark plus future React
source. GitHub runs 43381530289 and 43381530411 passed release packaging,
real page/pin transform checks, typechecking, map tests and both builds.
The host lock records compiler provenance; live deployment must still be verified.

## v1.0.24: Light-box holograms, bolder waypoint glyphs, Outzide Portland start

Source: `022229e3c413c718d2ac766dfb643c14db750f69` (immutable `v1.0.24`).
Archive SHA-256: `3689905795c31ab032b9694b30fa641b0975204a2cad41c0619f5d248c220aa7`.
Mapz holograms are the winning six-lightbox system: near, the poster is
sealed in a glass light-box (edge cage graded from the waypoint's assigned
colour into the poster's own border token, a mid glass pane with its own
cross-glitch, glitch/scanline signal layers); at far zoom it spins 540
degrees into the venue's extruded real logo — no disc — and the four-line
furniture (name, venue, start time, countdown; never a date or weekday)
stays up in both states. Waypoint glyphs are bolder (icon stroke 0.7 to
1.1, still centred on the kit shield). Outzide always starts in Portland:
a persisted URL camera no longer vetoes the Portland overview on boot,
and Outzide's waypoint name labels are removed. GitHub runs 44258108571
and 44258108636 passed the compiler checks, typechecking, map tests and
both builds. The v1.0.23 parts remain in this folder for rollback.

## v1.0.25: Tower-only light-box port (scene 03), fit-scale solver

Source: `bcbb47fb373a1e877ccf94d41ba5b20f43d530d8` (immutable `v1.0.25`).
Archive SHA-256: `9a20af1e0560bb48d5bf63db002548873805fa8d4d37b3a6b87659a294fafe51`.
Mapz holograms ship the approved Tower light-box only (scene 03; scenes 01/02
are out, not variants or fallbacks): the near state is the event poster sealed
in the glass Tower slab (140x249x28, edge cage graded from the waypoint's
assigned colour through a 48% blend into the poster's border token, white-hot
core line, corner nodes, mid glass pane), or — for posterless events — the
designed typographic face in the same slab, never bare text on a plate; beams
take the sheet geometry (352 near, 276 far) and land under the furniture; the
far state is the venue's extruded logo swapped in by a quick 540-degree spin,
its back pre-mirrored so it never reads mirrored, and one furniture block
(name, venue, start time, countdown only) stays up in both states. The layout
solver gains fit-scale in both states: a hologram whose natural stack cannot
fit above its anchor shrinks proportionally (the whole object, never
re-typeset) down to a legibility floor instead of degrading to its far text
state (near) or vanishing (far) — the geometry failure behind v1.0.24's
billboards-or-nothing rendering at the default camera. Tests 429/429 on the
tagged source; GitHub runs 44293528428 and 44293528463 passed the compiler checks,
typechecking, map tests and both builds. The v1.0.24 parts remain in this
folder for rollback.

## v1.0.26: Tower adapts to the poster; far-state distance falloff

Source: `5a0595c6b82c30b8c0ce1f95ab97546cbd47e527` (immutable `v1.0.26`).
Archive SHA-256: `cda8a743e92cdb8be36b5f6bab16f97412cafec19809b9e71737c6f7e45e6e93`.
The Tower light-box now takes each poster's own proportions: poster aspect is
measured from the image itself at runtime (the events payload carries no
dimensions) and the slab is derived at a held area budget with clamped
width/height, so a landscape poster fills a wide, shorter slab with no
letterbox bands, a portrait poster stays tower-like, and posterless events
keep the Tower's portrait form with the designed typographic face. The solver
collides and fit-scales on the per-poster box. Past the spin band the far logo
and its beam scale down progressively with distance until the solver releases
the hologram back to its waypoint; far forms render at their solved scale and
the far beam width follows the placement scale. Tests 434/434 on the tagged
source; GitHub runs 44344136151 and 44344139364 passed the compiler checks,
typechecking, map tests and both builds. The v1.0.25 parts remain in this
folder for rollback.

## v1.0.27: Expand-crash fix, far-logo back face, preview-card legibility

Source: `9e641e72bfa7bf1b810c301541a7e381cc57c362` (immutable `v1.0.27`).
Archive SHA-256: `3d898b9c74f3f9c5f4936faad019ef407ff5c80f8a2a7d4dff5c1731a72bf6c6`.
Expanding a map event card no longer crashes the page to black: the React
Compiler had hoisted a useRef inlined in a returned object literal
(useOpenCardClose, useIncidentalMap) into its memo-cache guard, so the hook
was skipped on cache-hit re-renders and corrupted the caller's hook order;
both hooks now call useRef as a top-level statement, a transform-level
regression test pins that shape, and an error boundary around the expanded
details degrades to the preview card as insurance. The far-state venue logo
back face is a plain half-turn again — the scaleX(-1) pre-mirror
double-flipped it, so a presented back read mirrored (the Badlands
wordmark). Map preview card legibility: the date/time line clears the close
chip, the flyer shows whole (contain, no fade mask), and the day-motif
network pattern no longer sits behind the card copy. Tests 441/441 on the
tagged source; GitHub runs 44406325296 and 44406325471 passed the compiler
checks, typechecking, map tests and both builds. The v1.0.26 parts remain in
this folder for rollback.

## v1.0.28: Map cards + hologram flyer unified with the new events cards

Source: `b5e8c7081ef8298978ba4f72305a49d55e2a2e9b` (immutable `v1.0.28`).
Archive SHA-256: `9ce169c4d0c3f1771ee8c4af44dda9c2f497f979d7453d5d7f16ebd234cf0c1f`.
The map's event cards and the Tower hologram's flyer are now the events
page's new card system, fed by the same live API. The events adapter
carries the full publicEvent record — the old 18-field whitelist dropped
isSexPositive, isClaimable, hasPendingClaim, lat/lng, venueWebsite and
source — so map cards render from the same record the board renders
from. A map tap opens the new FRONT card (variant A: countdown module
top-left, share icon + price chip top-right, Gigz/Carpool boxes + heart
in the bottom band, wide posters get the black chunk below the poster)
centered over a blurred scrim, not locked to the docks; a second tap
grows it into the new EXPANDED card (Feed / Info / Maps / More + Nearby
/ People from GET /api/events/:id/detail plus GET /api/placez/:id),
which alone locks full-screen above the top bar and bottom dock. The
legacy EventModal snapshot path is gone from production event details,
and the Mapz drawer footer now reads LIVE EVENTS · ZAYLIST EVENTS API.
The Tower hologram's flyer face carries the front card's countdown
module in hologram-law form (IN … / LIVE, no label, no days unit); the
law's furniture block, spin, far falloff and solver are unchanged, as
are the v1.0.27 expand-crash fix and its error boundary. Tests 447/447
on the tagged source; GitHub runs 44457309400 and 44457309352 passed
the compiler checks, typechecking, map tests and both builds. The
v1.0.27 parts remain in this folder for rollback.

## v1.0.29: Card scrim blur survives the CSS pipeline

Source: `5ca82c92ea62c62beb6045eaa6bdb97e17d9b86b` (immutable `v1.0.29`).
Archive SHA-256: `81d01df85d28bc95eb57407902ee0329bc5d8af9756d8ba8f39c960d26159044`.
One-line fix on top of v1.0.28: the map card overlay's blur was written
standard-property-first, and the CSS pipeline drops the standard
backdrop-filter declaration in that order, leaving only the -webkit-
form, which Chromium does not apply — the front card's scrim dimmed but
did not blur there. The overlay rule now writes -webkit-backdrop-filter
first and the standard backdrop-filter last; both declarations are
verified present in the built release CSS. Everything else is v1.0.28
unchanged. Tests 447/447 on the tagged source; GitHub runs 44461430505
and 44461430471 passed the compiler checks, typechecking, map tests and
both builds. The v1.0.28 parts remain in this folder for rollback.
## v1.0.30: Unconfirmed price demotes to asterisk small print

Source: `a10c93f520adb1ca6e345f9eb4c557a7cd16a32f` (immutable `v1.0.30`).
Archive SHA-256: `06e8fc48ba4cce78fd90e7f59bb057b99c174df8c0687be36d585acf522d9a41`.
One-treatment change on top of v1.0.29: PRICE NOT CONFIRMED no longer
renders as a chip on the map front card. An unconfirmed price is an
asterisk small-print note ("* Price not confirmed") at the bottom of
the card's bottom band, in both the overlay band and the wide-poster
chunk; confirmed prices keep the chip. The events board ships the
identical change (pdx-pride-guide PR #97) so both surfaces stay one
card system. Everything else is v1.0.29 unchanged. Tests 447/447 on
the tagged source; GitHub runs 44475124215 and 44475124204 passed the
compiler checks, typechecking, map tests and both builds. The v1.0.29
parts remain in this folder for rollback.
## v1.0.31: The heart is the Interested toggle on both card faces

Source: `9b588d72155017561cda9fa06ff981376164fa89` (immutable `v1.0.31`).
Archive SHA-256: `ae9b0ee1deb031d65918fa92506675b4c80bf235b618696d877827b9b24de072`.
One-behavior change on top of v1.0.30: the expanded card's heart is
restored, and on both faces the heart is the INTERESTED toggle — one
shared interested state owned by MapzMapCard drives the front heart,
the expanded heart, and the "I'm interested" row; neither heart is a
separate save/favorite state. Both hearts gain breathing room: the
front heart sits 6cqw in from the bottom and right edges (overlay band
and wide-poster chunk alike), and the expanded footer padding grows so
its heart's circle clears the bottom and right edges by the same
measure. The events board ships the identical change (pdx-pride-guide
PR #98) so both surfaces stay one card system. Everything else is
v1.0.30 unchanged. Tests 447/447 on the tagged source; GitHub runs
44489123636 and 44489123734 passed the compiler checks, typechecking,
map tests and both builds. The v1.0.30 parts remain in this folder for
rollback.
## v1.0.32: Card dialogs rise above the site dock

Source: `1d8c7349f49b85f5689540403a384bce5efa64f6` (immutable `v1.0.32`).
Archive SHA-256: `c28346bee748d58052743716dd0e0d27ed1471b0f6cf0db919409252820b2670`.
One-mechanics change on top of v1.0.31: the card dialogs (mapz-map
and board-map families) rise above the site dock — overlay z-index
130, dialog 131, against the dock's computed 120. A live geometry
check after v1.0.31 showed the expanded card's footer at the viewport
bottom (heart at y785-829 on an 844px phone) covered by the dock
(y754-836), leaving the heart restored in v1.0.31 — and the whole
footer row — untappable on the map at phone size. No card behavior
changes; everything else is v1.0.31 unchanged. Tests 447/447 on the
tagged source; GitHub runs 44499433303 and 44499433243 passed the
compiler checks, typechecking, map tests and both builds. The
v1.0.31 parts remain in this folder for rollback.

## v1.0.33: Expanded card receives the Nov 19 fix set

Source: `967451efe7a78e898c1af009c02f5102aca13c7e` (immutable `v1.0.33`).
Archive SHA-256: `83029e6f97a5e3d9a46d3acbe418ed6a8fdd6bba40bb722fd889484772eacf94`.
The cross-surface audit (Tucker: "Did anything else get missed like
that?") found the maps port of the expanded event card had missed the
site's Nov 19 fix set. This release carries it over: Info is the first
page; scroll containment with firm snap stops; the page scroller spans
the full card behind the flyer layer (flyer unchanged); the SOURCE
LINK button renders only from the server-gated detail payload field
(admins / promoters / owner); and the Info page connects the event to
both its venue (linked) and its host group. Everything else is v1.0.32
unchanged. Tests 448/448 on the tagged source; GitHub runs 44517719943
and 44517720056 passed the compiler checks, typechecking, map tests
and both builds. The v1.0.32 parts remain in this folder for rollback.

## v1.0.34: Gradient veil fix for the expanded card

Source: `69ead917e296273624041d51a66ed4772a5046f2` (immutable `v1.0.34`).
Archive SHA-256: `56fc95be0587e3ce0518c090c7075799cf4d4622dad17aad1f8b25dfede2395a`.
Follow-on to v1.0.33, caught by live verification: the expanded card's
gradient layer (768px tall, solid ink from 507px) painted over the
pages once they moved behind the flyer layer at z-index -1, so the
Info page rendered ghosted. The layer is now capped at the stack
offset with its stops in px (269/361/430/507 — the old 35/47/56/66%
of 768px): the flyer's fade is pixel-identical, but the layer ends
where the page content begins. The same fix ships for the site's
EventzExpanded in this PR — the defect was confirmed live there too.
Everything else is v1.0.33 unchanged. Tests 449/449 on the tagged
source; GitHub runs 44525308761 and 44525308905 passed the compiler
checks, typechecking, map tests and both builds. The v1.0.33 parts
remain in this folder for rollback.

## v1.0.35 · PlaceZ, rides and Afterz nights

Tag `v1.0.35` points to `440827f756a7b63b4aedd669afb9f9eb5d87fbb9`. The production archive has SHA-256 `af426c96858062304a1de7c935510ed2416bda91e9387253c961175833279aa1`.

PlaceZ opens at `/placez/map`. The map shows ride and invitation waypoints available to the signed-in member, opens native preview cards on selection, and supports opening and closing map controls on phones. Event interest uses the same heart service as the flyer board.

The [packaging workflow](https://github.com/maxmackpdx-pride/zaylist-maps/actions/runs/44645824243) and [compiler workflow](https://github.com/maxmackpdx-pride/zaylist-maps/actions/runs/44645824328) passed for this tag.
