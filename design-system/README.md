# Zaylist Design System

Public design reference for [Zaylist](https://www.zaylist.com) / [prideguidepdx.com](https://www.prideguidepdx.com).

**Not product code.** Standalone static guide so the full-quality system can live outside the main app deploy.

## View

GitHub Pages:

`https://maxmackpdx-pride.github.io/zaylist-design-system/`

Local:

```bash
# from this directory
python3 -m http.server 8765
# open http://localhost:8765/
```

## GitHub Pages requirement

Root must include **`.nojekyll`** (empty). Pages defaults to Jekyll, which
ignores paths starting with `_`. Without `.nojekyll`, these 404 and component
panels go blank:

- `_ds_bundle.js` — React specimen library
- `_ds_manifest.json` — stats
- `guidelines/_spec.js` — color/type helpers

If Claude Design looks correct but Pages frames are black, check
`/_ds_bundle.js` returns 200.

## Entry

- `index.html` — main guide (share button top-right; mobile drawer nav)
- Specimens under `guidelines/`, `components/`, `tokens/`, `brand-guide/`, `app-face/`, `ui_kits/`

## Source package

Synced from the BIG design-system export. Product site (Owner inbox → Design
guide) links here. Main app repo mirrors this package into `design-system/`
via `npm run sync:design-system` (excludes bulk `uploads/`).
