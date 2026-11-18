# OutZide source search and treatment

Saved 2026-11-18. This preserves the distinctions between three existing pipelines; it does not authorize a batch, regenerate approved assets, or deploy.

## Native screenprint artwork: current source-backed recovery

Sources: [approved native credits](../../client/public/outzide-native/batch1/credits.json), [native page](../../client/src/pages/OutzidePlacesPage.tsx), and [byte-preservation/native crop tests](../../script/outz-approved-small-presentation.test.mjs). The credits describe the actual delivered treatment as **AI-assisted Xerox screenprint adaptation**, with orange/category-color accents, terrain-conforming mesh, water contours where present, and a torn-paper edge.

1. Resolve the immutable destination ID and exact geographic feature before searching. Search by feature name plus region and distinctive viewpoint. Use real destination photographs, not generic mountains or another lake with the same name.
2. Inspect originals and existing approved artwork before doing new work. Source candidates should preserve recognizable shoreline, ridge, waterfall, rock and trail geometry. Prefer original photographer/agency pages and openly licensed archives; official appearance alone does not prove reuse rights.
3. Keep original URL, creator, capture-date uncertainty, license URL, derivative-license obligation and untouched source bytes with each output. The native credits demonstrate USGS public-domain sources, Oregon State Archives attribution requirements and multiple CC BY-SA versions. Preserve the exact license applicable to each photograph.
4. Render the recognizable source composition as photographic landscape plus tactile Xerox/screenprint and torn-paper texture. Use orange/category accents, fine terrain-conforming mesh, and contour/ripple treatment on existing water. Do not invent another landscape or treat decorative contours as surveyed elevations. Do not transplant architecture, flags, shoreline features or trees from style references.
5. Inspect source fidelity separately from style. A historical source view is not evidence of current conditions. Record AI-assisted modifications explicitly. Keep real source details such as authentic flagpole cables when present; do not erase them as presumed artifacts.
6. Inspect alpha and contrast against the actual renderer backgrounds. Check every requested native card size and expanded hero, not just the uncropped PNG. Preserve important landforms and paper texture in the final crop. Do not let generic renderer mesh duplicate water graphics already baked into approved artwork.
7. Record exact output SHA-256, source attribution and explicit QA scope. Preserve approved output bytes; crop/renderer changes do not imply permission to regenerate the image.

The original full native generation prompt/preset was **not recovered in this save**. This is an operational reconstruction grounded in checked-in assets, credits and tests, not a claim to a recovered verbatim prompt. Inspect Silver Falls/Rooster Rock and relevant approved batch images as visual authorities before generating.

## Shared map/card Xerox blend: separate pipeline

See [OUTZIDE_IMAGE_PREPARATION.md](../OUTZIDE_IMAGE_PREPARATION.md). Its shared `blend-art.js` renderer combines a small halftone-dot photo base, outlined real-photo cutouts, contour/water/mesh linework and route/lock-on HUD layers.

Its `checkBlend(placeId, variant)` requires a registered recipe and photo, at least five real-photo cutouts, an orange contour source (terrain, mesh or subject outline), and a route entry. Keep `outzBlend.ts` and `outzBlendedArt.ts` aligned. Tall/wide are art variants, not universal shell dimensions. Small reuses a suitable composition.

The existing pure planner identifies destination + source SHA-256 + variant + treatment version. Preserve its reuse/wait/review-existing-art/review-invalid-art/review-failure/needs-agent distinctions. Never treat a successful generation request or metadata alone as completed visual QA. Its document expressly says the old `outzide-blend-card` skill was unavailable; this save does not pretend to recover it.

## Older sculpted HDR v3: historical, not a substitute

[Source treatment JSON](../../script/data/outzide-photos/treatment.json) describes source-backed glossy sculpted HDR, 2048px-wide WebP bases with 640/1280 responsive variants, separate SVG lineart, orange sky/cloud networks, selected rainbow terrain contours, sparse green tree networks and broken water reflections. It reserves 30–45% graphics-free space and a bottom-10% softly feathered burnt-orange fade, with limited fine-pointer parallax and motion disabled offscreen/hidden/Calm/reduced-motion.

Those are this older pipeline's settings, **not instructions to apply it to the current native screenprint or Xerox blend**. Historical catalog counts in the JSON are not a current progress report.

## Resume safely

Read current manifests and implementation before any new generation. An old checkpoint marked pending may already have shipped. Use current asset mapping and byte hashes rather than archive titles or image counts to identify genuinely missing work.
