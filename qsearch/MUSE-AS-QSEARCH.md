# Muse as QSearch — operating plan (Oct 24, 2026)

Tucker designated Muse as the new QSearch, specifically because Muse is
connected to his Facebook and Instagram through his own linked accounts.
This replaces the *research/discovery* role of QSearch 2.0. It keeps every
founder rule. It does not run, restore, or depend on the archived QSEARCH
scraper or its fine-tuned model.

Source material reconciled Oct 24:
- The pasted full QSearch trace (Foundation intent vs. current code)
- `QSearch-Process-and-Sources.md` from the uploaded zip (same trace, concise)
- Tucker's founder rule (2026-09-25, revised Oct 4) from the QSearch rules chat
- Live checks run Oct 24, 2026 (below)

## Rules that do NOT change

- **Publication threshold (founder rule):** publish a current, non-canceled
  LGBTQ+ event when ONE current official source verifies title, exact
  venue/location, and start date/time. All other details may say Unverified.
  Never require two matching sources. Newest official update wins conflicts.
- **Trusted dedicated venues** (their official calendars establish LGBTQ+
  relevance for every event there): Sanctuary Club, Eagle Portland, Badlands,
  The Sports Bra, Q Center, Steam Portland, Camp Bar PDX, Darcelle XV
  Showplace, CC Slaughters, Hawks PDX, Scandals East (827 NE Alberta St only;
  the old downtown/Harvey Milk location is blocked). Sports Bra is never
  downgraded; its retired direct scraper stays disabled — research it via
  official site / Facebook / Instagram / ticket pages.
- Everywhere else, event-specific LGBTQ+ evidence is required. Organizer
  identity can establish relevance, never location. No venue from a shared
  word / partial keyword match.
- **Age:** never infer 21+ from "bar/pub/alcohol." Explicit event rule first,
  then an official venue policy that covers the event's hours. Sports Bra is
  all-ages until 10pm unless the event says otherwise.
- **Posters are evidence, not identity:** event-specific official art only,
  no shared venue banners across unrelated events, no borrowing across
  venues, honest empty poster beats a wrong one. Re-hunt every run — posters
  appear closer to the event date.
- **Detail pages are the source of record (Tucker, Nov 23, 2026):** an
  index, calendar, or API list read is DISCOVERY only. Wherever a source has
  per-event detail/follow-up pages, the event is read on its own detail page
  before it is published or updated — start AND end time, description,
  admission/price, age, and ticket link come from the detail page, never
  from the index alone. This holds for EVERY source in EVERY run, and for
  any venue or source added later: a new source's recipe in
  source-memory.md must state whether it has detail pages and how they are
  reached BEFORE its first publish. (Learned Nov 23, 2026: Q Center's
  follow-up pages carry the "About this event" info the index misses; the
  same-day audit found the same depth at Eagle Portland, Sanctuary, QSC,
  and Darcelle — and Naked Pool sat wrong by 7 hours on six live records
  because only an index-level read had ever been taken.)
- **Protections stay:** true duplicates, past/canceled, wrong-identity, and
  human claim/lock fields are never overridden.
- Provenance classes stay distinct: verified structured fact /
  organizer-supplied / community-contributed / AI synthesis / stale-uncertain.
  An AI summary never overwrites a source field.

## What is genuinely better now

### 1. Facebook is a real lane, not a signed-out hope
Old QSearch: Facebook/Instagram "may be used only through an existing
signed-in browser session; if signed out or blocked, report it" — and the
Oct 4 test run reported exactly that gap.
New: Muse reads Facebook through Tucker's linked account (verified live
Oct 24 as Tucker Casey). Available:
- `events search --scope discover` — public events near Portland by keyword,
  location, date window, with description, venue/address, start/end,
  going/interested counts, permalink
- `events search --scope connected` — events he's going to / invited to / hosting
- `events details` — full record incl. online/ticket URL
- `groups search` + `groups posts` — community groups as discovery sources
- `post read` / comments / reactions on any canonical post URL
- Pages he manages, saved items, friends feed

