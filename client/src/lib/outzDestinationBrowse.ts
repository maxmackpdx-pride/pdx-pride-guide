import { outzAlphabetMatches, type OutzAlphabetRange } from "../../../shared/outzAlphabet.ts";
import { outzCategoryLabel } from "../../../shared/outzCategoryLabel.ts";

const MAGENTA = "#FF1FA0";
export const OUTZ_BROWSE_COLORS: Record<string, string> = {
  trail: "#FF7B00", stay: MAGENTA, beach: "#00FFFF", camp: "#2BFF00",
  coastcamp: "#00FFFF", watercamp: "#00FFFF", spring: "#00FFFF", fishing: "#00FFFF",
  boating: "#00FFFF", atv: "#FF0000", winter: "#7B00FF", dayuse: "#D4FF00",
};
const legacyWaypoints: Record<string, string> = {
  "camp-hike": "trail", campground: "camp", trailhead: "trail", "outdoor-stay": "stay", beach: "beach",
};

/** The two approved screenprints carry their own names, descriptors and accents. */
export function destinationIdentity(name: string, kind: string, catalogKind?: string) {
  if (/silver.falls/i.test(name)) return {
    artworkId: "silver-falls", name: "Silver Falls State Park", kind: "Camping · Hiking",
    waypointKind: "camp", categoryAccent: OUTZ_BROWSE_COLORS.camp,
  };
  if (/rooster.rock/i.test(name)) return {
    artworkId: "rooster-rock", name: "Rooster Rock State Park", kind: "Beach · Day use",
    waypointKind: "beach", categoryAccent: MAGENTA,
  };
  const waypointKind = catalogKind && Object.hasOwn(OUTZ_BROWSE_COLORS, catalogKind)
    ? catalogKind : legacyWaypoints[kind] ?? "dayuse";
  return { artworkId: null, name, kind: outzCategoryLabel(catalogKind, kind.replaceAll("-", " ")),
    waypointKind, categoryAccent: OUTZ_BROWSE_COLORS[waypointKind] };
}

type BrowsePlace = { id: string; name: string; detail: string };
type BrowsePresentation = { waypointKind: string; image: string };

export function destinationBrowseLists<T extends BrowsePlace>(
  places: T[], search: string, group: string, kinds: readonly string[] | undefined,
  alphabet: OutzAlphabetRange, following: ReadonlySet<string>, entry: (place: T) => BrowsePresentation,
) {
  const query = search.toLowerCase();
  const visible = places.filter(place => (place.name + " " + place.detail).toLowerCase().includes(query)
    && (!group || kinds?.includes(entry(place).waypointKind)));
  const withPhotos = visible.filter(place => entry(place).image);
  const explored = visible.filter(place => outzAlphabetMatches(place.name, alphabet));
  const featured = (place: T) => Number(/silver.falls|rooster.rock/i.test(place.name));
  return {
    explored,
    exploreWithPhotos: explored.filter(place => entry(place).image),
    seasonal: [...withPhotos].sort((a, b) => featured(b) - featured(a)).slice(0, 5),
    followed: places.filter(place => following.has(place.id)),
    scope: [search, group, alphabet],
  };
}
