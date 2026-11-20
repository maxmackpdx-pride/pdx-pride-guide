/** Public rename only: retain the mapz mode/API and every bookmark parameter. */
export const PLACEZ_MAP_PATH = "/placez/map";
export function legacyPlacezMapRedirect(value: string): string | null {
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!["/map", "/map-demo", "/mapz", "/mapz-map", "/mapz-map/index.html", "/zaydar-map", "/zaydar-map/index.html"].includes(path)) return null;
  const query = new URL(value, "https://www.zaylist.com").searchParams;
  // /map remains the shared entrance for other worlds.
  if (["/map", "/map-demo"].includes(path) && query.has("mode") && query.get("mode") !== "mapz") return null;
  if (["/map", "/map-demo"].includes(path) && !query.has("mode") && ["gigz", "giftz", "sellz", "mizzed", "houz", "housing"].includes(query.get("layer") || "")) return null;
  if (["/mapz-map", "/mapz-map/index.html"].includes(path) && query.has("guestPlace")) {
    if (!query.has("place")) query.set("place", query.get("guestPlace")!);
    query.delete("guestPlace");
    const hash = value.includes("#") ? value.slice(value.indexOf("#")) : "";
    return PLACEZ_MAP_PATH + (query.size ? "?" + query.toString() : "") + hash;
  }
  return PLACEZ_MAP_PATH + value.slice(value.split(/[?#]/)[0].length);
}
