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
| Carpool / Afterz ride | `POST …/planning/rides`; `POST`/`DELETE …/rides/:ride/requests` | Existing NightRideTools flows |
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
  - sheet actions: the slugified label
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
