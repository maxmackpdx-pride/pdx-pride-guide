# Zaylist - Exact Scrape URLs

*Verified July 2026. This is the "where exactly to look" companion to `VENUE_SCRAPE_REGISTRY.md`.*

> **Runtime:** sources are also in `shared/ingestSources.ts` (admin Ingest panel presets). Keep this doc and the TS file in lockstep when URLs change.

## Tier 1 - Queer venues, direct

| Venue | Exact URL(s) to hit | What you get |
|---|---|---|
| **Sanctuary** ⭐ | `https://pdxsanctuary.com/calendar/` → follow the "Export .ics / Subscribe to calendar" link on that page (calendar plugin exposes a public .ics URL; capture it once at build time) | Full ICS feed, 35 events |
| **Darcelle XV** | `https://darcellexv.com/wp-json/tribe/events/v1/events` (JSON) · ICS alternate: `https://darcellexv.com/events/?ical=1` | The Events Calendar REST feed |
| **Steam Portland** ⭐ | `https://www.steampdx.com/events` - parse `warmupData` JSON in raw HTML; if empty, run vision on the flyer images on that page | Monthly kink/gear events |
| **Hawks PDX** | `https://www.hawkspdx.com/hawks-events?format=json` · overview: `/calendar-events` | Squarespace collection JSON |
| **Stag PDX** | `https://www.stagportland.com/events?format=json` · weeklies: `/theme-nights-1` | Squarespace collection JSON |
| **Scandals** | `https://www.scandalspdx.com/events?format=json` - **expect stale**; verify against IG before trusting | Squarespace collection JSON |
| **Badlands** | `https://badlands-events.badlandsportland.workers.dev/calendar` (needs browser User-Agent header; 403s default fetchers) · flyer grid fallback: homepage | Custom calendar worker |
| **CC Slaughters** | `https://www.ccslaughterspdx.com/` - parse the weekly-lineup sections in homepage HTML | Full weekly recurring schedule |
| **Eagle Portland** | `https://www.eagleportland.com/events` - parse embedded `warmupData` JSON; event pages at `/event-details/{slug}` | Wix Events data |
| **The Automatic Bar** | `https://www.theautomaticbarpdx.com/events` - same Wix `warmupData` parse | Currently sparse |
| **Montavilla Station** | `https://montavillastation.com/` homepage (recurring schedule) | Karaoke/live music weeklies |
| **Silverado** | homepage flyer images → vision extraction; low priority | Flyers only |

## Tier 2 - Music venues with queer bookings

| Venue | Exact URL(s) | Notes |
|---|---|---|
| **Star Theater** | `https://www.bandsintown.com/v/10001223-star-theater` · second stage: `https://www.bandsintown.com/v/10243136-starlight-patio-and-lounge-at-the-star-theater` · own site: `https://www.startheaterportland.com/calendar/` | Bandsintown pages carry JSON-LD |
| **Holocene** | `https://www.bandsintown.com/v/10001836-holocene` · own site: `https://www.holocene.org/events/` | |
| **Crystal Ballroom / Lola's** | Bandsintown venue page - resolve exact `/v/{id}` via one site search at build (McMenamins' own CMS is custom) | |
| **REALM PDX** | Bandsintown venue page (appears in the electronic feed below); own site `https://www.realmpdx.com` | |
| **The Get Down** | `https://www.tixr.com/groups/thegetdownpdx` - JSON-LD on event pages | |
| **Nova PDX** | `https://www.tixr.com/groups/novapdx` - JSON-LD · site: `https://novapdxevents.com` (fix venueLinks.ts: old novapdx.com) | Blow Pony, Bearracuda |
| **Alberta Rose** | `https://albertarosetheatre.com/calendar/` (structured listings) · ticketing feed: `https://www.etix.com/ticket/v/13010` | |
| **White Owl** | `https://ra.co/clubs/93930` (live) · own Squarespace `/upcoming-events` is dead | |
| **Black Water** | no usable site - covered by pdx-events.com + dopdx (below) | |

## Tier 3 - Community / seasonal

