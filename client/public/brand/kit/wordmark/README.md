# Zaylist brand reference assets

## Wordmarks
- `wordmark/zaylist-wordmark-primary.png` — ZAYLIST + PORTLAND neon lockup (site hero + OG)
- `wordmark/zaylist-wordmark-neon.png` — full neon wordmark, transparent
- `wordmark/zaylist-wordmark-on-white.png` — neon on white

## App face (home screen / PWA) — source of truth
See `app-face/` and repo root install from Downloads/handoff:
- Live icons: `/icons/zaylist-{180,192,512,mask,mono,1024}.png`
- Spec: `app-face/app-face.json` + `App Face Standards.html` (handoff)
- **Seam is the only color element.** Letter is cream. Never round corners in the file.

## Social / OG
- `social/zaylist-og-1200x630.png` — default share card (also `client/public/og-preview.jpg`)
- Rebuild: `node script/build-og-preview.mjs`

## Line icons
- `../line-icons/*.svg` — 32 product line icons from icons_export
