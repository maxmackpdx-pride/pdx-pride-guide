# Muse-QSearch Source Memory

Where facts were actually found, so the next run starts from the last working
recipe instead of rediscovering it. Append-only; date every entry.
Rule: record source label, exact URL, what it supplied, and success/failure.
Never store passwords, cookies, or tokens.

## Founder direction (reaffirmed Oct 25, 2026)

- **One official source is enough.** Tucker, Oct 25: "You do not need two.
  One is enough." This supersedes the two-distinct-sources requirement in
  `docs/QSEARCH_CANDIDATE_GATE.md`. The 27 single-source creates in Run #1's
  publish package are GO. If the production decision-gate enforces two
  sources, that is a server/founder-rule conflict to report and fix — never
  manufacture a second source or a URL variant to satisfy it.

## Standing recipes

- **Zaylist catalog (dedupe base):** `GET https://www.zaylist.com/api/events`
  — unauthenticated JSON, full catalog. Filter `dateStart` + `status=LIVE`
  locally. Verified Oct 24, 2026.
- **Facebook events:** `/opt/hatch/bin/facebook-cli events search --scope
  discover|connected --location Portland --start-date/--end-date --limit 25`
  + `events details --event-id`. Linked account required and present.
  Caveat (Oct 24): Discover often returns NO location even in details —
  when the venue fact is missing, go to the organizer's ticket page
  (Eventbrite / TicketTomato / sickening.events), not back to Facebook.
- **Facebook groups beat Discover for drag/burlesque** (Oct 24 run):
  Portland GAY Events (group id 791242055711086) produced 2 real candidates;
  queer/poly/bisexual/lesbian/gay/burlesque Discover keywords produced 0.
  Keyword yields Oct 24 (window Oct 25–Nov 7): karaoke 12 (zero LGBTQ
  yield), queer 2, pride 2, drag 1, trans 1, all others 0.
- **Instagram venue posts:** `/opt/hatch/bin/instagram-cli posts
  --account-id <tucker_pdmax> --username <handle> --limit 8
  --post-types POST,REEL`. **Resolved handle table (Oct 24, Lane C —
  each taken from the venue's official website, then verified by a posts
  call):**
  | Venue | Handle | Status |
  |---|---|---|
  | Hawks PDX | @hawkspdx | ✅ posts return |
  | Eagle Portland | @eagleportland | ✅ |
  | Sanctuary | @pdxsanctuary | ✅ |
  | Darcelle XV | @darcellexvshowplace | ✅ |
  | Camp Bar PDX | @campbarpdx | ✅ |
  | Badlands | @badlandspdx (from badlandsportland.com) | ✅ 21 posts |
  | CC Slaughters | @slaughterspdx (via venue-tagging post; site has no IG link) | ✅ 16 posts |
  | The Sports Bra | @thesportsbrapdx (thesportsbraofficial.com) | ✅ |
  | Q Center | @qcenter (pdxqcenter.org) | ✅ Portland Q Center confirmed |
  | Steam Portland | @steamportland (steamportland.com) | ✅ |
  | Scandals East | @scandals_pdx (scandalspdx.com) | ✅ — the Scandals account, now operating as Scandals East (827 NE Alberta); no separate East handle |
  | Stag PDX | @stagpdx (from stagportland.com; note stagpdx.com is parked) | ⚠️ official handle but connector returns 0 posts — retry next run, fall back to their Eventbrite/FB |
  Dead guessed handles — never reuse: @badlandsportland, @cc_slaughterspdx.
  Recipe: to resolve a venue handle, pull the instagram.com link from the
  venue's official homepage first; verify with one posts call.

- **Sanctuary ICS (exact URL — recorded Nov 21, 2026 health check; it
  lived only in run files before):**
  `https://pdxsanctuary.com/events/calendar/sanctuary/ics/` — Sugar
  Calendar feed (NOT Sesami; no Sesami feed exists on the site).
  Pull with `curl -L` (bare curl 301s to an empty body). Verified
  Nov 21, 2026: HTTP 200, 521 VEVENTs. ICS URL field gives each
  event's detail-page slug for the poster pass.

## Venue feed recipes (from Run #1, Oct 24, 2026)

- **Badlands API:** bare `/api/calendar` errors — must pass
  `?from=YYYY-MM-DD&to=YYYY-MM-DD`. Every event carries an event-specific
  `photoUrl` (drive-proxy). ⚠️ UTC offsets are inconsistent across the
  Nov 1 DST change — trust local clock times, not offsets.
- **Sanctuary ICS:** works as-is; 503 VEVENTs; NO images in ICS — posters
  come from the event-detail pages. ICS start = doors in at least one case
  (Gallery Girls 18:30 = doors, event 19:00 per IG).
- **Eagle Wix page:** curl hits a Vercel Security Checkpoint (429). Use
  rendered browser text instead.
- **Darcelle Tribe REST:** works, but every Saturday Night Show is stamped
  08:00 — systematic source artifact for 20:00 shows. Never import a
  Saturday time from Tribe without checking.
- **Hawks Squarespace JSON:** STALE as of Oct 24 — newest event Sep 7, 2026,
  `upcoming` empty. Do not treat catalog Hawks entries as source-verified.
- **Stag / Living Room Wines Eventbrite:** organizer pages are client-loaded;
  server HTML + public API return zero events. Needs a rendered-browser
  pass next time. Stag's page title said "4 Upcoming Activities" on Oct 24.
- **Camp TRC:** season mid-April–early October; fall checks are a clean
  negative, don't chase.
- **Conflicting official sources happen:** Naked Pool — Eagle's website
  says 2pm, Eagle's IG says 8pm–2am, catalog matches the website. When a
  venue's own sources disagree, flag it; never auto-correct from one lane.

## Hunt log

### 2026-10-24 — Camas Pride drag brunch venue (was: FB gave no location)
- Missing: venue/address for "Camas Pride Presents: A Stephen King Themed
  Drag Brunch," Sun Oct 25, 12–2pm. FB search AND `events details` both
  returned no location.
- **Found on the organizer's Eventbrite page:**
  https://www.eventbrite.com/e/camas-pride-halloween-drag-brunch-show-at-drop-the-mic-karaoke-tickets-2001303181690
- Venue: **Drop The Mic Karaoke, 224 Northeast 3rd Avenue, Camas, WA 98607**.
  Doors 11am, 18+, $17.85, hosted by Nashville Hott. Organizer: Rogue
  Apostles Entertainment (same organizer as Worlds Will Collide).
- Recipe for next time: for Camas Pride / Rogue Apostles events, skip FB
  location — go straight to their Eventbrite organizer listings.
- Status: all 3 founder facts now complete. NOT on Zaylist (checked
  catalog window Oct 25–Nov 7).

### 2026-10-24 — Clinton Street Theater "Sunday funday" show identity
- Missing: a group post (LGBTQ Portland + Portland GAY Events) named no
  title/performer — only "Sunday 6pm, NOTAFLOF, tickettomato.com/event/10383".
- **Found on the ticket page itself:** https://www.tickettomato.com/event/10383
- Event: **MELANGE — A Queer and P.O.C. Variety Show**, Clinton Street
  Theater, 2522 SE Clinton St, Portland, OR 97202. Sun Oct 25, 6–9pm
  (doors 5:30), $15, 21+, masks mandated, host Chakra Stone. Recurring:
  LAST SUNDAYS. Poster on the ticket page:
  https://www.tickettomato.com/file/image/large/26804/melange-a-queer-and-p-o-c-variety-show-all-welcome.jpg
- Recipe: TicketTomato event pages carry title, venue + street address,
  times, price, age, and poster — when a group post drops a TicketTomato
  link, fetch it first; it completes the record in one step.
- Status: all 3 founder facts complete. NOT on Zaylist.

### 2026-10-24 — Repeat Behavior: Kevin Aviance venue (was: "Secret Location TBA")
- Missing: venue for Fri Nov 6, 10pm–late, found via Portland GAY Events
  group post; tickets via sickening.events.
- **Hunted 3 official sources, all agree the venue is deliberately secret:**
  - Ticket page: https://sickening.events/e/repeat-behavior-kevin-aviance-dj-set-w-the-house-o
    → location given only as "Central Eastside, Portland, OR 97214"; 21+;
    tiers $20–$40 (QTBIPOC advance $20 ends 11/05)
  - Partiful: https://partiful.com/e/ScFYQO8Uw37bYBND9vxt → no venue
  - Resident Advisor: https://ra.co/events/2544639 → no venue, 10pm–4am
- Precedent: the prior Repeat Behavior PDX event (BANG!, Sep 19) was listed
  as "Secret Warehouse, Portland, OR 97232" — secret-warehouse is this
  organizer's model, not a data error.
- Status: venue fact = **intentionally undisclosed**; area = Central
  Eastside 97214. Founder-rule venue fact NOT met yet. **Recheck
  sickening.events + Partiful on Nov 5–6** — secret venues usually surface
  to ticket holders / day-of. Do not guess a venue from the zip alone.

### 2026-10-25 — Blue Party + Halloween Bingo start times (were: missing)
- Both were Instagram IMAGE posts; captions had date + venue but no time.
- **Found by reading the flyer images** with `instagram-cli media-understanding --media-ids <post media id>`:
  - Blue Party = "The BLUE BALLS" (CAP Northwest fundraiser), CC Slaughters,
    Fri Nov 6, **doors 7pm**, $10 cover, 21+, shows 10pm + 12am.
    Post: https://www.instagram.com/p/DexaTYxhDXT/
  - Halloween Bingo Fundraiser (Common Fire PDX), Q Center, Oct 31,
    **5–8pm**. Post: https://www.instagram.com/p/DeMufjBPKSv/
- Recipe: when an IG event post is a flyer image and the caption lacks a
  field, run media-understanding on the post's media id before marking the
  field missing — the flyer usually prints it.
- Status: both creates unblocked in publish-package.json (37 ready again).

### 2026-10-25 — Bearracuda (bearracuda.com)
- **Source health (Oct 30, 2026):** @bearracuda's Instagram was suspended
  by Meta (per producer JP Hardy's Oct 22 post on @j.p.hardyofficial —
  added to the host watch Oct 30). Working lanes: bearracuda.com +
  JP Hardy's account. Portland Treasure Trail Nov 8 at Sanctuary is
  catalog id 1637, matching his Oct 13 post (Nov 8, 3–7pm).
- Official site is the source of truth for Bearracuda Portland editions
  (Nova PDX) and its Sanctuary daytime party Treasure Trail. Text fetch
  hits a bot-check page; **curl with a browser UA works**.
- Event pages: bearracuda.com/events/<slug>/ (portlandbdat = Nov 14,
  portlandnye = NYE, treasure-trail-pdx = Treasure Trail). The edition
  flyer is each page's **og:image**.
