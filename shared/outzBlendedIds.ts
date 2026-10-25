/**
 * Outzide places that have finished blended art. Server-side mirror of client/src/lib/outzBlendedArt.ts
 * (BLENDED_ART_PLACE_IDS); a test keeps the two identical. Missed-connection posts may only target these places.
 */
export const OUTZ_BLENDED_PLACE_IDS: readonly string[] = [
  "bc-garibaldi", "silver-falls", "rooster-rock", "usfs-6485821010602", "usfs-5435010324", "dayuse-or-smith-rock-state-park",
  "dayuse-wa-palouse-falls-state-park-heritage-site", "cape-disappointment", "hurricane-hill", "sol-duc-falls", "usfs-5250.005571",
  "usfs-7682.004621", "dayuse-or-latourell-falls-trailhead-guy-w-talbot", "cape-lookout", "bc-brandywine",
];

export const MISSED_CONNECTION_KIND = "MISSED_CONNECTION";

/** Missed connections stay anonymous and never carry contact details (same rule as the Mizzed board). */
export function missedConnectionBodyError(body: string): string | null {
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(body) || /(^|\s)@[a-z0-9_.]{2,}/i.test(body)) return "Leave out emails and @handles. Replies stay private in the inbox.";
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|me|app|xyz)\b/i.test(body)) return "Leave out links. Replies stay private in the inbox.";
  if (/\+?\d[\d\s().-]{6,}\d/.test(body)) return "Leave out phone numbers. Replies stay private in the inbox.";
  return null;
}
