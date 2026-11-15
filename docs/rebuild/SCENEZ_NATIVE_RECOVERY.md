# SceneZ native recovery — 2026-11-15

Approved source: Scenez · Find your people, Sites saved version 16, exact commit `329a4b3499304fe616b6a66f12e2cff80332111d`. Original remains preserved in Sites and separate recovery checkout. This implementation never modifies or publishes that demo.

Reused: approved SceneZ wordmark, party/pride collage, scene brand assets, paper texture; native card markup and locally scoped original CSS. Original demo data, local follow state, owner-preview controls and simulated chat are not imported. Hero has existing host navigation, not demo cross-site links.

Native API: /api/communities for directory, authoritative sceneCategory, following, chat unread and nextEvent; /api/communities/:slug detail for real events, posts and membership; authenticated membership + follow mutations; native CommunityChatControls joins and opens personal Inbox. Boardz uses /api/communities/:slug/boardz and existing BoardBrowseCard/toBoardPosts/save API, not fake posts. API-level visibility remains server-owned.

Proportions preserved by shared LockedCardSlot: mobile wide 360×216; desktop square 250×250. Original face supports tall 200×403 and small 136×170. Full-screen expanded presentation has swipeable sections. Scoped styles cannot restyle PlaceZ or OutZide.

Limits: existing records without sceneCategory stay unclassified; no invented type. No claims that API-less records are mapped. User-owned event schedule and counts are never generated from old demo fixtures. Visual review and release verification are coordinated by rebuild lead; this checkpoint is not a deployment.
