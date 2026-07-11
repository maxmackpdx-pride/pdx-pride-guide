export type FloatingInboxNeon = {
  id: "orange" | "cyan" | "magenta" | "yellow";
  color: string;
  rgb: string;
};

export const FLOATING_INBOX_NEON_PALETTE: FloatingInboxNeon[] = [
  { id: "orange", color: "var(--neon-orange, #FF6600)", rgb: "255, 102, 0" },
  { id: "cyan", color: "var(--neon-cyan, #00FFFF)", rgb: "0, 255, 255" },
  { id: "magenta", color: "var(--neon-magenta, #FF00CC)", rgb: "255, 0, 204" },
  { id: "yellow", color: "var(--neon-yellow, #CCFF00)", rgb: "204, 255, 0" },
];

/** Picks a new neon accent on each page load / refresh. */
export function pickFloatingInboxNeon(): FloatingInboxNeon {
  return FLOATING_INBOX_NEON_PALETTE[Math.floor(Math.random() * FLOATING_INBOX_NEON_PALETTE.length)];
}