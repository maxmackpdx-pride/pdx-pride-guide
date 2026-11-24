# Zaylist Community Registry — master document

The record of WHY every venue, shop, club, organization, and service provider
is on Zaylist, HOW we know, and WHERE to verify it again. Started Nov 23, 2026
at Tucker's direction. Mirrored to GitHub with the rest of the QSearch process.

## The rules (Tucker, Nov 23, 2026)

- A venue or shop counts as an LGBTQ venue when the OWNERS are part of the
  community — established by a credible source: a write-up / press piece, the
  owner's own site or About page, Queer Social Club, or the venue's own
  official channels stating it. One hosted event is never enough.
- A club or organization counts when it is itself a community group (its own
  pages/events say so).
- **Hosting is not identity:** a venue that merely hosts a community event is
  NOT an LGBTQ venue. BUT if a club or group holds a REGULAR RESIDENCY at a
  venue not otherwise on this list, that venue earns a **residency nod**: it
  is listed as community-friendly — "they've hosted our community and are
  worth reaching out to if you're looking to host" — never labeled LGBTQ.
- Service providers (hairstylists, massage therapists, and the like) count
  when they are OPENLY out in their own professional presence — their About
  page, booking page, or official socials say so themselves.
- Every entry carries: why it's here, how we got that info (source + date),
  and where to verify it in the future.
- **Every entry carries its own search recipe** (Tucker, Nov 23, 2026):
  how that individual location or person is searched — their update
  surfaces in order, the detail-page route, official handles, and traps.
  The registry is the one list with everybody on it, and the recipe rides
  on the entry itself, so anyone running the process searches each place
  the right way. An entry without a recipe is incomplete. **Recipes are
  written once:** when a place searches the same way as an existing
  pattern, the entry names that pattern and spells out only its
  differences — the same recipe is never rewritten entry after entry.
- **Every entry carries a change log** (Tucker, Nov 23, 2026): dated
  lines for when it was added and everything that changed after — new
  additions, corrections, verification flips. The entry's history lives
  on the entry.
- **Intake — every route in gets the full treatment** (Tucker, Nov 23,
  2026): however a place arrives — a user submission on the site, a
  claim, someone telling an AI "add this place," or an add through code —
  it ends in the same place: Muse verifies it, and it gets a complete
  registry entry (why, source, verify-at, recipe, logo, front shot,
  change log). The venue hunter diffs the site directory/catalog against
  the registry every run; a place with no registry entry is a gap to
  close, however it got there.
