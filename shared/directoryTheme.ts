/**
 * Canonical ordered category list. One source of truth for admin pickers and
 * server-side validation so a new category cannot drift between the two.
 */
export const DIRECTORY_TYPES = [
  "bar",
  "restaurant",
  "cafe",
  "venue",
  "service",
  "shop",
  "hotel",
  "nonprofit",
  "healthcare",
  "realestate",
  "group",
  "campground",
] as const;

export type DirectoryType = (typeof DIRECTORY_TYPES)[number];

/**
 * Plain-English category names for admin surfaces. These stay literal on
 * purpose: the public board can brand a category (group reads "MY SQUADZ" on
 * the board), but an admin picking a category needs the unbranded name.
 */
export const DIRECTORY_TYPE_ADMIN_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
  healthcare: "Health & Care",
  realestate: "Real Estate",
  group: "Clubs & Groups",
  campground: "Campgrounds",
};

/** Canonical directory type labels and accent colors, shared by the board and z/. */
export const DIRECTORY_TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
  healthcare: "Health & Care",
  realestate: "Real Estate",
  group: "MY SQUADZ",
  campground: "Campgrounds",
};

export const DIRECTORY_TYPE_COLORS: Record<string, string> = {
  bar: "#FF00CC",
  restaurant: "#FF6600",
  cafe: "#39FF14",
  venue: "#19E3FF",
  service: "#A855F7",
  shop: "#FFD700",
  hotel: "#FF1FA0",
  nonprofit: "#FFFFFF",
  healthcare: "#FF00CC",
  realestate: "#1A4DFF",
  /** Gold pole of white→gold Clubs & Groups neon */
  group: "#FFD700",
  /** Lime pole of lime→dark green campground neon */
  campground: "#39FF14",
};

export function directoryTypeColor(type: string | null | undefined): string {
  if (!type) return DIRECTORY_TYPE_COLORS.venue;
  return DIRECTORY_TYPE_COLORS[type] || DIRECTORY_TYPE_COLORS.venue;
}

/** CSS background for one type or a blend of venue + group. */
export function directoryBrandGradient(colors: string[]): string {
  const uniq = Array.from(new Set(colors.filter(Boolean)));
  if (uniq.length === 0) return "transparent";
  if (uniq.length === 1) return uniq[0];
  return `linear-gradient(105deg, ${uniq[0]} 0%, ${uniq[1]} 100%)`;
}
