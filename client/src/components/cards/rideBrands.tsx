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
