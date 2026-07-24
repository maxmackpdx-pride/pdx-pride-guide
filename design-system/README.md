# Zaylist — Design System (portable kit)

Sync-ready bundle for a claude.ai/design project.

> **Live product is truth.** Full chrome rules:
> [`docs/LIVE_DESIGN_STANDARD.md`](../docs/LIVE_DESIGN_STANDARD.md)
>
> This folder is a **portable color/type/export kit**. It does **not**
> override production deep-glass cards, glass CTAs, or map deboss recipes
> in `client/src/components/ds/tokens/glass.css`.

**Source of truth chain:**

```
LIVE SITE + client/src/components/ds/tokens/glass.css
  ← shared/eventWeek.ts + client tokens
  → design-system/tokens/tokens.css + previews (sync)
```

## Grok / agent push checklist

Before every push to `master` that touches colors, Pride week, or global CSS:

```bash
npm run sync:design-system
git add design-system/
```

Commit the synced folder in the **same PR/commit** as the app changes. If
`sync:design-system` updates files, include those diffs — do not push drift.

If you change a **global chrome rule**, update `docs/LIVE_DESIGN_STANDARD.md`
in the same ship.

## Contents
- `tokens/tokens.css` — synced colors / days / type / spacing (not full glass chrome)
- `EVENTS_GUIDE.md` — events/schedule system + DS mapping (chrome → live components)
- `AVATARS_GUIDE.md` — avatar system (not in React DS)
- `ZAYLIST_LOGO_GUIDE.md` — **NEW (Jul 2026)**: ZAYLIST wordmark guidelines with Swiss design tweaks (30% scale for cleaner/timeless application), Neue Haas Grotesk Bold typography, vibrant rainbow color palette, centered balanced layout, generous negative space, simplicity (removed unnecessary effects), and cross-platform consistency.
- `previews/*.html` — samples for Claude Design indexing

Modular production tokens (richer, multi-file) live in
`client/src/components/ds/tokens/` — **especially `glass.css`**.

## Design rules (aligned with live — not pre-migration brutal)

- **Cards:** deep-glass OLED slabs (`--glass-card*`), black ring + neon edge,
  sheen, poster-well — **not** flat `#0b0b0b` + only `#2b2b2b` as the default.
- **CTAs:** glass buttons (`.pdx-glass-btn` / `.pdxBtn`); solid fill + dark type.
  **Not** default magenta brutal offset.
- **Claim sticker:** pure cyan `#00FFFF` + soft cyan offset (not yellow rim).
- Display: Barlow Condensed 700–900 uppercase. Body: Inter `#e6e3da`.
- One neon per element. Lime `#CCFF00` = reserved primary/RSVP where specified;
  never a Pride day color.
- Day colors: semantic Pride Week from `shared/eventWeek.ts`.
- Rainbow top seam on clickable cards (`docs/BOARD_CARD_STANDARD.md`).
- Motion: ~0.15s hover; calm / reduced-motion kills ambient pulse.
- Full retired-rule trap list: `docs/LIVE_DESIGN_STANDARD.md`.

## How to sync to claude.ai/design
This cloud session can't authorize Design sync (needs interactive login). Either:
1. Claude Design (claude.ai/design) → create/open a design-system project →
   "Send to Claude Code Web" — then ask Claude to sync this folder; or
2. Local Claude Code terminal in this repo: run `/design-login`, then ask
   Claude to push `design-system/` to the project (list_files → finalize_plan
   → write_files, one component at a time).