- Catalog: Bearracuda editions 792 (Oct 10, past), 793 (Nov 14, 21:00–02:00,
  $20), 794 (NYE, 21:00–03:00, $30 early), Treasure Trail 1637 (Nov 8,
  15:00–19:00, Sanctuary, $15) — ALL were posterless; official flyers
  downloaded to run-2026-10-24/posters/{793,794,1637}.jpg and queued in
  publish-package.json posterUploads.

### Correction (Oct 25, 2026) — Bearracuda posters already existed
- The poster field on /api/events is **posterImageUrl**, not imageUrl.
  Reading imageUrl made Bearracuda 792/793/794 + Treasure Trail 1637 look
  posterless; they all carry qsearch-2-uploaded flyers that are
  **byte-identical (MD5-verified)** to the official bearracuda.com
  og:images. The 3 queued uploads were removed from publish-package.json.
- Linkage model: events carry only venueName + venueWebsite strings (no
  place FK). The Placez/directory layer (/api/directory, 161 entries)
  computes joins — venues and groups expose upcomingEvents. Bearracuda is
  directory group id=72; Nova PDX venue id=36; Sanctuary venue id=33.
- Gaps seen Oct 25: Nova PDX's upcomingEvents omit the Bearracuda parties
  held there (793/794 appear only under the Bearracuda group), and
  Treasure Trail 1637 appears under Sanctuary but not under the
  Bearracuda group. Report to Tucker before assuming mechanism.

### Steam Portland — listings are the flyers (Tucker, Oct 26, 2026)
- Per Tucker: Steam's site lists its events **by the flyers** — the flyer
  images ARE the listings. So for Steam, the website flyer grid is the
  primary source artifact (not a facts feed); each flyer carries its own
  date/time art. IG @steamportland remains the backup lane.
- Caveat: steamportland.com would not connect from this environment on
  Oct 25–26 (curl 000, same as pdxsanctuary.com). Next run: try the live
  browser lane for the site before falling back to IG-only.

### Publishing lessons (Run #1 publish, Oct 26, 2026)
- The production decision-gate HONORS the founder one-source rule:
  `insufficientIndependentVerification: []` on all 37 candidates.
- Create hard-requires only title, venueName, dateStart. dateEnd null and
  admission UNKNOWN are accepted (server applies defaults) — the gate doc
  overstates requirements.
- **Record URL evidence in canonical form.** The create path normalizes
  URLs (e.g. adds trailing slash to bare domains); the gate compares
  evidence strings exactly. A bare-domain ticketUrl cost one 409
  ("candidate decision gate did not approve creation") until evidence was
  re-recorded canonically from the same source.
- Events dated in the past are gate-blocked as `pastEvent` — publishing
  latency loses same-day events; run discovery earlier in the day.
- Full log: run-2026-10-24/PUBLISH-LOG.md (ids 1685–1715, rollback tokens).

### Steam Portland — site recipe SOLVED (Oct 28, 2026, browser lane)
- Use **www.steamportland.com** — the apex domain has a certificate error
  (ERR_CERT_COMMON_NAME_INVALID); curl to apex fails too, which is why
  earlier plain fetches died.
- Events page /events lists recurring themes BY FLYER with recurrence
  rules printed on the flyers; /the-grid has the weekly schedule grid.
  Flyer images live at steamportland.com/s/<FLYER-NAME>.
- Standing themes: Morning Wood (weekday mornings 10–12), Thirst Quencher
  (Mon–Thu 18–23), Radical Rubdown (Tue 19–22), Hump Day (Wed), Blackout
  (1st/3rd Sat 22–04), Afterglow (Sun after Blackout 22–04), CumUnion
  (2nd Sat), Sin City (4th Sat), Kink Week (dated weeks). Site-wide:
  18+, gov ID, $10 min day pass.
- Oct 2026 note: Steam was closed Oct 26–28 for maintenance (reopened
  Oct 29) — always check the homepage for closure notices before
  materializing occurrences.

### Stag + Living Room Wines Eventbrite — resolved (Oct 28, 2026)
- Rendered-browser pass: BOTH organizers show "Nothing planned right
  now" on Upcoming. Run #1's extraction failure was a client-render wall
  hiding an empty list, not missed events. Recheck each run (cheap).

### Publishing lessons (Run #2, Oct 28, 2026)
- Age enum vocabulary: ageRequirement uses **UNVERIFIED**; "UNKNOWN" is
  admission-only vocabulary. Mixing them = gate block
  (invalidCandidateFields: ["ageRequirement"]).
- **Poster orientation rule (Tucker, Nov 18, 2026):** when an event has
  TWO official posters — one wide (landscape) and one tall (portrait) —
  attach the TALL one. Applies to every hunt and publish.
- **Ticket page is a poster source at PUBLISH time (Tucker, Nov 19,
  2026):** a ticketUrl is not just a link — before an event may publish
  posterless, the ticket page it points to must be checked for the
  official event image (og:image / page artwork, best original
  resolution), on ANY platform — Eventbrite, Humanitix, TicketTomato,
  Crowdwork/Fourth Wall, Universe, Dice, Ticketmaster, venue
  box-office and organizer event pages (Squarespace/Bandzoogle/
  WordPress event pages included) — and so must every other official
  link carried on the record (venue website / source page). This check
  belongs in the publish flow itself, not only in the later poster
  hunt: the old flow published on the 3 founder facts with "poster
  artwork is not a publication blocker" and never opened the record's
  own ticket page, so posters sat on ticket pages unclaimed. Found
  by Tucker: id 2177 Drag Show @ Triple Nickel Pub published
  posterless while its Eventbrite page carried the official flyer
  (unwrapped cdn.evbuc.com original, 1080×1350 — attached Nov 19).
  Same-run widened sweep of all 168 LIVE upcoming posterless events
  also filled id 2072 (Camp Nonsense: Jingle All The Gay) from the
  flyer embedded on its own campnonsense.com event page; every other
  checked page carried only a logo, brand/decor art, a generic venue
  photo, or no image (still never attach those), Darcelle per-date
  ticketUrls on 14 records return 404, Crowdwork 403s direct fetch
  (its og:image posters need the browser lane), and FetLife/Facebook
  event art stays browser/connector-lane work. A posterless publish
  now requires a recorded check of the record's own links first.
- Poster uploads: JPG/PNG/GIF/WebP only — AVIF rejected. Very large PNGs
  (~9MB) return 500; convert posters to JPG (<1MB) before upload.
  KEEP this pre-step (confirmed Nov 2, 2026): Janus's new image pipeline
  compresses AFTER upload succeeds, by watching new/changed public event
  records in the database — API-created events with uploaded posters are
  included automatically, and the pipeline does NOT raise the upload
  endpoint's size limit. No workflow change on our side.
- IG poster recovery: a plain fetch of an IG post page returns a login
  shell, but UA `facebookexternalhit/1.1` is served the post's og:image.
  Download, verify visually, then upload.
- Badlands post-DST pattern: TWO weekly events now show API 21:00 vs
  catalog 20:00 after the Nov 1 DST change (Musical Mondays 1659,
  Honeypot 1668) — flagged for founder decision, not auto-changed.

### Extra-source pass (Oct 29, 2026, evening) — lane notes
- **IG connector recipe fix:** `instagram-cli posts` needs the NUMERIC
  account-id (tucker_pdmax fbid 17841454892236263). Passing the username
  string errors "instagram connector is not connected" — misleading; the
  connector is fine.
- **Badlands API failed this pass:** curl to
  `/api/calendar?from=2026-10-30&to=2026-11-15` returned empty/non-JSON
  (worked Oct 28). Fall back to @badlandspdx IG when it does this.
- **Eventbrite discovery is a real yield lane for non-registry venues**
  (Peacock, Escape Bar & Grill, Peoples Yoga, Kickstand-adjacent
  listings) — discovery pages are crawl-cached up to 15 days, so open
  the event page before treating facts as current.
- Full results: run-2026-10-29/EXTRA-SOURCE-REPORT.md (12 candidates,
  incl. Queer Punk Bash Nov 12, Heart Throb Nov 14, Hyperpop Halloween
  Oct 31, Rainbow Resonance Nov 15; 2 start-time conflicts flagged on
  catalog ids 1718 and 1687).

### Standing rules update (Tucker, Oct 30, 2026)
- **Publish finds right away — never wait for Tucker.** "Never wait for
  me ones like the 12. Push right away." QSearch candidates that meet
  the founder gate go LIVE immediately; report after, don't ask first.
- **Poster hunter runs ~30 min after every QSearch run** (Tucker,
  Oct 30, 2026 — replaces the every-6-hours timer set the same morning).
  Mechanism: cron `qsearch-poster-hunter` is a one-shot; whoever runs a
  QSearch run re-arms it for 30 minutes after that run completes. First
  chained run: Oct 30, 4:39am PT, after the 13-create publish run.
- **End-of-day metrics report (daily):** cron `qsearch-eod-metrics`
  (~11:42pm PT) reports: events added today, existing events edited
  today, events removed/hidden today, posterless events dated today,
  posterless events dated in the last 7 days.

### Extra-source publish (Oct 30, 2026) — 12 candidates → 13 creates, ids 1761–1773
- Published under Tucker's Oct 30 rule ("push right away"). Run
  2e950c68-0543-4b77-b834-e8aab2d6ab6c; log:
  run-2026-10-29/PUBLISH-LOG.md; metrics: run-2026-10-29/METRICS.md.
- **Eventbrite event pages fetch cleanly with curl + browser UA.** The
  page HTML carries og:image (double-encoded proxy URL), the age
  restriction highlight ("ages 21+"), ISO local start/end with offsets,
  venue address + lat/lng. Discovery pages (.com/d/...) are crawl-cached
  and mix instances — always open the canonical event page before
  treating facts as current.
- **Series cadence trap (again):** Queer Movement Collective was
  reported as weekly with a Nov 13 occurrence; the organizer's own
  description says MONTHLY and its poster says "First Fridays" — no
  Nov 13 event exists. Verify recurrence wording on the organizer page
  before materializing occurrences (same family as the Locker Room
  4th-Friday rule and the `last-sunday-not-weekly` mistake test).
  Nu-Glitter IS weekly (Wednesdays) — corroborated by catalog id 1452,
  a prior Wednesday instance.
- **IG carousel og:image can be the wrong item:** the Untapped Trivia
  announcement's og:image was a cocktail video still, not the flyer.
  Visually verify every poster before upload; an honest empty beats
  wrong art. Published that one posterless.
- Crowdwork/Fourth Wall ticket pages carry the poster as og:image PNG
  (3.3MB — convert to JPG) and print venue age policy in the page text
  (Kickstand: shows starting before 9pm are all ages).
- **Metrics recipe:** admin `changes` feed (newest 200, actors
  qsearch-2/qsearch-3) + full admin `events` table (createdAt/updatedAt
  sweep) jointly establish adds/edits/hides per PT day; the admin
  events table (not the public catalog) is the right base for
  posterless counts over past dates because it includes HIDDEN and
  already-past events.

