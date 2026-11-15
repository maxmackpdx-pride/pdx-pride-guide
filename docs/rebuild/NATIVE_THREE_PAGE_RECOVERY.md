# Native three-page recovery, 15 November 2026

Status: reconstructed native source, staged on a recovery branch. **Not a production deployment or completed visual approval.**

## Preserved source
- Five-format demo v35: `bd3cbbd790bcfcc16adc51c1ac05c11a73941595`.
- SceneZ demo v16: `329a4b3499304fe616b6a66f12e2cff80332111d`.
- Native host baseline: `ed5abcf5925301908d640f80d4d9801e715b1f48`; platform and community privacy fixes retained.
- MapZ release remains v1.0.23, `7df02f2cd8930a5e374cfdc3a2e8249d4ccaae8a`.

## Native entrypoints
- `/directory`: PlacezBrowse. Existing `/directory/:id/:slug?` detail remains.
- `/scenez`: Scenez. Existing `/z/:communitySlug` remains.
- `/outzide/places`: OutzidePlacesPage. Existing `/outzide` map and `/outzide/:placeSlug` remain.
- Mobile Places fan and desktop Places dropdown share three destinations. Map fan and query-aware desktop map navigation preserved.

## Restored contracts
- Locked sizes: small136×170, tall200×403, wide360×216, square250×250. Shared LockedCardSlot scales the entire card, not its aspect ratio or internal layout.
- Wide art remains full bleed with right-dark/left-clear scrim. Heart retains existing placement and persisted follow behavior.
- PlaceZ directory/detail APIs drive native faces and expanded actions. Public GigZ/Mizzed feeds use existing BoardBrowseCard and persisted saves.
- SceneZ API records drive categories, next upcoming event/meeting, privacy-aware follows/membership, owner chat settings, actual Inbox conversations, scoped event BoardZ posts. When no upcoming event exists, GigZ/Mizzed counters remain.
- OutZide uses catalog/snapshot/board APIs. Follow and board save are persisted. Notification read cursor is shared with Hub; no OS push implementation is implied.
- Source palette is migrated to DS token variables; canonical category tokens reused and print texture inks preserved. Token guard is not loosened.
- New card faces added to exact React Compiler presentation allowlist. Map/auth/controller exclusions preserved.

## Evidence to date
- Aggregate TypeScript passed.
- Full client/server production build passed; pinned-map check passed.
- Deployment bundle verifier passed.
- Focused privacy/community/chat/navigation suites passed; expanded recovery suite35/35 passed before final attribution and query-key cleanup.
- CSS token guard passed; recovered malformed SceneZ CSS corrected.

## Release checks still required
- Repeat final build/tests against final checkpoint, not an earlier tree.
- Browser visual/mobile/desktop validation and real interaction smoke test. Local preview browser connectivity is under investigation; screenshots have NOT been verified.
- Foundation guide implementation pin and publication per owner's release requirement.
- Verify all canonical dimensions and explicit unread/follow/board save behavior in browser; do not describe branch checkpoint as shipped.

## Artwork truth
Six original mapped PlaceZ treatments plus approved Sports Bra derivative = seven. Kann is recovered draft and held; underU has source screenshots only. The saved category ZIP is a source collection, not a completed conversion batch. Do not mark all cards converted. See PLACEZ_BATCH_RECOVERY.md.