### 2. Instagram is a real lane, not a blocked assist
Old QSearch code: no unrestricted scraping; public OG preview often blocked;
caption-only parsing at 0.25–0.45 confidence; flyer vision preferred but
usually unavailable.
New: Muse reads Instagram through Tucker's linked accounts (verified live
Oct 24: @tucker_pdmax professional, @tucker_c_pnw). Available:
- `posts --username <venue/organizer>` — recent posts/reels WITH captions and
  media for any public handle, paginated
- `post --url / --id` — single post record
- `feed --variant following` — what the accounts he follows are posting
- `stories-tray`, `saved-posts`, `media-understanding` (stored image
  descriptions for flyer reading), comments/likers
That turns IG from "evidence a human must paste in" into a scheduled source:
venue flyers are read directly, at full caption+image fidelity.

### 3. One run, three-way cross-check, on demand
Old: nightly 3am batch + a separate Codex automation on his Mac, alternating
event days / poster days, 2,125 saved source paths of which 0.4% were
reached in the latest production run.
New: a single Muse run can pull the venue feed (ICS/Tribe/Squarespace/Wix/
Eventbrite organizer), the Facebook Event, and the Instagram flyer for the
same event, reconcile against live `www.zaylist.com/api/events`, and report
— when Tucker asks, not only at 3am. The alternating event/poster cadence
can stay as the scheduled rhythm.

### 4. The Foundation's other rooms are reachable now
Old implementation was Events-only; Housing/Gigs/Spaces/Directory answer
layer was never built.
Facebook groups already surface them (found live Oct 24):
- Portland Queer Housing (~20,000 members) — Housing room
- Portland Queer Gift 'n Get (~8,000 members) — gifting / gigs
- PDX kink events group — events discovery beyond venue calendars
These are discovery sources, not canonical truth — same provenance rules.

## Proof pass — live, Oct 24, 2026 (~8:50pm PT)

Connections:
- Facebook: linked, Tucker Casey
- Instagram: linked, @tucker_pdmax + @tucker_c_pnw

Zaylist baseline (live `/api/events`):
- 542 upcoming LIVE events on/after Oct 24
- **102 of them (19%) have no poster** — the current poster-hunt backlog

Facebook Discover, Portland, Oct 24–Nov 7 — NEW, not on Zaylist (0 matches
in the live catalog for venue/title):
1. **Queer + Trans Community Yoga** — Lighthouse Community Yoga PDX,
   9161 SE Foster Rd — Fri Oct 30, 7:15–8:30pm, donation-based
   https://www.facebook.com/events/1228644932022583/
2. **Bold Book Club: Gender Queer** — Bold Coffee & Books,
   1755 SW Jefferson St — Tue Nov 3, 2:00–3:00pm
   https://www.facebook.com/events/884844760728881/
3. **Camas Pride: Stephen King Drag Brunch** — Sun Oct 25, 12:00pm
   (Camas, WA — metro-adjacent; location text not returned, verify before
   treating as in-scope)

Each FB record already carries the founder rule's three facts (title,
venue/address, start date/time) from an official event page.

Instagram direct reads (recent posts returned, captions + media):
- Hawks PDX @hawkspdx — 8
- Eagle Portland @eagleportland — 8
- Sanctuary @pdxsanctuary — 8
- Darcelle XV @darcellexvshowplace — 7
- Camp Bar PDX @campbarpdx — 8
Guessed handles that returned ZERO (wrong handle or no posts — resolve
before relying on them): @badlandsportland, @stagpdx, @cc_slaughterspdx

Facebook keyword caveat: `queer` found events, `LGBTQ` found none, `drag`
found 1 — Discover is sparse per keyword. A real run needs a keyword set
(queer, drag, pride, lesbian, trans, gay, burlesque, karaoke, **bisexual,
poly** — last two added by Tucker Oct 24) + connected events +
groups + the IG following feed, not a single query.

## Honest limits

- **Production write path IS connected here (paired Oct 26, 2026).**
  Muse publishes through the scoped client in this workspace
  (`qsearch-agent-api.mjs`) under the founder rule and Tucker's Oct 30
  "push right away" rule; hundreds of events have published through it
  since (catalog ids into the 2370s by Nov 21, 2026). The Oct 24
  "no write path / prepare candidates for approval" posture above is
  superseded history, kept only as the proof-pass record. (Health-check
  correction, Nov 21, 2026.)
