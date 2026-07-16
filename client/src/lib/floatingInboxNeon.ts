export type FloatingInboxNeon = {
  id: "blue-deep" | "blue" | "blue-bright" | "cyan-blue";
  color: string;
  /** Space-separated for `rgb(var(--fab-neon-rgb) / alpha)` */
  rgb: string;
};

/**
 * Dark-blue → bright-blue neon family (matches deep-glass inbox drawer).
 * Rotates slightly within the blue gradient on each load — no orange/magenta.
 */
export const FLOATING_INBOX_NEON_PALETTE: FloatingInboxNeon[] = [
  { id: "blue-deep", color: "#0a2a9c", rgb: "10 42 156" },
  { id: "blue", color: "#1a4dff", rgb: "26 77 255" },
  { id: "blue-bright", color: "#3d7cff", rgb: "61 124 255" },
  { id: "cyan-blue", color: "#1966ff", rgb: "25 102 255" },
];

/** Picks a new blue-spectrum accent on each page load / refresh. */
export function pickFloatingInboxNeon(): FloatingInboxNeon {
  return FLOATING_INBOX_NEON_PALETTE[Math.floor(Math.random() * FLOATING_INBOX_NEON_PALETTE.length)];
}
