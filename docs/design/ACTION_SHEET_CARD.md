# ActionSheetCard: the card opened from a card

Owner direction: Tucker, Nov 20 2026 (t302u to t306u, t308u). Code:
`client/src/components/cards/ActionSheetCard.tsx`, `ActionSheetCard.css`,
motion in `client/src/components/cards/flipCard.ts`.

ActionSheetCard is a card type of its own. Use it for everything a card opens on top of itself:
option lists (Maps, Rideshare), item cards (Gigz, Mizzed), and popups (share,
invite, message host, the share-link join prompt). Don't build ad-hoc `.osheet`/`.opop` shells.

## Anatomy

```
scrim (black 50% + 12px blur over the host card)
└─ .zas  deep glass box, accent = --tile
   ├─ grab bar (placement="sheet" only)
   ├─ close ✕ (44px)
   ├─ header: [icon 40px, accent rim] KICKER (Barlow Condensed 700, .24em, accent)
   │                                   TITLE (800, white)
   ├─ children (notes, forms, previews)
   └─ actions: full-width .obtn pills, one may be .obtn--accent
```

## Props

| prop | type | notes |
|---|---|---|
| `accent` | CSS color token | **The opener's color.** Tile color for tiles (Maps green-acid, Rideshare magenta); the event accent for popups opened from the event card. Drives the edge, glow, icon, kicker and button glow. |
| `kicker` | string | Small uppercase label, e.g. `DIRECTIONS`. |
| `title` | string? | Second line, e.g. `TO SANCTUARY CLUB`. |
| `icon` | ReactNode? | The header icon. For tiles, pass the same icon as the tile. |
| `label` | string | Accessible dialog name. |
| `origin` | `OriginRect \| null` | Rect of the opener (tile face or tapped card). This is where the box grows from and shrinks back to. |
| `motion` | `"grow" \| "flip"` | `"grow"` for tiles; `"flip"` (default) for cards. |
| `iconOrigin` | `OriginRect \| null` | `grow` only: rect of the tile's icon. The header icon travels from it. |
| `onDismiss` | `() => void` | Called **after** the exit animation. |
| `actions` | `{label, href?, onClick?, external?, primary?, disabled?}[]` | Rendered as `.obtn` pills. `external` opens a new tab and adds ↗. |
| `placement` | `"sheet" \| "card"` | `sheet` docks to the bottom (option lists). `card` centers (items, popups). |
| `wide` | boolean | 420px instead of 360px (share-image previews). |

## Motion

There are two motions. Both use only `transform` and `opacity` through the Web Animations API.

- **grow** (tile-opened sheets: Carpool, Afterz, Maps, Rideshare). There's no flip.
  - The box scales up from the tile-face rect into place (380ms, `cubic-bezier(.2,.8,.2,1)`).
  - Meanwhile the tile's icon travels and scales into the header icon slot.
  - On dismiss, both run in reverse (320ms).
- **flip** (full cards: the event card itself, Gigz and Mizzed item cards, popups opened from a card).
  - Flip-and-grow from `origin`: `perspective(1200px) rotateY(-90deg → 0)` plus translate/scale from the origin rect, 420ms.
  - On dismiss, it flips and shrinks back to the origin.
- **Swipe down** past 90px dismisses (from wherever it was dragged). Under that, it snaps back.
- **Reduced motion / Calm Mode** (`prefers-reduced-motion`, `html.calm-mode`): a 180ms fade, with no transform.

Exception to "cards never scale" (LIVE_DESIGN_STANDARD, Homepage): that rule covers
the fixed card footprints on boards. Open transitions of overlay cards may scale
transiently. The resting state is always unscaled.

## Buttons

There's one class, `.obtn`: the open card's ADD TO SCHEDULE pill.
- Specs: 44px tall, 22px radius, white 1.5px rim, black fill, top accent bloom, Barlow Condensed 800 15px.
- `.obtn--accent` swaps the rim to the accent. Use it for the single primary action.
- Round icon buttons stay 44px circles.

## Surfaces

What a tile opens uses that tile's color as a deep-glass surface (t302u).
- The fill is near-black with a 12% accent radial at the top.
- The edge is a 63% accent keyline over a 2px black ring, with a 2-ring glow.

## Rules

- Never auto-send: message/DM sheets prefill an editable textarea and send only on tap.
- No attendee lists or counts anywhere in these cards.
- Escape, scrim tap, ✕ and swipe down all dismiss through the same exit motion.

## Logo slot

