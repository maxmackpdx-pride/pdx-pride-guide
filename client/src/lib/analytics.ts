const VISITOR_KEY = "pdx_vid";
const SESSION_KEY = "pdx_sid";
const SESSION_AT_KEY = "pdx_sat";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function readStorage(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / blocked */
  }
}

export function getAnalyticsVisitorId(): string {
  const existing = readStorage(localStorage, VISITOR_KEY);
  if (existing) return existing;
  const next = randomId();
  writeStorage(localStorage, VISITOR_KEY, next);
  return next;
}

export function getAnalyticsSessionId(): string {
  const now = Date.now();
  const existing = readStorage(sessionStorage, SESSION_KEY);
  const lastAt = Number(readStorage(sessionStorage, SESSION_AT_KEY) || 0);
  if (existing && lastAt && now - lastAt < SESSION_TIMEOUT_MS) {
    writeStorage(sessionStorage, SESSION_AT_KEY, String(now));
    return existing;
  }
  const next = randomId();
  writeStorage(sessionStorage, SESSION_KEY, next);
  writeStorage(sessionStorage, SESSION_AT_KEY, String(now));
  return next;
}

export function detectAnalyticsDevice(): "mobile" | "desktop" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(ua)) return "mobile";
  if (window.matchMedia?.("(max-width: 768px)").matches) return "mobile";
  if (window.matchMedia?.("(max-width: 1024px)").matches) return "tablet";
  return "desktop";
}

const lastSent = new Map<string, number>();

export function trackPageView(path: string, userId?: number | null) {
  if (typeof window === "undefined") return;
  const bare = path.split("?")[0].split("#")[0];
  if (bare.startsWith("/admin")) return;

  const now = Date.now();
  const prev = lastSent.get(bare) || 0;
  if (now - prev < 1500) return;
  lastSent.set(bare, now);

  const payload = {
    path: bare,
    visitorId: getAnalyticsVisitorId(),
    sessionId: getAnalyticsSessionId(),
    referrer: document.referrer || null,
    deviceType: detectAnalyticsDevice(),
    userId: userId ?? null,
  };

  const body = JSON.stringify(payload);
  if ("sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/analytics/pageview", blob)) return;
  }

  fetch("/api/analytics/pageview", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export type ProductEventName =
  | "time_to_content" | "post_attempt" | "post_completed"
  | "contact_attempt" | "contact_completed"
  | "report_control_seen" | "report_opened" | "report_completed"
  | "counter_mismatch";

export function trackProductEvent(eventName: ProductEventName, surface: string, value?: number) {
  if (typeof window === "undefined") return;
  const payload = {
    eventName,
    surface: surface.toLowerCase().replace(/[^a-z0-9:_-]/g, "_").slice(0, 60),
    value: value == null ? null : Math.max(0, Math.round(value)),
    visitorId: getAnalyticsVisitorId(),
    sessionId: getAnalyticsSessionId(),
  };
  const body = JSON.stringify(payload);
  if ("sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/analytics/product-event", blob)) return;
  }
  fetch("/api/analytics/product-event", {
    method: "POST", credentials: "include", keepalive: true,
    headers: { "Content-Type": "application/json" }, body,
  }).catch(() => {});
}
