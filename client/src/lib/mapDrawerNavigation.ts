/** Only local Mapz routes may be used as a detail-view return destination. */
export function mapReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !/^\/map(?:-demo)?(?:\?|$)/.test(value)) return null;
  return value;
}
export function mapRecordId(value: string | null, allowArchive = false): number | null {
  if (!value || !(allowArchive ? /^-?[1-9]\d*$/ : /^[1-9]\d*$/).test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
export const MAP_OVERLAY_KEYS = ["event", "place", "mizzed", "spotted", "gig", "gift", "sell", "sellz", "houz"] as const;
export function clearMapOverlay(params: URLSearchParams) {
  for (const key of MAP_OVERLAY_KEYS) params.delete(key);
}
