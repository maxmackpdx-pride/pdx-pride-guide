/** Session id + fire-and-forget impression/click helpers for public ads. */

const SESSION_KEY = "pdxpg_ad_session";
/** In-memory de-dupe so React Strict Mode remounts do not double-fire the same tick. */
const recentImpressions = new Map<string, number>();
const IMPRESSION_DEDUPE_MS = 2500;

export function getAdSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (id && id.length >= 8) return id;
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function trackAdImpression(adId: number, surface: "feed" | "grid") {
  if (!adId) return;
  const dedupeKey = `${adId}:${surface}`;
  const now = Date.now();
  const prev = recentImpressions.get(dedupeKey) || 0;
  if (now - prev < IMPRESSION_DEDUPE_MS) return;
  recentImpressions.set(dedupeKey, now);

  void fetch(`/api/ads/${adId}/impression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId: getAdSessionId(), surface }),
  }).catch(() => {});
}

export function trackAdClick(adId: number, surface: "feed" | "grid") {
  if (!adId) return;
  void fetch(`/api/ads/${adId}/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ sessionId: getAdSessionId(), surface }),
  }).catch(() => {});
}
