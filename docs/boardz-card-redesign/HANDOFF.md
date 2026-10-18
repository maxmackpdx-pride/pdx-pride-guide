# Boardz card redesign: handoff for the go-live build

Branch: `claude/nifty-lamport-ptzlbh`. Work in `docs/boardz-card-redesign/`.
Canvas reference (visual source of truth): https://claude.ai/artifact/AyVnR8MwaiDqTzv27hyvr6, page "Directions".
Local generators: `gen_dirs2.py` (Giftz board and card builders), `gen_rooms.py` (other boards, combined board),
`gen_forms.py` (composer forms), `dirs2.css` (all card styles). The built canvas file is `boards/Directions.dc.html`.

## Read first (rules that must not break)
- `CLAUDE.md` in repo root and `AGENTS.md`. Design: `client/src/components/ds/tokens/`, `client/src/index.css`.
- `docs/LIVE_DESIGN_STANDARD.md`, `docs/BOARD_CARD_STANDARD.md`, `docs/MAP_RENDERING.md`.
- Outer neon bloom stays at 8% (`--neon-bloom`). Maps have no bloom.
- Day colors are data (`var(--day-*)`). Never `#CCFF00` as a day color. Week is MON Jul 13 to SUN Jul 19.
- Copy: no em dashes. Plainspoken voice. "Trans affirming".
- Server bundles to one CJS file: no reads from disk at module load. Import assets.
- `npx tsc --noEmit` has pre-existing errors. Record the baseline first; do not increase it.

## Goal
Ship the new card designs in the real Boardz components, and add a mobile grid option.

## Scope, in order (stop and check in after each)
1. **Port card visuals to React.** Torn-paper rim via `punk-materials` scan with the live color filter (`--zt-card`, nine-slice
   top/bottom + stretched sides for tall cards). Wheatpaste (photo) and Cutout (no photo) layouts. Headline as one torn
   strip per line with one ransom key word (Cut Type mixes `CutMixPaper` and `CutMixLoose` only, no reversed glyphs).
   Edge glow (`filter: drop-shadow` in the card's accent). Decay glitch in random unsynced parts. Pins: reuse
   `BoardPushPin.tsx` (already live), not a copy.
2. **Open card.** Full phone size 375x667 (shown at 90% on the board). Border-widen open glitch (`z-widen`), with a
   variant per card (`zo-a..d`). Rainbow seam in the torn top edge on open cards and forms only. Content padding: 24px
   between sections. Mapz pin opens the open card centered, blurred map behind, close by the pin or the X, same glitch.
3. **Small cards.** 136x150. Titles up to 3 lines (ellipsis after), ransom word only if it fits. Post-type tag at the
   bottom left on the same baseline, heart bottom right (14px). Texture only, no hero motifs. Hoüz small: counter tag
   top left, no face stack.
4. **Month stamp (Hoüz).** Flat photocopy calendar, three-letter month only, black toner header with two holes, hard
   accent offset. Source: move in / by / goal / available date from the form. Hoüz list can sort by month, soonest first,
   undated last.
5. **Mobile grid.** Two small cards per row at phone width. A toggle to show one wide card per row. Respect 16px side
   gutter, no horizontal page scroll.
6. **Composer forms.** Field order and labels are in `gen_forms.py` and match the live composers (`HousingComposer`,
   `MizzedComposer` in `SpottedCardGrid.tsx`, `GiftComposer` in `Gifting.tsx`, `Sellz.tsx`, `GigComposer` in `PrideWork.tsx`).
   Restyle them; do not change fields or labels. Hoüz needs a new month field (currently free text "Available"). Ask first.

## Known open items (not done)
- Logos (Boardz, Gigz, Giftz, Mizzed, Sellz): restyle in the new texture, same shapes, token colors, color in the same
  places. Do the logo as an SVG edit; show the first one for approval before the other four.
- Events card and open card: mockup first (Opus), approved before any code. Keep wireframe, poster and logo rules,
  motif and the 7 day colors.
- Hoüz month field in the composer.

## Verification (before any push)
- `npx tsc --noEmit`: compare to the recorded baseline; no new errors.
- Render check: each card size, open card and mobile grid at 375px. One screenshot per change, not one per card.
- Calm mode and `prefers-reduced-motion`: animations stop.
- No horizontal scroll at 375px.

## Ship
Only when the user says "ship". Push to `master` per `zaylist-github-push` skill. Railway auto-deploys on push.
Never create a PR unless asked. Commit message footer:
```
Co-Authored-By: <model>
Claude-Session: https://claude.ai/code/session_01YQimMU9P4gQs2gaMVTkpNX
```