- **Adding a place includes its assets:** grab and verify the REAL logo
  (the venue's own current mark, never a lookalike), convert it to SVG,
  check it for drift and accuracy against the venue's own use, and store
  it in the slots that already exist — `client/public/directory-logos/`
  for venues, `client/public/community-logos/` for collectives and
  hosts. And the front-of-location shot: gather multiple online images
  of the verified entrance and make the perfect front shot with the
  house effects, stored where those live. (Open item, Nov 23, 2026: the
  front-shot process written with GPT — the effects and where the shots
  are stored — is not in Muse's files yet; get it from Tucker/Brodi
  and write it here verbatim rather than inventing it.)
- **Only Muse verifies and adds** new venues and service providers
  (Tucker, Nov 23, 2026). Hunters and contributing agents propose entries
  with their evidence; the verification and the add are Muse's. Only
  Muse can remove an entry.
- Entries are NEVER removed for going stale. An entry that can't be
  re-verified on schedule gets the **needs-verification** status (the badge)
  and stays listed until a re-check resolves it either way.

## Entry format

### <Name>
- Type: venue / shop / club / organization / service provider / residency nod
- Why on Zaylist: <the reason, in one or two lines>
- How we know: <source — write-up, About page, QSC, Partiful, official socials — with URL>
- Found: <date> · Found by: <weekly hunter / sweep / Tucker / other>
- Verify at: <the URL or source to re-check>
- Search recipe: <how this place/person is searched — update surfaces in
  order, detail-page route, official handles, traps>
- Last verified: <date> · Status: verified / needs verification
- Notes: <residency details, who holds the residency, anything a re-check needs>
- Change log: <dated lines — added, what changed, new additions>

## Entries

<!-- Seeded Nov 23, 2026 by the first weekly venue-hunter run: 11 trusted venues, 22 directory groups, and host-watch-list organizations, plus that run's verified hunt finds and residency nods (63 entries), then 8 more entries from the same day's Partiful + QSC gap run — 71 entries total. Recipe backfill pass, Nov 23, 2026: every entry now carries its own search recipe and a change log. -->

### Sanctuary Club
- Type: venue
- Why on Zaylist: LGBTQ+-centered event space and club in the Pearl; trusted dedicated venue — its official calendar establishes LGBTQ+ relevance for every event there (founder rule). All Sanctuary events are 21+ and sex-positive by standing rule (Nov 11, 2026).
- How we know: Zaylist directory record id 33 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.pdxsanctuary.com/ — site calendar + Sugar Calendar ICS https://pdxsanctuary.com/events/calendar/sanctuary/ics/ ; detail-page route: each event's own page at pdxsanctuary.com/events/<slug>/ (ICS URL field gives the slug)
- Search recipe: Sanctuary ICS first — curl -L https://pdxsanctuary.com/events/calendar/sanctuary/ics/ (Sugar Calendar; the VEVENT DESCRIPTION field carries the full text and the URL field gives the detail slug) — then each event's detail page at pdxsanctuary.com/events/<slug>/ (base slug is the reliable route; dated /<date>/ URLs redirect for some events), then Instagram @pdxsanctuary, then the FetLife lane, which catches real Sanctuary events absent from both the ICS and the site calendar. Detail-page route: the detail page is an INFO pass, not just a poster pass — description, doors and cover come from the page or the ICS description. Traps: og:image on Pickup Play Mixer / Sensation Play pages is only the Sanctuary logo, Get Clowny's og is a meme chart, Kandy Coated Karaoke's og is dated September, Sapphic Sunday's og is the generic banner — read the printed date on every og flyer and never attach a logo; FetLife-only events may have no detail page at all; all Sanctuary events are 21+ and sex-positive by standing rule.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Directory record lists queerOwned=False — identity rests on its LGBTQ+-centered programming and trusted-venue designation in MUSE-AS-QSEARCH.md, not an ownership claim. Detail pages are the source of record, not the calendar list alone.

### Eagle Portland
- Type: venue
- Why on Zaylist: Inclusive LGBTQIA+ leather/fetish/bear bar on N Lombard; trusted dedicated venue — its official calendar establishes LGBTQ+ relevance for every event there.
- How we know: Zaylist directory record id 5 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.eagleportland.com/ — detail-page route: per-event pages /events/<slug>?date=… carry doors/until, About text, dress code and prices; index cards alone are not enough (detail-page audit, Nov 23, 2026)
- Search recipe: Rendered browser first (curl hits a Vercel checkpoint) — eagleportland.com/events index is DISCOVERY only, then each event's per-event detail page /events/<slug>?date=… for doors/until times, structured start/end, About text, dress code and price, then Instagram @eagleportland, then host lanes (Red Hanky Social, Locker Room and GAYMENIGHT are NOT all on the venue calendar). Detail-page route: /events/<slug>?date=… — never publish or pattern-extend from the index alone. Traps: Naked Pool's catalog 14:00 was the bar's business opening hour scraped as an event time — its detail page says 21:00–00:00; index cards print price lines the sweeps must capture on the detail page.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Hosts Red Hanky Social (2nd Thursdays), Locker Room (4th Fridays), GAYMENIGHT and other series that are NOT all on the venue calendar — host lanes matter.

### Badlands
- Type: venue
- Why on Zaylist: Portland's LGBTQ+ video bar and dance club in Old Town; trusted dedicated venue.
- How we know: Zaylist directory record id 4 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.badlandsportland.com/ ; events feed: https://badlands-events.badlandsportland.workers.dev/api/calendar?from=&to= — no per-event detail pages exist; flyer text is the rich source
- Search recipe: Worker API first — https://badlands-events.badlandsportland.workers.dev/api/calendar?from=&to= pulled to the API's full ~7-week horizon, never a 14-day window — then the flyer text (each event's photoUrl, visually read: prices and times live on the flyers), then Instagram @badlandspdx. Detail-page route: NONE — there are no per-event pages; the API is the ceiling and the website /calendar collection is empty. Traps: photoUrl can be crossed between events (ManCandy / Honeypot shared one file) — verify every flyer visually; API Friday silence is intermittent — check Fridays on every pull and never invent a Friday occurrence from pattern alone; UTC offsets are inconsistent across the Nov 1 DST change — trust local clock times.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: API is silent on some Fridays in some pulls — never invent Friday occurrences from pattern alone.

### The Sports Bra
- Type: venue
- Why on Zaylist: First sports bar dedicated exclusively to women's sports, founded by Jenny Nguyen; trusted dedicated venue. Never downgraded; all-ages until 10pm unless an event says otherwise.
- How we know: Zaylist directory record id 9 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://thesportsbraofficial.com and @thesportsbrapdx (Instagram)
- Search recipe: Official site thesportsbraofficial.com first, then its Facebook events/posts, then Instagram @thesportsbrapdx, then ticket pages for dated events. Detail-page route: none found — /events serves generic Shopify/blog content with no per-event pages, so a dated Facebook Event or ticket page is the detail level. Traps: the retired direct scraper stays disabled — never research it that way; never downgraded; all-ages until 10pm unless an event says otherwise; zero upcoming events in the directory is a watch item, not proof of no programming.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Its retired direct scraper stays disabled — research via official site / Facebook / Instagram / ticket pages.

### Q Center
- Type: venue
- Why on Zaylist: Portland's 2SLGBTQIA+ community center — gallery, library, support groups, resource hub and event space; trusted dedicated venue.
- How we know: Zaylist directory record id 92 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.pdxqcenter.org/events — detail-page route: every event has its own follow-up/detail page carrying the fuller 'About this event' info; never publish from the index alone (Tucker, Nov 23, 2026)
- Search recipe: Rendered browser only (the site is Wix/JS-rendered; text fetch returns no dated listings) — pdxqcenter.org/events index for discovery, then EACH event's own detail page at /events-1/<slug>-<date>-<time> for the fuller About this event text, date/time and room detail, sweeping a full month out every run, then Instagram @qcenter. Detail-page route: the detail page — never publish or update from the index alone. External-link pattern: Sereni-Tea has no Q Center detail page and routes to an Eventbrite collection (eventbrite.com/cc/all-upcoming-events-4839929) and Boxing routes to its Acuity page (goredita.as.me/Fatfists) — read those as the detail pages for those series. Traps: December coverage lapses silently; candidate keys must be slugified to [a-z0-9-] or the gate rejects them.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: December coverage lapses silently — sweep a full month out every run, opening detail pages.

### Steam Portland
- Type: venue
- Why on Zaylist: Portland men's sauna / social club; trusted dedicated venue. Its site lists events BY THE FLYERS — the flyer images are the listings.
- How we know: Zaylist directory record id 129 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.steamportland.com/events and /the-grid — detail-page route: per-series flyers at steamportland.com/s/<NAME> (KINKWEEK, BLACKOUT, MORNING-WOOD, etc.). Use www host — apex has a certificate error
- Search recipe: www.steamportland.com/events first (use the www host — the apex has a certificate error) — the flyer images ARE the listings — then the per-series flyers at steamportland.com/s/<NAME> (KINKWEEK, BLACKOUT, MORNING-WOOD, THIRST-QUENCHER, RADICAL-RUBDOWN, HUMP-DAY, SIN-CITY, AFTERGLOW, FETCH-FROLIC, CUMUNION; Squarespace file URLs via curl -L), then /the-grid for the weekly schedule, then Instagram @steamportland. Detail-page route: no text detail pages — the flyer is the detail level. Traps: check the homepage for closure notices before materializing any occurrence; the Morning Wood flyer prints Mon–Thu while The Grid says Mon–Fri and the catalog follows The Grid — flag, do not silently change; site-wide 18+, government ID, $10 minimum day pass.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Site-wide 18+, government ID, $10 minimum day pass per source-memory (Oct 28, 2026). Check homepage for closure notices before materializing occurrences.

### Camp Bar PDX
- Type: venue
- Why on Zaylist: Modern inclusive gay bar in downtown's Gayborhood, in the historic former Scandals space on Harvey Milk St; trusted dedicated venue. Opened July 2026 in that space per press coverage.
- How we know: Zaylist directory record id 28 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://campbarpdx.com/ and @campbarpdx (Instagram)
- Search recipe: campbarpdx.com single-page weekly schedule first (it carries start AND end times and IS the detail level — there are no per-event pages and the page states no prices), then Instagram @campbarpdx, then host lanes for dated specials the venue feed misses: Drag Camp-ionship via @angelica_dvil and Game On via @2025th's monthly schedule graphic. Detail-page route: none — single-page listing is the detail level. Traps: admission UNKNOWN on Camp records is a source limitation, not a missed read; Drag Camp-ionship's official dates are Nov 7 / 14 / 21, Dec 5, Dec 12 — Nov 28 is NOT a series date, never materialize it.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Home to Drag Camp-ionship (Saturdays, host @angelica_dvil) and Game On (Tuesdays, host @2025th) — host schedule graphics catch editions the venue feed misses.

### Darcelle XV Showplace
- Type: venue
- Why on Zaylist: Oldest continuously operating drag venue in the United States, founded 1967 by Walter Cole / Darcelle XV; trusted dedicated venue and Portland landmark.
- How we know: Zaylist directory record id 2 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://darcellexv.com/events — detail-page route: dated pages /event/<slug>/<date>/ carry doors, cover, 21+ and exact times; do not trust Tribe REST Saturday 08:00 stamps
- Search recipe: darcellexv.com/events index for discovery, then the dated detail page /event/<slug>/<date>/ for doors, cover, 21+ and the exact time range — publish from the dated detail page only — then Instagram @darcellexvshowplace. Detail-page route: /event/<slug>/<date>/. Traps: never trust Tribe REST Saturday 08:00 stamps (a systematic artifact for 20:00 shows) without checking the dated page; index-built records are stubs whose ticketUrl points at the index, not the event.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Family-run since Darcelle's passing; resident emcee Poison Waters.

### CC Slaughters
- Type: venue
- Why on Zaylist: Portland's LGBTQ+ nightclub since 1981 in Old Town; trusted dedicated venue.
- How we know: Zaylist directory record id 1 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://ccslaughterspdx.com/ — single-page listings ARE the detail level for this venue (detail-page audit, Nov 23, 2026); @slaughterspdx (Instagram)
- Search recipe: ccslaughterspdx.com single-page listings first — that page IS the detail level (no per-event pages; it carries description, host, No Cover and 21+; it prints start times only, so missing end times are a source limitation) — then Instagram @slaughterspdx, then host lanes (QT PDX Events, PDX Collar Guard and other resident hosts name editions the venue feed misses). Detail-page route: none — single-page listing is the detail level. Traps: curl gets a 406 Mod_Security block on this domain — use the browser/crawl lane, not curl; both early QSearch gaps at this venue came from the host QT PDX Events, not the venue feed.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Home to QT PDX Events' QTBIPOC parties (BADDIES NIGHT, Fluid), PDX Collar Guard's Gear Night / RUFF, Trans-UHH-Licious, Black Magic, Velvet Cabaret and Keyed Up Karaoke.

### Hawks PDX
- Type: venue
- Why on Zaylist: Portland's LGBTQ+ community spa and social space in SE — hot tub, sauna, themed nights; trusted dedicated venue.
- How we know: Zaylist directory record id 52 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://hawkspdx.com/ and @hawkspdx (Instagram) — Squarespace JSON has been stale since Oct 2026; coverage runs through IG + host lanes + catalog pattern
- Search recipe: Instagram @hawkspdx first (the working lane), then host lanes — OMEN (omenpdx.org) for OMEN Wednesdays and host @kinkucation_wildside for Nerd Night — then the catalog pattern (Hawks runs much the same programming every week by default, per Tucker's Nov 13, 2026 ruling). Detail-page route: none usable — the Squarespace JSON has been stale since Sep 7, 2026 and is never treated as source-verified. Traps: a host's own stated recurrence governs its series over the venue's schedule graphic — Nerd Night is every 3rd Sunday, 18:00 per its host, so the Hawks graphic's extra date does not create an occurrence.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Hawks by default runs much the same programming every week (Tucker, Nov 13, 2026). Nerd Night is the host's series: every 3rd Sunday, 18:00, host @kinkucation_wildside.

### Scandals East
- Type: venue
- Why on Zaylist: Portland's long-running gay bar Scandals, reborn at 827 NE Alberta St (opened March 2026, still under longtime owner David Fones) after 46 years downtown; trusted dedicated venue. ONLY the Alberta location counts — the old downtown / Harvey Milk location is blocked.
- How we know: Zaylist directory record id 26 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026; Named a trusted dedicated venue in MUSE-AS-QSEARCH.md ('Rules that do NOT change'), standing through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://scandalspdx.com/ and @scandals_pdx (Instagram)
- Search recipe: scandalspdx.com first, then Instagram @scandals_pdx (the Scandals account, now operating as Scandals East — there is no separate East handle). Detail-page route: no per-event detail pages known — the site's and IG's dated posts are the detail level. Traps: ONLY the 827 NE Alberta St location counts — the old downtown / Harvey Milk location is blocked and never searched as this venue.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: All ages in the restaurant until 8pm per press (PDX Monthly); bar 21+. Shares the Alberta building with Carioca Bowls.

### The Imperial Sovereign Rose Court of Oregon
- Type: club / organization
- Why on Zaylist: Portland's Imperial Sovereign Rose Court — the oldest continuously operating court system organization in the world. Coronations, fundraisers, and community service for LGBTQ+ causes across Oregon.
- How we know: Zaylist directory record id 70 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://rosecourt.org ; Instagram @rosecourtpdx
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: rosecourt.org first; handle @rosecourtpdx returned 0 posts via the connector in the Nov 12, 2026 sweep (blind spot — check the site and Facebook as well); annual pageant cycle plus fundraisers, so a monthly glance suffices between cycles.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Pink Ponies
- Type: club / organization
- Why on Zaylist: Portland queer social and party collective — Western nights, fundraisers, and scene-building collabs (including Yes Coach × Pink Ponies). Community first, boots optional.
- How we know: Zaylist directory record id 71 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://events.humanitix.com/host/pink-ponies ; Instagram @pinkponiespdx
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: the Humanitix host page events.humanitix.com/host/pink-ponies is the FIRST surface (this host is Humanitix-native and that platform is a thin lane — check it directly); handle @pinkponiespdx returned 0 posts in the Nov 12, 2026 sweep; catalog copy also credits @burningmanpinkponies.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Bearracuda
- Type: club / organization
- Why on Zaylist: Portland bear dance party / nightlife brand. Events at Nova PDX, Crystal Ballroom, and partner venues — follow brand calendar + IG for flyers.
- How we know: Zaylist directory record id 72 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://bearracuda.com ; Instagram @bearracudapdx
- Search recipe: bearracuda.com first (curl with a browser user-agent — text fetch hits a bot-check page) — per-edition pages at bearracuda.com/events/<slug>/, whose og:image is the edition flyer — then producer JP Hardy's Instagram @j.p.hardyofficial. Detail-page route: the per-edition page on bearracuda.com. Traps: @bearracuda's own Instagram was suspended by Meta (per the producer's Oct 22, 2026 post), so the site plus the producer's account are the working lanes; Portland editions only in scope, plus Treasure Trail at Sanctuary; the catalog poster field is posterImageUrl, not imageUrl — reading the wrong field makes filled posters look missing.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### PDX PAH - Portland Pets & Handlers
- Type: club / organization
- Why on Zaylist: Human-pet play community in Portland: education, socials, and monthly mosh (often at Eagle Portland). Welcomes pets, pups, handlers, and the curious — all shapes, sizes, colors, genders, orientations.
- How we know: Zaylist directory record id 74 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.pdxpah.com ; Instagram @pdxpah
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: pdxpah.com first; sweep BOTH handles — @pdxpahofficial is the active lane that returns posts (verified Nov 21, 2026) while @pdxpah returned 0 posts (blind spot); its GAYMENIGHT series sits at Eagle Portland, so Eagle's per-event detail pages are a cross-check surface.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Oregon State Leather Contest
- Type: club / organization
- Why on Zaylist: Largest leather title contest in Oregon since 1997 (formerly Blackout Leather Productions; renamed 2021). Celebrates BDSM, Leather, Pup/Pet, Mx. Draws contestants from Oregon + SW Washington. Often partners with…
- How we know: Zaylist directory record id 75 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.instagram.com/oregonstateleather/ ; Instagram @oregonstateleather
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: sweep BOTH handles — @oslcontest is the active account that returns posts while @oregonstateleather returned 0 posts (blind spot); annual contest cycle with titleholder events between.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Portland Leather Alliance
- Type: club / organization
- Why on Zaylist: All-volunteer 501(c)3 (est. 1998) — education and awareness for alternative lifestyles. Largest membership-based BDSM org in Portland Metro + SW Washington. Consent in Kink, KinkFest, Black and Blue.
- How we know: Zaylist directory record id 76 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: http://www.portlandleather.org
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: portlandleather.org first (its class listings); its classes often sit at Sanctuary Club or Q Center, so that venue's detail page (Sanctuary /events/<slug>/ or the Q Center detail page) is the detail route for those editions, and a Sanctuary-published PLA event still needs the detail-page poster pass in the same run.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Bad Girls PDX
- Type: club / organization
- Why on Zaylist: Kinky women's group — BDSM Safety & Etiquette class + new member orientation (often at Q Center).
- How we know: Zaylist directory record id 77 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: http://www.pdxbadgirls.net ; Instagram @pdxbadgirls
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: pdxbadgirls.net/events first — it states the series rules (Bad Girls Munch, 2nd Tuesdays at Escape Bar & Grill; Full Moon Friday) — then @pdxbadgirls (returns posts). Trap: founder ruling Oct 30, 2026 — Bad Girls IS queer; organizer identity establishes relevance even when a single listing carries no explicit framing.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Black & Beyond the Binary Collective
- Type: club / organization
- Why on Zaylist: Leadership, healing, and safety for Black-African transgender, queer, nonbinary, two-spirit, intersex (TQN2SI+) Oregonians. Community at SE Uplift / Tabor Commons and citywide.
- How we know: Zaylist directory record id 78 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.blackbeyondthebinarycollective.org/ ; Instagram @blackandbeyondthebinary
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: blackbeyondthebinarycollective.org first; handle @blackandbeyondthebinary returned 0 posts in the Nov 12, 2026 sweep (blind spot — lean on the site and Facebook).
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Brown Girl Rise
- Type: club / organization
- Why on Zaylist: 501(c)(3) radical sisterhood of girls and non-binary youth of the global majority — camps, menstrual kit actions, zine workshops, connection to body, community, land, and creativity.
- How we know: Zaylist directory record id 79 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://browngirlriseportland.org ; Instagram @browngirlrise
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: browngirlriseportland.org first, then @browngirlrise; programming is camps and youth workshops — check the site's program pages for dated editions before treating anything as an event.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### TranzGuys PDX
- Type: club / organization
- Why on Zaylist: Inclusive peer-support / discussion / social group for AFAB folks who identify as trans, MTO, genderfluid, transman, genderqueer, boi, FTM, male, butch, two-spirit, and more. 3rd Sunday 6–8pm at Q Center.
- How we know: Zaylist directory record id 80 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.instagram.com/tranzguyspdx/ ; Instagram @tranzguyspdx
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: the only recorded surface is Instagram @tranzguyspdx, which returned 0 posts in the Nov 12, 2026 sweep (blind spot); it meets 3rd Sundays, 18:00–20:00 at Q Center, so Q Center detail pages are the cross-check. Trap: DISTINCT from Trans Guys Gather PDX, a separate entry in this registry — never merge them.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Portland Frontrunners
- Type: club / organization
- Why on Zaylist: Running/walking club for LGBTQIA+ and friends. Weekly runs + annual Portland Pride Run & Walk and Bridge to Bridge.
- How we know: Zaylist directory record id 82 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.meetup.com/Portland-Frontrunners/ ; Instagram @portlandfrontrunners
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: the Meetup page meetup.com/Portland-Frontrunners is the FIRST surface (dated runs live there), then @portlandfrontrunners.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Lavender League
- Type: club / organization
- Why on Zaylist: Portland soccer league for queer women and nonbinary or trans people (200+ members).
- How we know: Zaylist directory record id 83 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.instagram.com/lavenderleaguepdx/ ; Instagram @lavenderleaguepdx
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: the only recorded surface is Instagram @lavenderleaguepdx; seasonal league socials — a monthly glance suffices outside the season.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### PDX Gaymers
- Type: club / organization
- Why on Zaylist: Queer gamers — screenings, board games, socials.
- How we know: Zaylist directory record id 84 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.meetup.com/PDX-Gaymers/ ; Instagram @pdxgaymers
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: the Meetup page meetup.com/PDX-Gaymers is the FIRST surface, then @pdxgaymers.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Sankofa Collective
- Type: club / organization
- Why on Zaylist: Formerly Portland African-American/Black PFLAG — health and well-being for gay, lesbian, bisexual, and transgender persons, their families and friends.
- How we know: Zaylist directory record id 85 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Zaylist directory record (GET https://www.zaylist.com/api/directory)
- Search recipe: Directory record first (GET https://www.zaylist.com/api/directory — no official site or handle is recorded for this entry yet), then a web search for the collective's own current presence, then Q Center / PFLAG-adjacent listings naming it. Detail-page route: none recorded. Trap: this recipe is incomplete beyond the directory until an official site or handle is found and recorded here — a re-verification run should hunt for that surface first, and a directory listing alone never publishes an event.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Yes Coach Productions
- Type: club / organization
- Why on Zaylist: Portland athletic-fetish and gear-party collective run by Tucker Max (Tucker_PDmaX). Yes Coach nights, collabs (Stank, Pink Ponies), and community play at Sanctuary and partner venues. Consent-forward. Not a leather…
- How we know: Zaylist directory record id 93 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://yescoachparty.com ; Instagram @Tucker_PDmaX
- Search recipe: yescoachparty.com first, then Instagram @Tucker_PDmaX, then the host venue's detail page for the event. The 3-Year Anniversary (Sanctuary Club, Nov 29, 2026) is a ONE-TIME event — no recurrence, no series to extend. Host relationship: The Locker Room at Eagle Portland is HOSTED BY the Yes Coach party collective — same host, different event. The anniversary is one-time at Sanctuary; The Locker Room is monthly at the Eagle under its own recurrence rule in source-memory.md. Never extend the anniversary as a series, and never move Locker Room editions off their own rule (Tucker, Nov 24, 2026). DJ Bro Hoe often DJs both.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit. 2026-11-24 — corrected by Tucker: the anniversary is a one-time event, distinct from The Locker Room; the Locker Room recurrence rule the backfill had folded into this recipe was removed. 2026-11-24 — Tucker clarified: both events are his, DJ Bro Hoe often DJs both; different venues (Sanctuary vs Eagle Portland), different events; The Locker Room is monthly. 2026-11-24 — Tucker: The Locker Room is hosted by the Yes Coach party collective at the Eagle — same host, different events; recipe note rewritten to say so.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Fertile Ground Festival
- Type: club / organization
- Why on Zaylist: Portland platform for new and developing performance work.
- How we know: Zaylist directory record id 109 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://fertilegroundpdx.org
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: fertilegroundpdx.org first; a seasonal festival — its dated festival schedule pages are the detail route during the festival window.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### PDXBackstage
- Type: club / organization
- Why on Zaylist: Portland theatre community listserv for opportunities and discussion.
- How we know: Zaylist directory record id 110 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://groups.io
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: this is a theatre listserv on groups.io, not an event host — the list's own posts are the surface; there are no per-event detail pages, and a list post is discovery only until the producing org's own page confirms a dated event.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Portland Area Theatre Alliance
- Type: club / organization
- Why on Zaylist: Auditions, listings, and theatre events for the Portland area.
- How we know: Zaylist directory record id 111 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://portlandtheatre.com
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: portlandtheatre.com first — its audition and event listings are the surface; a listing there is discovery until the producing theatre's own dated page confirms the event.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Lesbian Culture Club
- Type: club / organization
- Why on Zaylist: Queer community for lesbians, trans people, nonbinary people, and anyone who feels at home there.
- How we know: Zaylist directory record id 112 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://lesbiancultureclub.com
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: lesbiancultureclub.com first, then Queer Social Club listings naming it — a QSC /events-portland/<slug> detail page is the detail route for those editions.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Queer Social Club
- Type: club / organization
- Why on Zaylist: Community-driven event calendars for queer happenings in Portland and the greater Pacific Northwest.
- How we know: Zaylist directory record id 113 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=True, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://queersocialclub.com
- Search recipe: Queer Social Club's Portland feed first via its Squarespace JSON — queersocialclub.com/events-portland?format=json (the upcoming array carries title, venue address, body copy and detail slug in one pull) — then EACH listing's own detail page at /events-portland/<slug> for its 21+ tags, ticket link, doors-versus-show split and full description. Detail-page route: /events-portland/<slug> — never publish a QSC find from the calendar index or the JSON alone. Traps: QSC mirrors other organizations' own calendars (Degenderettes is the standing example) — a QSC listing is the same source as that org's calendar, not a second source; a QSC listing page's image can be a generic venue interior photo, not event art — visually read it before attaching.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Radical Faerie Arts Fest
- Type: club / organization
- Why on Zaylist: Artist-centered market and audience-creation model for queer artists.
- How we know: Zaylist directory record id 114 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.radfaf.org
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: radfaf.org first; market/festival editions are seasonal — its dated festival pages are the detail route.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### Oregon Pride in Business
- Type: club / organization
- Why on Zaylist: Business education and networking for LGBTQ+ entrepreneurs.
- How we know: Zaylist directory record id 116 (GET https://www.zaylist.com/api/directory, accessed 2026-11-23) — directory lists queerOwned=False, queerFriendly=True; corroborated in ~/workspace/qsearch-new/source-memory.md and MUSE-AS-QSEARCH.md trusted-venue / lane records through Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.orpib.com
- Search recipe: Pattern IG-ORG (directory group, IG-first): official site (if any) first, then the IG handle by direct read, then Facebook / QSC / ticket-platform listings naming the group, then a catalog diff for programming with no upcoming events. Detail-page route: the dated event page on whichever platform lists the edition (Eventbrite / Humanitix / TicketTomato / Facebook Event) — the group itself has no per-event pages unless noted below. Trap: an IG connector return of 0 posts is a blind spot, never a clean negative. Differences: orpib.com first — its event and Certified Spotlight pages are the surface (Queer Nourish's spotlight ran there); networking events read on their dated orpib.com pages.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Seeded from the directory's group records in the first hunter run, per Tucker's Nov 23, 2026 seeding instruction.

### QT PDX Events
- Type: club / organization
- Why on Zaylist: QTBIPOC party pipeline at CC Slaughters — BADDIES NIGHT and Fluid; both early CC Slaughters gaps in QSearch came from this host, not the venue feed.
- How we know: Host watch list (~/workspace/qsearch-new/host-watch-list.md, built Oct 30, 2026); handle @qtpdxevents RESOLVED Nov 1, 2026 via a @slaughterspdx collab post by @lytablunt (source-memory.md)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @qtpdxevents
- Search recipe: Instagram @qtpdxevents first (handle resolved Nov 1, 2026 from a @slaughterspdx collab post by @lytablunt), then @slaughterspdx collab and tagged posts, then the CC Slaughters single-page listings. Detail-page route: no host detail pages — the venue's single-page listing plus the host's dated post together are the detail level, and a dated Eventbrite/ticket page when one exists. Trap: this host's editions (BADDIES NIGHT, Fluid) are exactly what the venue feed missed — never treat a quiet venue feed as a quiet host. Host is Lyta Blunt.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Host is Lyta Blunt. Recurring host — stays on host-watch-list.md.

### Sapphic Singles PDX
- Type: club / organization
- Why on Zaylist: Recurring sapphic singles mixers across multiple Portland venues (Escape Bar & Grill, JUNE Beaverton, NYE mixer).
- How we know: Host watch list (Oct 30, 2026), verified on live Eventbrite event pages (e.g. '40+ Sapphic Singles at Escape Bar & Grill')
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Eventbrite organizer 'Sapphic Singles PDX'
- Search recipe: Eventbrite event pages first — find them from a live dated event page (for example the 40+ Sapphic Singles at Escape Bar & Grill registration page); the organizer-page URL was UNVERIFIED at watch-list build, so enter through a live event page, not a guessed organizer URL. Detail-page route: the dated Eventbrite page — capture its age highlight and ticket tiers in the same read as its poster (per the detail-page audit). Trap: venues rotate (Escape Bar & Grill, JUNE Beaverton, NYE mixer) — one mixer at a venue is not a residency and earns no nod by itself.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. Organizer-page URL was UNVERIFIED at watch-list build; verify on a live event page.

### Repeat Behavior
- Type: club / organization
- Why on Zaylist: Secret-warehouse QTBIPOC dance parties; venue drops late by design, so its own pages are the earliest signal.
- How we know: Host watch list (Oct 30, 2026) + source-memory hunt log Oct 24, 2026 (sickening.events, Partiful and Resident Advisor all confirmed the secret-venue model); host account @repeatbehaviorparty added Nov 19, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://sickening.events and Instagram @repeatbehaviorparty ; Partiful public event pages
- Search recipe: sickening.events first, then Instagram @repeatbehaviorparty, then its public Partiful event pages, then Resident Advisor. Detail-page route: the dated sickening.events event page. Traps: the venue is deliberately secret and drops late by design — the founder venue fact is NOT met until the host itself drops the venue, and a zip code or neighborhood alone never publishes; re-check sickening.events and Partiful close to the date, when secret venues surface to ticket holders.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. Kevin Aviance edition moved to Dec 18, 2026, 525 SE Pine St, per the host's Nov 13 announcement.

### Stomptown
- Type: club / organization
- Why on Zaylist: Portland's LGBTQ country / western dance organization — recurring dances and lessons at Norse Hall and Escape Bar & Grill.
- How we know: Host watch list (Oct 30, 2026), verified via Queer Social Club listings; source-memory ledger (Nov 12, 2026): stomptown.org/dances is the reliable feed
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://stomptown.org/dances and Instagram @stomptownlgbtqcountry
- Search recipe: stomptown.org/dances first (the reliable feed), then Instagram @stomptownlgbtqcountry, then Queer Social Club listings. Detail-page route: the host's dances page is the detail route for every residency — Norse Hall (second/third Saturdays) and Escape Bar & Grill (first Fridays) have no per-event pages of their own for these dances.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. Its regular dates are the basis for the Norse Hall and Escape residency nods in this registry.

### PDX Collar Guard
- Type: club / organization
- Why on Zaylist: Portland pup / gear community org — Gear Night and RUFF: The Mosh at CC Slaughters, Fetch & Frolic at Steam Portland, monthly 'Collar Guard weekend'.
- How we know: Host watch list (added Oct 30, 2026, verified live: 873 followers at build) + source-memory recipe Nov 12, 2026
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://www.pdxcollarguard.org/events?tab=nextup (rendered browser only — text fetch sees only the Angular shell) and Instagram @pdxcollarguard
- Search recipe: Rendered browser ONLY — pdxcollarguard.org/events?tab=nextup (text fetch sees only the Angular shell), opening/expanding each card fully because capture is uneven between cards — then Instagram @pdxcollarguard, plus its Telegram (t.me/pdxCGEvents) from the watch list. Detail-page route: the rendered events page itself; whether cards expand into a fuller detail view is still an open browser-lane confirmation (Nov 23, 2026 audit). Traps: the site's default.jpg is the org's logo shield, never event art; its series sit at other venues (Gear Night and RUFF at CC Slaughters, Fetch & Frolic at Steam Portland), so the host page leads and the venue lane cross-checks — for Fetch & Frolic the organizer's stated time governs over the Steam flyer's printed time, and the flyer is still posted as-is.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. Its site's default.jpg is the org's logo shield, never event art.

### Red Hanky Social
- Type: club / organization
- Why on Zaylist: Non-play social for gay men in the FF community, every 2nd Thursday, 19:30, at Eagle Portland, hosted by Kevin Rohde (Mr. Portland Eagle Leather 2026). It is NOT on Eagle's venue calendar — the blind spot that created the Coverage safeguard.
- How we know: Source-memory entry Nov 12, 2026 + host watch list (added Nov 12, 2026, IG verified live: bio states recurrence and next date)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @redhankysocial and its dated Partiful editions
- Search recipe: Instagram @redhankysocial first (its bio states the recurrence and the next date), then its dated Partiful event pages, read on each event's own page in the live signed-in browser lane for end time, cost and host notes. Detail-page route: the dated Partiful event page. Traps: it is NOT on Eagle Portland's venue calendar — a venue sweep will never see it, which is the blind spot that created the Coverage safeguard; verify each month's theme and date against the host IG before materializing (every 2nd Thursday, 19:30, Eagle Portland); always compute the ordinal weekday — December 2026's 2nd Thursday is Dec 10, not Dec 11.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. Verify each month's theme/date against the host IG before materializing.

### BETTY (Queer Artists Fund)
- Type: club / organization
- Why on Zaylist: Recurring queer dance party at Holocene; sells out.
- How we know: Host watch list Top 10 (Oct 30, 2026)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @betty_pdx
- Search recipe: Instagram @betty_pdx first, then Holocene's dated event pages. Detail-page route: the dated holocene.org event page for each edition. Trap: editions sell out — a sold-out dated page still verifies the edition; do not drop it for that reason.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Rogue Apostles Entertainment (RAE Presents)
- Type: club / organization
- Why on Zaylist: Eventbrite / Facebook organizer behind Camas Pride drag brunches and Worlds Will Collide; presents as RAE Presents on Facebook (Supernova weekly, Portland's Pettiest Drag Competition).
- How we know: Host watch list (Oct 30, 2026), verified on the Camas Pride Eventbrite page Oct 24, 2026; RAE Presents name added Nov 21, 2026 (source-memory)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Eventbrite organizer 'Rogue Apostles Entertainment'; Facebook as RAE Presents
- Search recipe: Eventbrite organizer listings first — its Eventbrite pages always carry the venue — then Facebook under its presenting name RAE Presents (Supernova weekly, Portland's Pettiest Drag Competition). Detail-page route: the dated Eventbrite event page (age highlight, ticket tiers and full description captured in the same read as the poster). Traps: skip Facebook for the venue fact — its Facebook pages omit venue; an edition's venue must be date-confirmed on Eventbrite — the Pettiest series' Escape Bar & Grill history does not confirm a later edition's venue.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md. For its events, skip Facebook for venue — its Eventbrite pages carry the venue.

### PDX Queer Professionals Network (Stephan Rabimov)
- Type: organization
- Why on Zaylist: Portland queer professionals networking circle hosted by Stephan Rabimov; Tucker designated him a high-priority watch contact Nov 1, 2026.
- How we know: Host watch list addendum Nov 1, 2026 (Tucker's designation) + ~/memory/people/stephan-rabimov.md
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Partiful profile partiful.com/u/nPaTACVoYldFIPPVowqjrhRJxP22 and his public socials
- Search recipe: Partiful profile first — partiful.com/u/nPaTACVoYldFIPPVowqjrhRJxP22, in the live signed-in browser lane (his events are sometimes invite-gated; note the access state per event) — then his public socials. Detail-page route: the dated Partiful event page for public events. Traps: private/invite-only Partiful events are reported to Tucker, never published; watch priority is HIGH by Tucker's Nov 1, 2026 designation.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Watch priority HIGH. He offered a joint-venture intro if Zaylist hits 1,000 sign-ups in a rolling 90 days.

### Yes Sir
- Type: club / organization
- Why on Zaylist: Touring underwear dance party with city chapters; Portland chapter ran Oct 3, 2026.
- How we know: Host watch list (added Oct 30, 2026, verified live)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @yes.sir.portland and @yes.sir.party
- Search recipe: Instagram @yes.sir.portland first, then the main brand account @yes.sir.party. Detail-page route: the dated ticket/event page for the Portland edition when one exists. Trap: Portland dates ONLY (Tucker, Oct 30, 2026) — touring dates in other cities are out of scope and never entered.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Portland dates ONLY (Tucker, Oct 30, 2026).

### BRÜT
- Type: club / organization
- Why on Zaylist: Touring LGBTQ+ party brand (founder / DJ Dan Darlington) that has played Portland before.
- How we know: Host watch list (added Oct 30, 2026, verified live)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @brutparty
- Search recipe: Instagram @brutparty first, then the brand's dated ticket pages for any Portland edition. Detail-page route: the dated ticket page for the Portland edition. Trap: Portland dates ONLY (Tucker, Oct 30, 2026) — the brand's Chicago/DC and other touring dates are out of scope.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Portland dates ONLY (Tucker, Oct 30, 2026).

### Klip Klop Productions
- Type: club / organization
- Why on Zaylist: Themed queer raves and events / media outfit; productions teased for Dec 31 and Mar 31.
- How we know: Host watch list (added Oct 30, 2026, per Tucker, verified live)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @klipklopproductions
- Search recipe: Instagram @klipklopproductions first, then dated ticket pages for its productions (teased editions include Dec 31 and Mar 31). Detail-page route: the dated ticket/event page for each production. Trap: a bio teaser is not a dated event — wait for a dated page before treating a production as listable.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Camp Nonsense
- Type: club / organization
- Why on Zaylist: Drag troupe — Maximum OverDrag at Peacock, Drag CAMP-ionship at Camp Bar.
- How we know: Host watch list (Oct 30, 2026, from catalog ticket domain)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://campnonsense.com
- Search recipe: campnonsense.com first — its own event pages embed the event flyer (Jingle All The Gay's poster was filled from its campnonsense.com event page) — then the host venue's surfaces (Peacock PDX, Camp Bar PDX). Detail-page route: the dated campnonsense.com event page for each show.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### OMEN (Oregon Men Enjoying Naturism)
- Type: club / organization
- Why on Zaylist: Partner org running OMEN Wednesdays and socials at Hawks PDX.
- How we know: Host watch list (Oct 30, 2026, URL from live catalog copy)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://omenpdx.org
- Search recipe: omenpdx.org first, then the Hawks PDX lane (OMEN Wednesdays and socials sit at Hawks — see the Hawks PDX recipe). Detail-page route: omenpdx.org's dated pages where they exist; Hawks has no usable detail layer, so the org's own page leads.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### CumUnion
- Type: club / organization
- Why on Zaylist: International men's party series; Portland edition at Steam Portland.
- How we know: Host watch list (Oct 30, 2026, from catalog ticket domain)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: https://cumunion.com
- Search recipe: cumunion.com first, then the Steam Portland flyer lane (the Portland edition sits at Steam — its /s/CUMUNION series flyer cross-checks the edition; 2nd Saturdays per the Steam recipe). Detail-page route: cumunion.com's dated Portland edition page.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Queer Movement Collective
- Type: club / organization
- Why on Zaylist: Movement class series at The Peoples Yoga, run by Chloe Jacobson & Yaara Perczek.
- How we know: Host watch list (Oct 30, 2026, Eventbrite organizer per Oct 29 extra-source pass — page UNVERIFIED at build)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Eventbrite organizer 'Queer Movement Collective'
- Search recipe: Eventbrite organizer listings first — enter through a live dated event page, because the organizer page was UNVERIFIED at watch-list build. Detail-page route: the dated Eventbrite event page. Trap: verify the recurrence wording on the organizer's own description before materializing any occurrence — its own copy says MONTHLY / First Fridays at The Peoples Yoga, not weekly; a weekly pattern invented a Nov 13 occurrence that never existed.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Verify recurrence wording on the organizer page before materializing — its own description says MONTHLY / 'First Fridays', not weekly (source-memory, Oct 30, 2026).

### Lighthouse Community Yoga PDX
- Type: organization
- Why on Zaylist: Queer + Trans Community Yoga and Rainbow Resonance sound bath, donation-based, at 9161 SE Foster Rd.
- How we know: MUSE-AS-QSEARCH.md proof pass Oct 24, 2026 (Facebook Events 1228644932022583) + host watch list Facebook table
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Facebook public events for Lighthouse Community Yoga PDX
- Search recipe: Facebook public events first (this organizer has no Instagram lane) — its Queer + Trans Community Yoga and Rainbow Resonance events read on their Facebook Event detail pages (events details carries description, venue/address, start/end and ticket URL) — then a catalog check that the weekly Friday series has not lapsed. Detail-page route: the Facebook Event page. Traps: the Friday yoga series lapses silently — check it every run, the same failure family as Q Center; DISTINCT from Bhakti Yoga Movement Center's Queer + Trans Yoga residency, a separate entry in this registry.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Weekly Friday yoga series lapses silently — check every run (source-memory, Nov 21, 2026).

### Trans Guys Gather PDX
- Type: club / organization
- Why on Zaylist: Transmasc gathering org; co-sponsors Trans Giving (Nov 26, 2026). DISTINCT from TranzGuys PDX, seeded separately above.
- How we know: Host watch list addendum Nov 15, 2026 (discovery sweep)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @transguysgatherpdx
- Search recipe: Instagram @transguysgatherpdx first, then the pages of events it co-sponsors (Trans Giving, Nov 26, 2026). Detail-page route: the dated event page of the co-sponsored event. Trap: DISTINCT from TranzGuys PDX, a separate entry in this registry — never merge the two.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### FUNGEON
- Type: club / organization
- Why on Zaylist: Monthly QTBIPOC kink night at Sanctuary Club.
- How we know: Host watch list addendum Nov 19, 2026 (host-discovery pass)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @fungeonpdx
- Search recipe: Instagram @fungeonpdx first, then Sanctuary Club detail pages for its monthly night (see the Sanctuary Club recipe). Detail-page route: the Sanctuary detail page for each edition.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Gallery Girls / Jennifer Fabos
- Type: club / organization
- Why on Zaylist: Figure-drawing series at Sanctuary Club (Bound to Draw / Gallery Girls, 4th Mondays).
- How we know: Host watch list addendum Nov 19, 2026; produced the Gallery Girls Nov 23, 2026 catalog find (id 2317)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Instagram @gallerygirlspdx and @jenniferfabos
- Search recipe: Instagram @gallerygirlspdx and @jenniferfabos first, then Sanctuary Club detail pages (Bound to Draw / Gallery Girls, 4th Mondays at Sanctuary). Detail-page route: the Sanctuary detail page for each edition. Trap: the Sanctuary ICS start for this series (18:30) is doors, not the event start (19:00 per the host's IG) — read the detail page before setting times.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Spectrum Art Market
- Type: organization
- Why on Zaylist: Organizer of 2SLGBTQIA+ artist markets (A Little Gay Krampus Market Crawl, Dec 5, 2026).
- How we know: Host watch list addendum Nov 21, 2026 (discovery sweep, published id 2364)
- Found: 2026-11-23 · Found by: weekly hunter (first-run seed)
- Verify at: Facebook events under Spectrum Art Market
- Search recipe: Facebook events under Spectrum Art Market first (its 2SLGBTQIA+ artist markets, for example A Little Gay Krampus Market Crawl, Dec 5, 2026), read on their Facebook Event detail pages. Detail-page route: the Facebook Event page for each market.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Recurring host — stays on host-watch-list.md.

### Peacock PDX
- Type: venue
- Why on Zaylist: New dedicated queer bar that opened Oct 2, 2025 in the former Crush Bar space (1400 SE Morrison St), filling the loss of Crush (closed 2024 after 23 years). Programming: karaoke, trivia, mixers, drag, astrology comedy, open mics.
- How we know: Press: Eater Portland notable openings (via Postcard, crawled Nov 2026) — 'a new queer bar has stepped up'; Bridgetown Bites Jun 16, 2025 — founder Aaron Grimmer, 'many of [the team] are queer', project founded by Grimmer; PDX Monthly LGBTQ+ bars guide (Oct 2026) — 'Peacock fanned open its feathers last September'. Directory record id 24 also lists it queerOwned=true. Searched Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://peacockpdx.com and Instagram @peacock.pdx
- Search recipe: peacockpdx.com first, then Instagram @peacock.pdx, then dated ticket pages (Eventbrite is a real yield lane for this venue). Detail-page route: NONE established yet — before any first publish sourced from a new Peacock lane, record whether peacockpdx.com's events/calendar has per-event pages and read events there; until then the IG posts plus the dated ticket page are the detail level (recorded in source-memory Nov 23, 2026). Traps: host lanes carry much of its programming — Nu-Glitter (Wednesdays), Trans Mixer Happy Hour (Mondays 16:00) and Queeraoke with Sam Cole (Sundays 19:00) surface via Queer Social Club detail pages, not the venue feed; the directory's upcomingEvents join undercounts this venue (1 shown vs 6+ in the catalog) — cross-check against catalog venue counts.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Found by: weekly hunter (first hunt, Nov 23, 2026). Already in the Zaylist directory as a venue, but not a trusted-venue seed — entered here as a hunt find. Detail-page route for its events: record in source-memory before any first publish from a new Peacock source lane.

### TPK Brewing Co.
- Type: venue
- Why on Zaylist: Majority queer, woman-of-color-owned tabletop-roleplaying brewpub at 5051 SE Hawthorne Blvd — first dedicated TTRPG brewpub in Portland, co-founded by Elliott Kaplan and head brewer Jess Hardie.
- How we know: Press: PDX Monthly — 'a majority queer, woman-of-color-owned tavern'; New School Beer — 'Queer/Women-of-Color owned TPK Brewing'; Willamette Week Nov 20, 2024 — 'Oregon's first brewery owned by a queer, Indigenous woman of color'. Searched Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://tpkbrewing.com (official site — verify ownership / About there on re-check)
- Search recipe: tpkbrewing.com first — its own events page — then the host's dated event page for any hosted night. Detail-page route: no per-event detail pages known; the venue's events page or the host's dated page is the detail level. Trap: never publish from a guide listing (Lavender Atlas / Travel Portland) alone — a guide is discovery only (recorded in source-memory Nov 23, 2026).
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Found by: weekly hunter (first hunt, Nov 23, 2026). Not in the Zaylist directory at seeding. Detail-page route: no per-event detail pages known — events, if any, would be read on tpkbrewing.com's own events page before any publish; recorded in source-memory this run.

### Always Here Bookstore
- Type: shop
- Why on Zaylist: Queer and trans worker-owned bookstore in Portland (4555 N Williams Ave per Autostraddle) — queer books for all ages, mutual-aid lockers with free binders / gender-affirming gear, community gatherings and book swaps. Co-owners Rafael and John Hart.
- How we know: Press: Publishers Weekly — 'John Hart, who opened Always Here in 2025', 'being a queer bookstore is about more than the books we curate'; PW profile — married co-owners Rafael and John Hart, both they/he; Travel Oregon listing — 'a queer and trans worker-owned bookstore'. Searched Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: Official store site / socials via https://bookshop.org/shop/ listings and Travel Oregon — re-verify storefront address and hours on the store's own channels on re-check
- Search recipe: The store's own site and socials first, then partner organizations (Pride Northwest, SMYRC) naming its events, then guide listings (Bookshop.org shop listings, Travel Oregon) for re-verification of address and hours only. Detail-page route: the store's own dated event page or post for each event — a bookstore guide listing is discovery only (recorded in source-memory Nov 23, 2026). Trap: sources disagree on the storefront start (pop-ups from 2023; storefront dated Jan 2024 in one account and 2025 in another) — note the discrepancy, do not resolve it from a guide.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Found by: weekly hunter (first hunt, Nov 23, 2026). Not in the Zaylist directory at seeding. Began as pop-ups (2023), storefront from Jan 2024 / 2025 per PW's two accounts — the discrepancy is noted, not resolved.

### Bombshell Transformations
- Type: service provider
- Why on Zaylist: Beauty and wellness collective in N Portland (near St. Johns Bridge) dedicated to serving the trans community — hair, wig work, massage, aesthetics, electrolysis. Its own About / team page states founder Bettie 'identifies as a queer femme', manager DJ 'identifies as a gay/queer man', and Wrenn Koer is 'a queer licensed cosmetologist' — openly out in their own professional presence, per the registry's provider rule.
- How we know: The collective's own site, About / Meet the Team page (https://www.bombshelltransformations.org/), read via search Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://www.bombshelltransformations.org/ — About / team page
- Search recipe: bombshelltransformations.org first — its About / Meet the Team page is both the verify-at source and the search surface (the team members' own stated identities are the registry evidence). Detail-page route: none — this is a service provider, not an event venue, so no event detail-page route applies (recorded in source-memory Nov 23, 2026). Trap: re-verify against the collective's OWN About/team wording on every re-check; a third-party directory description does not meet the provider standard.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Found by: weekly hunter (first hunt, Nov 23, 2026). Not in the Zaylist directory at seeding. Its nonprofit arm is The T House (thethouse.org), which helps pay for services for trans clients.

### Escape Bar & Grill
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residencies: Stomptown LGBTQ+ country dancing (first Fridays), Bad Girls Munch (2nd Tuesdays, per pdxbadgirls.net/events), Sapphic Singles mixers, plus recurring drag competitions. Directory lists it queerFriendly=true, queerOwned=false — NOT labeled LGBTQ.
- How we know: Source-memory: Stomptown ledger + Bad Girls Munch rule (2nd Tuesdays at Escape) + host watch list (Sapphic Singles at Escape); directory record id 40 (GET /api/directory, Nov 23, 2026)
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: Host pages: https://stomptown.org/dances , http://www.pdxbadgirls.net/events , and Eventbrite host pages for dated editions — Escape has no known per-event detail pages of its own; the host's event page is the detail route
- Search recipe: Pattern RESIDENCY-HOST-DETAIL (residency nod): the venue has no per-event detail pages of its own, so the HOST's dated event page is the detail route, in this order — stomptown.org/dances (Stomptown, first Fridays), pdxbadgirls.net/events (Bad Girls Munch, 2nd Tuesdays), then Eventbrite host pages (Sapphic Singles mixers, drag competitions). Trap: a single Taimi blog post calling Escape 'lesbian-owned' is held unverified and does NOT meet the standard — the venue stays a residency nod unless its own About or a credible write-up confirms community ownership.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: A Taimi blog post calls Escape 'lesbian-owned' — that single weak source does NOT meet the verification standard and is held unverified; the venue stays a residency nod unless its own About / a credible write-up confirms community ownership.

### Norse Hall
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residency: Stomptown LGBTQ+ country dances (second / third Saturdays, lessons 7pm, social 8–11pm).
- How we know: Source-memory Stomptown ledger (Nov 12, 2026: 'dances at Norse Hall AND Escape — stomptown.org/dances is the reliable feed') + Stomptown's own dance listings, searched Nov 23, 2026
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://stomptown.org/dances — the host's dances page is the detail route; Norse Hall has no known per-event detail pages for these dances
- Search recipe: Pattern RESIDENCY-HOST-DETAIL (residency nod): stomptown.org/dances is the only route — it is the detail route for the Stomptown residency (second/third Saturdays, lessons 19:00, social 20:00–23:00). Norse Hall has no known per-event detail pages for these dances. Trap: never labeled LGBTQ — residency nod only; a non-Stomptown event at Norse Hall is not covered by this entry.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only.

### Clinton Street Theater
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residency: MELANGE — A Queer and P.O.C. Variety Show, last Sundays, hosted by Chakra Stone.
- How we know: Source-memory hunt log Oct 24, 2026 — facts completed on the show's TicketTomato page (tickettomato.com/event/10383): 2522 SE Clinton St, 6–9pm, $15, 21+, recurring LAST SUNDAYS
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://www.tickettomato.com/ — the dated TicketTomato event page is the detail route for each MELANGE edition
- Search recipe: Pattern RESIDENCY-HOST-DETAIL (residency nod): the dated TicketTomato event page for each MELANGE edition is the detail route — TicketTomato pages carry title, venue and street address, times, price, age and poster in one read. Trap: never materialize a new edition (last Sundays, hosted by Chakra Stone) without a dated TicketTomato page for that edition.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only. Do not materialize a new edition without a dated TicketTomato page.

### Holocene
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular queer programming incl. BETTY (Queer Artists Fund) recurring dance parties and Spend the Night co-presentations. Directory lists it queerFriendly=true, queerOwned=false — NOT labeled LGBTQ.
- How we know: Directory record id 30 (GET /api/directory, Nov 23, 2026) + host watch list (BETTY at Holocene; Spend the Night via holocene.org calendar credits)
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://holocene.org calendar — its dated event pages are the detail route for Holocene-hosted editions
- Search recipe: Pattern RESIDENCY-HOST-DETAIL (residency nod): holocene.org's calendar first — its dated event pages are the detail route for BETTY (Queer Artists Fund) editions and Spend the Night co-presentations — then the host accounts (@betty_pdx). Trap: never labeled LGBTQ — directory lists queerOwned=false; a Holocene listing without a community host or framing is not covered by this nod.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only.

### Workers Tap
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residency: T4T Social, Fridays 19:00, via Queer Social Club.
- How we know: Source-memory discovery sweep Nov 13, 2026 — 'T4T Social — Fridays 19:00, Workers Tap (QSC)'; series lapsed after Oct 2 and was restored in that run
- Found: 2026-11-23 · Found by: weekly hunter
- Verify at: https://queersocialclub.com — QSC's /events-portland/<slug> detail page is the detail route for T4T Social editions
- Search recipe: Pattern RESIDENCY-HOST-DETAIL (residency nod): Queer Social Club's /events-portland/<slug> detail page for each T4T Social edition is the detail route (Fridays, 19:00; QSC detail pages carry the age tags, ticket link and doors split the index misses). Trap: QSC listed no December dates for T4T Social at the Nov 19, 2026 sweep — pattern-only holds are not published, and a quiet QSC feed does not end the series.
- Change log: 2026-11-23 — added in the first weekly hunter run (see Found line); 2026-11-23 — search recipe backfilled in the recipe backfill pass, drawn from source-memory.md and the Nov 23, 2026 detail-page audit.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only. QSC listed no December dates for T4T Social at the Nov 19 sweep — pattern-only holds are not published.

### Westside Queer Resource Center (WQRC)
- Type: organization
- Why on Zaylist: 501(c)(3) nonprofit serving the LGBTQIA+ community in and around Washington County (Hillsboro / westside Portland metro) — drop-in hours, affinity groups, TTRPG and crafting programming, trans needle exchange. Founded 2019; its physical home, The Hive, is at 233 SE Washington St, Hillsboro.
- How we know: Queer Social Club Portland listings (accessed 2026-11-23) — Tabletop RPG Drop-In Night, Community Crafting Night and Queer Affinity Group all link to westsideqrc.org/calendar; corroborated by the City of Hillsboro's own profile ("a 501(c)(3) nonprofit... serve the needs of queer and trans people in Washington County") and KBOO's org description ("serving the LGBTQIA+ community in and around Washington County, Oregon")
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://www.westsideqrc.org/ and https://www.westsideqrc.org/calendar
- Search recipe: westsideqrc.org/calendar monthly programming pages first, then its QSC listings (/events-portland/<slug> detail pages). Trap: Hillsboro/Washington County, not Portland proper — metro scope is intentional.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Metro-area (Washington County), not Portland proper — in scope as the westside's queer resource center, the counterpart to Q Center. Detail-page route: its own calendar at westsideqrc.org/calendar (monthly programming pages) — recorded in source-memory this run.

### Portland Sage Singers
- Type: club / organization
- Why on Zaylist: Chorus for Q+ elders and allies (ages 55+), incorporated Oct 1, 2024 — one of only two queer and allied elder choruses in the country per its QSC listing. Part of the GALA Choruses network, the North American LGBTQIA+ choral movement.
- How we know: Queer Social Club listing "Making Spirits Bright" (accessed 2026-11-23) naming it "an LGBTQ+ elders and allies chorus"; its own About page (https://portlandsagesingers.org/about/) — "We will be part of the GALA Choruses network (leader in the North American LGBTQIA+ choral movement)", inspired by Sage Singers Denver, "the first GALA chorus for queer and allied elder singers"
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://portlandsagesingers.org/about/ and https://portlandsagesingers.org/
- Search recipe: portlandsagesingers.org concert listings first, then QSC detail pages for dated editions. Trap: do not confuse with Sage Singers of Denver (sagesingers.org), its inspiration — different org.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Artistic Director Dr. Tim Seelig. Rehearsals Sundays at Grant Park Church; concerts at the Reser Center, Beaverton. Recurring host — added to host-watch-list.md this run.

### Degenderettes
- Type: club / organization
- Why on Zaylist: Collective gym / martial-arts clubhouse run by trans women — a 501(c)(3) nonprofit whose programming is for LGBTQIA adults only: BJJ, Muay Thai kickboxing, judo, self-defense, squad-building and a motorcycle self-repair hangout, at its own clubhouse, 1628 N Columbia Blvd, Portland.
- How we know: Queer Social Club Portland feed (accessed 2026-11-23) — 16 upcoming listings at 1628 N Columbia Blvd, with its own copy: "Degenderettes is a collective gym run by trans women. It is a 501(c)(3) nonprofit" and "All programming at Degenderettes is for LGBTQIA adults only"; its own site (https://degenderettes.org/) — "The Degenderettes Clubhouse (Portland, OR) is a training facility for trans & queer adults", address 1628 N Columbia Blvd F, Portland OR 97211
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://degenderettes.org/ and its calendar https://degenderettes.org/calendar ; Instagram @degenderettes
- Search recipe: degenderettes.org/calendar first (full class calendar), then QSC listings at 1628 N Columbia Blvd, then @degenderettes. Trap: QSC mirrors its calendar — a QSC listing alone is the same source, not a second one.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Black and Indigenous trans-fems train free; Friday self-defense classes always free. Recurring host — added to host-watch-list.md this run. Detail-page route: degenderettes.org/calendar — recorded in source-memory this run.

### Our Dance Studio PDX
- Type: service provider
- Why on Zaylist: Dance instruction studio whose own homepage states "proudly queer owned" and "a queer + disabled-run small business with the goal of creating inclusive, trauma-aware, safer dance spaces here in Portland" — openly out in its own professional presence, per the registry's provider rule. Runs Queer Salsa Tuesdays and Dominican Bachata Fridays (classes at 232 SE Oak St).
- How we know: Its own site, https://www.ourdancestudiopdx.com/ (read 2026-11-23) — "proudly queer owned" / "queer + disabled-run small business"; Queer Social Club listing "Queer Salsa Tuesdays" (accessed 2026-11-23) — "Our Dance Studio was started to create a safer, more accessible dance space specifically for queer and neurodivergent folks", teacher a.b., they/them
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://www.ourdancestudiopdx.com/ and Instagram @ourdancestudio_pdx
- Search recipe: ourdancestudiopdx.com first, then QSC detail pages for Queer Salsa Tuesdays / Bachata editions, then @ourdancestudio_pdx. Trap: classes sit at Portland Dance Studio (232 SE Oak) — location is not a venue identity claim.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Classes are held at Portland Dance Studio, 232 SE Oak St — that building is a class location, not a venue identity claim for the studio.

### PDX Queer Book Club
- Type: club / organization
- Why on Zaylist: Recurring monthly queer book group — meets the second Thursday of each month, alternating fiction and nonfiction; a continuation of the group that previously met on Meetup (2022–2025).
- How we know: Partiful event "The Safekeep - PDX Queer Book Club", Thu Jan 14, 2027, 7pm, Lucky Labrador Brew Pub SE, 915 SE Hawthorne Blvd (https://partiful.com/e/m92BP9vvLseWO9UZ1mLC, read in the live signed-in browser 2026-11-23; host is a Partiful Community profile with 3 upcoming events); verified against the group's own presence, its Linktree https://linktr.ee/pdxqueerbooks — "a safe place for members of the queer community to gather and discuss books relevant to our diverse experiences. We meet the second Thursday of each month"
- Found: 2026-11-23 · Found by: weekly hunter (gap run — Partiful live signed-in sweep)
- Verify at: https://linktr.ee/pdxqueerbooks and its Partiful host / event pages
- Search recipe: its Partiful event pages first (Partiful Community host profile), then linktr.ee/pdxqueerbooks for the month's confirmed location. Trap: meeting location rotates — never publish or nod a venue from pattern.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Meeting location is confirmed month by month per its Linktree — Lucky Lab SE is the Jan 14 location, NOT a confirmed fixed residency, so Lucky Lab gets no residency nod from this. A QSC listing "Moby Dyke: PDX Queer Book Club" also appears in the QSC feed. Recurring host — added to host-watch-list.md this run.

### Queer Nourish
- Type: organization
- Why on Zaylist: Portland queer history, culture and learning events — founder Taylor J. Hodges (they/them). Events have been held at Peacock PDX (already in this registry) and via TicketTailor.
- How we know: Partiful mutual (2 shared events with Tucker, ~Sep 2026), checked in the live signed-in browser 2026-11-23; verified against its own presence, https://www.queernourish.com/ — "QUEER HISTORY CULTURE & LEARNING EVENTS", founder Taylor J. Hodges, Instagram @queernourish; Oregon Pride in Business Certified Spotlight (May 12, 2025)
- Found: 2026-11-23 · Found by: weekly hunter (gap run — Partiful live signed-in sweep)
- Verify at: https://www.queernourish.com/ and Instagram @queernourish
- Search recipe: queernourish.com first, then its TicketTailor event pages, then @queernourish and Partiful mutual pages. Trap: no fixed venue — events land at already-registered venues (Peacock).
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Previously carried on host-watch-list.md (added Nov 15, 2026) as an UNVERIFIED Partiful mutual — this run verifies it against its own site; watch-list entry updated. No fixed venue or residency found.

### Puddletown
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residency: Queer Board Game Night, every Monday, at Puddletown, 4100 NE Fremont St (free game rental library, no alcohol).
- How we know: Queer Social Club Portland feed (accessed 2026-11-23) — "Join us each Monday for a fun night of games at Puddletown", with two upcoming Monday editions in the current feed; RSVP via Partiful
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://queersocialclub.com/events-portland — QSC's /events-portland/<slug> detail page for Queer Board Game Night is the detail route for each edition
- Search recipe: QSC /events-portland/<slug> detail page for Queer Board Game Night (the residency pattern — QSC detail page is the detail route), RSVP via Partiful. Venue has no known per-event pages of its own.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only.

### Bhakti Yoga Movement Center
- Type: residency nod
- Why on Zaylist: Community-friendly — they've hosted our community and are worth reaching out to if you're looking to host. Regular residency: Queer + Trans Yoga, a weekly all-levels donation class (in-person + livestream), at 2500 SE 26th Ave.
- How we know: Queer Social Club Portland feed (accessed 2026-11-23) — six upcoming Queer + Trans Yoga listings at 2500 Southeast 26th Avenue, described as "A Weekly all levels donation class... for people with shared identities, to build community"
- Found: 2026-11-23 · Found by: weekly hunter (gap run — QSC direct sweep)
- Verify at: https://queersocialclub.com/events-portland — QSC's /events-portland/<slug> detail page for Queer + Trans Yoga is the detail route; Bhakti's own schedule on re-check
- Search recipe: QSC /events-portland/<slug> detail page for Queer + Trans Yoga (the residency pattern), then Bhakti's own schedule. Trap: distinct from Lighthouse Community Yoga PDX's Queer + Trans Community Yoga series.
- Change log: 2026-11-23 — added by the weekly hunter gap run (Partiful + QSC direct sweeps), verified same day.
- Last verified: 2026-11-23 · Status: verified
- Notes: Never labeled LGBTQ — residency nod only. Distinct from Lighthouse Community Yoga PDX's Queer + Trans Community Yoga series, already in this registry.
