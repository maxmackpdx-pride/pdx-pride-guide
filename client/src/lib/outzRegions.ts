// The Outzide browse regions, for Placez. Same areas and rules as client/public/outzide-map/assets/browse-regions.js
// (the Outzide map itself is plain JS in /public and cannot be imported here).
export type OutzRegion = { id: string; name: string; note: string };
export const OUTZ_REGIONS: OutzRegion[] = [
  { id: "portland-gorge", name: "Portland & the Gorge", note: "Portland, Mt. Hood, Sandy & the Columbia Gorge" },
  { id: "oregon-coast", name: "Oregon Coast", note: "Astoria to Brookings" },
  { id: "central-east-or", name: "Valley, Central & Eastern Oregon", note: "Salem, Eugene, Bend, the high desert & the Wallowas" },
  { id: "south-or", name: "Southern Oregon", note: "Umpqua, Crater Lake, Rogue Valley & Ashland" },
  { id: "olympic-coast", name: "Olympic & Washington Coast", note: "Olympic Peninsula, Long Beach & southwest Washington" },
  { id: "puget-north", name: "Puget Sound & Northwest Washington", note: "Seattle, the islands, Bellingham & foothills" },
  { id: "cascades-east-wa", name: "Washington Cascades & East", note: "Mountain passes, central Washington & the northeast" },
  { id: "vancouver", name: "Vancouver & Lower Mainland", note: "Vancouver, the North Shore & Howe Sound" },
  { id: "whistler", name: "Whistler & Sea-to-Sky", note: "Squamish, Whistler, Callaghan & Pemberton" },
  { id: "south-island", name: "Southern Vancouver Island", note: "Victoria, Saanich, Sooke & Jordan River" },
  { id: "southern-extension", name: "Northern California & Black Rock", note: "Redwoods, Shasta & the Black Rock Desert" },
];
export type OutzRegionInput = { state?: string; lat: number; lng: number; browseRegion?: string };
export function outzRegionFor(p: OutzRegionInput): string | null {
  if (p.state === "BC") return ["vancouver", "south-island", "whistler"].includes(p.browseRegion || "") ? p.browseRegion! : p.lng < -123.3 ? "south-island" : p.lat >= 49.65 ? "whistler" : "vancouver";
  if (p.state === "CA" || p.state === "NV") return "southern-extension";
  if (p.state === "WA") {
    if (p.lng < -123 || (p.lat < 46.7 && p.lng < -122.7)) return "olympic-coast";
    return p.lng < -121.8 ? "puget-north" : "cascades-east-wa";
  }
  if (p.state === "OR") {
    if (p.lng < -123.55) return "oregon-coast";
    if (p.lat >= 45 && p.lng < -120.9) return "portland-gorge";
    if (p.lat < 43.6) return "south-or";
    return "central-east-or";
  }
  return null;
}
