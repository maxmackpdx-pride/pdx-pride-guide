/**
 * Afterz blast audience and radius. The default radius matches the usual
 * event discovery radius (half a mile). Audience values are stored on the
 * gathering and enforced by the existing request endpoint.
 */
export type AfterzAudience = "open" | "request" | "friends" | "fof";

export const AFTERZ_AUDIENCES: { value: AfterzAudience; label: string; short: string }[] = [
  { value: "open", label: "Everybody, no invite needed", short: "Everybody, no invite needed" },
  { value: "request", label: "Everybody, request invite", short: "Everybody, request invite" },
  { value: "friends", label: "Friends", short: "Friends" },
  { value: "fof", label: "Friends of friends", short: "Friends of friends" },
];

/** Half a mile in meters: the normal event discovery radius. */
export const DEFAULT_EVENT_RADIUS_M = 800;

export const AFTERZ_BLAST_RADIUS_OPTIONS_M = [400, 800, 1600, 2400, 3200] as const;

export function formatBlastRadius(meters: number): string {
  const miles = meters / 1609.344;
  if (Math.abs(miles - 0.25) < 0.02) return "0.25 mi";
  if (Math.abs(miles - 0.5) < 0.02) return "0.5 mi";
  const rounded = Math.round(miles * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} mi` : `${rounded} mi`;
}

export function parseAfterzAudience(value: unknown): AfterzAudience | null {
  return AFTERZ_AUDIENCES.some(option => option.value === value) ? (value as AfterzAudience) : null;
}

/** Accept a listed radius, or the default when the value is missing. Reject anything else. */
export function parseAfterzRadiusM(value: unknown, fallback = DEFAULT_EVENT_RADIUS_M): number | null {
  if (value == null || value === "") return fallback;
  const meters = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(meters)) return null;
  return (AFTERZ_BLAST_RADIUS_OPTIONS_M as readonly number[]).includes(meters) ? meters : null;
}

/** Open join skips the request queue. The other three still use request plumbing. */
export function afterzRequestAutoAccepts(audience: AfterzAudience): boolean {
  return audience === "open";
}

/** Everybody (open or request) is visible to all. Friends / FOF stay in-circle. */
export function afterzAudienceAllows(
  audience: AfterzAudience,
  relation: "self" | "friend" | "fof" | "everybody",
): boolean {
  if (relation === "self") return true;
  if (audience === "open" || audience === "request") return true;
  if (relation === "friend") return true;
  return audience === "fof" && relation === "fof";
}
