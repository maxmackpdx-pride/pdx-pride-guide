# PDX Pride Guide — Design System

Sync-ready bundle for a claude.ai/design project.

**Source of truth chain:** `shared/prideWeek.ts` → `client/src/index.css` →
`design-system/tokens/tokens.css` + `previews/*.html`.

## Grok / agent push checklist

Before every push to `master` that touches colors, Pride week, or global CSS:

```bash
npm run sync:design-system
git add design-system/
```

Commit the synced folder in the **same PR/commit** as the app changes. If
`sync:design-system` updates files, include those diffs — do not push drift.

## Contents
- `tokens/tokens.css` — canonical tokens (colors, day colors, type, effects)
- `previews/*.html` — self-contained preview cards; first line carries the
  `@dsCard group="…"` marker the Design System pane indexes on:
  - `colors.html` (Colors), `typography.html` (Type), `buttons.html` (Buttons),
    `event-card.html` (Cards), `chips-effects.html` (Effects)

## Design rules
- Background is always near-black `#0a0a0a`; content sits on `#0b0b0b` cards
  with `2px solid #2b2b2b` borders. Radius is minimal (0–6px) — brutalist.
- Display type: Barlow Condensed 700–900, uppercase, tight line-height (~0.95).
  Body: Inter; body text `#e6e3da`, meta `#999`, faint `#666`.
- One neon per element. Yellow `#CCFF00` = primary action; cyan `#00FFFF` =
  accent pop; magenta `#FF00CC` mostly lives in offset shadows and glows.
- Day colors are semantic Pride Week (Mon Jul 13 – Sun Jul 19): MON purple,
  TUE blue, WED yellow, THU cyan, FRI magenta, SAT green, SUN orange.
  MON/TUE have lighter text variants (`--day-mon-text` / `--day-tue-text`);
  `#CCFF00` is reserved for RSVP/primary-action — never a day. Source of
  truth: `shared/prideWeek.ts` + `npm run sync:design-system`. Full
  event-system explainer with layout samples: `EVENTS_GUIDE.md` +
  `previews/events-page-layout.html` + `previews/schedule-grid.html`.
- Signature effects: rainbow bar divider; brutalist offset shadow
  `4px 4px 0 rgba(255,0,204,0.36)`; soft neon glow
  `0 0 14px color-mix(in srgb, <accent> 18%, transparent)` with a slow pulse.
- Motion: 0.15s snappy for hovers, ~4s ease-in-out for ambient pulses.
  Respect calm mode (glows off).

## How to sync to claude.ai/design
This cloud session can't authorize Design sync (needs interactive login). Either:
1. Claude Design (claude.ai/design) → create/open a design-system project →
   "Send to Claude Code Web" — then ask Claude to sync this folder; or
2. Local Claude Code terminal in this repo: run `/design-login`, then ask
   Claude to push `design-system/` to the project (list_files → finalize_plan
   → write_files, one component at a time).
