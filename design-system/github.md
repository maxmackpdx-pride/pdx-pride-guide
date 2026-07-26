repo: maxmackpdx-pride/pdx-pride-guide
branch: master
path: client/src

## Last sync
date: 2026-07-26T05:12:00Z
commit: ffb394b34cba

### Updated in this project
- Mobile top bar resynced to `hub-shell.css`: debossed #111 track at 9px radius, cyan active segment, magenta JOIN pill. The guide had a yellow pill on a #161616 track.
- Motion library added from the live client: aurora, spectrum wave, rainbow divider flow, word glitch, sticker float, board flicker, schedule card in, attendance pop, sheet up, inbox overlay, flyer stash holo, bubble float, orb, hero letter orbs and hero parallax.
- Identity rings resynced to `shared/avatarRings.ts`: added genderfluid, genderqueer, aromantic and agender, taking the set from 14 to the live 18. Gradients lifted from `client/src/index.css`.
- Site kit nav label corrected back to **Places**: `PRIMARY_NAV` labels the entry "Places" on the route `/directory`, whose page H1 is "Directory". Both words are correct in their own place; the nav says Places.

## Sync history
### 2026-07-25
- Added the Nude Beaches screen (Rooster Rock / Collins Beach tabs, conditions band, map, trip logistics) from pages/NudeBeaches.tsx + shared/nudeBeaches.ts.
- Added the public member profile screen (/u/handle) from pages/MemberProfile.tsx + components/profile/*.
- Site kit nav rebuilt on the live `PRIMARY_NAV`: Home, About, Events, Places, Nude Beaches, Boards dropdown, Promoters.
- Footer rebuilt on the live three folders (Explore, Participate, Guide) with the real legal and tagline copy.
- Home restructured to the live order: hero, stat strip, Up Next, seam, Community Boards, directory teaser.
- Hero copy corrected to the live kicker and two CTAs; stats moved out of the hero into the strip.

## Screen map
| Screen | Built from |
|---|---|
| ui_kits/zaylist/AppShell.jsx | client/src/lib/siteNav.ts, components/Nav.tsx, components/Footer.tsx |
| ui_kits/zaylist/HomeScreen.jsx | client/src/pages/Home.tsx, components/HomeHero.tsx, components/HomeStatStrip.tsx, components/HomeUpNext.tsx |
| ui_kits/zaylist/EventsScreen.jsx | client/src/pages/Events.tsx |
| ui_kits/zaylist/ScheduleScreen.jsx | client/src/pages/Schedule.tsx |
| ui_kits/zaylist/PlacesScreen.jsx | client/src/pages/Directory.tsx |
| ui_kits/zaylist/HubScreen.jsx | client/src/pages/Dashboard.tsx |
| ui_kits/zaylist/AdminScreen.jsx | client/src/pages/Admin.tsx |
| ui_kits/zaylist/AboutScreen.jsx | client/src/pages/About.tsx |
| ui_kits/zaylist/NudeBeachesScreen.jsx | client/src/pages/NudeBeaches.tsx, components/NudeBeachesHero.tsx, components/NudeBeachesHubPanel.tsx, shared/nudeBeaches.ts |
| ui_kits/zaylist/ProfileScreen.jsx | client/src/pages/MemberProfile.tsx, components/profile/ProfileHero.tsx, ProfileStatStrip.tsx, ProfileTop8.tsx, HostingPanel.tsx, GoingRail.tsx, UpdatesPanel.tsx, ProfileFooter.tsx |
| tokens/*.css | design-system/tokens/tokens.css, client/src/components/ds/tokens/glass.css |

## Not modeled in the kit
Screens with no kit equivalent: /spotted, /gifting, /pride-work, /submit, /inbox, /resume, /contact, /sponsors, /access, /legal. Nav and footer entries for these render but are inert.
Mobile bottom nav (Places / Events / Hub / Boards / Messages) is specified in components/layout/infra-action-nav.card.html but not wired into the kit shell, which previews at desktop width.
