export type FloatingInboxNeon = {
  id: "orange" | "cyan" | "magenta" | "yellow";
  color: string;
  /** Space-separated for `rgb(var(--fab-neon-rgb) / alpha)` */
  rgb: string;
};

export const FLOATING_INBOX_NEON_PALETTE: FloatingInboxNeon[] = [
  { id: "orange", color: "#FF6600", rgb: "255 102 0" },
  { id: "cyan", color: "#00FFFF", rgb: "0 255 255" },
  { id: "magenta", color: "#FF00CC", rgb: "255 0 204" },
  { id: "yellow", color: "#CCFF00", rgb: "204 255 0" },
];

/** Picks a new neon accent on each page load / refresh. */
export function pickFloatingInboxNeon(): FloatingInboxNeon {
  return FLOATING_INBOX_NEON_PALETTE[Math.floor(Math.random() * FLOATING_INBOX_NEON_PALETTE.length)];
}