- IG venue handles are RESOLVED (see the handle table in
  source-memory.md): Badlands @badlandspdx, CC Slaughters
  @slaughterspdx, Sports Bra @thesportsbrapdx, Q Center @qcenter,
  Steam @steamportland, Scandals East @scandals_pdx all return posts.
  Stag's @stagpdx is the official handle but the connector returns
  0 posts for it — a standing blind spot, never a clean negative;
  Stag coverage runs through stagportland.com + host lanes.
- Facebook Discover coverage is keyword-sensitive (see caveat above).

## Coverage safeguard — the Red Hanky rule (Nov 12, 2026)

Red Hanky Social (2nd Thursdays, Eagle Portland, hosted by Kevin
Rohde) ran unlisted for months: it is NOT on the venue's calendar and
announces only on the host's own Instagram + Partiful, and the host
wasn't watched. Tucker, Nov 12: "make sure it doesn't happen again
and doesn't happen for other events at any location." Three standing
countermeasures, part of EVERY run from now on:

1. **Host-discovery pass (run step 4d).** Discovery is not only feeds
   and watch lists — every run actively hunts for hosts it doesn't
   know yet: (a) trusted venues' IG collab posts, tagged posts, and
   monthly schedule graphics, which name guest-host nights the venue
   web calendars omit; (b) the Zaylist directory's groups, diffed
   against the catalog for programming with no upcoming events;
   (c) Tucker's top Partiful mutuals, checked as potential hosts.
   Any recurring host found gets added to host-watch-list.md AND
   swept in the same run — a host is never left for "next time."
2. **Recurrence ledger.** Every recurring series gets a written
   recurrence rule in source-memory.md (pattern, venue, time, source
   — e.g. Locker Room, GAYMENIGHT, Red Hanky Social). Each run
   verifies every ledger series has occurrences covering the run
   window; a series whose catalog occurrences have lapsed while its
   pattern says it continues is a GAP to fix in that run, not a
   curiosity. A series is only retired from the ledger on evidence
   it ended (host/venue statement), never by silence.
3. **Lane-coverage reporting.** Every run report states explicitly
   which lanes and watch-list hosts were actually swept and which
   were skipped/broken and why. "No finds" is only meaningful next
   to the list of places actually looked; an unswept lane is
   reported as unswept, never implied complete.
4. **Every fix becomes part of the repair.** Tucker, Nov 12: "Every
   time we find a fix it needs rewritten into the repair so it
   doesn't happen again." Whenever any run or one-off fix corrects
   a failure — a missed source, a wrong field mapping, a dedupe
   gap, a stale or sparse feed, a poster trap, a blind lane — the
   fix is written into this protocol or source-memory.md as a
   standing rule IN THE SAME RUN. A fix that lives only in a run
   report is not done; the run is not complete until the repair
   contains it, and the run report names where each fix was
   written.

## Signed-out rule (Tucker, Nov 12, 2026)

If ANY signed-in lane or source is found signed out (Partiful,
FetLife, Facebook, Instagram, the Zaylist admin pairing, anything
the work depends on), Tucker is told IMMEDIATELY and prominently —
in chat, as its own message, not buried in a run report — so he can
sign back in. His logins are saved in the Secure Vault (fetlife.com,
zaylist.com, github.com, openai.com) and the browser's login flow
uses them; a dead session is a notification, never a silent skip.
A run whose lane was signed out reports that lane as UNSWEPT and
names the sign-in as the blocker.

## A normal Muse-QSearch run

1. Read live Zaylist catalog; snapshot upcoming LIVE/HIDDEN, poster gaps.
2. Trusted-venue lane: the 11 registry feeds from the handoff doc
   (Badlands API, Sanctuary ICS, Eagle Wix, Darcelle Tribe, Hawks
   Squarespace, Stag + Living Room Wines Eventbrite organizers, Camp Bar,
   CC Slaughters, Camp TRC, Peacock generic).
3. Facebook lane: Discover across the keyword set for the window,
   connected events, and posts in the known queer PDX groups.
4. Instagram lane: recent posts for every confirmed venue/organizer handle
   + following feed; flyer images read for exact-event poster matches.
