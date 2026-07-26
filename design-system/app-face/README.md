# Zaylist app face, handoff package

Everything needed to put the Zaylist icon on a home screen. Nothing else.

```
App Face Standards.html   the spec, self contained, opens offline in any browser
app-face.json             the same spec, machine readable
icons/                    the exports
icons/src/                flat vector layers for the future native app
```

## Do this

1. Copy `icons/*.png` to `/icons/` on the web root.
2. Copy `icons/manifest.webmanifest` to the web root.
3. Paste `icons/head.html` into `<head>`, above any other icon links.
4. Confirm the manifest is reachable at `/manifest.webmanifest` and returns `application/manifest+json`.

That is the whole web install. No build step, no icon library.

## Which file goes where

| File | Size | Platform | Slot |
| --- | --- | --- | --- |
| `zaylist-180.png` | 180 | iOS | `apple-touch-icon`. iOS ignores the manifest for the home screen. |
| `zaylist-192.png` | 192 | Android | manifest `purpose: any` |
| `zaylist-512.png` | 512 | Android | manifest `purpose: any` |
| `zaylist-mask.png` | 512 | Android | manifest `purpose: maskable`, art at 78 percent |
| `zaylist-mono.png` | 512 | Android | manifest `purpose: monochrome`, white on transparent |
| `zaylist-1024.png` | 1024 | master | store listings, future exports |
| `src/*.svg` | 1024 | iOS native | three flat layers for Icon Composer |

## The two build paths

**Web app, now.** Neither platform composites anything. iOS reads one flat PNG from
`apple-touch-icon`, Android reads the manifest array. So the depth is painted into the
PNGs. That is why they look lit and the SVGs do not.

**Native iOS, later.** Import `src/01-background.svg`, `src/02-z.svg`, `src/03-seam.svg`
into Icon Composer in that order, as background plus two foreground layers. Annotate for
Default, Dark and Mono. Export one `.icon` file. Delete the baked lighting first, or it
fights the real thing and reads as pre iOS 26.

## Regenerating at another size

Use `app-face.json`. Every coordinate is a fraction of the canvas edge, so any square size
works. Draw order: tile, letter shadow, letter face, letter foot shade, letter rim, seam
shadow, seam fill, seam rim, seam under shade. Lighting values scale by `k = size / 150`.

For `maskable`, scale the whole artwork group by 0.78 about the canvas center and keep the
tile full bleed. For `monochrome`, draw only the letter polygon and the seam pill, both
solid `#ffffff`, on transparent, at the same 0.78 scale.

## Never

- Round the corners in the file. Both platforms mask it.
- Ship an alpha channel in `zaylist-180.png`. Transparency renders as solid black.
- Reuse the iOS file for Android maskable. A circular crop cuts the ends off the seam.
- Bake lighting into the SVG layers.
- Add color to anything but the seam.

## Accept when

- Home screen on iOS shows the icon with no black corners and no visible square edge.
- Android circular, squircle, rounded square and teardrop launchers all keep the full seam.
- Android themed icons show a white Z above a white bar, not a Z alone.
- The label under the icon reads Zaylist, not the page title.
- At 40px the seam still reads as a colored line rather than a smudge.
