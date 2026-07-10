/** Allowed profile accent colors (design-system neons only). */

export const PROFILE_ACCENT_SWATCHES = [
  { id: "magenta", hex: "#FF00CC", css: "var(--neon-magenta, #FF00CC)", textSafe: null },
  { id: "cyan", hex: "#00FFFF", css: "var(--neon-cyan, #00FFFF)", textSafe: null },
  { id: "yellow", hex: "#CCFF00", css: "var(--neon-yellow, #CCFF00)", textSafe: null },
  { id: "orange", hex: "#FF6600", css: "var(--neon-orange, #FF6600)", textSafe: null },
  { id: "violet", hex: "#8800FF", css: "var(--neon-violet, #8800FF)", textSafe: "var(--day-mon-text, #C9B3FF)" },
  { id: "green", hex: "#39FF14", css: "var(--neon-green, #39FF14)", textSafe: null },
  { id: "blue", hex: "#0044FF", css: "var(--neon-blue, #0044FF)", textSafe: "var(--day-tue-text, #9EC5FF)" },
  { id: "red", hex: "#FF2400", css: "var(--neon-red, #FF2400)", textSafe: null },
] as const;

export type ProfileAccentId = (typeof PROFILE_ACCENT_SWATCHES)[number]["id"];

const HEX_SET = new Set(PROFILE_ACCENT_SWATCHES.map(s => s.hex.toUpperCase()));
const ID_MAP = Object.fromEntries(PROFILE_ACCENT_SWATCHES.map(s => [s.id, s])) as Record<
  ProfileAccentId,
  (typeof PROFILE_ACCENT_SWATCHES)[number]
>;

export const DEFAULT_PROFILE_ACCENT = "#FF00CC";
export const DEFAULT_PROFILE_BANNER = "/sandbox-ds/banners/hero-collage.png";

export function isAllowedProfileAccent(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (HEX_SET.has(v.toUpperCase())) return true;
  return v in ID_MAP;
}

export function normalizeProfileAccent(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_PROFILE_ACCENT;
  const v = value.trim();
  if (HEX_SET.has(v.toUpperCase())) {
    return PROFILE_ACCENT_SWATCHES.find(s => s.hex.toUpperCase() === v.toUpperCase())!.hex;
  }
  if (v in ID_MAP) return ID_MAP[v as ProfileAccentId].hex;
  return DEFAULT_PROFILE_ACCENT;
}

export function accentTextSafeCss(hex: string): string {
  const sw = PROFILE_ACCENT_SWATCHES.find(s => s.hex.toUpperCase() === hex.toUpperCase());
  return sw?.textSafe || hex;
}

export type ProfileMarquee = {
  items: string[];
  speed: number;
  color: string;
};

export type ProfileMediaItem = {
  id: string;
  label: string;
  title: string;
  meta?: string;
  audioUrl?: string;
};

export type ProfileMedia = {
  title: string;
  tag: string;
  coverText?: string;
  blurb?: string;
  platformLinks?: Partial<Record<"spotify" | "apple" | "amazon" | "soundcloud", string>>;
  items: ProfileMediaItem[];
};

export type ProfilePup = {
  name: string;
  hood?: string;
  role?: string;
  lookingFor?: string;
};

export function parseStringArray(raw: unknown, max = 24): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string")
    .map(s => s.replace(/[<>]/g, "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, max);
}

export function parseMarquee(raw: unknown): ProfileMarquee | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const items = parseStringArray(o.items, 12);
  if (items.length === 0 && typeof o.text === "string") {
    items.push(
      ...o.text
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    );
  }
  const speed = Math.min(60, Math.max(12, Number(o.speed) || 30));
  const color = typeof o.color === "string" ? o.color.slice(0, 32) : "rainbow";
  if (items.length === 0) return null;
  return { items, speed, color };
}

export function parseProfileMedia(raw: unknown): ProfileMedia | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.replace(/[<>]/g, "").trim().slice(0, 120) : "";
  if (!title) return null;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items: ProfileMediaItem[] = itemsRaw.slice(0, 40).map((it, i) => {
    const row = it && typeof it === "object" ? (it as Record<string, unknown>) : {};
    return {
      id: typeof row.id === "string" ? row.id.slice(0, 40) : `track-${i}`,
      label: typeof row.label === "string" ? row.label.replace(/[<>]/g, "").trim().slice(0, 40) : `EP ${i + 1}`,
      title: typeof row.title === "string" ? row.title.replace(/[<>]/g, "").trim().slice(0, 120) : "Untitled",
      meta: typeof row.meta === "string" ? row.meta.replace(/[<>]/g, "").trim().slice(0, 80) : undefined,
      audioUrl: typeof row.audioUrl === "string" && /^https?:\/\//i.test(row.audioUrl) ? row.audioUrl.slice(0, 500) : undefined,
    };
  });
  const platformLinks: ProfileMedia["platformLinks"] = {};
  if (o.platformLinks && typeof o.platformLinks === "object" && !Array.isArray(o.platformLinks)) {
    for (const key of ["spotify", "apple", "amazon", "soundcloud"] as const) {
      const v = (o.platformLinks as Record<string, unknown>)[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) platformLinks[key] = v.slice(0, 500);
    }
  }
  return {
    title,
    tag: typeof o.tag === "string" ? o.tag.replace(/[<>]/g, "").trim().slice(0, 40) : "Media",
    coverText: typeof o.coverText === "string" ? o.coverText.replace(/[<>]/g, "").trim().slice(0, 40) : undefined,
    blurb: typeof o.blurb === "string" ? o.blurb.replace(/[<>]/g, "").trim().slice(0, 400) : undefined,
    platformLinks,
    items,
  };
}

export function parsePup(raw: unknown): ProfilePup | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.replace(/[<>]/g, "").trim().slice(0, 60) : "";
  if (!name) return null;
  return {
    name,
    hood: typeof o.hood === "string" ? o.hood.replace(/[<>]/g, "").trim().slice(0, 80) : undefined,
    role: typeof o.role === "string" ? o.role.replace(/[<>]/g, "").trim().slice(0, 60) : undefined,
    lookingFor: typeof o.lookingFor === "string" ? o.lookingFor.replace(/[<>]/g, "").trim().slice(0, 120) : undefined,
  };
}

export function parseIdArray(raw: unknown, max = 24): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const x of raw) {
    const n = typeof x === "number" ? x : Number(x);
    if (Number.isFinite(n) && n > 0 && !out.includes(n)) out.push(Math.floor(n));
    if (out.length >= max) break;
  }
  return out;
}