### Host watch — standing QSearch lane (Tucker, Oct 30, 2026)
- **Strategy (Tucker's call, Oct 30):** watch the HOSTS of current queer
  events, not just venue feeds — hosts announce first. The host watch is
  PART OF QSearch (Tucker, Oct 30: "It's part of qsearch"), swept inside
  normal QSearch runs, not on its own schedule.
- List: `~/workspace/qsearch-new/host-watch-list.md` — 32 hosts, 27 NEW
  (no prior lane). Top: QT PDX Events (handle still UNVERIFIED — resolve
  from a @slaughterspdx collab post), Sapphic Singles PDX (Eventbrite),
  Repeat Behavior (sickening.events + public Partiful pages), Stomptown
  (@stomptownlgbtqcountry), PDX PAH (@pdxpah).
- **Following is NOT the mechanism:** the Instagram CLI cannot follow
  accounts at all, and the Facebook CLI cannot follow pages or join
  groups. Watching = direct public-page reads by handle/URL each run,
  same as the venue lanes. (Partiful login also failed twice Oct 29 —
  browser doesn't retain the session cookie; public Partiful event
  pages remain readable without login.)
- Humanitix is an unwatched platform lane — Pink Ponies
  (events.humanitix.com/host/pink-ponies) is the first host found there.

### FetLife lane — first sweep + reconciliation (Oct 30, 2026)
- FetLife login COMPLETED Oct 30 (Tucker_PDMax; session held — unlike
  Partiful). Sweep scope per Tucker: ignore private events, named venues
  only. ~180 listings reviewed → 132 carried forward
  (`fetlife-sweep-2026-10-30.md`).
- Reconciliation (`fetlife-reconcile-2026-10-30.md`, run b3fe1518):
  27 duplicates (all Sanctuary, via ICS lane), **12 published LIVE
  (ids 1774–1785)** — 10 Sanctuary gaps the ICS lane missed (Popping
  Questions, Game Bang: Neon Nights Nov 11, Speed Spanking Nov 13,
  Boundless Rope Nov 14, Fusion Dance Nov 15, kinky Queer meet & greet
  Nov 20, Gallery Girls Nov 23, Power/Privilege/Intersectionality
  Nov 27, FemPower Nov 27, Jiffy Kink Speed Dating Nov 28), the CC
  Slaughters Kinky Speed Dating Mixer Nov 21, and Hex Dungeon (drag in
  title) at Kelly's Olympian. 92 out-of-scope (general kink at
  non-trusted venues, no LGBTQ+ framing). 1 held: Bad Girls Munch
  Nov 10 (organizer identity suggests relevance; listing itself has no
  explicit framing — settle via pdxbadgirls.net/events or detail page).
- **Founder ruling (Oct 30, 2026): Bad Girls PDX IS queer.** Tucker:
  "Bad Girls is queer." Organizer identity (women's leather org)
  establishes relevance — consistent with the operating plan's rule that
  organizer identity can establish relevance. The held Bad Girls Munch
  (Tue Nov 10, 19:00, Escape Bar & Grill) is cleared to publish.
- **Tagging rule DECIDED (Oct 30, 2026) — mixed kink listings:**
  Tucker's framing: the straight-leaning kink scene is full of queer
  women and that matters, but it can be scary for gay boys. His call:
  "List them, tagged kink/mixed crowd — not as queer events." So
  general kink/lifestyle listings at named venues (the former
  out-of-scope bucket) DO get listed, with eventTypes ["KINK"] and a
  description note that it is a kink / mixed-crowd listing, not an
  LGBTQ+ event — and no queer identity tags. Same gate discipline
  otherwise: one official source, exact venue/address for LIVE, no
  private events, no invented facts. There is no MIXED_CROWD enum in
  the catalog vocab (KINK, SEX_POSITIVE, NUDITY_OK are the kink
  family); the mixed-crowd distinction rides in the description.
- **Exclusion rule (Oct 30, 2026) — couples only / no single men:**
  Tucker: "Exclude any and all events that say couples only. Or no
  single men." Any event whose own listing or venue event page states
  couples-only admission, or that single men/males are not admitted
  (incl. "couples & single women only", "no unaccompanied males"),
  is NOT listed; if already listed, hide it. Differential pricing for
  single men is not by itself exclusion. Applies site-wide in
  QSearch, kink lane first.
- **Clarification (Tucker, Oct 30, 2026):** identity boundaries at
  QUEER parties are not this exclusion. A dyke party saying "no cis
  men" (e.g. Hussy — "Anyone But Cis Dudes") is under the gay pride
  queer umbrella — "not the same thing at all." The exclusion targets
  couples-only / no-single-men admission policies in the
  straight/mixed scene. Also ruled: Privata's Pasties & Panties is
  excluded (founder said no, despite its current event page lacking
  the language — the series' older official listing states couples &
  single women only); Privata's Gang Bang counts as mixed crowd
  (single men admitted/ticketed; a ratio cap is not exclusion).
- **Recipe facts:** FetLife list view gives title/date/start/venue
  reliably; cost/age usually NOT in list view → UNVERIFIED/UNKNOWN.
  List view exposes no usable poster art → publish posterless, re-hunt
  later. Evidence URL used: https://fetlife.com/events/near (the list
  page facts were observed on). Sanctuary ICS does NOT carry every
  Sanctuary event — FetLife caught 10 real gaps, so this lane is a
  genuine complement, not a dupe of ICS.
- Doll Parts time discrepancy: catalog 1746 starts 19:00 (ICS) vs
  FetLife 20:00 — flagged, not auto-changed (ICS-doors pattern).

### Sanctuary Club — standing rule (Tucker, Nov 11, 2026)
- **ALL Sanctuary Club events are 21+ (ageRequirement 21_PLUS) and
  sex-positive (isSexPositive true)** — no exceptions, no per-event
  judgment call. New Sanctuary finds publish with both set by default.
- Applied catalog-wide Nov 11, 2026: all 65 upcoming LIVE Sanctuary
  events corrected (9 age UNVERIFIED → 21_PLUS; 60 isSexPositive
  false → true); post-run verification: 0 remaining on either field.
  Log: run-2026-11-11-sanctuary/CHANGE-LOG.md.
- **Poster lesson (Nov 11, 2026):** Sanctuary events published from ANY
  non-ICS source (e.g. the Oct 30 FetLife batch, ids 1776–1785) still
  need the detail-page poster pass IN THE SAME RUN — the FetLife batch
  skipped it and sat posterless for 12 days until Tucker flagged it.
  Recipe: ICS URL field gives each event's detail-page slug; the flyer
  is the detail page's og:image. Dated URLs (/events/<slug>/<date>/)
  redirect to the homepage for some events — the base slug URL is the
  reliable route. Nov 11 fill: 7 of 9 filled; 1778 (Boundless Rope) and
  1783 (PLA class) have NO event flyer anywhere official — their pages
  carry only the Sanctuary / PLA logos, which are never attached.
  Log: run-2026-11-11-sanctuary-posters/POSTER-LOG.md.

### Red Hanky Social (Eagle Portland) — recurrence + blind spot (Nov 12, 2026)
- **Every 2nd Thursday of the month, 19:30, Eagle Portland** — a
  non-play social for gay men in the FF community, hosted by Kevin
  Rohde (Mr. Portland Eagle Leather 2026) and the Red Hanky Social
  board. Official channels: Instagram @redhankysocial (bio states the
  recurrence and next date) + dated Partiful editions (all 19:30,
  Eagle). **It is NOT on Eagle's own venue calendar** — Eagle's site
  shows only Naked Pool on its Thursdays — so venue-feed sweeps will
  never see it; the host's IG/Partiful is the only lane. It ran
  unlisted until Tucker flagged it Nov 12, 2026 (that night's edition).
  Verify each month's edition against the host IG (themes vary:
  "Red Hanky 101", "Locktober", "Assets") before materializing.

### The Locker Room (Eagle Portland) — recurrence rule (Tucker, Oct 29, 2026)
- **Always the 4th Friday of the month, 21:00, Eagle Portland — except
  Christmas Eve** (the December edition doesn't run on the regular rule;
  Dec 2026's 4th Friday is Dec 25 — watch for announcements instead of
  materializing it).
- Catalog error found Oct 29: id 823 had Locker Room on Oct 30 (the 5th
  Friday). October's real edition was Oct 23. Oct 30 at Eagle is actually
  **Lost Boys: A Darkwave Disco** (Bro Hoe, 21:00–02:00, $5) — fix run:
  hide 823, create Lost Boys.
- Lesson: verify weekday-ordinal recurrences against the rule (4th
  Friday ≠ last Friday in five-Friday months).

### Full run (Nov 1, 2026) — window Nov 1–15: 20 creates LIVE, ids 1874–1893
- Run 25141df2; log: run-2026-11-01/PUBLISH-LOG.md. Lanes ran as 4 parallel
  discovery passes (venues / Facebook / Instagram / web-Eventbrite) with a
  central reconcile + fuzzy dedupe vs a LIVE+HIDDEN window index.
- **Create-endpoint receipt traps (both cost a dry-run 400, gate had approved):**
  (1) a candidate whose description is exactly "Unverified" gets no description
  receipt and the create rejects with "field-level evidence receipts are
  incomplete" — always write a factual description (synthesized only from the
  same source's verified fields is fine). (2) an `eventTypes: []` key on the
  event object demands an eventTypes evidence receipt — OMIT the key entirely
  when empty, exactly as Runs #1–#3 packages did.
- **Badlands API photo mapping is crossed:** the ManCandy (Nov 14) entry's
  photoUrl and the Honeypot (Nov 7) entry's photoUrl return the IDENTICAL file
  (MD5 cb02d6158feb247a41470d6c2cb4509f) — the Honeypot flyer. Never trust a
  Badlands photoUrl without a visual read; ManCandy published posterless.
  The same flyer PRINTS "9PM till 2AM", corroborating the API's 21:00 for
  Honeypot vs catalog 1668's 20:00 (post-DST pattern, founder decision still
  pending — flagged again, not auto-changed).
- **QT PDX Events handle RESOLVED: @qtpdxevents** (from a @slaughterspdx
  collab post by @lytablunt, Oct 21: "brought to you by @qtpdxevents").
  Host-watch list updated.
- **FriDaze (Stag) still unpinned:** @kimberlywestwood's posts confirm
  October Fridays only; no November dates, no current start time (only a
  Dec 1, 2025 reel: 9PM / $5). Stag Eventbrite still "Nothing planned",
  @stagpdx still 0 posts. Do not materialize from the stale pattern.
- **Sanctuary ICS is partial** (11 in-window events; misses items the
  FetLife lane previously caught). ICS alone is not full Sanctuary coverage.
