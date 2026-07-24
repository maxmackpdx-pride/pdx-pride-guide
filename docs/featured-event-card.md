# Featured Event Card - template & how it rotates

The **featured event ad** is the big glowing card pinned at the top of the Hub
Scene Feed (the one built for **Stank · Yes Coach**): a poster/slideshow hero
that glows in the event's day color, with a live countdown and **Buy tickets** /
**RSVP** buttons. This doc is the recipe for adding another one and the rules
for how multiple featured events share the slot.

## Files

| Piece | File |
|---|---|
| The card component (poster + slideshow, countdown, CTA buttons) | `client/src/components/hub/sections/FeaturedEventAd.tsx` |
| The **`FEATURED` config + rotation/expiry logic** | `client/src/components/hub/sections/HubFeed.tsx` |
| Slideshow images | `client/public/posters/<key>-slides/` |

## How to add a new featured event (the template)

Three steps, all in `HubFeed.tsx` + `public/`:

**1. Make sure the event exists and is LIVE.** The card finds a real event by
its title (from `/api/events`) and pulls its poster, day color, ticket URL, and
start/end time from it. If it's not a live event yet, add/seed it first.

**2. Drop the slideshow images** in `client/public/posters/<key>-slides/`
(the frames that rotate after the poster). Name them however you like and list
them in the config. The event's own `posterImageUrl` is always the first frame.

**3. Add one entry to the `FEATURED` array** in `HubFeed.tsx`:

```ts
const CAMP_SLIDES = ["/posters/camp-slides/1.jpg", "/posters/camp-slides/2.jpg"];

const FEATURED: FeaturedConfig[] = [
  { key: "stank", anchor: true, match: (t) => /stank/i.test(t), slides: STANK_SLIDES },

  // 👇 new one - no `anchor`, so it rotates through the in-between slots
  { key: "camp", match: (t) => /gaylabration|camp/i.test(t), slides: CAMP_SLIDES },
];
```

That's it - the matching event auto-features. `match` is a function on the
event title, so use a regex loose enough to survive punctuation.

## How multiple featured events share the slot (the rules)

Only **one** featured card shows at a time, at the top of the feed. When there's
more than one eligible:

- **Yes Coach (the `anchor`) shows every other time.** A rotation counter in
  `localStorage` (`hub-featured-rotation`) flips each visit: even → the anchor,
  odd → a **random** pick from the other eligible featured events.
- With only the anchor eligible (today), it simply always shows Yes Coach.
- The pick is made **once per feed load** and stays put until the next visit.

## Expiry & dismiss (applies to every featured card)

- **Auto-expires after the event ends.** Once `Date.now()` passes the event's
  end time (`eventEndMs` handles the 9pm–2am cross-midnight case; falls back to
  ~6h if no end time), that card stops showing - no cleanup needed.
- **Dismiss (X) hides it for the rest of the Pacific day**, per event
  (`hub-promo-<key>-dismissed-day`). It comes back the next day (until the event
  ends). Dismissing one doesn't swap in another on the same load.

## What the card itself does (`FeaturedEventAd`)

- **Glows in the event's day color** (SAT → green, etc.), rounded, dismissible.
- **Hero**: the event poster (4s) then the extra slides (2s each), cross-fading
  and looping; every frame is full-width and top-anchored (never crops L/R).
- **Live countdown** to the event's Pacific start · "Kickoff in".
- **Buy tickets** (→ the event's ticket URL) and **RSVP** (→ opens the real
  event card / `EventModal` in place).
- It takes just `event` + `slides` + `onDismiss`, so any event can be featured.

## Quick checklist

1. Event is live (`/api/events` returns it) with a `posterImageUrl`.
2. Slides in `client/public/posters/<key>-slides/`.
3. One `FEATURED` entry (`key`, `match`, `slides`; add `anchor: true` only for
   the every-other event).
4. `npm run build`, then load `/dashboard` - the card shows at the top of the
   feed, glowing in the day color, and disappears after the event ends.
