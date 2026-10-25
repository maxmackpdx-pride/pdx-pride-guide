import { readBrowseCategories } from "./browseCategoryState";
import { isPlacezType } from "../../../shared/directoryTheme";

/** Placez browse key for Outzide. Not a directory business type, so Mapz place lists stay unchanged. */
export const OUTZIDE_BROWSE_TYPE = "outzide";

export const OUTZIDE_CATEGORY_COLOR = "var(--neon-orange)";

/** Same order as the Outzide map activity chips, then the kinds those chips do not show. */
const OUTZIDE_KIND_ORDER = [
  "trail", "stay", "beach", "camp", "spring", "winter", "fishing", "boating",
  "watercamp", "coastcamp", "dayuse", "atv",
] as const;

export const OUTZIDE_KIND_LABELS: Record<string, string> = {
  trail: "Hikes",
  stay: "Stays",
  beach: "Beaches",
  camp: "Camp",
  spring: "Hot springs",
  winter: "Winter",
  fishing: "Fishing",
  boating: "Boating",
  watercamp: "Lake / river camp",
  coastcamp: "Coastal camp",
  dayuse: "Day use",
  atv: "ATV",
};

export function isDirectoryBrowseType(value: string): boolean {
  return value === OUTZIDE_BROWSE_TYPE || isPlacezType(value);
}

/** Outzide wins when it is mixed into a directory type list. Those lists do not share a result set. */
export function readPlacezBrowseType(params: URLSearchParams): string {
  const types = readBrowseCategories(params, "type", isDirectoryBrowseType, "category");
  if (types.includes(OUTZIDE_BROWSE_TYPE)) return OUTZIDE_BROWSE_TYPE;
  return types.join(",") || "ALL";
}

export function outzideSubcategoryOptions(places: { kind: string }[]) {
  const counts = new Map<string, number>();
  for (const place of places) {
    if (!OUTZIDE_KIND_LABELS[place.kind]) continue;
    counts.set(place.kind, (counts.get(place.kind) || 0) + 1);
  }
  return OUTZIDE_KIND_ORDER.filter(id => counts.has(id)).map(id => ({
    id,
    label: OUTZIDE_KIND_LABELS[id],
    count: counts.get(id)!,
  }));
}

export function filterOutzidePlaces<T extends { name: string; kind: string; region?: string }>(places: T[], kind: string, query: string): T[] {
  const q = query.trim().toLowerCase();
  return places.filter(place => {
    if (kind !== "ALL" && place.kind !== kind) return false;
    if (!q) return true;
    const label = OUTZIDE_KIND_LABELS[place.kind] || "";
    return `${place.name} ${place.region || ""} ${label} ${place.kind}`.toLowerCase().includes(q);
  });
}
