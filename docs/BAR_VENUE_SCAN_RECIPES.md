# Bar + venue + group scan recipes (32)

Research compiled **2026-07-19** for QSearch accuracy.  
**Groups rule:** Portland-metro events only (multi-city brands drop SF/Seattle/etc.).

| # | Name | Type | Events URL (primary) | Format | Flyers | Conf |
|---|------|------|----------------------|--------|--------|------|
| 1 | Badlands | bar | `https://badlands-events.badlandsportland.workers.dev/api/calendar?from={d}&to={d}` | custom JSON | `photoUrl` → Drive proxy full art | high |
| 2 | Camp Bar PDX | bar | `https://campbarpdx.com` `#events` | html weeklies | IG specials only | high |
| 3 | CC Slaughters | bar | `https://ccslaughterspdx.com/` | html | WP vertical posters `/wp-content/uploads/` | high |
| 4 | Covert Café | bar | `https://www.thecovertcafe.com/events` | html | stock category imgs only | high |
| 5 | Eagle Portland | bar | `https://www.eagleportland.com/what-s-happening` | wix html | wixstatic; strip `/v1/fill/` | high |
| 6 | Escape Bar & Grill | bar | Weebly weeklies + EB specials | html + eventbrite | Weebly gallery + evbuc | high |
| 7 | Happylucky No. 1 | bar | `https://happylucky.com/now-serving` / Humanitix host | meta / IG | Humanitix when ticketed | med |
| 8 | Jackie's | bar | - | **ig-only** | IG `@jackiespdx` | high |
| 9 | Living Room Wines | bar | Eventbrite org `o/104468106391` | eventbrite | EB card art; free nights IG | high |
| 10 | Montavilla Station | bar | `https://montavillastation.com/` `#fun` | static html | none | med |
| 11 | Peacock PDX | bar | `https://peacockpdx.com/` Events section | html/JS | cards + IG `@peacock.pdx` | med · year-round (ex-Crush; never scrape `@crushbarpdx`) |
| 12 | Process | bar | `https://www.processpdx.club/` Schedule | html + RA | RA event art better | high |
| 13 | Ring Ding Ding | bar | - | **ig-only** | IG `@ringdingdingpdx` | high |
| 14 | Scandals East | bar | `https://scandalspdx.com/events` | zyrosite flyer gallery | full posters on zyrosite CDN | high |
| 15 | Silverado | bar | `/events` SQS **stale** | squarespace archive | historical only; live = IG/FB | high |
| 16 | Stag PDX | bar | Eventbrite `o/stag-pdx-73608204703` | eventbrite | EB brunch/specials | high |
| 17 | Stem Wine Bar | bar | site redirects Friendship Kitchen; calendar dead | **ig-only** | IG | low |
| 18 | The Automatic Bar | bar | homepage ( **/events 404** ) | wix empty | when published: wixstatic | low |
| 19 | The Lodge Bar and Grill | bar | - | **ig-only** | IG karaoke | low |
| 20 | The Nest Lounge | bar | EverOut location / IG | **ig-only** | IG; EverOut open mic | med |
| 21 | Alberta Rose Theatre | venue | `https://albertarosetheatre.com/calendar/` | html + etix | WP uploads `.jfif` | high |
| 22 | Darcelle XV | venue | Tribe REST + ICS | tribe / ics | `image.url` / ICS ATTACH | high |
| 23 | Hawks PDX | venue | `…/hawks-events?format=json` | squarespace | `assetUrl` posters | high |
| 24 | Holocene | venue | `https://www.holocene.org/events/` | html (+ BIT alt) | WP uploads | high |
| 25 | Nova PDX | venue | `https://www.tixr.com/groups/novapdx` | tixr | static.tixr.com per event | high |
| 26 | REALM PDX | venue | `https://realmpdx.com/events/` | html + Eventim | site/IG + Eventim art | high |
| 27 | Sanctuary Club | venue | `/calendar/` + ICS | ics / html | sparse featured imgs | high |
| 28 | Star Theater | venue | `https://www.startheaterportland.com/` | html + BIT | artist posters | high |
| 29 | The Get Down | venue | `https://www.tixr.com/groups/thegetdownpdx` | tixr | Tixr event images | high |
| 30 | Meet Rack at Darkroom | venue | social only | **ig/bluesky** | social flyers | low |
| 31 | **Bearracuda** | **group** | `https://bearracuda.com/#events` | html multi-city | WP posters on `/events/{slug}/` | high - **PDX only** |
| 32 | **Rose Court (ISRC)** | **group** | `https://rosecourt.org/upcoming-events/` | html | coronation art; venue per listing | med-high - **PDX only** |

## Flyer rules (all sources)

1. Prefer **per-event** image (Tribe `image`, SQS `assetUrl`, Tixr card, WP poster).  
2. **Never** stamp one list-page hero onto every night at a venue.  
3. Weekly series with **no new art** → reuse **same-title** catalog flyer only (e.g. BI Night).  
4. Groups: drop non-Portland cities before queue.

## Escape dual recipe

- Weeklies: `https://escapebargrillpdx.weebly.com/events.html` (`escapebarandgrill.com` DNS dead)  
- Specials: Eventbrite city search - **filter venue name Escape** (noise common)

## Dead / false-friend URLs (do not use as calendar)

| URL | Why |
|-----|-----|
| Crush Bar / `@crushbarpdx` / crushbarpdx.com | **CLOSED_PERMANENT_2025-01-01** — space is Peacock PDX (`peacock-pdx` ingest source) |
| Sissy Bar, Doc Marie's, Misfits, Embers Avenue, The Uncanny | **CLOSED permanent** — see `shared/closedVenues.ts` (QSearch hard-drop by venueName) |
| Scandals **downtown / Harvey Milk only** | Moved to Scandals East (NE Alberta) — old address blocked, name alone not |
| Local Lounge, Hobo's, Queen's Head, The Roxy, Shine Distillery | Historic closings — same blacklist |
| `novapdx.com` | Parked domain |
| `theautomaticbarpdx.com/events` | 404 |
| `stagportland.com/events?format=json` | Empty SQS page, not calendar |
| `scandalspdx.com/events?format=json` | Zyrosite HTML, not SQS JSON |
| `silveradopdx.com/events` | Archive only (`upcoming: []`) |
| `stemwinebarpdx.com` | Redirects; calendar stale since 2024 |

## Machine twin

Active scrape URLs live in `shared/ingestSources.ts` (curated) + directory auto-wire.  
Keep this doc and `ingestSources.ts` in lockstep when recipes change.
