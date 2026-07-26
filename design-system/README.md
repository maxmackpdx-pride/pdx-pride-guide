# Zaylist Design System

**This folder is the design guide.** It matches the public package:

| | |
|--|--|
| **Public site** | https://maxmackpdx-pride.github.io/zaylist-design-system/ |
| **Public repo** | https://github.com/maxmackpdx-pride/zaylist-design-system |
| **Product code** | `client/src/components/ds/**` (implementation) |

## Source of truth

1. **This design system** (`design-system/` here, and the public Pages site) is the **written standard and specimens**. Color, type, deep glass, motion, voice, patterns, brand guide, app face.
2. **Live product React + CSS** implement that standard. If product drifts, fix product (or mark a panel **queued** in the guide when the guide is deliberately ahead).
3. **Do not** maintain a second portable kit (`EVENTS_GUIDE.md`, old single-file `tokens/tokens.css`, ad-hoc `previews/*.html`). Those are gone.

There must be **no parallel contradictory guides**. Prefer files under `guidelines/`, `tokens/`, `components/`, `brand-guide/`, and the root `index.html` shell.

## Local view

```bash
cd design-system
python3 -m http.server 8765
# open http://localhost:8765/
```

Entry: `index.html` (share button top-right; mobile drawer nav).

## GitHub Pages (public package)

The public site is served from `maxmackpdx-pride/zaylist-design-system`.

**Required:** root file **`.nojekyll`** (empty). Without it, GitHub Pages runs Jekyll, which **drops every path starting with `_`**. That breaks:

- `_ds_bundle.js` — React component specimens (blank black iframes)
- `_ds_manifest.json` — guide stats
- `guidelines/_spec.js` — color/type specimen helpers

If component panels look empty on Pages but work in Claude Design or local `python3 -m http.server`, check that `.nojekyll` is present and `_ds_bundle.js` returns HTTP 200.

## Layout

| Path | Role |
|------|------|
| `index.html` · `ds-index.js` · `ds-page.js` | Guide shell |
| `tokens/` | Modular CSS tokens (colors, glass, type, layout, effects, fonts) |
| `guidelines/` | Specimens (color, type, voice, motion, nav, hub, inbox, …) |
| `components/` | Component cards + props surfaces |
| `brand-guide/` | Mark, lockup, misuse, voice, accessibility |
| `app-face/` | App icon / face standards |
| `ui_kits/` | Assembled page demos |
| `assets/` | Logos, flyers, icons used by specimens |
| `handoff/` | Rebrand / agent handoff prompts |
| `SKILL.md` · `CLAUDE.md` | Agent rules for this package |

Bulk export dumps stay only on the public design-system repo (see `.mirror-excludes.md`).

## Refresh from the public package

```bash
# from repo root, if you have the sibling clone:
npm run sync:design-system
```

That script **mirrors** `../zaylist-design-system` (or `ZAYLIST_DS_SRC`) into `design-system/`. It does **not** invent a second token file from `index.css`.

## Product integration

- Live components: `client/src/components/ds/`
- Ship / trap list for production chrome: `docs/LIVE_DESIGN_STANDARD.md` (implementation checklist; must not contradict this guide)
- Owner inbox link on the site opens the **public** Pages URL for sharing