ActionSheetCard and FormCard take `logo?: CardLogo`:
- `FAMILY_LOGOS.afterz`, `.mizzed` and `.gigz` come from `client/src/components/cards/cardLogo.tsx` and point at the `/brand/family/` artwork.
- `"ridez-pending"` renders a dashed **RIDEZ · LOGO PENDING** placeholder in the tile color. The Ridez logo is not drawn yet, so this is not final art. Rideshare and Carpool use it until the logo ships.

---

# FormCard

Code: `client/src/components/cards/FormCard.tsx` and `FormCard.css`. The event flows live in `client/src/components/events/EventFormCards.tsx`.

Every flow that leads to a form flips the current card into a full-size extended card of the same size and accent:
- claim this event
- post Mizzed
- post Gigz
- message host
- report / request a change
- invite friends to Afterz

On submit the card turns to a thank-you face, then flips back.

## Props

| prop | type | notes |
|---|---|---|
| `accent` | color token | The opener's accent (`--a` for the event, the tile color for tiles). |
| `kicker` | string | The action, e.g. `CLAIM THIS EVENT`. It is the header word-mark when there is no logo. |
| `title` | string | The event or item name, shown small under the logo. |
| `logo` | `CardLogo?` | The feature logo (Afterz, Mizzed, Gigz, Ridez placeholder). |
| `intro` | ReactNode? | One or two sentences in plain language about what happens. |
| `fields` | `FormCardField[]` | `{name, label, kind: text\|textarea\|email\|select\|checkbox\|date\|time, required, placeholder, hint, options, minLength, maxLength, rows, defaultValue}` |
| `submitLabel` | string | A verb, e.g. `POST GIG`. |
| `onSubmit` | `(values) => Promise<void>` | Throw an Error to keep the form open and show its message. |
| `success` | `{title, body?, next?}` | The thank-you face. `next` is the single follow-up action. |
| `draftKey` | string? | Turns on local autosave. |
| `origin` | `OriginRect?` | Where the card flips from. Defaults to its own rect, so it flips in place. |
| `autoReturnMs` | number? | Default 2200ms. When `next` is set it defaults to 0, so the card waits for DONE. |
| `gate` | ReactNode? | Replaces the fields, e.g. a sign-in prompt. |

## (7) One header for every form

The header always has the same three parts:
1. The **feature logo**. When there is no feature logo, the action is shown as a Barlow Condensed 900 word-mark in the accent.
2. The **event name** in small type under it.
3. An **accent line**.

