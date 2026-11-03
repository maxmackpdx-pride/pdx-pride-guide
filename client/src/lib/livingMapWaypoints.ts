// Leaflet adapter kept separate from the pure card/globe SVG markup.
import L from "leaflet";
import { waypointHtml, type WaypointOpts } from "./livingMapWaypointMarkup";
export * from "./livingMapWaypointMarkup";
function escapeAttribute(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] ?? ch));
}
/** Compact Placez discovery marker. The 44px shell keeps the orb easy to tap. */
export function placeOrbIcon(color: string) {
  const size = 44;
  return L.divIcon({
    className: "wp-icon wp-place-orb-icon",
    html: `<span class="wp-place-orb" style="--wp:${escapeAttribute(color)}" aria-hidden="true"><i></i></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function waypointIcon(opts: WaypointOpts) {
  const D = opts.size ?? 42;
  const pad = Math.round(D * 0.22);
  const scoopR = D * 0.3;
  const sw = Math.max(1, D * 0.0425);
  const r = D / 2 - sw / 2;
  const cy = pad + D / 2;
  const scoopCy = opts.scoop ? cy + r + scoopR * 0.55 : cy;
  const tipY = (opts.scoop ? scoopCy + scoopR : cy + r) + D * 0.34;
  const w = Math.ceil(pad * 2 + D);
  const h = Math.ceil(tipY + pad * 0.4);
  return L.divIcon({
    className: "wp-icon",
    html: waypointHtml(opts),
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 2],
    popupAnchor: [0, -h + 8],
  });
}
