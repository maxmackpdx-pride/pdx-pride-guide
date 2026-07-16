# Deep-glass package — **ARCHIVED migration** (2026-07-16)

> **Status: MIGRATION COMPLETE.** Do **not** treat this folder as open agent
> work orders or as the live source of truth.
>
> **Live design standard:** [`docs/LIVE_DESIGN_STANDARD.md`](../../LIVE_DESIGN_STANDARD.md)  
> **Live tokens:** `client/src/components/ds/tokens/glass.css`  
> **Live product:** https://www.prideguidepdx.com (`master` on Railway)

Post-migration polish also landed on production (claim sticker, Shop Now
contrast, PAST board timing, ad builder WYSIWYG, map deboss, etc.). Those
overrides live in **code + LIVE_DESIGN_STANDARD**, not only in the original
Card System export.

## What this folder is for now

- Historical reference for *why* deep-glass replaced lite-glass / brutal CTAs
- Screenshots and `Card System.html` when debugging a surface that might have
  drifted from the original migration intent
- Motion inventory in `GROK_ANIMATION_MIGRATION.md` (still useful as a catalog)

## What agents must not do

- Re-run `GROK_PER_AGENT_TASKS.md` as if sections are unfinished
- Restore **brutal default CTAs**, **map outer bloom**, or **yellow-rim claim**
  because an old prompt screenshot shows them
- Prefer this package over production CSS when they disagree

## Original contents (archive)

- **GROK_MIGRATION_PROMPT.md** — original migration brief (§1 tokens, §2 surfaces)
- **GROK_PER_AGENT_TASKS.md** — 14 parallel work orders (**done**)
- **GROK_ANIMATION_MIGRATION.md** — motion vocabulary
- **Card System.html** — design export used during migration
- **screenshots/** — section references from the original package

Source repo: `maxmackpdx-pride/pdx-pride-guide`.
