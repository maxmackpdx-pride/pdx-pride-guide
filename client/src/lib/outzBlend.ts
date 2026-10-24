// Places that have blended art recipes (client/public/outzide-map/assets/blend-art.js). Other places keep the layered photo.
const BLEND_PLACES: Record<string, Array<"tall" | "wide">> = {
  "bc-garibaldi": ["tall", "wide"],
  "silver-falls": ["tall"],
  "rooster-rock": ["tall", "wide"],
};
export const hasBlendRecipe = (placeId: string, variant: "tall" | "wide" = "tall") => Boolean(BLEND_PLACES[placeId]?.includes(variant));
