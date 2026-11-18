# SceneZ image and logo treatment

Saved 2026-11-18 from the native SceneZ implementation and recovery notes. This is a source-grounded handoff, **not a recovered full image-generation preset**.

## Identity and sourcing

SceneZ represents clubs, organizations and party collectives, not a second PlaceZ building directory. Resolve the actual community/slug and authoritative category. An event venue does not create a permanent address for that scene. Do not put a scene on the map unless its own address is verified.

Start with the exact project logo/brand asset. Search official community pages, media kits and original image sources for missing material; establish identity, date and reuse rights. Keep a representative photo distinct from an actual documentary image of that community. Do not invent evidence of attendance, membership, events or a venue.

The current PGMC model explicitly labels the piano close-up **illustrative**, not a documented PGMC instrument. Preserve that disclosure. Q Center's legacy community graphic remains distinct from its reviewed directory-logo slot.

## Family appearance without flattening identity

Use the approved SceneZ collage family: layered physical paper, grunge/Xerox texture, editorial typography and fine circuit/traces. Keep authentic logo and art as separate layers. Reuse approved party/pride collage assets where the current model selects them; do not regenerate their logos or convert every community into a fabricated building.

[SceneCardFace.tsx](../../client/src/components/scenez/SceneCardFace.tsx) has separate landscape/custom-art, paper-back/front, primary/secondary trace and logo/wordmark elements. Preserve this distinction instead of baking card controls or dynamic event information into artwork. A real logo image should remain intact rather than being recreated by image generation. Current text-wordmark fallbacks are implementation choices, not proof of authentic brand artwork.

## Verified palette and asset selection

[sceneModel.ts](../../client/src/components/scenez/sceneModel.ts) is the checked source for current selections:
- Club: `#FFD700`; party collective: `#FF7B00`; organization: `#ffffff`.
- Bearracuda override: `#ff7800`, party collage and existing wordmark.
- Pink Ponies: `#f15aa9`, existing logo.
- Yes Coach: `#e62026`, party collage and existing logo.
- Pride Northwest: existing pride collage and logo.
- PGMC: representative piano image and white-logo SVG.
- Q Center: reviewed directory SVG in separate logo slot.

These are **observed current implementation values**, not newly declared universal design tokens. Resolve current tokens and any explicit owner correction before new work; do not silently harmonize brand overrides.

## QA and limits

Inspect the actual image and exact logo at intended small, square, tall, wide and expanded presentations as applicable. Check proportional logo scaling, legibility, crop, paper texture, contrast and clear separation between art and live UI. Keep current shared geometry rather than copying old demo dimensions blindly.

Source-fidelity QA, style QA and native-card crop QA are separate. Current community data and upcoming events must come from the native API, not historical demo fixtures or generated pixels.

[SCENEZ_NATIVE_RECOVERY.md](../rebuild/SCENEZ_NATIVE_RECOVERY.md) identifies the approved Sites v16 source commit `329a4b3499304fe616b6a66f12e2cff80332111d` and reused original assets. That is provenance, not a fresh assignment to restore the demo. No standalone complete SceneZ image-search/treatment skill or verbatim generation prompt was recovered in this save. Preserve existing approved art; do not present this reconstruction as an exact lost preset.
