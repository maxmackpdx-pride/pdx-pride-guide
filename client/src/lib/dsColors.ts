import { EVENT_WEEK_DAYS } from "@shared/eventWeek";

/** CSS accent token for Pride week day filter chips. */
export function dayAccentToken(day: string): string {
  if (day === "ALL") return "var(--neon-yellow)";
  const code = day.toUpperCase();
  if ((EVENT_WEEK_DAYS as readonly string[]).includes(code)) {
    return `var(--day-${code.toLowerCase()})`;
  }
  return "var(--neon-yellow)";
}

/** Readable text and complementary accents shared by every event-card view. */
export function dayTextToken(day: string): string {
  const code = day.toUpperCase();
  return code === "MON" || code === "TUE" ? `var(--day-${code.toLowerCase()}-text)` : dayAccentToken(code);
}

export function dayInkToken(day: string): string {
  return ["MON", "TUE"].includes(day.toUpperCase()) ? "var(--text-heading)" : "var(--z-black)";
}

export function dayComplementToken(day: string): string {
  const tokens: Record<string, string> = {
    MON: "yellow", TUE: "orange", WED: "violet", THU: "orange",
    FRI: "yellow", SAT: "red", SUN: "cyan",
  };
  return `var(--neon-${tokens[day.toUpperCase()] || "yellow"})`;
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

/** Map dashboard CSS vars (--dash-*) to DS StatPill color names. */
export function dashVarToDsAccent(cssVar: string): string {
  const v = cssVar.toLowerCase();
  if (v.includes("magenta") || v.includes("pink")) return "pink";
  if (v.includes("cyan")) return "cyan";
  if (v.includes("lime") || v.includes("yellow")) return "lime";
  if (v.includes("orange")) return "orange";
  if (v.includes("purple") || v.includes("violet")) return "purple";
  if (v.includes("green")) return "green";
  return "lime";
}