# Map controls improvement and Astra system audit

Requested outcome: improve on-map Filters, Locate and Key placement; have Astra independently analyze the entire map system. This work is local. No deployment was requested for this task.

## Implemented

- Anchored the map to the measured header and mobile dock, including the dock's actual height. Mounted the Vaul portal in an explicit map-relative track. The desktop drawer no longer starts at the top of the browser over the navbar.
- Established one control layout. Desktop Locate is above the posting plus, with Key alongside and the screen rail beneath. On phones, Filters, Key, Locate and the plus occupy a single row with a 12px gap above the collapsed drawer. Locate is now available on mobile.
- Retained leftward entry/exit for the mobile filter panel, added a close control, constrained panel heights, and made the complete Key scrollable. Custom date fields stay within the panel width. Reset filters restores the default next-three-weeks window and layers.
- Kept the collapsed cyan grip at 52px above the real dock; it opens fully on tap or swipe. Vaul owns release snapping without a second asynchronous snap override. Reset the gesture flag at the next gesture so a drag cannot consume the next tap.
- Added an explicit nonmodal Radix context inside Vaul. The installed Vaul 1.1.2 does not forward `modal` to its Radix root; this was hiding map and navigation controls from assistive technology and trapping focus in the persistent sheet.
- Kept attribution in a visible top safe area. The expanded mobile drawer starts below it. Isolated Leaflet's stacking context so its zoom controls cannot paint over filter, Key or drawer content.
- Added control disclosure relationships, Escape dismissal and trigger focus restoration, named markers, and removed unsupported menu/radio semantics. Zoom and all map actions have at least 44px targets.
- Included both supported overlay aliases (`spotted`, `sellz`) in selection cleanup so closing their cards can remove the corresponding URL state.

The existing top navigation, homepage routing, marker designs, content families and posting destinations were preserved. The preceding local Happening Today change remains in place.

## Verification

`npm run check` and `npm run build` passed. The build retains the existing large-bundle warning.

`node script/check-living-map-ui.mjs` exercises rendered Chromium layouts at 1440×1000, 1280×720, 820×900, 390×844, 375×667 and 667×375. It checks control bounds and touch target sizes, drawer/rail separation, attribution clearance, full Key/feed scrolling, filter dates/reset, focus restoration, geolocation success, and creation choices. Where the shared nav is hidden at landscape width, the drawer correctly rests at the viewport edge.

Touch input is sent through Chromium's actual touch input channel to verify swipe-open, swipe-close, a subsequent handle tap, feed scrolling that starts on a card, and a deliberate card tap opening the Placez detail. Screenshots are written to ignored `.local/map-ui-check/`.

Additional browser checks passed for denied-location feedback, reduced-motion panel/drawer transitions and closing the ZayDark coming-soon dialog. The global reduced-motion rule resolves to a near-zero duration (0.00001 seconds), preserving the existing animation-event fallback.

These checks do not claim real-device iOS Safari validation, a production deploy, or repaired map data. The existing local realtime socket also reports a connection error during development; the map interaction checks run independently of that socket.

## Independent Astra review: remaining findings

Astra performed read-only analysis of LivingMap, its waypoint helpers, filters and routes, the shared map/card integrations, basemap delivery, and the associated location data. Findings below remain open and are separate from the control-placement fix.

| Priority | Finding and effect | Evidence | Suggested next change |
| --- | --- | --- | --- |
| High | Mizzed pins have no usable coordinate source even when the layer is enabled. | `client/src/pages/LivingMap.tsx`, `rowMarks`; `server/storage.ts`, `getMissedConnections` projection and `mapMissedConnectionRow` | Resolve public event/beach coordinates for these records, preserving anonymous identity behavior. |
| High | Missing coordinates can become `(0,0)` because `Number(null)` returns zero. The detail map can also describe this as a precise position. | `LivingMap.tsx`, `rowMarks`; `client/src/components/EventLocationMap.tsx:63`; nullable housing coordinates in `server/housing/store.ts` | Validate presence, finite values and valid coordinate ranges before conversion. |
| High | Co-located events, places and carpools cover one another and can hide selectable listings. | `LivingMap.tsx`, independent `Marker` loop; `client/src/components/EventsMap.tsx:129` has an existing venue grouping precedent | Introduce a location chooser or grouping using the existing object/card model. |
| Medium | Carpool destinations cannot be centered inside the map's allowed camera bounds. Rooster Rock is east of the limit; Sauvie is north. | `LivingMap.tsx`, `maxBounds` and carpool `BEACH_VERIFY_POINTS`; `shared/nudeBeaches.ts:157` | Reconcile supported destinations and metro bounds. |
| Medium | Custom dates slice ISO date strings while Today/weekend use Portland-local dates. Near midnight the same event can land on different days. Time-based memos also lack clock dependencies. | `LivingMap.tsx`, `visibleEvents` and `todayEvents` | Use one calendar-day/time-window helper and refresh at meaningful time boundaries. |
| Medium | The screen rail counts a list already capped to twelve, favors event-first ordering and includes markers hidden behind the right drawer. | `LivingMap.tsx`, `screenMarks` | Count the full eligible set and base eligibility on the unobscured map area. |
| Medium | Nearby Placez uses a business's first location even when another branch is nearer; its map pins include every branch. | `LivingMap.tsx`, `placePoint`, `placeMarks`, `nearbyPlaces` | Choose the nearest valid branch for distance and rail eligibility. |
| Medium | Vector fallback is removed after initial load and is not restored for later vector/network failure. | `client/src/components/CartoVectorBasemap.tsx:90`; `EventLocationMap` initialization | Provide a recoverable unavailable/fallback state. |

## Product decisions to keep explicit

- Drawer discovery sections and map layers are currently independent: Today does not follow the selected map date range, Nearby Placez does not follow Bars, and layer switches filter pins. Decide whether to label this distinction or align those feeds before changing it.
- Event and Placez detail overlays are the real shared components. Closed cards in the drawer are still custom presentation, not shared listing-card imports.
- LivingMap uses CARTO raster tiles while other surfaces use `CartoVectorBasemap`. Migrating it is a separate integration choice; control placement does not require it.
- `/` remains the restored homepage; `/map` is signed-in gated with the existing local-demo exception. ZayDark, Zenegades and AfterZ remain coming-soon actions.

## Worktree ownership

Pre-existing edits to `client/src/components/home/HomeStage.css`, `client/src/components/home/HomeStage.tsx`, `package.json`, `package-lock.json`, and `data.db`, plus untracked `client/public/fonts/` and `client/src/components/ui/handwriting-text.tsx`, belong to other ongoing work. They were preserved and excluded from this map commit.
