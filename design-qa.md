# Placez and ReZources — Eventz preview review

Result: passed for the private design preview. Zaylist production is unchanged.

## Scope and reference

Eventz supplies the page composition and the open/closed card standard. Placez uses the large Eventz frame at 200 × 403px with a 17px radius. ReZources uses the small 136 × 170px Eventz frame enlarged 20% in both dimensions: 163.2 × 204px, with a 19.2px radius. Fixed card dimensions apply in browse and grid views.

Both details now import the actual EventModal approved/reference styles: a centered frame up to 600px wide, viewport minus 38px on phones, height up to 1040px with 12px viewport clearance, a 24px radius, share/close controls, an artwork region, title hierarchy and action stack. Resource disclosures and the Place details disclosure use the Eventz disclosure treatment. The resource detail uses an accessible centered Radix dialog; its separate immediate-support drawer is unchanged.

Original PlaceDiscoveryCard and ResourceCard artwork, motif source, category coloring, motion and logo assets remain. Resource cards display an identifying caption for every organization. Only layout adapters and detail markup changed.

## Classification

- 35 nonprofit, health and support listings leave Placez: 27 match existing ReZources entries and eight were added using their existing directory content.
- Therapy and psychiatry practices are included per Tucker's explicit direction.
- The seeded preview now has 62 Placez and 91 ReZources results (90 organizations plus the food-finder entry). Cross-category appearances refer to the same organization.
- Existing place links for moved organizations open their ReZources details. Business records and event relationships are retained.
- Add Place options omit nonprofit, healthcare and group categories.

## Verification

- Classification assertions covered all 35 moved listings, unique matching resource targets and retained ordinary businesses.
- All 436 bundled preview assets match their immutable GitHub hashes. All 306 referenced logo paths resolve.
- Product TypeScript check, Sites production build and whitespace validation passed.
- Desktop and 390 × 844px phone layouts inspected. Closed dimensions measured in the browser. Open frames measured at 600px on desktop and 352 × 820px on phone; no horizontal overflow in the detail scrollers.
- Search, page navigation, resource and place detail opening, disclosures, scrolling, close controls, Escape, and focus restoration passed. Legacy place links to moved resources passed.
- Place follow/account actions show the preview notice. No production account mutations occur.

## Visual evidence

Current screenshots are kept in `.local/sites-review/`: `placez-eventz-frame.png`, `rezources-eventz-frame.png`, their mobile variants, and `placez-eventz-open.png`, `rezources-eventz-open.png` with mobile variants. The unchanged Eventz reference is `.local/design-review/eventz-desktop.png`.

## Limits

The private Sites preview uses seeded public data and a private three-page navigation bar. Account writes are disabled. Verification used Chromium and phone-sized emulation; physical Safari was not tested. The product's primary navigation, Eventz implementation, Foundation Library and Zaylist production deployment are unchanged.

## October 12 follow-up

- Removed list layout from both browse pages, including normalization of old `layout=list` links.
- Map entry links explicitly select just Placez or just ReZources, preserving optional place coordinates; the normal Mapz layer controls remain available. The place layer excludes organizations moved to ReZources.
- Place details now precede Follow and open by default. The Eventz Mizzed Connection inset opens the venue's existing connection tab. Upcoming events appear in an independent default-open section at the bottom, using square EventFlyerArt tiles.
- TypeScript and whitespace checks passed. Browser checks confirmed both default-open disclosures, details-before-Follow order, Mizzed tab selection and 148px square event tiles at the 390px viewport. Map query assertions and the rendered Placez/ReZources links agree with Mapz's existing eight visibility controls.
- The isolated Site contains three clearly marked archived event examples for Badlands, so the tile treatment can be reviewed without implying a current schedule. No product event data changed.
- A Site-only All boards experiment combines five community categories with twelve fictional posts. Its implementation, sample data, and three-page navigation do not alter product routes or production navigation.


## 2026-10-12 · Shared complementary card accents

Passed for the scoped color change. Added a shared secondary-color recipe across the existing card families, including nested cards and older card roots. Eventz large, compact and open cards retain the existing dayComplementToken pairs. Category cards derive a softened complementary hue from their own primary color. Nested Mizzed doorways rebind to their own identity. Thin opposite edges, motif linework, footer seams and small icons carry the secondary accent; dimensions, text hierarchy, logos, imagery and statuses remain intact.

