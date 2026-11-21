import "../ds/tokens/brand-third-party.css";

/** Ride app buttons in the Ridez sheet (t327u). Each brand keeps its own primary
 *  color (third-party brand exception, see ds/tokens/brand-third-party.css).
 *  The marks are simplified wordmarks drawn here until the official logo files
 *  are added. */
export type RideBrand = "uber" | "lyft" | "trimet";
export const RIDE_BRAND_COLOR: Record<RideBrand, string> = {
  uber: "var(--brand-uber)",
  lyft: "var(--brand-lyft)",
  trimet: "var(--brand-trimet)",
};

export function RideBrandMark({ brand, glyph = false }: { brand: RideBrand; glyph?: boolean }) {
  if (brand === "trimet" && glyph) return (
    <svg className="zride-mark zride-mark--glyph" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M7 9h10M12 9v9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
  if (brand === "uber") return (
    <svg className="zride-mark" viewBox="0 0 56 24" aria-hidden="true"><text x="28" y="17.5" textAnchor="middle" fill="currentColor" fontFamily="Helvetica, Arial, sans-serif" fontWeight="500" fontSize="17" letterSpacing="-.3">Uber</text></svg>
  );
  if (brand === "lyft") return (
    <svg className="zride-mark" viewBox="0 0 56 24" aria-hidden="true"><text x="28" y="18" textAnchor="middle" fill="currentColor" fontFamily="Helvetica, Arial, sans-serif" fontWeight="800" fontSize="19" letterSpacing="-.6">lyft</text></svg>
  );
  return (
    <svg className="zride-mark zride-mark--wide" viewBox="0 0 72 24" aria-hidden="true">
      <circle cx="11" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M6.5 9h9M11 9v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <text x="45" y="16.5" textAnchor="middle" fill="currentColor" fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="12.5">TriMet</text>
    </svg>
  );
}

/** Directions map-app tiles (owner, Nov 20): brand color (third-party exception) and a simple
 *  in-house glyph until official marks are added. Zaylist Mapz uses the day accent, not a brand color. */
export type MapBrand = "google" | "apple" | "waze" | "citymapper";
export const MAP_BRAND_COLOR: Record<MapBrand, string> = {
  google: "var(--brand-google-maps)",
  apple: "var(--brand-apple-maps)",
  waze: "var(--brand-waze)",
  citymapper: "var(--brand-citymapper)",
};
export function MapBrandMark({ brand }: { brand: MapBrand | "zaylist" }) {
  const common = { className: "zride-mark zride-mark--glyph", viewBox: "0 0 24 24", "aria-hidden": true as const, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (brand === "google") return <svg {...common}><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>;
  if (brand === "apple") return <svg {...common}><path d="m4 11 16-7-7 16-2-7-7-2Z" /></svg>;
  if (brand === "waze") return <svg {...common}><path d="M5 15.5a7.5 7.5 0 1 1 14 0c0 1.9-2 3-4 3H9c-2.2 0-4-1.1-4-3Z" /><circle cx="9.5" cy="11" r=".6" fill="currentColor" /><circle cx="14.5" cy="11" r=".6" fill="currentColor" /><path d="M9.5 14c1.3 1 3.7 1 5 0" /><circle cx="8" cy="20" r="1.3" /><circle cx="16" cy="20" r="1.3" /></svg>;
  if (brand === "citymapper") return <svg {...common}><path d="M4 12h12" /><path d="m12 7 5 5-5 5" /><circle cx="19.5" cy="12" r="1" fill="currentColor" /></svg>;
  return <svg {...common}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /></svg>;
}
