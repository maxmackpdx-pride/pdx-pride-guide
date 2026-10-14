# Public profile implementation

The current `/u/:username` page is `client/src/pages/MemberProfile.tsx`.
The July handoff is [historical reference](archive/design-standards/2026-10-13/PROFILE_REIMAGINED_DATA_CONTRACT.md); its old component paths and draft labels do not govern the current page.

Design authority remains the [canonical Zaylist Library](https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/), with Tucker's profile redesign direction first. This document identifies implementation, not a separate design system.

- `components/profile/ProfileHero.tsx`: identity, cover crop, avatar/ring, bio, theme, follow, messaging, sharing, and guarded account options.
- `components/profile/ProfileStatStrip.tsx`: the existing public counters.
- `components/profile/ProfileAbout.tsx`: existing public roles, talents, values, social links, places, media, photos, and pack connections. Approved SoundCloud players mount only when opened.
- `components/profile/ProfileContent.tsx`: mobile area navigation and focused-area deep links.
- `components/profile/ProfileEditDrawer.tsx`: owner-only existing full editor, photo/cover controls and server validation.
- `components/profile/ProfileCollection.tsx`: authorized collection inputs; private favorites are fetched only for their signed-in owner. `stashCollection.ts` deduplicates identity and computes XP.
- `components/profile/ProfileWidgetGrid.tsx`: device-local section order; static reading layout, lazy arrangement tools, keyboard/touch movement and reset.
- Existing HostingPanel, ProfileTop8, TheBigOne, GoingRail, UpdatesPanel, FlyerStash and owner-only OutzAdventures retain their native features. Closed dialogs and secondary galleries load on demand.
- `pages/profile/types.ts` describes the API response; `components/profile/normalizePublicProfile.ts` maps its existing public fields without exposing anonymous Mizzed posts.
- `server/ogCards.ts` renders the versioned public photo/monogram social image with “Follow me on Zaylist.” Visibility is checked before returning cached artwork. `shared/profileShare.ts` is the common metadata path.

GET `/api/users/:username` remains session-aware: private adventures and moderation capabilities are not shared publicly. Follow and profile edits keep their existing server authorization and Hub cache updates. No user data migration is required.
