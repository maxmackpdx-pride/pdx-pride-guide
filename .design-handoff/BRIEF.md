# PDX Pride Guide — Build Brief

## 0. The one rule that matters most
**Preserve as much of what I already have as possible.** Add to my existing site; do not rebuild or
restyle it. Treat everything below as "add these animations and this feature on top of my current
site," NOT "design something new." When in doubt, keep mine and ask me before changing it.

**Exception — when the reference is clearly better, use the reference version.** The main example is
the **marquee/neon ticker**: mine is worse, replace it with the reference one. If you spot another
piece where the reference is a clear upgrade, *ask me first* before swapping.

---

## 1. What this is
I have two reference files from a design session:
- `Pride Motion Guide.dc.html` — a motion field guide: the visual system + a menu of animations.
- `Im Here Events.dc.html` — the "I'll be there" feature for the Events tab (bubble physics + RSVP).

These are **working HTML/CSS/JS prototypes**, not the final site. Rebuild the chosen pieces in my
real codebase using its existing framework and patterns. The `.dc.html` wrapper and `support.js` are
just the prototyping harness — ignore them; copy the markup, CSS, and JS logic out.

---

## 2. Visual system (keep consistent everywhere)
- **Pure black** backgrounds (`#000`, cards `#0a0a0a`, wells `#0d0d0d`).
- **Electric neon** accents: lime `#C8FA3C` (primary), magenta `#FF1FA0`, cyan `#19E3FF`,
  violet `#A24BFF`, orange `#FF8C00`.
- **Full Pride spectrum** for gradients/sweeps/loaders: `#E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787`.
- **Type:** Anton (poster headlines, uppercase), DM Sans (body), DM Mono (labels/tags, uppercase, wide tracking).
- Texture: subtle film-grain overlay, urban-ink/poster-grunge feel.

---

## 3. KEEP exactly as they already are (do not touch)
- ✅ **My pink-and-green secondary headers** — magenta fill, black text, lime-green border with the
  hard offset green shadow (the "sticker" tag look). I love these. Leave them everywhere they appear.
- ✅ My existing layout, page structure, copy, and navigation.
- ✅ The "X PEOPLE / X GOING" count badge concept.
- ✅ My logo (I like it). Enhance only via presentation (see §6), don't redraw it.

---

## 4. ADD these animations from the motion guide
Bring these in, matched to the reference's exact colors/timing/easing:
- ✅ **Staggered reveals** — rows/sections fade-and-rise in sequence on scroll-in (use IntersectionObserver in production).
- ✅ **Spectrum loaders** — prism-ring spinner, bobbing dots, shimmer bar, for loading states.
- ✅ **Neon ticker / marquee** — opposing poster-type scrolling rows. **Replace my current marquee with this.**
- ✅ **Alive-on-hover** — spectrum-sweep buttons + lifting cards with neon edges.

## 5. DON'T like / leave out
- ❌ **The glitch effect was too much** — too fast and too busy. If used at all, keep it the toned-down,
  **pixelated/chunky, slow, low-frequency** version (reduced internal resolution, rare bursts, slow
  rolling band). Default to **not** putting it on content-heavy areas.
- ❌ Don't over-add motion. If it's not in §4, don't introduce new animations without asking.
- ❌ Don't introduce new fonts or colors outside §2.

---

## 6. Logo treatment
The logo file has a **black background**. In the prototype it's shown with `mix-blend-mode:screen`
(drops the black out) plus a soft cyan/lime radial glow behind it. **If I can give you a transparent
PNG/SVG, use that instead** and drop the blend trick.

---

## 7. Events tab — "I'll be there" feature
Component on the event detail page. Wording is **"I'll be there"** (future tense), not "I'm here."

**Data model:** `rsvps[]` of `{ userId, avatarUrl, displayName, phrase }`.
`phrase` enum: `HEY | ILL_BE_HERE | WANT_TO_CHECK_OUT | LOOKING_FOR_SOMEONE | WORKING_THIS`.

**Desktop — bubble physics:**
- Each RSVP = ~60–64px circular avatar in a ~300–340px fixed-height container.
- requestAnimationFrame loop: each bubble has x/y + slow velocity, bounces off walls, slight drift.
- **Hover** → bubble expands and a **speech bubble pops from that avatar showing their pre-selected
  phrase + display name** (phrase shown in its accent color, with a pointer tail). This is core — the
  phrase is the one they picked at RSVP, pulled from their record, not chosen on hover.
- New RSVPs animate in from center with a pop/scale-in.

**Mobile — horizontal scroll strip:**
- Same data; `overflow-x:scroll` row of ~80px avatars, snap scrolling.
- Tap avatar → expand inline below with speech bubble + name + message button (if mutual).

**Phrase selector:** modal (desktop) / bottom sheet (mobile) on the "I'll be there" press — 5 pill
options, pick one, confirm → writes RSVP. Can change phrase later from their own bubble.

**Mutual message gate:** Message button renders only if `currentUser.hasRsvpd === true` AND
`bubble.userId !== currentUser.id`. Message → opens existing inbox thread or creates a new one.

**State/real-time:** keep the count badge ("X GOING"). Physics state is local, not persisted.
New RSVPs should appear without refresh — websocket, or poll ~30s.

---

## 8. Implementation notes
- Convert prototype inline styles to my codebase's styling approach (CSS modules / Tailwind / etc.);
  the values above are the source of truth.
- Honor `prefers-reduced-motion`: freeze glitch on one frame, stop marquee/aurora loops, make reveals instant.
- Most motifs are CSS-only; the glitch and the bubble physics are the only ones with real JS.
- **Again: preserve my current site. Add on top. Ask before replacing anything except the marquee.**

---

## 9. Gifting page — build notes
- **"Open Grab" filter.** The board filters are **All · Gift · In search of · Open Grab**. *Open Grab* = first-come-first-grab items left out for anyone (set it on the corner/porch, no hand-raising or picking process) — distinct from regular Gift posts where the poster picks from up to 3 raised hands. Grab posts show an "Open Grab" tag and a "on the corner — first come" status instead of a hands count.
- **Use existing wallpapers.** The prototype uses the hero collage / gradient placeholders for the Gifting hero and listing thumbnails. In production, pull from my existing wallpaper/background assets already in the site — don't generate new art.
- **Connect uploaded images to the post.** When a user uploads photo(s) in the post form (up to 2 per the "Add photos" step), wire those uploaded files through to the listing record so each Gift / In Search Of card renders the user's actual uploaded image — not the placeholder thumbnail. The thumbnail slot on each board card should bind to `post.images[0]`.
