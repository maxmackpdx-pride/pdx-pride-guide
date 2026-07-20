/** Directory type accent colors — keep in sync with Directory.tsx TYPE_COLORS. */
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
  group: "#CCFF00",
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