Tucker’s follow-up removed the fixed pink/cyan smoked-glass flare from open cards and the experimental wide family. Shared card lighting now uses restrained category-specific linear reflections, a darker fill, 6px backdrop blur and a shorter edge shadow. No new image asset was created.

Verification: product TypeScript check and diff checks passed; matching private Site build passed. Browser inspection covered Placez (200 × 403), ReZources (163.2 × 204), open Placez, nested Mizzed and upcoming event tiles, wide board cards/open state, and calm mode. A local isolated fixture checked the actual full-size and compact Eventz components across all seven days, open Eventz, and representative shared card primitives. Fixed an explicit day-pair inheritance mismatch on compact card art. Final built board view compared against the prior screenshot in one visual input. At 390px the board page has no horizontal overflow and its cards remain 334px wide. Representative families were inspected, not every route; physical Safari was not tested. Product production is unchanged.


## 2026-10-12 · Category branding and Eventz typography tokens

Passed. Category brand color now owns every card edge, surface reflection, motif line and tag outline. Complementary color is confined to small arrows/icons and motif nodes, targeting about 10% of the treatment and never a second broad surface. Fixed flare textures remain removed. Shared bloom now composes the existing 8% token.

Extracted the approved 200px Eventz card geometry and typography into component tokens, consumed by TonightEventCard, Placez and the experimental board cards. Placez badges now use the Eventz 9.2px mono label recipe; titles remain 18px Barlow Condensed. All Boards retains the exact room-brand registry, with system neutral colors, type, spacing, radii, focus and motion. Its stylesheet contains no raw color literals. This adapts the requested reference; it does not change the Foundation Library.

Verification: product and Site TypeScript checks passed, Site build passed, diff checks passed. Desktop and 390px phone inspected, including all 12 board cards (334 × 242px on phone, no content/page overflow), Giftz open state with primary-color frame, default-open details, Escape/focus return and Calm Mode. Placez remains 200 × 403px with matching Eventz title/tag fonts. Before/after screenshots compared in the same visual input. Physical Safari not tested.

Evidence: `.local/qa/token-boards-desktop.png`, `token-boards-phone.png`, `token-board-open.png`, `token-placez-phone.png`.


## HUB dropdown — October 12, 2026

This section records the current Hub implementation. Earlier reports above remain intact.

