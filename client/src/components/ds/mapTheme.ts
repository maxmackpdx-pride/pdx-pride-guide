/**
 * Map surface theme - deep-glass / OLED frame.
 * SoT: GROK_MIGRATION_PROMPT.md §1.6 + Card System.html map frames.
 *
 * Live Leaflet tiles still need network; frame, grid, pins, vignette
 * are offline chrome from this module.
 *
 * Frame rule: thin black outline + inward-only (deboss/vignette) effects.
 * No outer neon / neutral bloom on any map surface.
 */

export const MAP_SURFACE_BG = "#06060A";

export const MAP_PIN_SIZE = 18;

/**
 * Outer frame: thin black outline + deep hole-rim deboss (inward only).
 * Same language as --edge-deboss drawers: recessed well, no outer glow.
 */
export const mapFrameShadow = [
  "0 0 0 1px #000",
  "inset 0 0 0 1px rgba(0,0,0,.85)",
  "inset 0 2px 3px rgba(0,0,0,.9)",
  "inset 0 0 28px -8px rgba(0,0,0,.95)",
  "inset 0 0 52px 10px rgba(0,0,0,.42)",
  "inset 0 4px 10px -2px rgba(0,0,0,.75)",
  "inset 0 -1px 0 rgba(255,255,255,.045)",
].join(", ");

/** Grid plate under tiles (faux streets when tiles offline). */
export const mapGridBackground = [
  "repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.022) 38px 39px)",
  "repeating-linear-gradient(90deg, transparent 0 46px,rgba(255,255,255,.022) 46px 47px)",
  "radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%)",
].join(", ");

/** Hole-rim vignette - softens map edge into the deboss well. */
export const mapVignetteBackground =
  "radial-gradient(128% 128% at 50% 50%, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.48) 100%)";

export const mapVignetteInset =
  "inset 0 0 18px 2px rgba(0,0,0,.48), inset 0 0 56px 10px rgba(0,0,0,.4)";

/**
 * @deprecated No outer glow on maps - kept as empty for callers that still
 * reference the token. Prefer mapFrameShadow alone.
 */
export const mapNeutralGlow = "none";

/** Diagonal light shaft over map (pointer-events none). */
export const mapLightShaftBackground =
  "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015) 50%, transparent)";

const MULTI_CONIC =
  "conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF))";

/** Pin core shadow: thin black ring + inward hole only - no outer neon bloom. */
const PIN_INSET =
  "0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.06)";

/** Day-colored pin: black core + color ring + inward only. */
export function mapPinStyle(dayColor: string, extraShadow = ""): string {
  const shadow = extraShadow ? `${PIN_INSET}${extraShadow}` : PIN_INSET;
  return [
    `width:${MAP_PIN_SIZE}px`,
    `height:${MAP_PIN_SIZE}px`,
    "border-radius:999px",
    "background:#000",
    `border:3px solid ${dayColor}`,
    `box-shadow:${shadow}`,
  ].join("; ");
}

export function mapPinMultiStyle(extraShadow = ""): string {
  const shadow = extraShadow ? `${PIN_INSET}${extraShadow}` : PIN_INSET;
  return [
    `width:${MAP_PIN_SIZE}px`,
    `height:${MAP_PIN_SIZE}px`,
    "border-radius:999px",
    "border:2px solid #000",
    `background:${MULTI_CONIC}`,
    `box-shadow:${shadow}`,
  ].join("; ");
}

/** HTML for Leaflet divIcon - single day / category pin. */
export function mapPinHtml(
  dayColor: string,
  opts?: { rsvpPulse?: boolean; rsvpColor?: string },
): string {
  const rsvp = opts?.rsvpPulse;
  // RSVP feedback is scale pulse (CSS), not outer neon bloom
  const cls = rsvp ? ' class="map-pin-rsvp-pulse"' : "";
  return `<div${cls} style="${mapPinStyle(dayColor)}"></div>`;
}

/** HTML for Leaflet divIcon - multi-day conic, no white outer bloom. */
export function mapPinMultiHtml(opts?: { rsvpPulse?: boolean; rsvpColor?: string }): string {
  const rsvp = opts?.rsvpPulse;
  const cls = rsvp ? ' class="map-pin-rsvp-pulse"' : "";
  return `<div${cls} style="${mapPinMultiStyle()}"></div>`;
}

/** Legend / Expand chips - accent border + thin black + inward only. */
export function mapChipStyle(): string {
  return [
    "color:var(--lime, #CCFF00)",
    "background:rgba(5,5,7,.7)",
    "border:1px solid #000",
    "outline:1px solid var(--lime, #CCFF00)",
    "outline-offset:-2px",
    "box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75)",
  ].join("; ");
}