4b. Partiful lane (added Nov 1, 2026, at Tucker's direction; scope
   restated Nov 21, 2026): the browser session stays signed in as Tucker
   Casey — check Partiful during every run. Partiful is a DISCOVERY
   lane, not just an invites check: actively sweep it for Portland
   public LGBTQ events (Explore/search, hosts, mutuals' public events).
   Public events go through the normal founder gate and publish; when a
   Partiful event publishes, take its poster from the event page's cover
   art in the same run (Partiful is also a poster source for the poster
   hunter). Private / invite-only events are NEVER published to Zaylist;
   instead, report Tucker's pending private invitations to him directly
   (title, host, date/time, venue, RSVP status) as part of the run
   report.
   BROWSER-ONLY: the signed-in invites page cannot be reached by fetch
   tools (login wall). This lane is run by the main-chat agent through
   the live browser, never delegated to a fetch-only worker.
4c. FetLife lane (browser-only, standing): fetlife.com is policy-blocked
   for fetch tools and the lane needs Tucker's signed-in session
   (Tucker_PDMax), so it is ALWAYS run by the main-chat agent through
   the live browser as part of every QSearch run — never delegated to a
   fetch-only worker. Scope: public events at named Portland venues,
   ignore private events; KINK tagging and the couples-only /
   no-single-men exclusion per the standing rules. (This routing rule
   was made explicit Nov 1, 2026, after a delegated run could not sweep
   FetLife at all.)
4d. Host-discovery pass (added Nov 12, 2026 — the Red Hanky rule; see
   "Coverage safeguard" above): trusted venues' IG collab/tagged
   posts + monthly schedule graphics; directory groups diffed vs.
   catalog; Tucker's top Partiful mutuals checked as hosts. New
   recurring hosts are added to host-watch-list.md and swept in the
   SAME run. Then verify the source-memory recurrence ledger: every
   ledger series must have catalog occurrences covering the window.
5. Reconcile: dedupe vs. catalog, founder-rule check (3 facts, relevance,
   current, not canceled), newest-official wins, flag conflicts.
6. Poster hunter (after EVERY run — Tucker, Oct 30, 2026; this supersedes
   the old "alternate runs" poster pass): whoever runs a QSearch run
   re-arms the one-shot `qsearch-poster-hunter` cron for ~30 minutes
   after that run completes. The hunter works the no-poster list in
   date order, event page → venue site → ticket page → FB Event → IG
   post.
6b. Flyer accent pass (added Nov 16, 2026, at Tucker's direction): every
   event QSearch publishes or fills a poster for gets its accent token
   computed from the flyer with tools/flyer_accent.py — saturation-
   weighted majority color snapped to the nearest of the 10 calibrated
   tokens (Blue #0066FF, Cyan #00FFFF, Magenta #FF1FA0, Acid Yellow
   #D4FF00, Violet #7B00FF, Safety Orange #FF7B00, Red #FF0000, Acid
   Green #2BFF00, Afterz Yellow #FFDD00, Coral #FF5F6D). Verdict "unset"
   (no chromatic majority) leaves the event on its default accent —
   never force a match. The token drives the card edge bloom and
   accents. Until the events accentColor field ships with the Eventz
   build, computed values are held in tools/accent-backfill.json;
   once the field is live, set it in the same publish/change call as
   the poster. Known soft cases: tan/brown majorities snap to Coral;
   very dark flyers can land Blue over Violet.
7. Report in plain language: coverage — INCLUDING the lane-coverage
   statement required by the Red Hanky rule (lanes + watch-list hosts
   actually swept; anything skipped/broken named as such) — FB/IG
   status, sources checked, new events found with evidence URLs,
   poster gains, conflicts, uncertain items. Founder-gated finds
   publish immediately under the Oct 30 rule; the report comes after.
8. Sign-up count (every run — Tucker, Nov 21, 2026): read
   `GET https://www.zaylist.com/api/home/stats` and append the
   `newUsers90Days` reading, dated, to
   ~/workspace/goals/1-000-zaylist-downloads-in-90-days/hidden_files/signup-count-log.md.
   The count check rides along with QSearch runs; there is no separate
   daily schedule for it.
