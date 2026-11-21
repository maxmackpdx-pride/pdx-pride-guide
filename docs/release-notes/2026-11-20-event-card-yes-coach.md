# Release notes: Eventz open card (PR #115, Yes Coach pass), Nov 20, 2026

## What ships

- **One open event card** for every event tap (board, rails, EventModal callers). The front
  preview step is gone; the card opens directly.
- **Front board cards:** no share button (sharing lives on the open card).
- **Locked head:** a darker scrim band behind the three tiles and the tabs, so poster type never
  collides with the tab labels. The poster stays natural size, fades only at its own foot, never cut.
- **Tiles:** RIDEZ (`--neon-orange`), AFTERZ (`--yellow`), DIRECTIONS (`--green-acid`) in three
  equal columns across the full width.
- **ExpandingActionPanel** (replaces the tile sheets): the divider under the tiles splits into two
  accent lines and the panel opens inline (countdown-box surface, two drifting accent bloom orbs,
  small ✕). Lit active tile / dimmed others, cross-fade between tiles, close on same tile / ✕ /
  swipe up, static orbs for reduced motion and Calm Mode, no inner scroll, last-opened dot, light
  haptic, Directions distance + travel time when location is already permitted.
- **Ridez panel:** wide-short carpool cards (avatar, neighborhood, origin, departure time, seats
  left, ARRIVING / DEPARTING label). The dashed `+` is gone; the leading rail area opens a clearly
  marked "Expanded carpool card · design coming" stub; posting is OFFER A RIDE / I NEED A RIDE. Lyft,
  Uber and TriMet tiles open their websites in a new tab.
- **Ridez section (shared with the #117 drawer):** OFFER A RIDE and I NEED A RIDE open the expanded
  Ridez form with the event preselected (mode preset, Arriving/Departing kept). A compact
  Everybody / Friends / Friends of friends toggle (top right, persisted) filters the rail. A divider
  separates the controls from the list. NEEDS A RIDE cards join the rail: people going to this event
  plus anyone within 2 miles who needs a ride right now; a slow `--yellow` bloom marks someone going
  to your Afterz, `--neon-orange` someone going to this event (static in reduced motion / Calm Mode).
- **I'M COMING / Who's coming:** drivers tap I'M COMING on a NEEDS A RIDE card. The rider gets an in-app
  note and a push. The rider's Who's coming sheet shows each driver's avatar, rides given, ETA and an
  estimated fuel cost, plus the existing safety check-in.
- **Directions panel:** venue + address with COPY, distance/time chips, and large tiles: Zaylist
  Mapz (first, in-app), Google Maps, Apple Maps, Waze, Citymapper (new tab).
- **Countdown box:** fixed size, dead center; venue mark directly left, collective/host mark
  directly right on one center line. Yes Coach uses its saved collective logo.
- **Info:** GOING / REMOVE MY ATTENDANCE shows once, at the foot of Info (no longer on every tab).
- **Feed (THE PREGAME):** whole bubbles only (max three), CTA first; taps open the inbox group chat.
- **Nearby:** restaurant cards are the standard Placez small card (artwork, logo, or place mark).
- **Backdrop:** one shared blur behind every expanded card, except the bottom dock.

## API

- `GET /api/events/:id/occurrences/:date/planning`: each ride now includes `driverPhotoUrl` and
  `circle` (you / friend / fof / everybody); new `needs[]` (members only, no coordinates).
- New: `POST` / `DELETE {planning}/needs(/me)` for I NEED A RIDE, and `POST` / `GET` / `DELETE
  /api/ridez/needs` for location-only needs within 2 miles (the #117 drawer). New tables `ride_needs`,
  `ride_need_responses`.
- New: `/api/ridez/needs/:id/coming` (POST/DELETE, `/location`, `/arrived`), `GET /api/ridez/needs/mine/coming`,
  `POST /api/ridez/needs/:id/watch` (the existing ride check-in), `GET /api/ridez/fuel`.

## Fixes behind CI

- Card stage releases the page's both-edge scrollbar gutter while open (mobile 10px gutter).
- Motion fixture loads the Tailwind 4 Vite plugin (AuthModal's fixed scrim).
- Open card poster uses the responsive DPR variants (srcset), retrying the original on error.
- The at-event dialog leaves the modal layer when its exit animation starts, so one Escape closes
  the card underneath.

## Next (not in this version)

- Optional Cash App / Venmo handles in profile settings (visible only to matched ride partners) and the
  on-arrival "Thank them with a tip" popup.
- A live Portland gas price. Fuel is a configurable constant labeled "est.".

## Design notes: future (NOT in this version)

- **Afterz.** Afterz is not host-only. (1) "Host an Afterz" (e.g. while at the party) opens an
  expanded form to create/host one. (2) The Afterz list displays like the Ridez carpool rail:
  wide-short cards with avatar, neighborhood, and "You" or "Ask for invite"; any user can tap a
  card to open that Afterz's event card. "Ask for invite" is for people leaving the event, reaches
  everyone within the normal event radius, and will use `POST /api/afterz/gatherings/:id/request`
  (PR #117).
- **Expanded carpool card:** design pending (stub ships).

## Future: iPhone integration

iPhone integration that can be done in-browser within the app is planned but is **not included in
this version**. Documentation only: no code, stub or flag for it ships here.
