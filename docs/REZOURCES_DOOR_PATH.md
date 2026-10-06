# ReZources door path: design handoff

Source: the "ReZources Door Path" design canvas (private artifact, 38 versions). This file records every
decision settled on that canvas so the page can be built and reviewed without it. Implementation lives in
`client/src/pages/Resources.tsx` and `client/src/pages/Resources.css`.

Design system sources: `zaylist-foundation-library` `public/design-system/` (type scale, motion tokens,
utility layer, lit plate). Live tokens: `client/src/components/ds/tokens/`.

## The one structural change

Step 01 ("What do you need?") owns the screen until a door is chosen.

| | Phone (under 720px) | Desktop |
|---|---|---|
| Choosing a door | Replaces step 01 with the next screen. It does not scroll into step 02. | Doors stay at the top of one page. Choosing a door fills what is below. |
| Back | Back arrow, top left. Returns to the question. | Not needed. Doors stay on screen. |
| Skip to view all | **Removed everywhere.** Select all in step 02 does that job. | Same. |

Everything else from the live chrome is unchanged: Share (dark pill), Follow (yellow hairline), yellow circle 01,
START HERE, WHAT DO YOU NEED? in Barlow Condensed uppercase, one segmented control (Find a resource is the filled
acid-yellow segment with a black label, Talk to someone is the dark segment in the same pill, yellow hairline
around the whole control, press swaps the fill). No heart, no pink, no phone icon on the door.

## Screens

**Find.** Back arrow, yellow circle 02, EXPLORE CATEGORIES, I'M LOOKING FOR..., "Choose one or more categories.",
the ten checkbox tiles (labels and hairline colors unchanged), Select all / Deselect all, then the existing card
rail per picked category. Rail head: yellow mono kicker, condensed title, copy, count, "Swipe left · tap a card to
preview". The card object is unchanged (glass well, Share, pills, description, View details).

**Talk.** TALK TO SOMEONE kicker, "A person on the other end.", then hairline rows grouped as Crisis & safety
support, Queer people to talk to, OHP & local services (data already in `TALK_GROUPS`). Phone icon on the row,
never a heart. Call is a pill in the line's own rainbow color (see below). Text pill only on lines that take
texts (988; The Trevor Project, text START to 678678).

## Decisions added during review

1. **Select all / Deselect all** use the same 1.5px outline, radius, floor glow and 8% bloom as the category tiles
   (green acid and neutral grey tokens).
2. **Resource count** on each tile, small grey mono, bottom right.
3. **Open now** tag on every Talk line and every ReZources card. Worked out from hours in Pacific time. Open lines
   show a green live dot, closed lines show "Opens Mon 11am", lines with no fixed hours show "Hours vary" (cards)
   or nothing (lines). Utility-layer tag: ink panel `#0c0c0f`, hairline `#1c1c22`, mono kicker, 4s breathing dot.
4. **Talk lines are filter-style cards** (phone: stacked cards; desktop: wide rows). Each takes the next color
   from red, orange, yellow, green, blue, violet, magenta, trans blue, trans pink, white (existing tokens). The
   gradient-ring phone icon is kept. White text stays white. Call is a dark pill with a colored outline and lit
   plate; all Call pills align in one column.
5. **Step links** (phone pushes history, desktop replaces):
   `?door=find`, `?door=find&cat=health,safety`, `?door=find&view=all`, `?door=talk`.
   The phone back gesture returns to the question.
6. **Focus moves with each step**: to the step's heading, or back to the chosen door on return.
7. **Phone transition**: the yellow fill grows from the pressed segment, then the step slides in from the right
   (back slides left). 360ms, ease-out.
8. **Calm mode**: the canvas concept removed it, but the production site keeps Calm Mode and reduced motion as
   supported accessibility branches (design system rule), so the build still honors them.

## Spacing (4px-based, hand-tuned on the canvas)

Desktop: logo to 01 START HERE 48 (Share/Follow are in their own row under the top nav, right aligned); 01 to
question 16; question to slider 40; slider to step 02 57 (28 + divider space 20 + 28, no hairline); between
filter block and first rail 40; between rails 40; rail head lines 14. Phone is about 0.7x desktop: 01 to
question 11, question to slider 28, step 02 to title 17, title to tiles 25, between rails 28, rail head lines 10.

Section bloom behind each block: a radial dark glow, 60% opaque center (40% transparent) easing to 20% at 62%,
0% at the edge on desktop; 30% center on phone.

## Type and motion tokens (design system)

Question: `--display-1`. Step and rail titles: `--display-2`, `text-wrap: balance`. Body copy: line height 1.55,
tracking .025em. Chrome labels .06em. Mono kickers .2em. Motion: `--dur-fast` 150ms touch, `--dur-base` 220ms,
`--dur-slow` 360ms panels, ease-out `.2,.8,.2,1`; buttons lift 2px on hover and press to .97. Filled buttons and
Call pills use the lit plate (keyline + bevel + floor + floor bloom + 8% bloom).

## Desktop rails: side rail layout

Each rail is a two-column row: heading, count, hint and arrows on the left (260 to 320px), the fan on the right.
Cards stay the live card at 265 x 480 (same as phone). Fan overlap `clamp(80px, 8vw, 104px)`, hover lift 24px,
scale 1.025, neighbors push apart. Below 1000px it stacks back to heading over cards.

## Phone only

- **Sticky category strip** under the tiles once something is picked: an Edit pill plus one 44px pill per picked
  category (its color outline and count). Tapping jumps to that rail; the current rail's pill is tinted.
- **Logo intro (first frame only)**: the hero logo fades in centered and large with Share and Follow below it,
  holds, then scales down and slides to a header row at the top of the page (logo left, Share and Follow right, 12px labels,
  44px hit area). The row is not pinned: it scrolls away with the page like any other content. 01 START HERE, the question and the slider then fade in, centered in the space above the nav.
  Skipped when arriving by a step link and replaced by the final layout when returning to the question.
- Bottom nav and the approved two-bar phone nav: not changed here (production nav drift awaits owner approval).

## Open questions

- Phone top nav: follow the approved two-bar design or the current production bar?
- Retired Skip to view all: confirm no analytics or deep link depends on the `discovery-skip` button.
