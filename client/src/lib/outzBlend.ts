// Places that have blended art recipes (client/public/outzide-map/assets/blend-art.js). Other places keep the layered photo.
export const BLEND_PLACES: Record<string, Array<"tall" | "wide">> = {
  "bc-garibaldi": ["tall", "wide"],
  "silver-falls": ["tall"],
  "rooster-rock": ["tall", "wide"],
  "usfs-6485821010602": ["tall"],
  "usfs-5435010324": ["tall"],
  "dayuse-or-smith-rock-state-park": ["tall"],
  "dayuse-wa-palouse-falls-state-park-heritage-site": ["tall", "wide"],
  "cape-disappointment": ["tall"],
  "hurricane-hill": ["tall"],
  "sol-duc-falls": ["tall", "wide"],
  "usfs-5250.005571": ["tall"],
  "usfs-7682.004621": ["tall"], // wide art has no orange contour source, so it does not qualify (blend-art.js checkBlend)
  "dayuse-or-latourell-falls-trailhead-guy-w-talbot": ["tall"],
  "cape-lookout": ["tall"],
  "bc-brandywine": ["tall"],
};
export const hasBlendRecipe = (placeId: string, variant: "tall" | "wide" = "tall") => Boolean(BLEND_PLACES[placeId]?.includes(variant));
