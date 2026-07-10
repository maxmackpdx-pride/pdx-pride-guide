// Shared design constants for the Inbox bottom-sheet, ported verbatim from the
// PDX Pride Guide "Member / Admin / Owner Inbox" design handoff. Values are the
// final source of truth for this surface.
import type { CSSProperties } from "react";

export const C = {
  // surfaces
  page: "#080809",
  sheet: "#0d0d10",
  nav: "#0a0a0c",
  card: "#0c0c0f",
  list: "#131317",
  inset: "#141418",
  inset2: "#0f0f12",
  hover: "#1b1b21",
  seg: "#26262e",
  // borders / dividers
  border: "#1c1c22",
  border2: "#1e1e25",
  border3: "#22222a",
  borderFaint: "#17171c",
  divider: "#1a1a1f",
  // neons
  lime: "#CCFF00",
  limeSoft: "#c8fa3c",
  cyan: "#19e3ff",
  cyan2: "#00FFFF",
  magenta: "#ff1fa0",
  magenta2: "#FF00CC",
  orange: "#ff8c00",
  purple: "#b06bff",
  green: "#39FF14",
  red: "#FF4D4D",
  blueCyan: "#38d9ff",
  // text
  heading: "#fff",
  body: "#d6d6dc",
  body2: "#e6e6ea",
  muted: "#9a9aa2",
  muted2: "#c8c4bb",
  meta: "#8a8a92",
  faint: "#6a6a72",
  faint2: "#55555c",
  dim: "#45454d",
} as const;

export const MONO = "ui-monospace,Menlo,monospace";
export const DISPLAY = "'Barlow Condensed',sans-serif";
export const BODY = "'Inter',sans-serif";

export const sectionTitle: CSSProperties = {
  margin: "24px 2px 12px",
  fontFamily: DISPLAY,
  fontWeight: 800,
  fontSize: 22,
  letterSpacing: ".02em",
  color: C.heading,
};

export const kicker = (color: string): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: "0 2px 12px",
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: ".14em",
  fontWeight: 600,
  color,
});

export const barTrack: CSSProperties = {
  height: 6,
  borderRadius: 999,
  background: C.divider,
  overflow: "hidden",
};

// horizontal bar-chart rows: [label, value, optional display]
export function hbars(
  rows: Array<[string, number, string?]>,
  color: string,
  suffix?: string,
) {
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return rows.map(([label, val, display]) => ({
    label,
    display: display != null ? display : suffix ? `${val}${suffix}` : String(val),
    width: `${Math.max(2, Math.round((val / max) * 100))}%`,
    color,
  }));
}
