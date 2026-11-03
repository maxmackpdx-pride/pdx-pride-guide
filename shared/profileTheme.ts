/** Profile accent color swatches - the only selectable hexes, all existing design-system neon tokens. */
export const PROFILE_ACCENT_COLORS = [
  "#FF1FA0", // neon-magenta
  "#00FFFF", // neon-cyan
  "#D4FF00", // neon-yellow
  "#FF7B00", // neon-orange
  "#7B00FF", // neon-violet
  "#2BFF00", // Acid Green (canonical green)
  "#0066FF", // neon-blue
  "#FF0000", // neon-red
] as const;

export type ProfileAccentColor = (typeof PROFILE_ACCENT_COLORS)[number];

/** Lighter text-safe variant for accents that are too dark to read as body/heading text. */
export const PROFILE_ACCENT_TEXT_OVERRIDES: Record<string, string> = {
  "#7B00FF": "#9D66FF", // --day-mon-text
  "#0066FF": "#44AAFF", // --day-tue-text
};

export function profileAccentTextColor(hex: string): string {
  return PROFILE_ACCENT_TEXT_OVERRIDES[hex.toUpperCase()] || hex;
}

export const DEFAULT_PROFILE_ACCENT = "#FF1FA0";

/** Retired green accepted at the API boundary so existing profiles upgrade safely. */
export const LEGACY_PROFILE_GREEN = "#00EE44";

export function normalizeProfileAccentColor(value: string): string {
  const upper = value.toUpperCase();
  return upper === LEGACY_PROFILE_GREEN ? "#2BFF00" : upper;
}

export type ProfileBanner = "accent-gradient" | "sticker-wall" | "pride-guide-social";

export const PROFILE_BANNERS: ProfileBanner[] = [
  "accent-gradient",
  "sticker-wall",
  "pride-guide-social",
];

export const DEFAULT_PROFILE_BANNER: ProfileBanner = "accent-gradient";

/** Static banner image paths for the non-gradient options (already-deployed design assets). */
export const PROFILE_BANNER_IMAGES: Record<Exclude<ProfileBanner, "accent-gradient">, string> = {
  "sticker-wall": "/sandbox-ds/banners/banner-stickers.png",
  "pride-guide-social": "/sandbox-ds/banners/banner-social.png",
};

export function isProfileAccentColor(value: unknown): value is ProfileAccentColor {
  if (typeof value !== "string") return false;
  const upper = value.toUpperCase();
  return upper === LEGACY_PROFILE_GREEN || (PROFILE_ACCENT_COLORS as readonly string[]).includes(upper);
}

export function isProfileBanner(value: unknown): value is ProfileBanner {
  return typeof value === "string" && (PROFILE_BANNERS as string[]).includes(value);
}
