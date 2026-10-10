// Keep the October 10 live renderer as the fallback. Midnight November 1 in Portland
// is still PDT; use an explicit offset so device timezone cannot change the cutoff.
export const HALLOWEEN_END = Date.parse("2026-11-01T00:00:00-07:00");
export const HALLOWEEN_START = Date.parse("2026-10-10T00:00:00-07:00");
export function homeHalloweenActive(now = Date.now()) { return now >= HALLOWEEN_START && now < HALLOWEEN_END; }