Source visual truth: `/Users/tuckercasey/.codex/generated_images/01a13131-ae08-71f2-b571-fde825e2aed6/exec-c57d5f64-ca1e-4a6d-8389-cf0842cf2556.png` (Tucker's selected second concept). Tucker explicitly overrode the mock's name to **HUB**. The later everyday, events, and board studies supply representative content patterns, not a different visual direction.

Implementation: `http://localhost:5056/`, built production assets, signed-in disposable local preview member. All preview fixture changes stay in ignored `.local/data.db`; no production posts were created.

Evidence:
- Desktop screenshot: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/hub-desktop-final.png`
- Full comparison: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/comparison-final.png`
- Focused panel comparison: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/comparison-panel-final.png`
- Initial comparison: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/comparison-initial.png`
- Phone screenshot: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/hub-mobile.png`
- Board examples: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/hub-boards-mobile.png`
- Calm mode: `/Users/tuckercasey/.codex/visualizations/2026/10/12/01a13131-ae08-71f2-b571-fde825e2aed6/hub-build/hub-calm-mobile.png`

Comparison normalization: source 1487×1058 raster, final desktop 1440×1024 pixels at 1440×1024 CSS pixels / DPR 1. The full comparison scales the source to 1440×1024; the ratios are effectively identical. Focused source panel crop (945,70)-(1460,1038) is normalized to 480 px wide; actual panel is 480×920 CSS px at (944,88). Both captures show Home at page scroll 0, an open panel, All activity, and photo/event rows. Phone viewport is 390×844, panel 374×680 at (8,76); tablet 768×1024 was checked for fit and overflow. The mock's illustrative counts, stock picture, author pictures, and flyer are replaced by actual renderer data and existing local sample assets. Home globe animation, headline, and stats remain the current product.

### Findings and comparison history

- [P2, fixed] Initial panel was capped at 820 px and the photo at 300 px, reducing visible feed density. The panel now uses available viewport height up to 960 px and photo previews are capped at 220 px. The final full/panel comparisons show the complete photo and event, with the next row starting above the persistent footer.
- [P2, fixed] Local venue image URLs could fail and leave broken-image glyphs. UserAvatar now falls back to a neutral venue initial (or the member's existing avatar choice). Final capture and DOM inspection found zero broken feed avatar images.
- [P2, fixed] Opening a native RSVP changed attendance without immediately refreshing Hub. Attendance entry points now invalidate feed and activity-head queries. A local confirmation renders GOING in the event row.
- [P2, fixed] Phone scroll locking initially used overflow rather than the application's shared iOS-safe lock and did not respond to a breakpoint change. Hub now uses the existing ref-counted body lock, follows media-query changes, and restores focus to a visible Hub trigger. Mobile body position is fixed while open and restored on close.
- [P2, fixed] Calm controls were quiet but category tokens could retain bright board colors. Panel and semantic category tokens are now muted within Hub. Final Calm capture shows neutral controls, categories, and listing actions while photos retain color, matching the existing Calm policy.

No actionable P0/P1/P2 findings remain. Expected adaptations: HUB naming, current Barlow/Barlow Condensed typography and capsule controls, 44 px interaction targets, actual data and image crops, native RSVP state, the existing up/down vote model, and engagement only for content that actually supports it. These retain the selected panel structure without fabricating actions or counts for event listings.

### Fidelity surfaces

- Typography: browser reports loaded fonts; HUB and names use Barlow Condensed, body copy uses current Barlow tokens, metadata uses the existing mono token. Hierarchy, readable body sizes, wrapping, and long-text expansion are consistent. No fallback-only display font remains.
- Layout: header, filter, composer, continuous hairline rows, full-width photos, compact embedded events/listings, independent scrolling, and persistent footer follow the selected concept. Desktop, phone, and tablet have no horizontal overflow; bottom navigation remains reachable on phone.
- Colors: canonical token colors identify post families. Neutral dark shell and top spectrum seam preserve the reference; Calm removes the seam and control/category color. Focus outlines and disabled states remain visible.
- Images: real uploads/posters and existing local fixture assets render in the appropriate photo/thumbnail frames; venue logos remain contained. Missing assets use the existing avatar fallback treatment. No generated replacement brand marks or rasterized interface were introduced.
- Copy: navigation and reader are HUB; filter is Following, with clear posting, refresh, error, empty, and older-page states. Source/time/category data come from the feed API. Fictional fixture copy identifies itself as a local sample.

### Interaction and requirement evidence

- Desktop/mobile triggers and `/dashboard?section=feed` open the shared Hub panel; the old route returns to Home with Hub open. Account utility sections remain available.
- Text post submission, own-post removal, inline reply submission, and upvote were exercised through the local UI and verified in returned state. Existing photo input and audience controls are reused.
- RSVP opens the native attendance tab, exposes public/friends/anonymous choices, and confirmation returns to the Hub. GIFTZ opens the existing listing dialog. Nested Escape closes the child and keeps Hub open.
- Older updates increased rendered rows from 25 to 45. Keyboard scrolling changes only the feed. Escape closes Hub and focuses Hub; reopening restored scrollTop 371.
- All/Events/Posts/RSVPs/Boards/Following use the real feed. Compact renderer covers every HubFeedKind, including text/photo, submitted/grouped events, host updates, RSVP, GIFTZ/ISO, SELLZ, GIGZ, all housing types, anonymous connections, OUTZ public notes/buddy/ride posts, check-ins, community posts, resource releases, and pinned beach/feedback content.
- Tests verify person, venue, board, community, and destination follows; unfollow/mute; blocking before anonymous rendering and engagement; private check-in/request exclusion; expiry; RSVP-only audience and anonymous RSVP behavior; resource release persistence; publication-time sorting and paging beyond the prior candidate cap.
- Existing featured-event rotation, daily dismissal/expiry, server feed ad pin/depth ordering, and affiliate fallback remain in the reader.
- Loading/error/empty/retry/older-page failure states have dedicated rendering. A housing-source failure preserves the rest of the feed and identifies the unavailable source.
- Browser console inspection found only the earlier development HomeStage fetchPriority warning; no Hub runtime exception was observed in the built preview.

Validation: 16 focused tests passed; final typecheck, production build (including token/nav guards), bundle verification, and diff whitespace check passed. Canonical master closeout passed. Actual Safari and file-upload transport were not separately exercised; Hub reuses the established scroll lock and upload path.

### Follow-up polish

A future iteration could tune individual image crops and compact spacing against larger live-content samples. This is optional P3 work, not a remaining implementation requirement.

final result: passed