| Source | Exact URL(s) |
|---|---|
| **Portland Pride** | `https://www.portlandpride.org/2026-portland-pride-official-events?format=json` - slug rolls to `2027-…` yearly (config field) |
| **Q Center** | `https://www.pdxqcenter.org/wp-json/tribe/events/v1/events` (probe; fall back to `/events/` HTML) |
| **OSL Contest** | `https://www.oslcontest.org/calendar` → extract public Google Calendar ID → `https://calendar.google.com/calendar/ical/{ID}/public/basic.ics` |
| **Escape Bar & Grill** | `https://www.eventbrite.com/d/or--portland/escape-bar-and-grill/` - venue-scoped Eventbrite search, JSON-LD ItemList in page |
| **Bar Cala** | `https://www.eventbrite.com/d/or--portland/bar-cala/` (same pattern; drag brunches confirmed) |
| **The Sports Bra** | `https://www.eventbrite.com/d/or--portland/sports-bra/` + IG |

## Eventbrite - the exact pattern

Venue/keyword-scoped discovery pages: `https://www.eventbrite.com/d/or--portland/{query}/`
Each page embeds a JSON-LD `ItemList` of events - parse that, not the HTML.

**City-wide queer catch-all (scrape this one nightly):**
- `https://www.eventbrite.com/d/or--portland/gay-event/` - surfaces Queer'd PDX, SNAG IndigiQueer, Drag Valley Brunch, Peach Fuzz, Flirty Fridays - events at venues nobody else tracks
- Also worth rotating: `/d/or--portland/drag/`, `/d/or--portland/lgbtq/`, `/d/or--portland/queer/`

## Partiful - the exact pattern

No city feed exists. Three entry points:

1. **Event resolver:** any `https://partiful.com/e/{eventId}` URL → static fetch returns full structured event (title, date/time, location, description, guest counts). Fires from the submit form, from URLs found in scraped descriptions, and from IG bios later.
2. **Host profiles (registered sources, need headless render):**
   - Drew Picard - `https://partiful.com/u/11P3xlH7MVhDzZvLf6JoQ7ysRup2`
   - Kevin Rohde - `https://partiful.com/u/VbEQBWaBJFRslnABiVaFlN0OBBX2`
3. **Seed events already verified:**
   - Pride Ride + White Owl party - `https://partiful.com/e/RNgh9o2xBSbtN5ZzLHW0`
   - Wake Bake Walk Roll (weekly Sat) - `https://partiful.com/e/dbI1343XEB6XxzxSQciD`

Geo-filter everything - Seattle events circulate freely in PDX networks.

## Luma

Any organizer calendar `https://lu.ma/{calendar}` → append `.ics` / use the calendar's "Subscribe" ICS URL. Register organizers as found.

## Aggregators - exact pages

| Source | Exact URL |
|---|---|
| **dragpdx.com** (ask first - partnership) | `https://dragpdx.com/wp-json/tribe/events/v1/events` · iCal: `https://dragpdx.com/events/?ical=1` |
| **Queer Social Club** | `https://www.queersocialclub.com/events-portland?format=json` |
| **EverOut drag feed** | `https://everout.com/portland/events/?category=performance-drag` · per-venue: `https://everout.com/portland/locations/{venue-slug}/` |
| **pdx-events.com** | `https://www.pdx-events.com/` daily listing (covers Peacock, Covert, Black Water) |
| **Resident Advisor** | Process: `https://ra.co/promoters/141994` · White Owl: `https://ra.co/clubs/93930` · JSON-LD on all event pages |
| **Bandsintown city feeds** | all: `https://www.bandsintown.com/c/portland-or/all-dates/genre/all-genres` · electronic (REALM/45 East/Holocene in one page): `https://www.bandsintown.com/c/portland-or/all-dates/genre/electronic` |

## IG/FB-only (Meta phase - no URL to scrape today)

Peacock (@peacock.pdx) · Camp Bar · Jackie's · Meetrack · Black Water · Silverado backup · Steam backup (@steamportland) · Montavilla weekend lineups
