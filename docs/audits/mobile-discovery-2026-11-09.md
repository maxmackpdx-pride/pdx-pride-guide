# Mobile discovery audit: evidence and remaining gates
Date: 2026-11-09. Scope: Eventz, Placez, Boardz, Needz, Mapz.
Branch: audit/mobile-discovery-2026-11-09. Separate from Compiler PR #69.

## Current live observations
These were observed through the live cloud browser at a desktop viewport. They are not mobile acceptance results.

1. Eventz: searched karaoke, selected Free, opened Keyed Up Karaoke and closed it. Search and Free filter persisted in the URL, and focus returned to the event opener. The expanded card exposed date/time, venue, Free tag and external Event Link. Availability beyond the listing was not verified.
2. Placez: searched Badlands, selected Bars & Clubs, opened and closed details. Search/category persisted and focus returned to View details. The detail exposed both Website and Directions. Exact scroll restoration was not numerically measured in this manual pass.
3. Boardz: searched DJ, selected Available for work, opened DJ in Portland and closed it. Search/intent persisted and focus returned to the opener. Posting and server-persisted bookmarks were not exercised. Multiple save controls had the same accessible name, Save, with no post title.
4. Needz: Food & Groceries expanded; ZIP 97215 returned two food options with addresses, listed hours, phone links, Food Finder links and a retrieval timestamp. Eligibility completeness and SNAP flow remain to be checked.
5. Mapz: this browser reported WebGL2 unavailable and displayed the existing list/card fallback and discovery drawer. The first-visit world chooser dismissed normally. This does not establish normal WebGL startup speed or recovery timing.

## Focused repair
Boardz save/unsave accessible names now include the post title, for small and large Zine faces and the shared base face. Heart visuals, event propagation, API writes, gating and persistence semantics are unchanged. An isolated browser test checks six distinct labels, Save/Unsave state, saved count and that saving does not expand the post.

## Reproducible evidence collection
script/mobile-discovery-audit.mjs exercises the live site at 390px and 430px:
- search, filter, open, close, exact URL retention, focus and scroll return for Eventz/Placez/Boardz;
- close-button viewport visibility;
- Placez website/directions;
- Needz 97215 food results and SNAP text capture;
- Mapz host-mounted timing, WebGL fallback classification, simulated map-entry failure and retry.

The live run blocks non-GET/HEAD/OPTIONS requests, uses anonymous fresh browser contexts and never posts, saves a live bookmark, sends messages or submits login credentials. Screenshots and report.json are uploaded as mobile-discovery-evidence by the dedicated workflow. A failed selector or changed live listing must be distinguished from a product defect before changing production.

## Validation status
- Both new JavaScript test scripts passed local node --check.
- Full dependency installation, TypeScript, isolated Boardz test and live mobile run are not yet confirmed.
- No physical iPhone/Safari results.
- No visual audit completion claim until mobile screenshots are downloaded and inspected.
- No merge or production deployment from this audit.
- Mapz source/assets/backend behavior and Compiler settings are untouched.

## Remaining work
Inspect the new mobile evidence, fix reproducible high-impact failures, then rerun the affected cases. Add authenticated posting/save persistence coverage using isolated fixtures before claiming those flows reliable. Verify event availability presentation and Needz eligibility against their existing source fields; do not invent availability or eligibility information. Preserve current designs and newer master changes.
