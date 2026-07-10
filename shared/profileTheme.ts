/** Profile accent color swatches — the only selectable hexes, all existing design-system neon tokens. */
export const PROFILE_ACCENT_COLORS = [
  "#FF00CC", // neon-magenta
  "#00FFFF", // neon-cyan
  "#CCFF00", // neon-yellow
  "#FF6600", // neon-orange
  "#8800FF", // neon-violet
  "#00EE44", // neon-green
  "#0044FF", // neon-blue
  "#FF2400", // neon-red
] as const;

export type ProfileAccentColor = (typeof PROFILE_ACCENT_COLORS)[number];

/** Lighter text-safe variant for accents that are too dark to read as body/heading text. */
export const PROFILE_ACCENT_TEXT_OVERRIDES: Record<string, string> = {
  "#8800FF": "#AA66FF", // --day-mon-text
  "#0044FF": "#4488FF", // --day-tue-text
};

export function profileAccentTextColor(hex: string): string {
  return PROFILE_ACCENT_TEXT_OVERRIDES[hex.toUpperCase()] || hex;
}

export const DEFAULT_PROFILE_ACCENT = "#FF00CC";

export type ProfileBanner = "accent-gradient" | "neon-collage" | "sticker-wall" | "pride-guide-social";

export const PROFILE_BANNERS: ProfileBanner[] = [
  "accent-gradient",
  "neon-collage",
  "sticker-wall",
  "pride-guide-social",
];

export const DEFAULT_PROFILE_BANNER: ProfileBanner = "accent-gradient";

/** Static banner image paths for the non-gradient options (already-deployed design assets). */
export const PROFILE_BANNER_IMAGES: Record<Exclude<ProfileBanner, "accent-gradient">, string> = {
  "neon-collage": "/sandbox-ds/banners/hero-collage.png",
  "sticker-wall": "/sandbox-ds/banners/banner-stickers.png",
  "pride-guide-social": "/sandbox-ds/banners/banner-social.png",
};

export function isProfileAccentColor(value: unknown): value is ProfileAccentColor {
  if (typeof value !== "string") return false;
  const upper = value.toUpperCase();
  return (PROFILE_ACCENT_COLORS as readonly string[]).includes(upper);
}

export function isProfileBanner(value: unknown): value is ProfileBanner {
  return typeof value === "string" && (PROFILE_BANNERS as string[]).includes(value);
}