- **Eagle Portland:** curl = Vercel JS checkpoint; browser text fetch served
  a 2026-09-22 crawl. Needs a live-browser pass for fresh verification.
- **Steam Kink Week:** dated weeks are real events (Nov 15–21, 2026); the
  public API renders a multi-day span as daily occurrences under one id.
  The /s/KINKWEEK flyer still prints October dates (10/20–10/24) — stale
  art, do not upload until Steam posts a November version.
- **Morning Wood flyer prints Mon–Thur** while The Grid says Mon–Fri;
  catalog pattern (incl. Fridays) follows the Grid. Flagged, not changed.
- **FetLife could not be swept from the subagent environment** (domain
  policy-blocked for fetch; lane needs the signed-in live browser). The
  Partiful signed-in invites page is likewise browser-only; public explore
  returns a login wall in text fetch.
- **IG CLI exposes no image URL field** in posts output — IG-sourced events
  publish posterless and the poster hunter must use the og:image route.

### Stag PDX — NEW WEBSITE (Nov 4, 2026) — PRIORITY SOURCE (Tucker)
- Tucker, Nov 4: "Stag has a new website absolutely priority bar to have on the schedule" — https://www.stagportland.com (Squarespace). This replaces Stag's dark lanes (@stagpdx IG returns 0 posts; Eventbrite "Nothing planned"). Sweep this site FIRST for Stag in every QSearch run.
- **Recipe:** the events collection is at /events — pull `https://www.stagportland.com/events?format=json` and read `items`/`upcoming` (Squarespace JSON; structured dates + posters). Pages: /home, /dancers, /drag-brunch, /vip, /contact (sitemap.xml lists all). Venue facts from the site: Stag PDX, 317 NW Broadway, Portland, OR 97209; 21+ venue; open 7 nights (7pm–2:30am Mon–Thu, 4pm–2:30am Fri–Sun); dancers perform nightly 9pm–2:30am (venue programming, not listable events).
- **Nov 4 state:** /events collection exists but is EMPTY (0 items) — the site just launched; recheck every run, items will land there first. /drag-brunch ("Broadway's Finest Drag Brunch", hosted by Kherry O'Kay, all-you-can-eat buffet + complimentary mimosa, 21+) states NO day or time — still unpinned, do NOT materialize from the old Saturday pattern (catalog ids 502–505 are past Aug–Oct Saturdays) until the site or its events feed states a day/time.
- **Amateur Night (from /dancers + its official flyer, read by eye Nov 4):** every Tuesday 21:00–02:30, hosted by Devlin Lynn Phoenixx, dancer check-in 8pm, 21+. CAUTION: the page's crawler-generated image alt text said "9 PM to 11:30 PM" — WRONG; the flyer itself prints 9PM–2:30AM. Flyer art wins over alt text, always read the flyer. Publish run Nov 4 (occurrences Nov 10/17/24 + Dec 1) — see run-2026-11-04/PUBLISH-LOG.md.
- FriDaze (Kimberly Westwood, Fridays) is NOT on the new site as of Nov 4 — still unpinned; watch /events.

### FetLife reconciliation (Nov 1, 2026) — browser sweep Nov 1–8, 40 candidates
- Browser sweep (main-chat lane) produced `run-2026-11-01/fetlife-candidates-nov1-8.md`;
  reconciliation run 68906bed (log: `run-2026-11-01/fetlife-publish-log.md`).
  Because the Oct 30 sweep's window ran to Nov 30, **36 of 40 were already LIVE**
  (Oct 30 batches + venue lanes) — expect heavy duplication whenever a FetLife
  sweep overlaps a previously published window; dedupe on date+time+venue with
  fuzzy title match (series retitles are common: "OMEN T-Dance" = catalog
  "OMEN Event" 1691).
- **1 new publish: 1894 Rose City Cigar Social (Nov 8, McMenamins Greater
  Trumps)** — a Sunday series distinct from the Thursday Midweek Cigar Social.
- FemDom Bootcamp Nov 5 occurrence = HIDDEN 1807 (exclusion applied Oct 30) —
  the sweep will keep re-surfacing it; check HIDDEN before treating as new.
- Pasties & Panties Nov 7 = HIDDEN 1818 under the founder's series ruling;
  this occurrence's own text is pricing/limit only, but a hidden occurrence is
  never re-created or unhidden by a reconcile pass.
- HB PDX Suspension Series: occurrences #5 (1797) and #6 (1824) are LIVE from
  Oct 30. Recorded judgment (Nov 1): as new candidates the series fails the
  public-event gate (application-only 10-week cohort; Studio 201 has no public
  street address) — NOT an exclusion case. Retroactive hiding is a founder
  decision, flagged for Tucker, not taken.
- Pre-existing LIVE duplicate pairs noticed: 851/1799 (FANGBANG) and
  1417/1811 (PDX Rated) — earlier-lane dupes awaiting a dedupe decision.

### Full redo with coverage repair (Nov 12, 2026) — run 30e589d4, 242 created (ids 1913–2154)
- **Admission is an ENUM, not free text:** UNKNOWN / FREE / TICKETED / DOOR_FEE /
  SUGGESTED_DONATION. Free-text prices ("$10 min day pass", "FREE (no cover)")
  fail the gate with invalidCandidateFields=['admission'] — 81 candidates
  blocked on first pass. Map: priced + ticketUrl → TICKETED; priced, no ticket
  page → DOOR_FEE; donation wording → SUGGESTED_DONATION; keep the exact price
  text in the description.
- **Badlands API is silent on ALL Fridays** (Nov 13/20/27, Dec 4/11 pulled
  empty) — Fridays Are A Drag occurrences past Nov 13 need another lane
  (host/venue IG); never invent them from the weekly pattern alone.
- **New ledger series:** Drag Camp-ionship — Saturdays at Camp Bar, 5-week
  competition run launched Nov 7, 2026 (host @angelica_dvil). Game On —
  Tuesdays at Camp Bar (host @2025th; check the host's monthly schedule
  graphic, the venue feed alone missed editions). Back 2 Emo — new home
  CC Slaughters from Nov 13, 2026 (host @back2emo). Y2GAY — monthly-ish
  Thirsty-Thursday special at Badlands (host @angeldarkoo). Emo Dance Party —
  monthly-ish Tuesdays at Badlands after Dragula (host @hootishi).
  Stomptown — dances at Norse Hall AND Escape (stomptown.org/dances is the
  reliable feed). Nu-Glitter — Wednesdays open mic at Peacock (series page
  spans Jun 2026–Mar 2027) + occasional Saturday headliner shows.
  Bad Girls Munch — 2nd Tuesdays at Escape (pdxbadgirls.net/events states
  the rule; Dec 8, 2026 published rule-derived).
- **Sanctuary detail-page og:image traps:** Pickup Play Mixer and Sensation
  Play pages carry ONLY the Sanctuary logo (never attach); Get Clowny's
  og:image is a "Clown Scale" meme chart, not event art (never attach).
  Verified-good art this run: Unconventional Dynamics, BDSM 101 banner
  ("Third Sundays 2 p.m."), Mix It Up ("Mix It up W/ Kandy!!").
- **Gate duplicate net works:** 9 FetLife candidates were blocked as
  duplicates of ids 852 + 1841–1865 (a catalog batch whose titles differ
  enough to beat fuzzy matching — Partner Dance 101, Pony Munch, Sub Rosa
  Social, Zero Proof Munch, ABDL Munch, Belle Supper Club, Close-In Munch,
  Rose City Rope Munch). Trust the gate's duplicateEventId over local fuzzy.
- **Still open after this run:** Game Bang Dec 9 missing; Naked Karaoke
  Nov 27 unverified; MELANGE Nov 29 held (no date-specific TicketTomato
  page yet); Hawks Nerd Night has NO start time anywhere and a conflicted
  recurrence rule (host @kinkucation_wildside vs Hawks graphic 11/15+11/22);
  PDX Collar Guard unverifiable via text fetch (Angular SPA) — needs a
  rendered/IG pass; IG connector returns 0 posts for @pdxpah,
  @pinkponiespdx, @rosecourtpdx, @blackandbeyondthebinary, @tranzguyspdx,
  @oregonstateleather (not a clean negative).

### PDX Collar Guard — official site recipe (Nov 12, 2026)
- PDX Collar Guard events are listed at **https://www.pdxcollarguard.org/events?tab=nextup**
  — readable ONLY in a rendered browser (text fetch sees an Angular JS shell;
  this was the Nov 12 full redo's one named blind spot, closed the same night
  by a rendered-browser pass).
- Series: **Fetch & Frolic** (Steam Portland), **Gear Night** (CC Slaughters,
  last-Saturday pattern — Nov 28, Dec 26, 2026), **RUFF: The Mosh** (CC
  Slaughters), plus cross-listed **PDX-PAH Awoo! Social** and **Onyxpnw
  Come Together** at Eagle Portland. Sweep this page every run.

### Fix-up pass (Nov 12, 2026, evening) — run 474bc9b2, log: run-2026-11-12-full/FIXES-LOG.md
- **Held-item rulings resolved by dedupe, not creation:** HB PDX Suspension
  #7 (id 1840) and #8 (id 1860), and both sold-out Shibari 101 sessions
  (ids 1852/1858), were ALREADY LIVE from the Oct 30 FetLife batch — the full
  redo's reconcile had missed all four (same title-matching gap as the
  1841–1865 duplicate batch). Always dedupe held items against the full
  catalog before treating a founder "publish" ruling as new work.
- **Sanctuary ICS December coverage is sparse:** the feed spans into 2027 but
  emits instances on only ~14 December days — absence from the ICS in
  December is weak evidence. Game Bang Dec 9: no ICS instance, base slug
  /events/game-bang/ 404s → reported as an unverified series break, not
  materialized from the Wednesday pattern. Naked Karaoke Nov 27: no ICS
  instance and FEMPOWER affirmatively holds its Friday 20:00 slot that week
  → series break, not invented.
- **Queeriosity (QSC) poster trap:** the Queer Social Club event page's
  Squarespace image for the LCC trivia night is a generic Box Social interior
  photo (lamp + tent cards), NOT event art — published posterless (id 2155).
  Same family as the Sanctuary logo rule: visually read every candidate
  poster, even from an official listing page.
- GAYMENIGHT lock retry (Nov 12, founder re-approved via options widget):
  ids 677/681/688/693 STILL reject with "409: patch would overwrite locked
  human fields" — the unblock remains Tucker's Admin action (unlock
  description + posterImageUrl on those 4 records).

### Discovery sweep (Nov 13, 2026) — run 9d9dd4f8, 46 created (ids 2160–2205)

