# Zaylist card system

**Built locally** on `codex/yes-coach-card-system`. Open the [four-surface viewer](http://127.0.0.1:5117/dev/card-system). It loads the real local routes in a 402 × 874 frame. Select any of the four front sizes to open the card. The viewer prefers Yes Coach, then uses a public event from the local catalog if that listing is unavailable. The other tabs open the actual map drawers.

| State | Evidence |
| --- | --- |
| Demo | The owner-private ChatGPT Site holds the [original four surfaces](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/) and the [interactive Afterz and Ridez demo](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/demo/). All three original capture files match PR #121. |
| Built | Local React 19, React Compiler and Tailwind 4.3.5 build, exercised in Chrome with the application API and local database. |
| Deployed to zaylist.com | No. The feature branch is local. |
| Live-verified on zaylist.com | No. Production served as a read-only reference for the previous card and navigation. |

## What you can see

[Four local surfaces](card-system-captures/four-surfaces.png)

| Surface | Original capture | Local build |
| --- | --- | --- |
| Yes Coach | [Captured demo](card-system-captures/original-card.png) | [Info](card-system-captures/event-info.png) · [Pinned header](card-system-captures/event-pinned.png) · [Tickets](card-system-captures/event-tickets.png) · [Mizzed](card-system-captures/mizzed-upcoming.png) · [Ridez](card-system-captures/ridez.png) · [Pregame](card-system-captures/pregame.png) |
| Events + Placez | [Captured demo](card-system-captures/original-events-placez.png) | [Placez map](card-system-captures/events-placez.png) · [Event filters](card-system-captures/events-filter.png) |
| Outzide | [Captured demo](card-system-captures/original-outzide.png) | [Area filter](card-system-captures/outzide.png) · [Filtered destination](card-system-captures/outzide-result.png) |
| Afterz | [Captured demo](card-system-captures/original-afterz.png) | [Invitation](card-system-captures/afterz.png) · [Collapsed grip](card-system-captures/afterz-grip.png) |

## The 32 ledger decisions

| Ask | Outcome in this build |
| --- | --- |
| 1 | The viewer opens on the real Yes Coach event's front cards. Both original blend options led to the single selected expanded face. |
| 2 | Retained the restored design. The separate v2 rebuild had been rejected. |
| 3 | Info owns pricing and the ticket action. A complete presale/door price line moves into its two rows. The header owns when and where, the Maps tab owns location, and More owns Mizzed and Gigz. The gate checks the displayed event facts against the API. |
| 4 | Event interest is one record across the board, front cards and expanded footer. The heart sits bottom right. The drawer minis open on tap and carry neither heart nor share. |
| 5 | Cards and drawer countdowns share one formatter. It shows days and hours, then hours and minutes, then minutes. Map holograms keep total hours and minutes. The operated hologram read [01H 00M](card-system-captures/hologram.png). |
| 6 | Operated the PR #121 stage and measured 376 × 697.97px. At 402 × 874 the new card uses those dimensions with the 14px outline measured on the current live event card. Its contents lay out in the sheet's natural coordinate system. The shell centers between the real header and dock. |
| 7 | Attached action drawers have exact-token side and bottom edges and an open top seam. The containing sheet caps their height at 347px. Long content scrolls internally. A grip or close button collapses them. |
| 8 | The rejected icons-only comparison supplied no replacement buttons. The four captured tile controls remain the starting geometry. |
| 9 | Neither unselected full-card concept became a new surface. The implemented composition follows the later owner ruling. |
| 10 | FlyerBoard, Events and Hub open the shared card. Opening grows from the source, closing shrinks, and Escape also works during entry. |
| 11 | The chosen top-right poster treatment supersedes the early traveling-poster experiment. Tapping the thumbnail opens the original artwork in a full-viewport dialog. |
| 12 | Read the Foundation preset and operated all nine playground pieces. Shared materials implement the landed glass. Applied it to floating surfaces. Most card content, filters and minis are solid. |
| 13 | The title, metadata and thumbnail have distinct space. Interior controls have restrained edges. The later continuous entrance replaces this entry's two-stage pause. |
| 14 | The solid event shell keeps the current product's 1px accent edge, dark outer keyline and two soft halos. Its flat interior uses inset content blocks. Every new glass surface uses its own locked token edge. |
| 15 | The discarded landing-top concepts stay in the design history. The retained design supplies the layout. |
| 16 | Honored the narrowed top-only exploration. The rest of the card continues to use the captured tile and tab ordering. |
| 17 | The unselected top alternatives led to no additional shipped variant. |
| 18 | Ridez, Afterz, Directions and Website keep their order and square icon geometry. The six tabs are Feed, Info, Maps, People, More and Nearby. Info opens first. Arrows wrap in tab order. |
| 19 | The centered full-bleed experiment and its detached claim pulse were superseded by #29. Full-bleed poster viewing lives behind a deliberate thumbnail tap. |
| 20 | The pinned header has an opaque ground. The header contains real text and a separate thumbnail, so the flyer's lettering cannot ghost through the title. |
| 21 | The public attendance pill keeps I'M GOING for upcoming nights and fills when selected. Its follow-up choices preserve the two ruled responses. Remove my attendance clears attendance and interest in one transaction with one confirmation. Private saves remain a separate action in Info. |
| 22 | The pin takes a faint accent wash and one divider bloom when it settles. Fronts get one first-appearance sheen. Press feedback uses transform or fades a prepainted highlight. Reduced motion skips the grow and sheen. |
| 23 | One local viewer covers the card plus Events + Placez, Outzide and Afterz using the actual product routes. |
| 24 | Reused the drawer language from PRs #116 and #117, including the top, calendar, chips, rail/card composition, Afterz cards and share glyph. Calendar filters drive the real rails. Corrected blended edges and mini controls at their component owners. |
| 25 | The cancelled edit to the two closed PRs stayed cancelled. Its standing edge and mini rules apply to the new components. |
| 26 | A single 720ms transform carries the source to the expanded rect. The sheen follows the poster-size crossing. The solid event shell requires no optical texture. Optical materials that share the opening defer texture work until it settles. The motion evidence below distinguishes frame pacing from a hardware guarantee. |
| 27 | Preserved the design correction that protects the title from poster lettering. The intermediate centered layout was later retired. |
| 28 | Verified the header pin and horizontal fit at phone width. The transient claim-at-poster-foot placement yielded to the next ruling. |
| 29 | Title left, thumbnail and overlapping X right, venue under the title, claim first among the chips. Claim status comes from the owning API without exposing the claimant's identity. The pin reaches 70% over 140px of scroll. |
| 30 | The further rewind stayed cancelled. The renewed dock request is built. Both ordinary and map docks measured 56px tall, 28px radius, 8px side and bottom clearances, 6px padding, five 44px tabs, four 22 × 22px icons and a 28 × 32px center icon. |
| 31 | The nine-version rewind stayed cancelled. |
| 32 | The private original preserves the PR #121 artifact and JSON ledger. The rebuilt components are on a separate local feature branch. |

## Repairs and improvements

- Public RSVP and interest now update together through the existing attendance API. A disposable local member confirmed removal once, refreshed and verified both records were gone. Profile, Schedule, drawer plans, event chat membership and the visible heart refresh from their owning queries.
- People rows open the public member card across the whole row when a public identity is available. Pregame opens the event's authorized Inbox conversation. A member sent a local test message and saw it in Feed on return.
- Ridez supports offering and requesting for both arriving and departing. The browser tests used three local accounts, verified venue check-in and neighborhood privacy, and reloaded the API results. Withdrawing one direction preserved the other.
- Afterz retains its Pacific time window, consent and role restrictions. Hosting, guest request, acceptance, private chat, persistent No, and a fresh request after No all passed. An event shows its own occurrence. The map can show all invitations visible to the acting account.
- The Placez map rail centers the map and opens the real event. Outzide opens the actual outdoor destination, including photo and canonical destination page. Viewer-visible plans determine badges and counts. Thin local data was supplemented by a captured public catalog for multi-event pagination.
- Directions has address copy, optional device location and five map choices when coordinates exist. It labels its calculated distance as straight-line miles. Routing apps supply walking time. Private events omit public directions.
- Sharing, reporting, poster viewing and the tab pager are operational. Report sends through the existing feedback API and preserves a failed draft. Returning from the expanded Hub card restored the originating post with zero measured scroll displacement.
- More carries the Mizzed Connection panel Tucker marked in the third phone reference. The magenta edge frames a matte-black countdown. A signed-in member sees when posting opens. During the window the event’s eligibility API enables the existing composer. It closes seven days after the event ends. A local member posted a note and read it back. [Upcoming](card-system-captures/mizzed-upcoming.png) · [Open](card-system-captures/mizzed-active.png) · [Composer](card-system-captures/mizzed-composer.png) · [Closed](card-system-captures/mizzed-closed.png)
- A private host retained read access after an event changed from public to private. The composer and public share control disappeared. The public board, venue rail, counts and social preview followed the viewer’s access. An unrelated account and a signed-out guest could not retrieve the private note. The guest’s event and image requests returned 404. [Host’s note reader](card-system-captures/mizzed-private-reader.png) · [Guest opening the same event](card-system-captures/mizzed-private-guest.png)
- The Schedule compiler work exposed a selected-week PNG export that still printed a July heading. It now prints the selected week and sorts occurrences by the selected day. A local export produced a 1080 × 1920 PNG.

- The expanded card uses a single opaque shelf for the title and action tiles, an inset active-tab rule, a countdown between the venue and host marks, and a divided grid of real event facts. The whole host cell opens the host's page. The four Yes Coach cells show DJ Bro Hoe, the 11 PM end, the five-hour run and the host. The listing has no separate doors time or dress requirement. Ticket prices stay together in two rows, above one full-width ticket action and its destination hostname. These choices came from operating the two references Tucker selected and preserve the later decisions about the tab order and footer. [Slight Enhancements](https://muse.ai/s/expanded-event-card-slight-xlxe711qxvxycql/DqU_e-Tg20aGzJL_R3pPSKyDs1aI35NJJiwf-1UD7NQ) · [Repair Demo](https://muse.ai/s/zaylist-asks-repair-demo-kq711r4jxh3s/T4axDQm2h-xnxrn8B78Efxn2DxaQ8bDKjWrK0KFp218)
- On Outzide, the drawer starts with the live page's guided filters. Chrome returned 385 Northwest destinations, 70 in Portland and the Gorge, 23 trails, and one match for Angel's Rest Trailhead. Opening the result selected the same waypoint on the local and live maps. The browse page keeps its own search and categories. [Live Outzide](https://www.zaylist.com/outzide)
- Drawer headings and grips now use the owning room's artwork. The event's Afterz action and consent sheet carry the same Afterz wordmark. The Website drawer uses the venue mark when available. Directions uses Our Placez. Ridez uses its parent Eventz mark.
- A friend invite is a server-validated event attachment. Two local members sent an invitation, opened it from Inbox, and closed the card back to the conversation. The server checks visibility, follow status and member blocking. A public link generates a 1200 × 630 social image containing the uncropped poster and Zaylist hero mark. Private and archival artwork stay out of public share previews. [Share artwork](card-system-captures/share-poster.png) [Recipient's phone](card-system-captures/friend-invite.png)

## Sources and owner decisions

The build used the 32-entry ledger in PR #121, the original files in both closed Grok PRs, the nine operated playground pieces, and the published Foundation Design System release 2026-11-21.8. Observations from the production site were read-only. [Ledger and design capture](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/121) · [Grok #116](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/116) · [Grok #117](https://github.com/maxmackpdx-pride/pdx-pride-guide/pull/117) · [Glass playground](https://muse.ai/s/beveled-deep-glass-playground-xzxm711xsxjxtxhqj/tWdB5f-sUfEE7hKHuVNBQhiybZu89y5jOWgMQ107nsI) · [Published Foundation](https://zaylist-foundation-library.maxmackpdx.workers.dev/)

All four Muse references opened in Chrome. The two interactive refinements were operated as well. The Drive review covered the folder inventory, the kit manifests and archive indexes, relevant source and design documents, and the eight additional images and screen recordings. The standalone HTML matched PR #121 byte for byte by SHA-256. The main archive and four split indexes were compared. Individual basemap tiles were not exhaustively decoded. [Owner's Drive handoff](https://drive.google.com/drive/folders/1n343CZkFR2-SNTboJXFu5kNV2tnhJ8Cl)

The release build attempted to refresh its decorative motifs and used the checked `zaylist-foundation-design-system-2026-10-31.2` snapshot when that request was unavailable. The glass checker independently fetched the published preset.

The published six-role, nine-power matrix informed visible actions and counts. Local interaction checks covered signed-out, member, host, requestor, attendee, blocked and unauthorized paths. Existing permissions tests covered role-based access. No interaction in this work grants additional push rights. [System and permissions](https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/)

## Verification and open items

| Check | Observed locally |
| --- | --- |
| Event geometry | 376 × 697.96875 CSS px at 402 × 874. The computed border, halo, corner radius, outline, background and backdrop filter matched the live Yes Coach card. |
| Event interactions | Opened all four branded action drawers from a front card. Each drawer had an open seam. Opened the 1320 × 1715 poster, returned, opened the host cell and reached the Yes Coach Productions community. Measured a 70% pinned header. |
| API gate | Six interest presentations and five drawer consumers used their shared owners. An altered API response reached both Info and People. A guest saw no source-link control. |
| Glass gate | The checker read release 2026-11-21.8 at runtime. It compared 38 painted samples across overlay, dock and scrim with zero advisories. A separate intentional mismatch produced an advisory and permitted the build to proceed. |
| Copy gate | The final local guest view matched the Codex editorial review (SHA-256 `93358fbf97a90fe946bc37d8b44dd3aebd5e85b7a2100d1df821798c4afbfc25`). The organizer’s description and API prices matched, including $15 presale and $25 at the door. The gate returned its documented editorial-only exit code 2. Independent human voice sign-off remains open. |
| React Compiler | 121 render functions and 20 hooks across 87 changed application source files had a successful compiler transform and matching Vite output. The four private demo renders were checked separately. |
| Release motion | The 402 × 874 and 390 × 874 phone-width runs each captured 44 frames before the opening animation reached full opacity in desktop Chrome. Both had a 16.7ms median and 16.8ms 95th percentile. The longest intervals were 50.0ms and 33.4ms respectively. Both entrances grew without rotation and returned to their original front card on close. An uninterrupted 60fps on a physical iPhone remains unverified. [Frame samples](card-system-captures/opening-motion.json) |
| Regression suite | The combined local suite ran 95 tests. It passed 94 with zero failures. The one skipped case is the opt-in timing benchmark for legacy versus cached event feeds. Separately, the drawer-page tests passed 22 of 22. The TypeScript check and full local release build passed. |

The local development viewer opens the real application routes with their normal data and permissions. [Run the gates](card-system-gates.md)

## Try Afterz and carpool

The owner-private ChatGPT Site opens on the Yes Coach anniversary at Sanctuary Club. Jules Finch is a fictional checked-in guest. Rowan Vale hosts The Lantern Room and drives the Buckman carpool. The profile selector lets you operate both sides of each exchange. Reset restores the original rooms, seats and messages. Changes stay in this browser. [Open the interactive demo](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/demo/)

- **Afterz.** As Jules, open The Lantern Room, confirm you are 18 or older and request an invite. Switch to Rowan, accept Jules, then switch back to Jules. The private group chat and meeting directions are now available. Side B shows an accepted invitation and Night Kitchen shows a waitlist. The product’s map discovery window is 9 PM to 6 AM Pacific. The demo opens at 10 PM Pacific so you can try it at any hour. [Afterz](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/demo/#/afterz) · [402 × 874 capture](card-system-captures/private-site-afterz.png)
- **Ridez.** As Jules, choose Going and request a seat in the Buckman carpool. As Rowan, accept Jules’s request. Switch back to Jules to see Seat confirmed and the shared passenger tools. You can also offer a carpool or post a pickup neighborhood using I need a ride. Departing covers the trip from the event. Matching requires attendance and venue check-in, and a departing rider’s home neighborhood stays private. [Carpool](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/demo/#/rides) · [402 × 874 capture](card-system-captures/private-site-carpool.png)

Private Site version 2 uses source commit `5f38669321b0c0511024524fe93b7516f0c5af95`. Chrome at 402 × 874 operated the hosted invitation, approval, private chat and directions, seat request and acceptance, profile switch, withdrawal, local safety check and reset. The six captures and full poster loaded. The original HTML served at the root retained SHA-256 `47a7e6f62afef0f378387d43957e9d8faa34a6b39f3678865a7b63a0075de33d`. The interactive route made zero external network requests in the navigation check. The access policy still lists only the owner. [Phone gallery](https://zaylist-yes-coach-cards.tucker-pdmax.chatgpt.site/demo/#/captures)

Run `node demos/card-system-preview/build.mjs` to reproduce the static demo from this checkout. It compiles the same Afterz drawer and event planning components as the local application. An in-browser fixture adapter supplies sample data through their existing API contracts. The demo’s location and phone controls operate on fictional data. The Zaylist feature branch remains local.
