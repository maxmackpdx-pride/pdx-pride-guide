import type { OutzFeedItem } from "@shared/outzFeed";

type AlertFeature = { id?: string; properties?: {
  id?: string; event?: string; headline?: string; description?: string;
  severity?: string; status?: string; messageType?: string;
  sent?: string; effective?: string; ends?: string; expires?: string; areaDesc?: string;
} };
export function majorOutzAlerts(features: AlertFeature[], now = Date.now()): OutzFeedItem[] {
  const unique = new Map<string, OutzFeedItem>();
  for (const feature of features) {
    const p = feature.properties;
    if (!p || p.status !== "Actual" || p.messageType === "Cancel") continue;
    if (!/warning/i.test(p.event || "") && !["Severe", "Extreme"].includes(p.severity || "")) continue;
    const end = p.ends || p.expires;
    if (!end || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= now) continue;
    const id = p.id || feature.id;
    if (!id || !p.headline) continue;
    unique.set(id, { id: `weather:${id}`, kind: "weather", title: p.headline,
      body: (p.description || p.event || "").slice(0, 700), placeName: p.areaDesc || "Oregon / Washington",
      href: `https://alerts.weather.gov/search?id=${encodeURIComponent(id)}`,
      createdAt: p.sent || p.effective || new Date(now).toISOString(), endsAt: end });
  }
  return [...unique.values()];
}
let cached: { items: OutzFeedItem[]; at: number } | undefined;
let pending: Promise<{ items: OutzFeedItem[]; unavailable: boolean; updatedAt: string | null }> | undefined;
export async function getOutzFeedWeather() {
  if (cached && Date.now() - cached.at < 5 * 60_000) return {
    items: cached.items.filter(i => Date.parse(i.endsAt!) > Date.now()), unavailable: false, updatedAt: new Date(cached.at).toISOString(),
  };
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch("https://api.weather.gov/alerts/active?area=OR,WA", {
        headers: { "User-Agent": "Zaylist OutZide (www.zaylist.com)", Accept: "application/geo+json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`NWS ${response.status}`);
      const data = await response.json() as { features?: AlertFeature[] };
      if (!Array.isArray(data.features)) throw new Error("Invalid NWS response");
      cached = { items: majorOutzAlerts(data.features), at: Date.now() };
      return { items: cached.items, unavailable: false, updatedAt: new Date(cached.at).toISOString() };
    } catch {
      return { items: (cached?.items || []).filter(i => Date.parse(i.endsAt!) > Date.now()), unavailable: true,
        updatedAt: cached ? new Date(cached.at).toISOString() : null };
    } finally { pending = undefined; }
  })();
  return pending;
}