Below the header come the action (when a logo is present), the intro, and then the fields. Labels are Barlow Condensed 700, tracked, in the accent color. Inputs are black, 44px or taller, 12px radius, 16px text (so iOS doesn't zoom). Actions are CANCEL plus the primary pill.

## (3) Drafts autosave

With `draftKey`, every change is written to `localStorage["zaylist:draft:<key>"]`. An accidental dismiss (swipe, Escape, scrim) keeps the typed text, and reopening restores it. Only fields with the same name and type are restored. A successful submit clears the draft. Event forms use `<kind>:<eventId>:<date>[:<gig>]`.

## (5) Thank-you offers one next step

The thank-you face shows a check in the accent, the success title and one line of copy. With `success.next` it shows exactly one relevant follow-up and waits for the user:
- Gigz: **SHARE YOUR GIGZ POST**
- Afterz: **INVITE ANOTHER FRIEND**
- Mizzed: **SHARE THIS EVENT**

DONE flips back. Without `next`, the card flips back by itself after 2.2s.

## Motion and haptics

FormCard flips like a full card. A light `navigator.vibrate` tick fires on card open, on a successful submit and on swipe-down dismiss. It's a no-op where unsupported, and off in Calm Mode and under reduced motion (`haptic()` in `flipCard.ts`).

## Tile states

- **Press:** the face dips for 90ms with an accent glow, and then the sheet grows from it.
- **Window badge:** Afterz shows `OPENS 2D` until its window opens, using `getAfterzWindow` in `shared/afterzWindow.ts` (opens 72h before doors, closes 30 min after the end, same helper as the server). Mizzed isn't a tile; its rail "+" slot shows the locked "Opens in" state from `getMissedConnectionWindow`.
- **Activity dot:** Carpool and Afterz show a dot when there are ride posts the viewer hasn't seen since last opening that tile. It uses the planning endpoint's `rides`, has no counts, and is static in Calm Mode and under reduced motion.

---

# Hearts: "I'm interested"

A heart means **I'm interested**. It applies site-wide (events, places, Needz, Boardz, OutZide) and does two things:
1. It **saves the card to the member's Stacks** (`card_hearts`, `server/hearts.ts`).
2. It **follows the card's updates**.
   - Events: host updates (time or venue changes and other host notices) now go to hearted members too, through the existing `notifyAttendeesOfHostUpdate` HOST_UPDATE delivery.
   - Places: the existing business follow.
   - OutZide: the existing destination follow.

The label comes from one helper, `heartLabel(name, hearted)` in `client/src/hooks/useHearts.ts`:
- Off: "Interested in {name}: save it and get updates".
- On: "Interested in {name}, saved with updates on. Remove" (title "Interested · saved, updates on").

There are no counts. The API is `POST /api/hearts {kind, ref, title, href, ...snapshot}` and `DELETE /api/hearts {kind, ref}`. Both are idempotent: adding twice upserts one row, and deleting a missing row is ok.

Not covered yet (needs a decision, not a new system):
- Event chat, Mizzed/Gigz posts, Afterz opening and countdown-state notifications don't exist for anyone yet, so hearts can't follow them.
- Small event cards (Tonight, rail, square) still use the heart glyph for the private **schedule** save.
- `VenueFollowButton` follows but doesn't pin to Stacks.

---

# Agents: every card action has an API

Users' own agents act with the user's session (same cookie auth), on the same endpoints the UI uses. None of these expose counts or attendee lists.

**Anything that reaches another person** (DMs, invites, message host, chat posts, gig posts) **must be confirmed by the user before the agent sends it.** The UI enforces this by never auto-sending. An agent must do the same. There is no server-side confirmation token yet; that's a gap.

| Action | Endpoint | Notes |
|---|---|---|
| Read event | `GET /api/events/:id/detail?date=YYYY-MM-DD` | Event, venue, hosts, hostGroup, gigs, Mizzed, nearby. No attendance counts. |
| Read event (markup) | open card `script[type="application/ld+json"]` | schema.org `Event` |
| Add / remove schedule (private) | `PUT` / `DELETE /api/events/:id/save` | Idempotent |
| Interested (heart) | `POST` / `DELETE /api/hearts {kind:"event", ref:"<id>", title, href}` | Idempotent. Saves to Stacks and follows host updates. |
| Going / join chat | `POST` / `DELETE /api/events/:id/attendance` | Joining the chat = Going |
| Chat read / post | `GET` / `POST /api/events/:id/chat {body}` | Members only; 403 otherwise. **Confirm before posting.** |
| Planning (rides, gigs, window) | `GET /api/events/:id/occurrences/:date/planning` | |
| Carpool / Afterz ride | `POST …/planning/rides`; `POST`/`DELETE …/rides/:ride/requests` | Existing NightRideTools flows. Each ride in `planning.rides` now carries `driverPhotoUrl` (members-only payload). |
| Get a ride (Uber / Lyft / TriMet) | `a[data-action=ride-uber|ride-lyft|ride-trimet]` in the Ridez panel | Plain website links in a new tab (see the RIDEZ panel table). No API, no app hand-off. |
| Post Mizzed | `POST /api/missed-connections {title, body, eventId}` | Anonymous. **Confirm.** |
| Post Gigz (hosts) | `POST /api/gigs {postType:"POSTING_GIG", title, description, name, contactEmail, eventId, occurrenceDate, acceptRules:true}` | 403 unless host. **Confirm.** |
| Message host | `POST /api/events/:id/message-host {body}` | `NO_CONTACT` means no host account, so invite instead. **Confirm.** |
| Invite a friend | `GET /api/users/me/people/following`; `POST /api/users/:username/message {subject, body}` | One friend per send. **Confirm.** |
| Claim event | `POST /api/submit {type:"CLAIM", eventId, claimReason}` + `Idempotency-Key` | Admin review |
| Report / request change | `POST /api/feedback {category:"EVENT_CORRECTION", message, pageUrl}` | |
| Share link | `<event url>?ref=share&from=<username>` | The social image renders client-side (`renderShareImage`) |

Errors are `{error: string}` with HTTP 400/401/403/404/409. No new endpoints were added for the card. One server change: hearted members now get host updates.

## Markup for agents

- Every action carries a stable `data-action` attribute:
  - tiles: `carpool`, `afterz`, `maps`, `rides`
  - card buttons: `share`, `heart`, `claim`, `report`, `post-gig`, `post-mizzed`, `join-chat`, `close`
  - panel and sheet actions: the slugified label; Ridez panel: `open-carpool`, `ride-lyft`, `ride-uber`, `ride-trimet`; Ridez section: `ridez-offer`, `ridez-need`, `ridez-circle-everybody|friends|fof`
  - forms: `data-form` on the form and `data-action="submit"` on the submit button
- The card root has `data-zay-card="event" data-event-id data-occurrence`.
- Every swipe has a button (✕ / Close), and no action is hover-only.

## Agent workflows

1. **Add to schedule and invite friends:**
   1. `GET detail`.
   2. `PUT /save`.
   3. `GET people/following`.
   4. For each friend the user confirms, `POST /api/users/:u/message` with the event link (`?ref=share`).
2. **Offer to perform via Gigz:**
   1. `GET planning` to list the gigs.
   2. Draft a message.
   3. After the user confirms it, `POST /api/events/:id/message-host`. On `NO_CONTACT`, share the event link and the "I can help with this" image instead.
3. **Follow an event:**
   1. `POST /api/hearts`. Host updates now arrive in the inbox.
   2. Optionally `POST /attendance` to join the chat.

---

## App Translation

Not yet worked out. Theory only: ActionSheetCard maps to a native sheet and FormCard to a pushed modal, but this is undecided and unbuilt.

## Event card tiles (t327u, t345u): RIDEZ · AFTERZ · DIRECTIONS

Three tiles under the host slot, in three equal columns across the full card width:

| Tile | Token | Panel |
|---|---|---|
| RIDEZ | `--neon-orange` (Ridez logo slot `ridez-pending`) | Carpool rail + ride websites |
| AFTERZ | `--yellow` | Afterz window + invites |
| DIRECTIONS | `--green-acid` (was MAPS) | Apple/Google Maps / Zaylist Mapz, distance + time |

A darker scrim band sits behind the tile row and the tabs, so poster type never collides with the
tab labels. It only darkens; the poster keeps running behind it and is never cut.

# ExpandingActionPanel: the in-card tile panel (t345u)

`client/src/components/cards/ExpandingActionPanel.tsx`. The tiles no longer open sheets. Tapping a
tile splits the divider under the tiles into two accent lines (the panel's top and bottom edges)
and opens the content inline between them; the tabs and page below slide down with it.

- **Surface:** the countdown box's (`--fbx-chip-bg`). Two large bloom orbs in the tile accent
  drift off the top-left and top-right corners, deliberately unequal in size and offset.
- **Close:** the site's small ✕ (`.zas-x`) in the corner, tapping the same tile again, a swipe up,
  or Escape inside the panel.
- **The 8 rules:**
  1. The pressed tile stays lit (`.otile.is-active`); the others dim slightly.
  2. Another tile cross-fades content, orbs and lines without closing (`panelKey`).
  3. The same tile, the ✕ or a swipe up closes it.
  4. The orbs drift slowly; static under `prefers-reduced-motion` and Calm Mode.
  5. The panel fits its content with no inner scroll. While it is open, the locked head and page
     scroll together and the footer stays pinned. The height animates (`grid-template-rows`).
  6. A small dot marks the last opened tile (`localStorage zaylist:last-tile:<eventId>`). It never
     auto-opens.
  7. A light haptic on open and close (`haptic()`, off in Calm Mode / reduced motion).
  8. Directions shows distance and travel time in its header, only when location is already
     permitted (`usePermittedTravel`: Permissions API `granted` only, never prompts). Walking under
     about 1.2 mi, otherwise a rough drive estimate.
- **Props:** `panelKey`, `accent`, `label`, `kicker?`, `title?`, `meta?`, `logo?`, `centered?`,
  `actions?` (same `ActionSheetAction` shape), `open`, `onRequestClose`, `onClosed`, children.
- **A11y:** a labelled `section`; each tile carries `aria-expanded` and `aria-controls="ocard-tile-panel"`.
- Dialogs opened from cards (Gigz, Mizzed, carpool card, share / invite / message popups) remain
  ActionSheetCard over the blurred backdrop.

**RIDEZ panel.** Single column, the Ridez logo placeholder and `TO <VENUE>` centered:
1. `CARPOOLS` rail. The first, leading area is a real button
   (`data-action="open-carpool"`, aria-label "Open the expanded carpool card…"). There is no dashed
   `+`. It opens the **expanded carpool card**, which is not designed yet: a clearly marked stub
   ("EXPANDED CARPOOL CARD · DESIGN COMING", `data-stub="expanded-carpool"`) over the blurred
   backdrop with flip-and-grow and the site ✕. Posting moved out of the stub to OFFER A RIDE /
   I NEED A RIDE (see "Ridez section" below); carpool cards still open the at-event ride flow.
2. Carpool cards are **wide and short** (248×124, 2:1, Afterz-style proportions): the standard
   small-card chrome with the Boardz torn edge (`torn-card-wide.svg`) in `--neon-orange`. Each card
   shows only real planning-API fields:
   - the offerer's avatar (`driverPhotoUrl`, else their initial)
   - their neighborhood (`area`: required on every offer, "where you're coming from")
   - the origin (`plan.meeting`, the public meeting place)
   - the departure time (`plan.leaveBy`; omitted when the offer has none)
   - seats left (`remaining`: functional, not an attendee count)
   `ARRIVING` / `DEPARTING` stays at the top of each card. Both kinds show anytime. Tapping a card
   opens the full carpool flow with flip-and-grow. The rail follows the Mizzed/Gigz rail rules.
   Departing (ride home) keeps the server safety rule: the poster must be Going and verified
   present at the venue, so it can't be posted before check-in yet (product decision pending).
3. `RIDE APPS`: three square brand-color icon tiles (Lyft, Uber, TriMet). They open each
   **website in a new tab** (`target="_blank" rel="noopener noreferrer"`), never an app deep link,
   a universal-link hand-off, an in-app webview, an iframe or a sheet:

   | Brand | URL | Venue passed? |
   |---|---|---|
   | Uber | `https://m.uber.com/go/product-selection?drop[0]=<Location JSON>` (`latitude`, `longitude`, `addressLine1` = venue, `addressLine2` = address) | Yes, with coordinates. This is the m.uber.com web ride flow's `drop[0]` Location object (Uber deep-link docs). Without coordinates: `https://m.uber.com/go/home` (no destination). |
   | Lyft | `https://ride.lyft.com/u?destination[latitude]=…&destination[longitude]=…` (the Lyft SDK's web mode) | Coordinates only. Lyft has no name or address parameter, so without coordinates it opens `https://ride.lyft.com/`. |
   | TriMet | `https://trimet.org/home/planner?toPlace=<Venue>::<lat>,<lng>` (or `toPlace=<address>`) | Yes (TriMet trip planner `toPlace`). |

**AFTERZ panel.** The Afterz window, INVITE FRIENDS, and INVITE PEOPLE NEARBY while open.

**Third-party brand exception.** Lyft/Uber/TriMet colors are the one allowed non-system color,
only on those buttons, from `ds/tokens/brand-third-party.css` (`--brand-lyft #FF00BF`,
`--brand-uber #FFFFFF` (Uber's reverse mark, since black disappears on black), `--brand-trimet
#0E68B0`). Marks are simplified wordmarks in `cards/rideBrands.tsx` until the official logo files
are dropped in.

## Ridez section: shared `RidezRail` (owner, Nov 20)

`client/src/components/ridez/` holds the Ridez pieces shared by the event card Ridez panel (#115)
and the Afterz/Ridez drawer (#117):

| Component | What it is |
|---|---|
| `RidezRail` | OFFER A RIDE / I NEED A RIDE (expanded-card `.obtn`, Ridez `--neon-orange`), the circle toggle top-right, a divider (`hr.zridez-div`), then one wide-short rail of NEEDS A RIDE cards and carpool offers. |
| `RidezCircleToggle` + `useRidezCircle` | Compact 3-way segmented radiogroup: Everybody / Friends / Friends of friends. Default Everybody, persisted (`localStorage zaylist:ridez-circle`), arrow/Home/End keys, roving tabindex. Filters offers and needs. |
| `RideNeedCard` | The carpool card chrome with the label NEEDS A RIDE: avatar, neighborhood, @user, "Going to this event" or "0.3 mi away · right now". |
| `RidezFormCard` | The expanded Ridez form (FormCard). From an event card the event is preselected (no picker). Mode preset offer vs need; Arriving/Departing kept. |

**Circle buckets** come from the server on every ride and need: `circle: "you" | "friend" | "fof" | "everybody"`.
Friend = mutual follow (the same rule as ride-check trusted members). Friends of friends = mutually follows
one of your friends (scan bounded to 500 friends). Only the bucket is returned, never the linking friend.
Note: during the follow-all soft launch (`FOLLOW_ALL_DEFAULT`, on by default) nearly everyone is a "friend".

**Bloom:** a NEEDS A RIDE card pulses slowly in `--yellow` when the person is going to the same Afterz as
you (host or accepted guest of the same open gathering), else `--neon-orange` when they're going to the same
event. Static under reduced motion and Calm Mode. Afterz cards sort first, then same event.

**The leading rail area** still opens the marked expanded-carpool stub; posting moved to the two buttons.
Tapping a NEEDS A RIDE card opens OFFER A RIDE.

### Ridez API

| Call | Purpose |
|---|---|
| `GET {planning}` | `rides[].circle`, `needs[]` (members only): same occurrence + anyone within 2 mi of the venue who posted in the last 3 h. Fields: `id, user, photoUrl, area, direction, mine, sameEvent, sameAfterz, circle, distanceMi` (no coordinates). |
| `POST {planning}/rides` | OFFER A RIDE: `{area, seats 2–8, kind carpool|home, meeting, leaveBy, oneWay}` (existing). |
| `POST {planning}/needs` | I NEED A RIDE: `{direction arriving|departing, area}`; one per person per occurrence (upsert); located at the public venue; expires 30 min after the event. |
| `DELETE {planning}/needs/me` | Withdraw it. |
| `POST {planning}/rides/:ride/requests` | Optional seat request from the need form (existing). |
| `POST /api/ridez/needs` | Location-only need for the drawer: `{lat, lng, area}`; 3 h. |
| `GET /api/ridez/needs?lat&lng` | Needs within 2 mi right now (drawer). |
| `DELETE /api/ridez/needs/me` | Withdraw the location-only need. |

## Design notes: future Afterz cards (NOT in this version)

Notes only. Nothing below is built, stubbed or flagged in this version.

1. **Host an Afterz.** Tapping "Host an Afterz" (for example while at the party) opens an expanded
   form to create and host an Afterz.
2. **Afterz list.** Afterz is not host-only. The list displays like the Ridez carpool rail: wide,
   short cards with the host's avatar, the Afterz's neighborhood, and either "You" (the user's own
   Afterz) or an "Ask for invite" action. Any user can tap a card; it opens that Afterz's own event
   card (the event card, for the Afterz).
3. **Ask for invite** is for people leaving the event and reaches everyone within the normal event
   radius. It will be wired to the existing invite-request plumbing
   (`POST /api/afterz/gatherings/:id/request`, PR #117).

## Countdown box (t345u)

The countdown never changes size (fixed 132px column, tabular numerals) and stays centered both
ways. The venue mark sits directly left and the collective/host mark directly right, each centered
in an equal side column on the same center line, so the padding is even on both sides. With one mark
the countdown stays centered. Never stacked above or below.

## Standard small card (t327u/t329u)

Every small card in an event rail (Mizzed, Gigz) and Nearby restaurants is the site's existing standard
small card: the Boardz zine small card (`BoardBrowseCard size="small"` → `PunkBoardCard` →
`ZineSmallCard`) at `--card-small-width/height` (136×170), with its existing torn rim in the
category accent. Do not build a new card; convert the data to a `BoardPost`
(`client/src/components/events/EventRailCards.tsx`). Empty/new slots are a black square, dashed
accent border, `+`. Tapping a card flips/grows it open over a blurred background. Nearby restaurants
use the standard Placez small card (`PlaceDiscoveryCard size="small"`): artwork, else the directory
logo, else the place-mark fallback. Ridez carpools use the wide-short card above.

## Feed = JOIN THE PREGAME (t327u)

The FEED tab does not host the chat. It is a transparent call to action: no panel, no scroll, no
input. Members see the newest bubbles that fit (read-only, faded at the top) and OPEN THE PREGAME;
non-members see JOIN THE PREGAME (joining = Going, `POST /api/events/:id/attendance`); signed out
sees SIGN IN TO JOIN. Every tap opens the inbox group chat directly:
`useInboxSheet().openSheet({ view: "chats", group: { kind: "EVENT", id, title, calendarDate } })`.

## Shared expanded-card backdrop (t332u)

One backdrop for every expanded card (open event card, Gigz/Mizzed/carpool cards, action sheets,
forms, share popups): `--z-backdrop-tint` + `--z-backdrop-filter` (`blur(var(--z-backdrop-blur))`,
12px) in `ds/tokens/effects.css`. `prefers-reduced-transparency: reduce` swaps to a 94% solid tint,
no blur. The backdrop always stops above the bottom dock (`CardStage` measures the dock and
publishes `--z-dock-h`), so the dock stays sharp and usable. Collectives: the countdown box uses a
party collective's saved SceneZ logo (`sceneCollectiveLogo(slug)`) before the name-matched
directory trace.
