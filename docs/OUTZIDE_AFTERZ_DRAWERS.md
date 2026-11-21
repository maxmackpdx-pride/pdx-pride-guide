# Outzide and Afterz drawers

These rooms use the shared DrawerTop from `client/src/components/drawers/DrawerTop.tsx`. Do not fork a second top. Import it from `@/components/drawers`.

## Outzide

Path: `client/src/components/outz/OutzideDrawer.tsx`, mounted on the Outzide map (`/outzide` and `/map?mode=outzide`).

The Placez calendar is replaced by a `lead` rail of full-bleed mini cards for whatever is in view on the map (events and places). The countdown card still lists the next three names, and it mixes featured buddy events (`/api/outz/buddies`) and offered carpools (`/api/outz/feed`, "Offering a ride") with regular next-up events. Section titles use the ransom-note style (exactly one whole word inverted). That title style is for Outzide titles only.

Helpers: `shared/outzideDrawer.ts`, `client/src/lib/outzideDrawerApi.ts`.

## Afterz

Path: `client/src/components/afterz/AfterzDrawer.tsx`, mounted on `/map?mode=afterz`.

The shared top stays in place (calendar, countdown, two-row filter rail). Below it:

1. A wide Host an Afterz button, which opens the host form (`POST /api/afterz/gatherings`).
2. Wide, short cards with a `--yellow` bloom. Each card shows the host name, the Afterz type (Hang out, Chill / relax, or The party continues), and RSVP Yes / No. Yes posts to `/api/afterz/gatherings/:id/request`. No posts to `/api/afterz/gatherings/:id/leave`. There are no attendee counts.

The Afterz window is 9 PM to 6 AM Pacific (`shared/afterzWindow.ts`, also `GET /api/afterz/window`). Hosts can invite friends anytime. People in the area can request to join only once the window opens. Afterz will not show on the map before then. During off hours the map blurs, this drawer opens, the button reads Host an Afterz in advance, and the background under the drawer explains the times and how Afterz works.

Agent-callable helpers live in `client/src/lib/afterzDrawerApi.ts`.
