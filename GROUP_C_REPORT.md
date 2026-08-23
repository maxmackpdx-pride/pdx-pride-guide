# Group C (Wave 1)

Branch `feat/group-c-wave-1` off `origin/master`. Isolated worktree. Not pushed.

## C1 Optimistic rollback

Save / RSVP / raise-hand / request-to-chat share the MemberProfile pattern: `cancelQueries` + snapshot + `setQueryData` + restore `ctx.prev` on error. Per-id in-flight flags block double taps.

What rolls back together:

- RSVP chip (`/api/events/mine/check-ins`) and attendance summary count (`/api/events/attendance-summaries`). Schedule no longer has a duplicate mutation; it calls `useEventRsvp`. AttendanceCluster uses the same cache helpers.
- Housing Save chip (`saved` on board + detail).
- Housing request status (`myRequest` PENDING).
- Gifting raise-hand (`viewerSelected` + `interestCount`).
- SELLZ saved ids.
- Housing PeopleTab accept/decline: hidden row returns on error (it previously hid with no rollback).

Tests in `client/src/lib/optimisticCache.test.ts`:

- (a) forced 500 restores previous cache (chip + count)
- (b) offline `TypeError("Failed to fetch")` restores previous cache
- (c) double-tap in-flight does not double-count; sequential apply is idempotent

`npx tsx --test client/src/lib/optimisticCache.test.ts` → 13 pass.

## C2 Inline confirm

On the control: Saved, Request sent, Going ✓, Hand raised. Success toasts stripped from HousingPost `requestMutation`, GiftListingCard "Updated", and Sellz save "SELLZ updated". Error toasts remain.

## C3 ChangeBadge

- Presentational `<ChangeBadge>` in `client/src/components/ds/ChangeBadge.tsx`, exported from `ds/index.ts`.
- Mounted on `HubFeedCard` (`hub-feed-card__change`) so Events / GIFTZ / GIGZ inherit the slot.
- Housing `.hz-change-label` is the same component (positioned on the card). Not housing-only.
- `HubFeedItem.changeLabel`. `getHubFeed` bumps saved housing and sellz for the viewer when `last_change_at`/`updated_at` > `seen_updated_at`, sorted by that bump time.
- Server coalesce ~20 min (`shared/changeCoalesce.ts`); last label wins. No extra feed row per keystroke.
- Events / GIFTZ / GIGZ still have no generic save table; no fake labels on unsaved events.

## C4 Skeletons

Board feeds (Events, GIFTZ, GIGZ, SELLZ, HubFeed, Housing) use `BoardFeedSkeleton`: `pdx-glass-card pdx-glass-rebind` / listing-card geometry, avatar row, no spinner. `SpectrumLoader` stays on route `Suspense` in `App.tsx`.

## C5 Seeded empty

Empty HAÜZ (ALL, no tags): `@hausing_demo` posts via `/api/housing?demo=1` plus one-tap CTA to `/the-hauz/new`. No fake listings on real accounts. Filter-empty Events stays "Clear filters".

## C6 Pending inbox

Existing floating inbox. `nudge_sent_at` on `housing_requests`. Requester sees "Waiting on them"; one nudge after 48h. Recipient uses existing accept / "Not right now". Decline stays quiet. Composer gated while PENDING; stub message remains. Housing added to overlay FILTERS / CAT_TAG / CAT_ACCENT.

## tsc

`npx tsc --noEmit --pretty false --incremental false` → 0 errors. No `@ts-ignore` / `@ts-nocheck` / tsconfig loosen added.