- **Partiful invites URL (Nov 13, 2026):** partiful.com/invites returns 404 even signed in; the pending-invitations list lives at partiful.com/events?category=invites ("Invites N" filter on the events page). Use that URL for the invites lane.
- **Sanctuary's own site calendar is NOT complete either:** the venue lane's
  pdxsanctuary.com calendar comparison showed Nov 19–26 "covered," but the
  FetLife lane caught 9 real Sanctuary events absent from BOTH the site
  calendar comparison and the catalog (Speedy Spanking Nov 19, Rope Burn
  Nov 20, Kink 101 + Erotic Art Show + Laughrodisiac Nov 21, Erotic Arts
  Social + Bondage Nov 22, Friendsgiving + Misfit-Thanksgiving Nov 26) —
  published ids 2197–2205. FetLife is a genuine complement for Sanctuary,
  not a dupe of any venue feed. Never call Sanctuary covered on the site
  calendar alone.
- **Directory upcomingEvents join UNDERCOUNTS:** /api/directory showed
  Peacock with 1 upcoming event vs 6+ in the catalog (Nova, Escape, Star
  Theater similar). Directory diffs must be cross-checked against catalog
  venueName counts; a zero in the directory is directory state, not proof
  of no programming. (Sports Bra / Scandals East / Holocene showing zero
  directory upcoming remains a watch item, not a finding.)
- **Fetch & Frolic time conflict (standing):** catalog id 2156 starts
  20:00 (PDX Collar Guard, the organizer). Steam's own flyer says
  22:00–04:00. Organizer vs venue disagreement — flagged, NOT
  auto-corrected (Naked Pool precedent). Newest official word wins only
  when a source updates; neither has yet.
- **Pre-existing duplicate pairs from the Nov 12 batches (flagged for a
  founder dedupe decision, never unilaterally hidden):** Portland
  Polyamory 2nd Friday Nov 13 (1833 vs 1915, venue string differs),
  PDX Nerd Munch Nov 18 (1845 vs 1950) and Nov 25 (1864 vs 2004),
  PNW Kinky Parents Munch Nov 22 (1859 vs 1986), FISHNET Nov 13
  (1836 vs 1919), Deviance Nov 19/20 (840 vs 1851).
