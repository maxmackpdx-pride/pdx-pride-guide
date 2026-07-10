declare global {
  interface Window {
    __PDX_GA_ID__?: string;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readMeasurementId(): string | null {
  if (typeof window === "undefined") return null;
  const runtime = window.__PDX_GA_ID__?.trim();
  if (runtime) return runtime;
  const built = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  return built || null;
}

let initialized = false;

function ensureGtag(measurementId: string) {
  if (initialized) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
  initialized = true;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return !!readMeasurementId();
}

export function trackGooglePageView(path: string) {
  if (typeof window === "undefined") return;
  const bare = path.split("?")[0].split("#")[0];
  if (bare.startsWith("/admin")) return;

  const measurementId = readMeasurementId();
  if (!measurementId) return;

  ensureGtag(measurementId);
  window.gtag?.("event", "page_view", {
    page_path: bare,
    page_location: `${window.location.origin}${bare}`,
    page_title: document.title,
  });
}