/** Profile accent + banner allowlists (shared by client and server). */

export const PROFILE_ACCENT_COLORS = [
  "#FF00CC",
  "#00FFFF",
  "#CCFF00",
  "#FF6600",
  "#8800FF",
  "#39FF14",
  "#0044FF",
  "#FF2400",
] as const;

export type ProfileAccentColor = (typeof PROFILE_ACCENT_COLORS)[number];

export const DEFAULT_PROFILE_ACCENT: ProfileAccentColor = "#FF00CC";

/** Lighter text-safe variants on dark backgrounds. */
export const PROFILE_ACCENT_TEXT: Partial<Record<ProfileAccentColor, string>> = {
  "#8800FF": "#AA66FF",
  "#0044FF": "#4488FF",
};

export function profileAccentText(hex: string): string {
  const key = hex.toUpperCase() as ProfileAccentColor;
  return PROFILE_ACCENT_TEXT[key] || hex;
}

export function isValidProfileAccent(hex: unknown): hex is ProfileAccentColor {
  return typeof hex === "string" && PROFILE_ACCENT_COLORS.includes(hex.toUpperCase() as ProfileAccentColor);
}

export const PROFILE_BANNERS = [
  { key: "accent", label: "Accent color", path: null },
  { key: "collage", label: "Neon collage", path: "/sandbox-ds/banners/hero-collage.png" },
  { key: "stickers", label: "Sticker wall", path: "/sandbox-ds/banners/banner-stickers.png" },
  { key: "social", label: "Pride Guide", path: "/sandbox-ds/banners/banner-social.png" },
] as const;

export const DEFAULT_PROFILE_BANNER = "/sandbox-ds/banners/hero-collage.png";

const BANNER_PATHS: Set<string> = new Set(
  PROFILE_BANNERS.flatMap(b => (b.path ? [b.path] : [])),
);

export function isValidProfileBanner(path: unknown): path is string | null {
  if (path === null || path === "") return true;
  return typeof path === "string" && BANNER_PATHS.has(path);
}

export const MARQUEE_COLORS = [
  "rainbow",
  "pink",
  "cyan",
  "lime",
  "orange",
  "purple",
  "green",
] as const;

export type MarqueeColor = (typeof MARQUEE_COLORS)[number];

export function isValidMarqueeColor(c: unknown): c is MarqueeColor {
  return typeof c === "string" && (MARQUEE_COLORS as readonly string[]).includes(c);
}

export const BOARD_COLORS = {
  Spotted: "var(--board-spotted)",
  Gifting: "var(--board-gifting)",
  Gigs: "var(--board-gigs)",
} as const;