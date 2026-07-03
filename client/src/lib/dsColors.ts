import { PRIDE_WEEK_DAYS } from "@shared/prideWeek";

/** CSS accent token for Pride week day filter chips. */
export function dayAccentToken(day: string): string {
  if (day === "ALL") return "var(--neon-yellow)";
  const code = day.toUpperCase();
  if ((PRIDE_WEEK_DAYS as readonly string[]).includes(code)) {
    return `var(--day-${code.toLowerCase()})`;
  }
  return "var(--neon-yellow)";
}

const HEX_TO_DS_ACCENT: Record<string, string> = {
  "#CCFF00": "lime",
  "#C8FA3C": "lime",
  "#39FF14": "green",
  "#19E3FF": "cyan",
  "#00FFFF": "cyan",
  "#FF8C00": "orange",
  "#FF6600": "orange",
  "#FF00CC": "pink",
  "#FF1FA0": "pink",
  "#A855F7": "purple",
  "#750787": "purple",
  "#FFD700": "amber",
};

/** Map legacy dashboard hex accents to DS color names (falls back to raw hex). */
export function hexToDsAccent(hex: string): string {
  const normalized = hex.trim().toUpperCase();
  return HEX_TO_DS_ACCENT[normalized] ?? hex;
}