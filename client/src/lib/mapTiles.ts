declare global {
  interface Window {
    __PDX_CARTO_KEY__?: string;
  }
}

const CARTO_DARK_VECTOR = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const CARTO_DARK_RASTER = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/** Required by CARTO's free basemap tier. */
export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function readCartoKey(): string {
  if (typeof window !== "undefined") {
    const runtime = window.__PDX_CARTO_KEY__?.trim();
    if (runtime) return runtime;
  }
  return String(import.meta.env.VITE_CARTO_BASEMAP_KEY || "").trim();
}

function withCartoKey(url: string): string {
  const key = readCartoKey();
  if (!key) return url;
  return url.includes("?") ? `${url}&key=${encodeURIComponent(key)}` : `${url}?key=${encodeURIComponent(key)}`;
}

/** Dark Matter vector style. Key is attached so the later vector key requirement is a no-op. */
export function cartoDarkVectorStyleUrl(): string {
  return withCartoKey(CARTO_DARK_VECTOR);
}

/** Keyed Dark Matter raster — fallback when MapLibre does not paint, and the watermark-free path. */
export function cartoDarkTileUrl(): string {
  return withCartoKey(CARTO_DARK_RASTER);
}

/** MapLibre fetches style.json, then tiles/sprites/fonts without the query. Reattach the key. */
export function cartoTransformRequest(url: string): { url: string } {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("basemaps.cartocdn.com")) return { url };
    const key = readCartoKey();
    if (key && !parsed.searchParams.has("key")) parsed.searchParams.set("key", key);
    return { url: parsed.toString() };
  } catch {
    return { url };
  }
}

export const ROOSTER_ACCENT = "#FF6600";
export const SAUVIE_ACCENT = "#39FF14";

/** Mix a hex color toward an accent without leaving the dark map. */
export function mixHex(base: string, accent: string, amount: number): string {
  const a = parseHex(base);
  const b = parseHex(accent);
  if (!a || !b) return base;
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t),
  );
}

function parseHex(value: string): { r: number; g: number; b: number } | null {
  const hex = value.replace("#", "");
  if (hex.length !== 6) return null;
  const n = Number.parseInt(hex, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")}`;
}
