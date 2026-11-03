# Release 4: forward-only image processing and phone loading

**Status: PUBLISHED AND VERIFIED ON PRODUCTION.** Base production commit: `d5ae1154b0dde8b05fd2007ff936f7acdaea302a`.

On November 3, 2026 at 00:09:38 UTC, the user changed the image work to focus on new incoming images rather than the existing catalogue, then proceed to Release 5. The current direction is automatic forward-only processing, persistent runtime derivatives and dynamic frontend delivery. The implemented paths, local verification and production closeout are recorded below.

## Current scope

- Process new eligible incoming images going forward. Preserve originals; provide appropriately sized display copies and reliable original fallback.
- Do not backfill existing images. The earlier 368-file, 44,216,102-byte static poster batch is **excluded from the intended release**. Existing images and recovery backups remain preserved.
- Retain OutZide card sizing hints, incidental map deferral and camera lifecycle, pure waypoint imports, intent-based Home map warming, Motion runtime consolidation and declaration-emission safeguards.
- Preserve card dimensions and anchors, pinned image/phone regions, internal scrolling, carousel behavior, map controls and attribution. Keep the flagship renderer and map-generation pipeline unchanged.
- Retain only previously verified housekeeping: seven failed downloads totaling 2,153 bytes relocated with their exact bytes preserved. Referenced legacy OutZide assets, valid historical posters and brand masters stay intact.

This is not a general private-album processor, sitewide moderation rollout or authorization to resize brand masters. New runtime processing must respect the existing source visibility and serving boundaries. No new-image trigger, format or automatic recovery behavior is considered covered until the implementation and tests establish it.

## Implemented design

The implementation observes future event inserts and changes to poster URL, status or public/private flags through persistent SQLite jobs and triggers, installed after seed loading. This processor performs no initial catalogue scan. The pre-existing remote-poster mirroring process can run about 15 seconds after startup and replace an older remote URL with a local URL; that legitimate replacement can enqueue optimization of an older event. Thus forward-only means no new backfill scan, not a guarantee that an old event can never receive variants. Newly inserted, newly published or poster-replaced events can qualify, including a pre-existing event changed after installation; merely viewing an old image does not enqueue it. Eligible jobs require the current event to be LIVE, public and not private, with the same source URL still attached.

The worker reads first-party local files only, under constrained `/uploads/`, `/posters/` and `/event-posters/` paths. It does not fetch external URLs. Work is sequential, at most two jobs per five-second tick, with a 20 MiB source and 40-million-pixel decode limit. It produces non-upscaled 640/1280 WebP copies at quality 88 only when at least 5% smaller. Failed work has at most three attempts with delayed retries. Originals stay unchanged. Unique upload names/content-addressed captures are assumed; overwriting bytes at an identical source URL is not supported as an automatic refresh trigger.

Output lives beside the uploads directory on persistent runtime storage, not inside the static public tree. `/api/poster-variants` exposes currently eligible ready metadata; the image endpoint rechecks current eligibility before serving. Both use `private, no-store`. These checks do not recall bytes already delivered, and no new private-album processing is introduced. The current design does not promise a total derivative-storage cap or automatic orphan-file cleanup.

EventFlyerArt and EventModal consume one shared metadata query. A single foreground timer refreshes it every 30 seconds while subscribers exist. On a cold eligible first-party image, rendering waits up to two seconds for metadata to avoid downloading both original and derivative. Unknown older images may incur the same initial lookup delay; external URLs and paused/offline queries bypass that wait. Unknown, pending, failed or ineligible mappings retain original delivery; a derivative load failure retries the original once. The metadata response is bounded to 5,000 newest ready records and 2 MB; omitted entries use originals, without deleting files. Metadata retrieval never starts historical processing. Fresh aggregate checks and actual event-research/member ingestion checks passed locally, as detailed below.

## Fresh forward-only verification

The November 2 static-batch candidate is superseded. The following checks were rerun against the current forward-only implementation on November 3, rather than inherited from that earlier candidate:

- Typecheck, predeploy, glass audit, full production build, deployment-bundle verification and server bundle passed.
- CI: 146 passes and one intentional benchmark skip. Shared-card units: 20/20. Browser suite: 14/14, including the original four card suites and current map, motion and poster coverage. These overlapping groups must not be summed as unique tests.
- Actual publisher ingestion: 14 checks passed through real authenticated upload, event-research single-create, LIVE/public event insertion, automatic queueing and the real five-second worker timer. Upload alone did not enqueue; the public feed retained the original URL; original bytes were unchanged; optimized delivery returned 200 with no-store.
- Actual ordinary-member ingestion: 13 checks passed through upload, pending moderation, admin approval and automatic variants. Pending submissions did not enqueue; promoter autoapproval reached the same path; approved private submissions remained excluded.
- These HTTP workflows used copied databases and loopback-only test fixtures, not production writes. The synthetic publisher JPEG (25,695 bytes to a 1,060-byte 640w copy) proves delivery behavior, not representative compression savings.
- Cold metadata browser cases covered a 400 ms ready response without an original-image request, plus error, timeout, empty and paused/offline cases falling back to one original request. Geometry and DPR cases, derivative failure and original fallback passed.
- Offline route diagnostics: 30/30 HTTP 200 samples, no JavaScript/sample errors, negative frame intervals, top-frame map canvases or Leaflet/MapLibre script requests during the observation window.
- The final 6,062-file source inventory had zero drift, including the tracked root database. Profile packaging emitted 324 declarations with zero JSON inputs. Documentation is excluded from the runtime source inventory.

Fresh entry JavaScript is **795,598 raw / 233,148 Brotli / 249,659 gzip bytes**. Entry CSS is **588,002 raw / 94,396 Brotli bytes**. These replace the older static-batch measurements. They are entry sizes, not complete page transfer or total code removal.

[Current verification](releases/release-4/verification-results.json), [source identity](releases/release-4/source-verification-identity.json), [bundle evidence](releases/release-4/bundle-comparison.json), [offline diagnostics](releases/release-4/mobile-summary.json), [image-flow evidence](releases/release-4/controlled-image-comparison.json) and [release summary](releases/release-4/summary.json) describe this candidate. No historical catalogue savings are claimed for forward-only processing.

## Production closeout

The initial implementation shipped as `1fa417cf6577dbd61d7b4f23b4233d5a8db00182`. Its core CI failed during poster screenshot capture. That initial CI failure is retained in the chronology; the earlier local passes do not make the first CI run a pass.

Follow-up `b15844b13685a3bbc78b2096133836597778529c` made a minimal test-only screenshot reliability correction for constrained CI, plus the latest map-work authorization hold in the plan. It did not alter application runtime behavior. The repair used CSS-scale captures and a 30-second screenshot timeout while preserving behavioral assertions; constrained local reproduction failed before and passed after the repair.

At `b15844b13685a3bbc78b2096133836597778529c`:
- Core CI run `41565024036`: SUCCESS.
- Deploy workflow run `41565024055`: SUCCESS.
- Railway deployment `4d2bc47d-0fec-4d1d-97f5-0c50ac58e3b5`: SUCCESS.
- Live health returned that exact SHA and Node 24.22.2.

These establish the deployed identity and successful release pipeline. Local disposable-database tests establish the publisher/member mutation workflows; this record does not claim those mutations were repeated on production. [Machine-readable production closeout](releases/release-4/production-closeout.json).

Release 5a may now proceed separately, followed by 5b only after 5a is verified live. Stop after both for the user's whole-project review. Releases 6 and 7 remain held. Do not restart the abandoned historical poster batch.

Cloud Chromium/software-renderer checks are not physical iPhone/Safari proof. Offline diagnostics with request routing do not represent warm HTTP-cache or live network behavior; top-frame measurements omit iframe internals. Entry-byte reductions and selected image fixtures are not whole-page speed or catalogue-wide claims.
