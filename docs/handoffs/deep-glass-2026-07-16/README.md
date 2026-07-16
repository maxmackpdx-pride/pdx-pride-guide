# PDX Pride Guide — New Design Standard Package

Contents:

- **GROK_MIGRATION_PROMPT.md** — the migration brief. Feed this to Grok. It defines the new universal tokens (§1), then walks every surface (§2) with old→new + which token it points to, and lists the deliverables (§3).
- **GROK_PER_AGENT_TASKS.md** — the same work split into 14 self-contained per-agent work orders (one agent per section: Event Cards, Directory, Nude Beaches, etc.), each with files to edit, exact changes, tokens to point at, the screenshot to match, and where to look in `Card System.html`. Use when parallelizing across agents.
- **GROK_ANIMATION_MIGRATION.md** — motion-only companion: the full existing DS motion vocabulary (tokens + every keyframe + entrance cascade + calm/reduced-motion contract), the three new deep-glass motions (`dirCardIn`, `dirRefract`, `pullHandle`), how the old and new rainbow seams reconcile, and motion-only deliverables.
- **Card System.html** — the fully-built reference implementation (open in any browser). Source of truth for exact pixel values. This is the exported/standalone version of the design.
- **screenshots/** — one reference image per section, named to match §2 of the prompt:
  - `00-overview-top.png` — the manifest table (surface → source → global standard)
  - `01-event-cards.png` · `02-open-event.png` · `03-directory-cards.png` · `04-board-cards.png`
  - `05-map-surfaces.png` · `06-directory-map.png` · `07-floating-inbox.png`
  - `08-work-project-rows.png` · `09-navigation.png` · `10-islands.png`
  - `11-promoter-intake.png` · `12-infrastructure-grid.png` · `13-support.png`
  - `14-hub-items.png` · `15-ads.png`

How to use: give Grok the prompt + screenshots + `Card System.html`. Grok rewrites `tokens/glass.css`, `glass.ts`, `mapTheme.ts`, `effects.css`, and per-component styles so the whole app matches the new OLED-neon glass standard — cards and maps first.

Source repo referenced throughout: `maxmackpdx-pride/pdx-pride-guide`.
