/** Room entry links start with one map layer. Mapz's normal toggles can then change it. */
export function mapBrowseHref(layer: "places" | "rezources", focus?: { lat: number | null; lng: number | null; name: string }): string {
  const params = new URLSearchParams({ layer });
  const visibility = {
    events: "hideEvents", places: "hidePlaces", rezources: "hideResources",
    mizzed: "hideMizzed", gigz: "hideGigz", giftz: "hideGiftz", sellz: "hideSellz", houz: "hideHouz",
  };
  for (const [id, key] of Object.entries(visibility)) params.set(key, id === layer ? "0" : "1");
  if (focus) {
    if (focus.lat != null && focus.lng != null) {
      params.set("lat", String(focus.lat));
      params.set("lng", String(focus.lng));
      params.set("zoom", "15");
    } else params.set(layer === "places" ? "places.q" : "resources.q", focus.name);
  }
  return `/map?${params}`;
}
