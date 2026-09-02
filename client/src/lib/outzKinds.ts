import type { OutzPlaceKind } from "@shared/outz";

/**
 * Badge label and accent per OUTZ listing kind. Shared by the OUTZ homepage and
 * the destination page so a kind reads the same colour and label on both.
 */
export const OUTZ_KIND_META: Record<OutzPlaceKind, { label: string; color: string; accent: string }> = {
  beach: { label: "Beach", color: "cyan", accent: "var(--cyan)" },
  "camp-hike": { label: "Camp + Hike", color: "lime", accent: "var(--lime)" },
  campground: { label: "Camp", color: "green", accent: "var(--green)" },
  trailhead: { label: "Hike", color: "orange", accent: "var(--orange)" },
  "outdoor-stay": { label: "Stay", color: "amber", accent: "var(--amber)" },
};

/** Button accent tokens are a narrower set than badge colours. */
export const OUTZ_BUTTON_ACCENT: Record<string, string> = {
  amber: "orange",
  green: "green",
  cyan: "cyan",
  lime: "lime",
  orange: "orange",
};

export const OUTZ_MOTIF = "/motifs/outz";

/** Deterministic motif per listing so a place keeps the same art between renders. */
const BAND_ART = [
  `${OUTZ_MOTIF}/ridge-loop-cyan.svg`,
  `${OUTZ_MOTIF}/canyon-overlook-orange.svg`,
  `${OUTZ_MOTIF}/alpine-lake-loop-lime.svg`,
  `${OUTZ_MOTIF}/waterfall-crossing-lime.svg`,
  `${OUTZ_MOTIF}/topographic-ridge-basin-amber.svg`,
];

export function outzBandArt(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return BAND_ART[hash % BAND_ART.length];
}

/** "72°F", or an em dash placeholder when the source returned nothing. */
export function outzTempLabel(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value)}°F`;
}
