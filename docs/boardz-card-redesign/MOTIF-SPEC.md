# Boardz motifs: spec for the next build

Base: `origin/master` (not the canvas branch). Live cards are React: `client/src/components/board/punk/ZineCard.jsx`,
`BoardzCollage.jsx`, `PunkBoardCard.jsx`, `PunkArtwork.jsx`, `BoardCardMotif.tsx`.

## Context
- The original motifs were removed by the zine redesign (`8d4f038`, `923c32c`). Before that, cards showed the category
  object sticker from `PunkArtwork` (gift box, magnifier, mic, bubbles, house) with a wire companion.
- Place art exists as motif recipe assets: `companion-placez-specific-*` and `placez-specific-*`, including
  `companion-placez-specific-eagle-portland`. Source: `client/public/card-art/motif-recipes.json`, `designMotifRecipes.ts`.

## Changes
1. **Placez cards only, top motif.** Show the venue's own geometric companion (`companion-placez-specific-<venue>`)
   at the top of the card, both sizes. Look up by venue slug. No art for a venue means no top motif. No other
   categories get a top motif.
2. **Category object sticker, bottom, both sizes.** Show the category object (gift box for Giftz giving, magnifier for
   Giftz ISO, mic for Gigz, bubbles for Mizzed, house for Hoüz) offset toward the bottom edge, not centered. Keep its
   wire companion. Use the existing `PunkArtwork` resolver, not new art.
3. **Keep everything else.** Title fitting, grid, forms, open card layout, month stamp, pins, and the Hoüz small-card
   counter stay as they are.

## Checks before any push
- `npx tsc --noEmit`: no new errors against the recorded baseline.
- Render check: one Placez large, one Placez small, one Giftz large, one Hoüz large, at 375px. One screenshot each.
- Calm mode and reduced motion: nothing animates.
- No horizontal scroll at 375px.

## Ship
Only when the user says "ship". Push to `master` with the `zaylist-github-push` skill. Railway auto-deploys on push.