/** Inline CSS for outer map frame (apply to shell around Leaflet). */
export function mapFrameStyle(_opts?: { neutralGlow?: boolean }): string {
  // neutralGlow ignored - maps never get outer bloom
  return [
    "position:relative",
    "border-radius:16px",
    "overflow:hidden",
    `background:${MAP_SURFACE_BG}`,
    "border:1px solid #000",
    `box-shadow:${mapFrameShadow}`,
  ].join("; ");
}

/**
 * Inject once into live Leaflet map roots.
 * Uses glass.css vars when present; falls back to §1.6 literals.
 * Frame: pair with class `pdx-map-surface` (+ `pdx-map-surface--neutral` for directory).
 * Neutral no longer adds outer glow - same inward frame as every map.
 */
export const LIVE_MAP_CHROME_CSS = `
.pdx-map-live.pdx-map-surface,
.pdx-map-live.pdx-map-surface--neutral{
  position:relative;
  border-radius:16px;
  overflow:hidden;
  background:var(--map-surface-bg, ${MAP_SURFACE_BG});
  border:1px solid #000;
  box-shadow:var(--map-frame-shadow, ${mapFrameShadow});
}
/* Over tiles; pointer-events none so pan/zoom/pins still work. UI chrome uses z>500. */
.pdx-map-live__vignette{
  position:absolute; inset:0; z-index:400; pointer-events:none;
  background:var(--map-vignette-bg, ${mapVignetteBackground});
  box-shadow:var(--map-vignette-inset, ${mapVignetteInset});
  border-radius:inherit;
}
.pdx-map-live__shaft{
  position:absolute; top:-20%; bottom:-20%; left:48%; width:70px; z-index:401;
  pointer-events:none;
  background:${mapLightShaftBackground};
  transform:rotate(14deg); filter:blur(1px); opacity:.85;
}
.pdx-map-live .leaflet-container{
  background:var(--map-surface-bg, ${MAP_SURFACE_BG}) !important;
  font:inherit;
  z-index:0;
}
.pdx-map-live .leaflet-control-attribution{
  background:rgba(0,0,0,.65) !important;
  color:var(--text-faint, #8a8a8a) !important;
  font-size:9px !important;
}
.pdx-map-live .leaflet-control-attribution a{ color:var(--text-meta, #aaa) !important; }
.pdx-map-live .leaflet-control-zoom a{
  width:44px !important;
  height:44px !important;
  line-height:42px !important;
  background:#111 !important;
  color:var(--lime, #CCFF00) !important;
  border:1px solid #000 !important;
  box-shadow:inset 0 1px 2px rgba(0,0,0,.7) !important;
}
.pdx-map-live .leaflet-control-zoom a:hover{ background:#222 !important; }
.pdx-map-live .leaflet-control-zoom a:focus-visible{
  outline:3px solid var(--chrome-focus, rgba(0,255,255,.55)) !important;
  outline-offset:2px;
  position:relative;
  z-index:2;
}
/* Map key panel: OLED glass well (swatches stay ring-pin shapes) */
.pdx-map-live .map-legend{
  color:#c8c5bc;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.05), transparent 55%),
    radial-gradient(90% 80% at 50% 100%, rgba(0,0,0,.55), transparent 60%),
    #08080c;
  border:1px solid rgba(255,255,255,.07);
  border-radius:16px;
  box-shadow:
    0 0 0 1px #000,
    0 18px 40px -16px rgba(0,0,0,.92),
    inset 0 1px 0 rgba(255,255,255,.07),
    inset 0 -10px 28px -14px rgba(0,0,0,.75);
  outline:none;
}
/* Expand chip - separate from legend; thin black + lime edge */
.pdx-map-live .pdx-map-live__expand{
  color:var(--lime, #CCFF00);
  background:rgba(5,5,7,.88);
  border:1px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75);
  outline:1px solid color-mix(in srgb, var(--lime, #CCFF00) 70%, #000);
  outline-offset:-2px;
}
html.calm-mode .pdx-map-live .pdx-map-live__expand,
:root[data-calm="true"] .pdx-map-live .pdx-map-live__expand{
  outline-color:#555;
}
`;

/** CSS custom properties for map surfaces (set on a wrapper). */
export const mapThemeVars: Record<string, string> = {
  "--map-surface-bg": MAP_SURFACE_BG,
  "--map-frame-shadow": mapFrameShadow,
  "--map-grid-bg": mapGridBackground,
  "--map-vignette-bg": mapVignetteBackground,
  "--map-vignette-inset": mapVignetteInset,
  "--map-neutral-glow": "none",
};
