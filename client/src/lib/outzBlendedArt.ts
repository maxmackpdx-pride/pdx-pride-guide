import { BLEND_PLACES } from "@/lib/outzBlend";

/**
 * The NEW Outzide card art: the "blended" style (halftone dot base, real-photo cutouts, orange topo
 * and route lines, glitch title). It exists only for places that have a blend recipe in
 * client/public/outzide-map/assets/blend-art.js (BLEND_KEYS). Every other Outzide place, including the
 * 143 with a layered v3 photo, uses the older layered-photo or motif-SVG art and does NOT qualify.
 *
 * `places.json` carries no flag for this, so the recipe registry is the manifest. A place qualifies only when it
 * passes the Xerox cinematic style check in blend-art.js (`checkBlend`: halftone base + photo, >= 5 photo cutouts,
 * an orange contour source, a route overlay). A test keeps this file, outzBlend.ts and the engine's own check in
 * sync (script/home-today.test.ts), so a hand-edited registry cannot let an unqualified place in.
 */
export type BlendVariant = "tall" | "wide";

/** Base cutout photo for each recipe (blend-art.js BLEND_KEYS + BLEND_PHOTO): /outzide-map/assets/photos/blend/<file>.webp */
export const BLEND_PHOTO_FILES: Record<string, Partial<Record<BlendVariant, string>>> = {
  "bc-garibaldi": { tall: "garibaldi", wide: "hero" },
  "silver-falls": { tall: "falls" },
  "rooster-rock": { tall: "rooster", wide: "rooster-wide" },
  "dayuse-or-smith-rock-state-park": { tall: "smithrock" },
  "usfs-5435010324": { tall: "trillium" },
  "usfs-6485821010602": { tall: "tamolitch" },
  "cape-disappointment": { tall: "capedis" },
  "dayuse-wa-palouse-falls-state-park-heritage-site": { tall: "palouse", wide: "palouse-wide" },
  "hurricane-hill": { tall: "hurricane" },
  "sol-duc-falls": { tall: "solduc", wide: "solduc-wide" },
  "usfs-5250.005571": { tall: "proxy" },
  "usfs-7682.004621": { tall: "tumalo" },
  "bc-brandywine": { tall: "brandywine" },
  "cape-lookout": { tall: "capelookout" },
  "dayuse-or-latourell-falls-trailhead-guy-w-talbot": { tall: "latourell" },
};

/** Every place id with blended art, in registry order. */
export const BLENDED_ART_PLACE_IDS: string[] = Object.keys(BLEND_PLACES);

/** True when the place has blended art for the variant (default: the 200px "tall" rail/card art). */
export function isBlendedArtPlace(place: { id: string } | string | null | undefined, variant: BlendVariant = "tall"): boolean {
  const id = typeof place === "string" ? place : place?.id;
  return Boolean(id && BLEND_PLACES[id]?.includes(variant));
}

/** Keep only places with blended art. Never returns older artwork, so it can return fewer rows, or none. */
export function blendedArtPlaces<T extends { id: string }>(places: readonly T[] | null | undefined, variant: BlendVariant = "tall"): T[] {
  return (places ?? []).filter(place => isBlendedArtPlace(place, variant));
}

/**
 * The static cutout photo the blend is built on, or null. The finished card art is this photo plus
 * generated halftone/topo/route layers, so to show the real thing render `<OutzBlendArt placeId variant />`
 * (components/outz/OutzBlendArt.tsx) rather than this image alone.
 */
export function blendedArtPhotoUrl(placeId: string, variant: BlendVariant = "tall"): string | null {
  const file = BLEND_PHOTO_FILES[placeId]?.[variant];
  return file ? `/outzide-map/assets/photos/blend/${file}.webp` : null;
}

/** Split a filtered/sorted Outzide list for the places page: blended-art places feature on top (large cards),
 *  everything else is `rest` (small cards). Order inside each list is preserved, so search, filters and sort still apply. */
export function splitBlendedArt<T extends { id: string }>(places: readonly T[]): { featured: T[]; rest: T[] } {
  const featured = blendedArtPlaces(places);
  const ids = new Set(featured.map(p => p.id));
  return { featured, rest: places.filter(p => !ids.has(p.id)) };
}
