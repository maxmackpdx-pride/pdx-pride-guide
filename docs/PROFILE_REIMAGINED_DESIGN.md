# Current user profile layout

Implementation: `client/src/pages/MemberProfile.tsx`. The current Zaylist Library governs tokens and native card objects; this is an implementation map, not a separate design system.

The phone layout is primary. Identity, photo/cover, bio and follow/message/share actions lead into the existing counters. A touch-scrollable area rail selects Overview, The Stash, Eventz, BoardZ, People or Media. Overview retains all available features and device-local section arrangement; focused areas preserve their deep link with `?view=`.

Existing public roles, talents, values and social links appear in About. Places, Top 8 and pack relationships live in People; photos, audio and approved players live in Media. Owner editing opens the existing full profile editor in a responsive drawer. Theme controls and guarded moderation remain available.

Eventz uses its locked HostingPanel, ProfileEventRail and TheBigOne objects, with the shared open event card. Place previews use PlaceDiscoveryCard compact geometry. Board previews reuse the current BoardZ artwork, anatomy and native detail flows. Past event posters remain grayscale.

The Stash is a manual collection album, with the approved collector panel theme, font and ranks retained. It shows unique flyers, owner-only past Outz check-ins, owner-only favorite places and existing public BoardZ posts. It has no automatic poster animation. Flyer/work XP is unchanged; each unique past destination/date adds 25 XP, favorite place adds 10 XP and public community post adds 10 XP. Private check-ins are self-entered history, not verified attendance.

Closed editing and detail tools load on demand. Collection and adventure modules load near their viewport. Reduced motion and hidden-page behavior remain supported.