- **Nerd Night (Hawks) hold RESOLVED:** the host (@kinkucation_wildside)
  published a dated + timed post (Nov 1: "Sunday, November 15th... starts
  at 6 PM") plus a standing-events post ("every 3rd Sunday, 6 PM") —
  Nov 15 published as id 2173. The Nov 22 occurrence stays UNPUBLISHED:
  Hawks' schedule graphic listed 11/22, conflicting with the host's
  3rd-Sunday rule; no start time problem remains, only the date conflict.
- **New ledger series (from this run):** Trans-UHH-Licious — Thursdays
  21:00, CC Slaughters (venue site; host Sheniqua Volt); Keyed Up
  Karaoke! — Sundays 19:00, CC Slaughters (live band); Black Magic —
  2nd Saturdays 21:00, CC Slaughters ($10, Safari Productions); The
  Velvet Cabaret — 4th Fridays 21:00 (doors 20:00), CC Slaughters ($10,
  Rogue Storm Safari; date rule from the venue's own reel); T4T Social —
  Fridays 19:00, Workers Tap (QSC); Trans Mixer Happy Hour — Mondays
  16:00, Peacock PDX (QSC); Queeraoke with Sam Cole — Sundays 19:00,
  Peacock PDX (QSC); Hardwear — Kink Week Friday 22:00, Steam (dated
  flyer). Series that lapsed and were restored this run: T4T Social
  (lapsed after Oct 2), Queeraoke (after Sep 27), Sapphic Speed Dating
  (after Sep 30; Dec 9 published).
- **Still open after this run:** Drag Camp-ionship Nov 28 + Dec 5
  (series-derived only — Camp homepage lists no dated Saturday special;
  needs a dated host/venue source; host @angelica_dvil posts confirmed
  only Nov 14/21); Fridays Are A Drag Nov 20 + 27 (Badlands API silent
  on Fridays, no other lane produced them); Game Bang Dec 9 (no
  evidence either way); MELANGE Nov 29 (TicketTomato still shows only
  the Oct 25 edition); Game On at Statera Cellars Nov 19 (host schedule
  graphic gives the date but NO start time — held); Bad Girls Full Moon
  Friday Nov 20 (Eventbrite listing not located — venue/time unconfirmed);
  Portland's Pettiest Drag Competition Nov 27 (FB gives no venue; the
  RAE series' home is Escape Bar & Grill per its Oct 23 Eventbrite page,
  but the Nov 27 edition's venue is not date-confirmed — held, do not
  guess); Queer Rope Nov 22 at "The Nest" (no address sourced — held);
  Skyhook Queer Climbing Night (QSC date conflicts with its own
  "third Friday" copy — held); Sinister Affair Nov 13 (QSC-listed only,
  no explicit queer framing in its copy — held for founder judgment).

### Founder rulings + Badlands deep dive (Nov 13, 2026, midday)

- **Hawks default (Tucker, Nov 13):** "Hawks by default, pretty much just
  the same thing every week." Do not hold Hawks editions over pattern
  noise — the venue's programming recurs. A host's own stated recurrence
  still governs its series: Nerd Night is every **3rd Sunday, 18:00**
  (host @kinkucation_wildside's standing-events post), so after Nov 15
  the next occurrence is Dec 20 — NOT Nov 22 (the Hawks November
  graphic's 11/22 mention does not override the host's pattern).
- **Flyer-time conflict rule (Tucker, Nov 13):** when the organizer's
  stated start time conflicts with the time printed on the flyer, post
  the flyer as-is and set the listing's start to the ORGANIZER's stated
  time. Applied: Fetch & Frolic (id 2156) — Collar Guard says 8 PM
  start; the Steam flyer (pup-hood art, "10:00 PM – 4:00 AM", DJ Pup
  Sam) is the poster. A flyer's printed time never vetoes the poster.
- **Badlands API real address:** the calendar API lives at
  https://badlands-events.badlandsportland.workers.dev/api/calendar?from=&to=
  (a Cloudflare Worker). badlandsportland.com/api/calendar returns the
  Squarespace 404 page — do not pull there. The website itself is a
  3-page brochure (/home, /menu, /calendar) whose /calendar collection
  is EMPTY (itemCount 0); all dated data is in the Worker API.
- **Badlands Friday silence reconfirmed first-hand (Nov 13):** a fresh
  pull Nov 13→Dec 31 returned 88 events, ZERO on Fridays, spanning to
  Dec 30. Fridays Are A Drag is the only Friday programming; the series
  runs unbroken in the catalog Aug 14 → Nov 13 at 21:30 pre-DST /
  20:30 post-DST. Extended on that evidence: Nov 20, Nov 27, Dec 4,
  Dec 11, Dec 18 at 20:30, posterless (per-date art differs; hunter
  follows). **Dec 25 (Christmas Day) NOT published — founder call.**
- **Badlands December gap (the deep-dive catch):** prior sweeps only
  pulled the API to ~Dec 10–13; the catalog was missing every API event
  Dec 13–30 (32 events, incl. a new Sunday series, Gagged Queer Comedy
  Night, Dec 13 19:00). Future Badlands pulls go to the API's full
  horizon (it serves ~7 weeks out), never a 14-day window.
- **Game Bang Nov 25 title:** Sanctuary's official calendar titles it
  "Game Bang: Thanksgiving Eve"; the pattern-seeded catalog title
  "Game Bang: Blanket Forts" (id 790) loses — newest official venue
  source wins, even though FetLife agreed with the seeded title. Title
  is lock-held on 790, so the retitle goes through the signed-in Admin
  UI (same route as the GAYMENIGHT swap).

### Poster hunt (Nov 13, 2026) — run 9434ba37, 60 filled, log: poster-hunt-2026-11-13/POSTER-LOG.md
- **Steam Portland flyer matrix (NEW standing recipe):** Steam's events
  page (steamportland.com/events) embeds a per-series flyer map —
  steamportland.com/s/<NAME> (KINKWEEK, HARDWEAR, BLACKOUT, MORNING-WOOD,
  THIRST-QUENCHER, RADICAL-RUBDOWN, HUMP-DAY, SIN-CITY, AFTERGLOW,
  FETCH-FROLIC, CUMUNION). Squarespace file URLs: fetch with curl -L
  (302 to static1.squarespace.com). Each is the venue's official series
  flyer; download and visually read before attaching, same as Badlands.
  This filled 39 Steam listings in one pass (the whole Nov 23–Dec 11
  Morning Wood / Thirst Quencher runs included).
- **FetLife-only Sanctuary events may have NO venue page at all:** the
  nine Nov 13 FetLife finds (ids 2197–2205) are absent from Sanctuary's
  ICS feed AND its site calendar — no detail pages exist, so the
  detail-page og:image recipe has nothing to read. Verified via the live
  browser (pdxsanctuary.com is curl-000 from the VM and text-fetch
  fails; the browser CAN load it, but cannot read og:image meta tags —
  moot when no page exists). Do not borrow a series flyer from another
  date's edition (Speed Spanking "Second Fridays" art ≠ the Thu Nov 19
  Spank Week edition). These stay posterless unless the organizer posts
  art (IG/FetLife) closer to the date.
- **Eventbrite listing images can be a PAST edition's dated flyer:**
  id 2177's og:image reads "Thursday, Aug. 20th" for a Nov 19 show —
  visually read every ticket-page og:image's printed date before
  attaching; a dated flyer for a different date is another event's art.
- **Venue-vs-FetLife conflict flagged:** Sanctuary's site shows Thu
  Nov 26 as "Closed for the Holiday"; FetLife lists Friendsgiving +
  Misfit-Thanksgiving at Sanctuary that day (ids 2204/2205, published
  from FetLife). For the next discovery sweep to weigh, not resolved here.

### Discovery sweep (Nov 15, 2026) — run f0d23b27, 37 created (ids 2244–2280)
- **fieldSources MUST be canonical URLs only:** 9 candidates (FB/IG/web lanes) were blocked on the first publish pass with "400: evidence requires field, safe sourceUrl, and checkedAt" because their fieldSources values were prose descriptions of the source instead of URLs. Prose goes in `notes`; every fieldSources value is the bare canonical source URL (facebook.com/events/<id>/, instagram.com/p/<id>/, the ticket page, the QSC listing). All 9 re-ran clean after normalization in the same run.
- **Badlands Friday silence did NOT reproduce (Nov 15):** a fresh API pull to Dec 15 returned Fridays Are A Drag Nov 13–Dec 11 — but at **21:30**, while the catalog's Nov 13 series extensions (ids 2238–2242) sit at **20:30** (the post-DST catalog pattern). Standing conflict, flagged not auto-changed. Do not assume the API is Friday-silent; check Fridays every pull. Also: Sat Dec 12 returns nothing in API or catalog — unconfirmed hole.
- **Q Center is a first-class venue source:** catalog Q Center coverage had silently stopped after Nov 5 (except 3 specials from other lanes); pdxqcenter.org/events carried 15 dated in-window events (The Dojo Sundays, Sereni-Tea, QTM Support, Boxing w/ Chris Saturdays, TDOR Vigil, Petsgiving…) — all published Nov 15 (ids 2244–2258). Sweep the Q Center events page every run like any registry venue; its December occurrences are the same gap family (check Dec in the next sweep). **DETAIL-PAGE RULE (Tucker, Nov 23, 2026): every Q Center event has a follow-up/detail page carrying the fuller "About this event" info — the listing page alone misses it. Never publish or update a Q Center event from the index alone: open each event's own detail page and take date/time, description, and any venue/room detail from there. The rendered-browser pass this source needs must open the detail pages, not just the index.**
- **Sanctuary Thanksgiving week (Nov 26) — attribution now in doubt:** Sanctuary's site lists NOTHING Nov 22–28 (no "Closed for the Holiday" notice anymore), and this run's FetLife read shows the three Nov 26 Friendsgiving listings with NO venue named. Catalog ids 2204/2205 (Friendsgiving + Misfit-Thanksgiving at Sanctuary, published Nov 13 from FetLife) may carry a wrong venue — flagged for a founder decision, NOT changed in this run.
- **Sanctuary dated instance pages outrank the calendar list:** Game Bang Dec 9 was confirmed on the dated page /events/game-bang-neon-nights-3/2026-12-09/ (Neon Nights, 20:00–01:00, $10/$12) and published as id 2259, even though the site's calendar list shows no events at all Dec 6–11. Same family as the Nov 13 FetLife catch: absence from Sanctuary's list/ICS is weak evidence; a dated instance page is a full official source.
- **Bye, Bye, Bi (new series):** comedy trivia game show, Social Good Place (4511 SE Main St), 3rd Wednesdays 19:00, organizer Molly S. Callahan — launched Nov 18 (id 2266, with poster). Time conflict resolved toward 19:00: the official flyer prints "7 PM 3RD WEDNESDAYS STARTING 11/18," outweighing the venue site's 18:00. Ledger: next Dec 16.
- **Partiful invites state (Nov 15):** NO unanswered invitations. Friendraiser Nov 19 = Going (already catalog 2194); Angel & Billy birthday Dec 12 = On the list / Approved (moved from Nov 13's pending-approval state).

### Discovery sweep (Nov 17, 2026) — run f49cb145, 32 created (ids 2282–2313)
- **Sanctuary ICS works with `curl -L`:** bare curl returns HTTP 301 with an empty body; `curl -L` → 200, 519 VEVENTs. ICS times are local wall times stored as UTC — read as printed, do not convert. (Supersedes the Nov 15 "ICS unreachable" note.)
- **Create gate rejects accentColor:** including accentColor in a create candidate fails with "candidate contains unsupported event fields" — the field exists on catalog records but the agent create path does not accept it yet. Hold computed flyer-accent tokens in the run's publish-set.json notes for the accent backfill; do not include the field in creates.
- **candidateKey must be a canonical slug:** keys built from raw titles containing &, @, /, +, parentheses, or colons fail the gate with "candidate gate requires a canonical candidateKey and no eventId" (6 Q Center candidates blocked on the first pass). Slugify to [a-z0-9-] only, format `candidate:<lane>:<date>:<slug>`.
- **FriDaze RESOLVED (Nov 17, 2026):** host @kimberlywestwood's standing post states FriDaze at Stag PDX, every Friday, 21:00, $5 cover, hosted by Kimberly Michelle Westwood. Nov 20 + 27 published (ids 2305/2306, 21:00–02:30 per Stag's house pattern). The long-standing FriDaze gap is closed; sweep her posts for schedule changes.
- **Drag Camp-ionship official dates:** Camp Bar's own series list (@campbarpdx, Nov 10) is Nov 7 / 14 / 21, Dec 5, Dec 12 — **Nov 28 is NOT a series date** (Thanksgiving weekend skip). Dec 5 + 12 published (2309/2310); the series ends Dec 12. Never materialize a Nov 28 edition.
- **Browser Sanctuary-site reads need corroboration:** the Nov 17 rendered read of pdxsanctuary.com/events listed six events absent from both the ICS and the catalog (Come to Jesus Nov 20, Kink & Coffee Nov 21, Sapphic Saturday Nov 22, Hedonist's Haven Nov 22, PDX Munch Nov 18, Speed Spanking Dec 11), several overlapping ICS-confirmed slots, and its weekday labels were shifted by one day. Held as unverified — verify each against its detail page or the ICS before publishing; a site-list read alone is not enough when it conflicts with the feed.
- **Q Center December gap closed:** 13 occurrences Dec 1–15 published from pdxqcenter.org/events (ids 2282–2288, 2291–2296). Keep sweeping the Q Center page a full month out every run — its coverage lapses silently.
- **Portland Kinky Dating Mixer venue conflict (Nov 17) — RESOLVED Nov 19, 2026:** catalog id 1966 (Nov 20) said Brujos Brewing; a signed-in FetLife re-read Nov 19 (12:46 AM PT) confirms the organizer moved it to Alchemy Cider Co, 818 Southeast Ankeny Street (announced in a discussion post ~Nov 17, after high RSVP volume; Brujos appears nowhere on the current listing). Date/time unchanged (Fri Nov 20, 19:00–21:00), hosts Hersheykissess + pdxkinkydating. The event is NOT queer-specific (full description + host profiles read: a general inclusive kink mixer series) — it stays KINK + mixed-crowd per the Oct 30 ruling; Tucker noted Nov 19 he leans "not super queer" on it. Catalog correction (venue/address/coords/description) pending his explicit yes because venueName/address are lockedFields and the item was founder-held.
- **FetLife extra monitoring + mixed labels (Tucker, Nov 19, 2026) — superseded same night by the scratch rule below:** FetLife-sourced events need EXTRA MONITORING and clear MIXED labels. FetLife listings are editable after publication — including venue changes announced only in discussion posts (the 1966 failure: published Nov 13 with the then-correct venue, organizer moved it ~Nov 17, the Nov 17 sweep caught the new venue but filed it as a conflict instead of fixing it). Rules from now on: (1) every sweep re-reads FetLife-sourced LIVE upcoming events — listing fields AND discussion posts — for venue/time/cancellation changes, on a tighter cadence than other lanes; a post-publish organizer change is applied to the catalog in the same run (unlocking locked fields for the correction when the organizer's own current listing is the source), never just flagged; (2) every FetLife-sourced non-queer event carries the explicit mixed-crowd label (KINK type + the standard "Kink / mixed crowd — listed for the kink community; not an LGBTQ+ event" note) — verify the label is present on every FetLife-sourced listing in the sweep report.
- **FetLife SCRATCH rule (Tucker, Nov 19, 2026 — supersedes the Oct 30 mixed-crowd FetLife rule and the monitoring entry above for FetLife-sourced events) — EXECUTED Nov 19, run b7e8dc87, report run-2026-11-19-fetlife-scratch/REPORT.md:** "Scratch all Fetlife events unless it says its clear that its lgbtq and public on it." Every FetLife-sourced event is hidden/never published UNLESS its own FetLife listing clearly states it is LGBTQ and public. Result: 67 FetLife-sourced LIVE candidates → 53 HIDDEN (incl. 1966; Oct 30 mixed batches; Nov 13 Sanctuary FetLife stubs 2197–2205 — their ICS-lane counterparts are separate records, untouched), 8 KEPT (1780, 1975, 1997, 2001, 2195, 2272, 2274, 2275 — explicit LGBTQ + public in the listing), 6 HELD resolved Nov 19 — ALL KEPT under Tucker's standing approvals stated that night: "Sanctuary always approved" (277/278/280 + 1784/1785) and "Leather Alliance always approved" (1783). Treat both as standing approvals in future runs. Catalog 1,719 → 1,666. Every hide has a rollback token in the report. New FetLife finds: LGBTQ-clear + public or do not publish. Mixed labels/monitoring continue for mixed events from NON-FetLife lanes. Address audit from the same run: 9 LIVE upcoming events lack an address (Eagle Naked Pool 1651–1657; kept FetLife 1997, 2272) — flagged, not yet actioned.
- **Posterless fallback flyer (Tucker, Nov 19, 2026):** an event with no flyer gets a designed fallback — place image centered, slightly blurred, black treatment, the SVG logo dead center sized to look good (FetLife logo for FetLife events; the place's logo otherwise). Fallback art is a display treatment, never recorded as a found poster.
- **All events need an address (Tucker, Nov 19, 2026):** no address, no publish — for every lane. Address-less LIVE events get audited and reported; the Oct 30 no-street-address approvals are grandfathered no longer.
- **Venue-address inheritance is common sense (Tucker, Nov 19, 2026):** when an event's venue matches a directory business, the event's address IS that business's address — fill it automatically in the same run, never report it as a gap. The trigger: the Eagle Portland "Naked Pool" series (ids 1651–1657) sat address-less while venueName literally read "Eagle Portland" and the directory carried 835 N Lombard St. Tucker: "that's common sense should never be a thing." A venue-matched event with an empty address is a defect to fix on sight in every sweep. (Filled + verified Nov 19, run 050faa9b; full-catalog scan found no other venue-matched gaps.)
- **Private venues: "Register for address" (Tucker, Nov 19, 2026):** private/vetted spaces do not publish a street address — leave it off even if discoverable — and the event's address line reads "Register for address" (address reaches attendees through registration/vetting). Applied to Dyke Underground (2272, Sub Rosa PDX — private dungeon, host shares address 24h prior) and Hummer! (1997, Meetrack — address behind its ticket form). A venue does NOT need a directory entry for its events to list. Sub Rosa PDX should exist as a directory venue (private, no street address).
- **HUSSY flag reconfirmed:** a browser FetLife read mechanically flagged HUSSY (Nov 27, Peacock) under the couples-only/no-single-men exclusion because its text says "No cis men." Tucker's Oct 30 ruling governs: Hussy is queer, an identity boundary is not the exclusion. It stays LIVE (id 2016). Do not re-flag.
- **Sanctuary Nov 26 attribution:** the venue site now affirmatively shows "Closed for the Holiday" on Nov 26 and FetLife places Misfit-Thanksgiving at The-Jobsite (Clatskanie) with Friendsgiving listings showing no venue — catalog ids 2204/2205 (Sanctuary attribution, published Nov 13 from FetLife) look wrong. Founder decision still pending; do not change unilaterally.

### Poster hunt (Nov 17, 2026, evening) — run a850b707, 5 filled, log: poster-hunt-2026-11-17/POSTER-LOG.md
- **Quiet Kitten Dec 1 (id 2312) DID have a detail page:** ICS URL /events/sensation-play-2/ carries a real dated flyer ("Quiet Kitten Hours, Sanctuary Tues 12/01/2026, Doors 7pm, $15") — filled. The task's "logo-only pages are never attached" caution stands, but always fetch the og:image before assuming logo-only.
- **FB event covers are edition-specific traps even for series:** Bold Book Club's Dec 1 FB event (884844767395547) reuses a JULY dated flyer ("Tues., July 7") as its cover — visually read the printed date on every FB cover, same as Eventbrite og:images (id 2177 family). Illusions' FB cover is a text-free generic organizer banner — not art.
- **IG media-understanding can verify a flyer the file route can't deliver:** Drag & Draw's full flyer (Dec 3, Social Good Place) is confirmed by media-understanding, but the only retrievable file is a text-free center crop — a verified-but-undeliverable poster stays unfilled; re-hunt only if a full file surfaces.

### Poster-hunt repair (Nov 18, 2026) — sibling-art verification rules
- The Sept-28 audit poster mapping is CROSSED for at least one file: cc-12.png, carried by id 462 "Hump Wednesday," actually reads "AMATEUR NIGHT." Never trust a sibling file by its catalog title — read the image content and match title + venue + weekday + time off the flyer itself before reusing series art on a posterless occurrence.
- Title-only sibling matching is dangerous: the catalog's "Karaoke" art (id 550) is Eagle Portland's, not Camp Bar's; Sapphic Sunday's sibling poster (id 1692) is the Sanctuary logo itself; T4T Social's sibling is a dated Oct 2 personal send-off; Stomptown's sibling is the October schedule; Game On's sibling is dated "Starting July 21st"; Champagne's sibling is seasonal "March ~ September." All rejected Nov 18.
- Verified-clean undated series art (content read Nov 18, filled across occurrences): Trans-UHH-Licious, Queens Keys, Keyed Up Karaoke, Rager, Monday Gameday graphic, Black Magic, Untapped Trivia, Traitors Watch Party (Camp), Laughrodisiac, Dyke Nite. Hump Wednesday has NO verified art in the catalog.

### Discovery sweep (Nov 19, 2026) — run 0314c64f, 39 created (ids 2315–2353)
- **Bad Girls Full Moon Friday venue SOLVED:** pdxbadgirls.net/events (the org's own site) states Full Moon Fridays are held at the **McMenamins Kennedy School, 7–8:30pm**, on the Friday closest to the full moon. Combined with the dated @pdxbadgirls IG post (Nov 20, "Romance", $3 Eventbrite), the Nov 20 edition published as id 2316. The long-standing FMF hold (open since Nov 13) is closed; sweep pdxbadgirls.net/events every run.
- **Repeat Behavior venue is no longer secret for the Kevin Aviance edition:** the host (@repeatbehaviorparty, new watch) announced Nov 13 that the edition moved to **Fri Dec 18, 22:00–03:00, 525 SE Pine Street, Portland, OR 97214** — published as id 2352. The Oct 24 "intentionally undisclosed" status applies to the original Nov 6 listing only; always re-check the host account for reschedule/venue drops.
- **Sanctuary ICS failed again from the VM (curl 000)** after working Nov 17 — the feed is intermittent from this environment. The rendered site pass (browser) covered Sanctuary fully this run and confirmed: site affirmatively shows **"Closed for the Holiday" on Thu Nov 26**; the FetLife Friendsgiving listings that day name NO Portland venue (Misfit-Thanksgiving is at The-Jobsite, Clatskanie). Catalog ids 2204/2205 were already HIDDEN by the Nov 19 FetLife scratch, so no wrong-venue LIVE record remains.
- **Eagle Portland's own site DOES carry a full dated calendar** (eagleportland.com/events, rendered pass) running months out — it verified every in-window Eagle series this run and exposed the Dec 14 Brief Encounters + Dec 19 Undergear gaps. Sweep it every run; it outranks the old "no dated calendar" assumption.
- **Darcelle's own events page is current** (darcellexv.com/events, rendered) — Fri/Sat shows + Sunday brunches; catalog coverage had silently stopped Dec 13 (Dec 18/19 published, ids 2348/2349). The Tribe REST pull returned an empty redirect stub this run.
- **FetLife scratch rule applied cleanly:** of 7 LGBTQ-clear + public FetLife candidates, 5 were already LIVE (FUNGEON 739, ENM 1780, TranscenDance 731, Pass the Gayvy 2274, HUSSY 2016, Leatherdyke Social 2175 at Eagle — six counting Leatherdyke); only Vortex T4Tea (Nov 21, The Vortex) was new (id 2315). The Dating Mixer's current venue is confirmed Alchemy Cider Co, 818 SE Ankeny St (its catalog record 1966 is HIDDEN under the scratch rule, so no correction was applied). Beefcake Walk (Nov 21, Darcelle) has NO explicit LGBTQ wording on its FetLife listing and is absent from Darcelle's own page — not published under the scratch rule even though catalog id 2091 carries it from an earlier lane.
- **Get Clowny! (id 1961, Thu Nov 19, Sanctuary) is marked POSTPONED on Sanctuary's own site** — flagged for a founder decision, not changed in this run.
- **Steam flyer-vs-Grid note stands:** the Morning Wood flyer prints Mon–Thu while the Grid + catalog run Mon–Fri (flagged Nov 1); this run's Dec 14–18 Morning Wood creates follow the Grid/catalog pattern.
- **QSC December series silence:** Queer Social Club's own feed lists no December dates for T4T Social, Trans Mixer Happy Hour, or Queeraoke — those December occurrences stay pattern-only holds (not published), same posture as Nov 15/17.
- **Duplicate pair noticed (not created by this run):** TWIRL Nov 21 at Star Theater appears twice LIVE (ids 1980 + 2314) — flagged for a dedupe decision.
- **Pre-existing catalog title typo noticed:** id 278 reads "Jiffy Kink: Merry Kinksman" vs the venue's "Merry Kinksmas" — flagged, not changed (likely lock-held).

### Discovery sweep (Nov 21, 2026) — run b54ea502, 17 created (ids 2354–2370), 3 hidden
- **Artwork-review gate mechanism (NEW — the repair for the Nov 19 ticket-page rule):** the decision gate now returns `uncheckedArtworkPages` for posterless candidates and blocks publication until every source/ticket page carries an evidence receipt with field exactly `artwork-review`, sourceUrl = the page URL, observedValue `no-official-image`, authorityLevel primary (server/qsearch/publication.ts: `latest.get("artwork-review|" + url)`). This check did NOT exist in the Nov 19 sweep's gate responses — it is the enforcement of Tucker's Nov 19 "check the ticket page before publishing posterless" rule. Record the receipt only after actually checking the page for official art. A candidate WITH a posterImageUrl skips the check entirely. record-media does NOT satisfy it (tried — fingerprints are URL-pair hashes, gate ignores them).
- **checkedAt cannot be future-dated** (evidence endpoint 400s) — always stamp with the real current America/Los_Angeles time.
- **Cancellations caught by re-checks:** Camp Nonsense's own site retitled Princegiving (id 1974) "CANCELLED — rescheduled date TBD"; the FetLife re-read caught Vortex T4Tea's "Event Canceled" (2315 hidden; its duplicate 1975 "Deva's T 4 Tea" hidden with it). Same-day re-checks of tonight's events pay off — keep doing them.
- **Landline Dance flyer recipe:** the host's IG post og:image (via facebookexternalhit UA) was the exact flyer (11/29, Swan Dive, 6–9pm, $5–15) — downloaded, visually read, uploaded at publish (id 2361). Swan Dive = 727 SE Grand Ave, Portland, OR 97214.
- **QSC-only November finds published** (Masculinity is a Drag 2367, Steam Masquerade 2368, Dyke Access 2369) under the one-source founder gate; QSC's December calendar is still unchecked (its /events-portland crawl showed November only).
- **Steam December horizon:** site states Kink Week Dec 20–26; published as one multi-day record (2370) posterless — the /s/KINKWEEK flyer has carried stale dated art before.

### Health check (Nov 21, 2026) — biweekly apparatus audit, run qsearch-health-check
- **Lanes verified FUNCTIONING to purpose:** Partiful (browser, signed in
  as Tucker Casey — Explore Portland returns events, LGBTQ search returns
  Portland results, no login wall); FetLife (browser, signed in as
  Tucker_PDMax — /events/near readable, 20 listings in first view);
  Facebook Discover (results for queer/drag/pride/trans/gay/burlesque/
  karaoke; 0 for lesbian/bisexual/poly — the known sparse pattern, not an
  outage); Instagram connector (posts return for all 11 core venue
  handles); Zaylist admin pairing (read-only `control` + `events` calls
  succeed; latest run = Nov 21 poster hunt, complete).
- **Partiful invites surface changed:** partiful.com/events?category=invites
  now renders the Home view — no separate invites list or pending-invite
  count is shown. No pending invites were visible this check (consistent
  with Nov 15's "no unanswered invitations"), but the invites lane can no
  longer be read as its own list; read pending invites off the events/
  home view and say so in run reports.
- **IG zero-post blind spots (named, never clean negatives):** @stagpdx
  (official handle, standing), @pdxpah, @pinkponiespdx, @rosecourtpdx,
  @blackandbeyondthebinary, @tranzguyspdx, @oregonstateleather — all
  returned 0 again. Working alternates confirmed this check:
  @pdxpahofficial RETURNS posts (PDX PAH's active lane — sweep it
  alongside @pdxpah), @oslcontest returns posts (Oregon State Leather's
  active lane), @pdxbadgirls returns posts.
- **Sources:** Badlands worker API healthy (79 events Nov 21–Dec 31,
  Fridays present — Friday silence did NOT reproduce). Sanctuary site +
  Sugar Calendar ICS healthy (521 VEVENTs; URL now in standing recipes
  above). Steam flyer matrix healthy (direct /s/<NAME> URLs 200:
  KINKWEEK, BLACKOUT, MORNING-WOOD, FETCH-FROLIC). Q Center events page
  loads. Darcelle events page loads. PDX Collar Guard rendered page
  healthy (12 upcoming cards; text fetch still sees only the Angular
  shell — rendered browser only, as recorded). Eagle Portland curl still
  hits the Vercel checkpoint (rendered browser is the lane, as recorded).
  CC Slaughters curl gets 406 Mod_Security on both domains — curl is
  blocked, the site is not dead (the Nov 21 sweep's crawl of
  ccslaughterspdx.com worked); use the browser/crawl lane, not curl.
  Hawks Squarespace JSON still stale (0 collection items — known since
  Oct 24; Hawks coverage = @hawkspdx IG + host lanes + catalog pattern).
  **Stag /events?format=json still returns 0 items / 0 upcoming** —
  empty since the site's Nov 4 launch; Stag coverage remains the host
  lanes (FriDaze via @kimberlywestwood) + Amateur Night standing rule.
  Name it as an empty source in run reports, not a failure.
- **Recurrence-ledger gaps found (for the NEXT discovery sweep — this
  audit publishes nothing):** (1) Fetch & Frolic — Collar Guard lists
  Thu Dec 24, 20:00–04:00 at Steam Portland; NOT in catalog (only the
  past Nov 19 occurrence, id 2156). (2) Gear Night Dec 26 and RUFF
  Dec 27 (CC Slaughters) on Collar Guard's page; catalog holds only
  Nov 28 / Nov 29. (3) Come Together (Onyxpnw, Eagle) Dec 24; catalog
  holds only Nov 26. (4) Emo Dance Party (Badlands, monthly-ish
  Tuesdays, host @hootishi) — last catalog occurrence Nov 17 (id 1949),
  no upcoming occurrence and no end evidence; check the host/Badlands
  lanes for the December date before materializing. Awoo! Social
  Dec 18 IS covered (id 820). All other ledger series checked
  (Red Hanky, Locker Room — Dec 25 exception applies, GAYMENIGHT,
  Drag Camp-ionship, Game On, Back 2 Emo, Y2GAY, Nu-Glitter, Bad Girls
  Munch, MELANGE, Trans-UHH-Licious, Keyed Up Karaoke, Black Magic,
  Velvet Cabaret, T4T Social, Trans Mixer, Queeraoke, Nerd Night
  Dec 20, Fridays Are A Drag, Game Bang, FriDaze, Bye Bye Bi) have
  upcoming catalog occurrences.
- **Standing machinery verified:** poster hunter ran after the most
  recent sweep (one-shot cron fired Nov 21 10:45 PT; admin run
  74673b66 complete, 7 posters applied to ids 2362–2369). Sign-up log
  gained 3 entries from Nov 21 sweeps; /api/home/stats returns
  newUsers90Days=66.
- **Protocol fixes applied this check (verified by re-reading the
  edited files):** MUSE-AS-QSEARCH.md — stale "no production write
  path" limit replaced with the paired/publishing status; stale
  "IG handles still need confirming" limit replaced with the resolved
  table + @stagpdx blind spot; step 6 "poster pass (alternate runs)"
  replaced with the Oct 30 poster-hunter-after-every-run rule; new
  step 8 records the sign-up count check as part of every run (it was
  in source-memory and the log but missing from the protocol).
  host-watch-list.md — stale "QT PDX handle unresolved" note corrected;
  @pdxpahofficial upgraded from UNVERIFIED to a returns-posts lane.

### Discovery sweep (Nov 21, 2026, evening) — run 9f5a516a, 6 created (ids 2371–2376)
- **Health-check gaps closed:** the four Collar Guard December dates from the health check published from the rendered pdxcollarguard.org/events?tab=nextup page: Fetch & Frolic Dec 24 (2371, with the organizer's fetch___frolic.jpg flyer — undated series art, visually read), Come Together Dec 24 (2372, with come_together.jpg — undated, "every fourth Thursday, starts at 7PM", Eagle 835 N Lombard), Gear Night Dec 26 (2373), RUFF Dec 27 (2374, posterless).
- **Collar Guard default.jpg is the org's logo shield, NOT event art** — it is the image the site serves for Gear Night and RUFF cards. Never attach it. Gear Night Dec 26 instead carries the verified undated series art from the Nov 28 record (2158) ("GEAR — a monthly kink party, CC Slaughters, every fourth Saturday", re-read this run).
- **Emo Dance Party recurrence PINNED: every 3rd Tuesday, 22:00–02:00, Badlands** — host @hootishi's own reel states "@emo.dance.party every 3rd Tuesday at @badlandspdx", and catalog occurrences Sep 15 / Oct 20 / Nov 17 are all 3rd Tuesdays. Dec 15 published (2375) from the rule; Badlands' calendar API does NOT carry the series. The Nov 17 flyer is dated/cast-specific — never reuse on another edition. @emo.dance.party returns 0 posts via the connector (blind spot).
- **Queer + Trans Community Yoga gap:** the weekly Friday series was catalogued only through Nov 20; Nov 27 published (2376) from its official FB event (1228644922022584) with the series' undated flyer (from record 2261, re-read). Check the Friday series every run — it lapses silently like Q Center.

### Discovery sweep (Nov 23, 2026) — run d5739e0f, 6 created (ids 2377–2382)
- **All 6 creates came from the Facebook lane** (venue/IG/FetLife/Partiful lanes produced zero new): Illusions Nov 27 series gap (2377, posterless — FB cover is a text-free generic organizer banner, same trap as Nov 15), Bar Cala Dec 6 (2378, exact cover), Breakside Holiday Drag Brunch Dec 6 (2379) AND Dec 20 (2380) — the flyer prints both dates ("December 6 + 20, Show 11:30am, Tickets $20") and the description confirms two dates; a flyer printing a second date IS a full official source for that date. Queer Magic Holiday Craft Fair Dec 6 (2381, exact cover). Sweet Tica Holi-Gay Market Nov 28 (2382, posterless — the only art is a vendor's pop-up graphic embedding the market flyer; a vendor's art is not the event's poster).
- **FB event og:image route works with the facebookexternalhit UA on facebook.com/events/<id>/** — returns lookaside.fbsbx.com crawler media; download and visually read before attaching (Illusions = generic banner; the other three were exact).
- **Q Center Dec 16–23 is the run's one open ledger gap:** pdxqcenter.org/events is Wix/JS-rendered and text fetch returns no dated listings; catalog coverage ends Dec 15. NOT materialized from pattern — next run needs a rendered-browser pass on the Q Center page (Boxing Sat Dec 19, Dojo Sun Dec 20, Sereni-Tea fall in that span).
- **Red Hanky December date check:** the 2nd Thursday of Dec 2026 is Dec 10 (catalog 1910 ✓). An early task note said Dec 11 — Dec 11 is a Friday (Eagle runs Classic Cock that night). Always compute the ordinal weekday, never trust a noted date.
- **Partiful home view this run:** exactly 2 upcoming events (Birthday Orgy Dec 12 = Approved/On the list; Brooklyn Speed-Friending Dec 1 = Interested). No unanswered invitations. Portland Explore produced no clearly-LGBTQ public event in-window.
- **Sign-up count:** newUsers90Days 68 (Nov 23), up 2 from 66 (Nov 21).

- **IG full-flyer recovery (Nov 23, 2026, poster hunt 1040):** a post page's og:image is a CENTER-CROPPED square (stp=c…a_dst-jpg_e35_s640x640) whose signature cannot be re-signed for other sizes — never upload the og crop of a tall flyer. The full uncropped image is at `https://www.instagram.com/p/<code>/media/?size=l` (1080-wide, works with a plain Mozilla UA). Used for fills 2174 (@feralkickz Nov 28 market) and 2307 (@drag_and_draw_pdx Dec 3).
- **Sweet Tica Events (Nov 23, 2026):** organizer of the Sweet Tica Holi-Gay Market (Allgood Brewing). No standalone flyer or social presence found (FB/web/IG all empty); the only art in circulation is vendor Aura Archive's pop-up graphic embedding the market flyer — never attach the vendor graphic as the market's poster.
- **Sanctuary detail-page og traps (Nov 23, 2026):** Kandy Coated Karaoke's page og:image is a flyer dated 9/8/26 (September edition) — always READ the Sanctuary og flyer for its printed date before attaching to a later occurrence; Sapphic Sunday's og is the generic Sanctuary banner; Anal Touch's og is a text-free stock photo.
- **Q Center follow-up pages (Tucker, Nov 23, 2026 — fix written same day per the repair rule):** Tucker flagged that Q Center events each have a follow-up page with more event info ("about this event") and that info gets missed. Root cause: sweeps read the /events index (and fetch can't even render it). Standing fix, also in the Q Center recipe bullet above: every Q Center event is read on its own detail page before publishing; the Dec 16–23 gap pass must be a rendered-browser pass that opens detail pages (Boxing Dec 19, The Dojo Dec 20, Sereni-Tea).
- **DETAIL-PAGE AUDIT (Nov 23, 2026, Tucker's "see if there are similar misses") — full audit at ~/workspace/qsearch-new/detail-page-audit-2026-11-23.md. Standing rules from it:**
  1. **Eagle Portland — detail pages are the source of record.** Per-event pages (/events/<slug>?date=…) carry doors/until times, structured start/end, About text, dress code, prices; index cards are NOT enough. Catalog damage: 40/47 upcoming admission UNKNOWN, 16/47 no end time. **WORST MISS: Naked Pool ids 1652–1657 sit at 14:00 with no end, admission UNKNOWN, description "Unverified" — Eagle's own detail page says Doors 9PM–12AM (21:00–00:00) with full About text. The 14:00 is the bar's business opening hour scraped as an event time — wrong by 7 hours on six LIVE records. Correct all six from the detail pages (this also closes the long-standing "Naked Pool time conflict" flag: the venue's current surfaces agree with each other; the catalog was the outlier).**
  2. **Sanctuary — detail pages are an INFO source, not just a poster source.** They carry full descriptions, doors times, cover prices; the ICS VEVENT DESCRIPTION field carries the same and is under-used. Only 5/64 upcoming records have a >300-char description; 15 admission UNKNOWN. Every Sanctuary publish/update pulls description/doors/cover from the detail page or ICS description in the same pass.
  3. **QSC (Queer Social Club) — /events-portland/<slug> detail pages are the source:** 21+ tags, ticket links, doors-vs-show splits, full descriptions. The Nov 21 QSC finds (2367–2369) went up off the calendar index as stubs (age UNVERIFIED, no ticketUrl) — backfill from their detail pages.
  4. **Darcelle XV — publish from the dated /event/<slug>/<date>/ pages** (doors, cover, 21+, exact range). Index-built records 2115/2116 and 2133/2134 are 119-char stubs with ticketUrl pointing at the index — backfill. The detail page is also the antidote to the Tribe 08:00 stamp artifact.
  5. **Eventbrite — capture fields in the same read as og:image:** admission and age come off the event page when it's opened for art (11/17 EB-ticketed upcoming are admission UNKNOWN, 9 age UNVERIFIED).
  6. **Partiful / Collar Guard — browser-lane confirmations still owed:** Red Hanky ids 1909–1912 lack end times + admission on all four editions (check the Partiful event pages); Collar Guard capture is uneven (2371 complete vs 2372 no end + age UNVERIFIED) — confirm whether Collar Guard cards expand to detail pages in the rendered lane.
  - **NOT detail-page cases:** Badlands has no per-event pages (API description empty on 29/30 — the under-used rich source is FLYER TEXT, e.g. printed prices; flyer-mining is that fix family). CC Slaughters and Camp Bar single-page listings ARE the detail level. Steam flyers are the listings by design. Stag's Drag Brunch day/time is missing at the source too. Hawks has no live detail layer. Facebook is already a detail-read lane.
