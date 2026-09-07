import L from "leaflet";

export type WaypointId =
  | "eventz"
  | "hauz"
  | "zenegade"
  | "afterz"
  | "mizzed"
  | "carpool"
  | "bar"
  | "club"
  | "venue"
  | "park"
  | "outz"
  | "cafe"
  | "shop"
  | "bath"
  | "adult"
  | "gigz"
  | "sells"
  | "giftz"
  | "plus"
  | "host-home"
  | "host-hotel"
  | "host-car"
  | "host-hole"
  | "host-group"
  | "dark-room"
  | "sling"
  | "glory-hole"
  | "trail"
  | "happening"
  | "looking-now"
  | "looking-later"
  | "goon-buds";

export const WAYPOINT_COLOR: Record<WaypointId, string> = {
  eventz: "#ccff00",
  hauz: "#00ffff",
  zenegade: "#ff2400",
  afterz: "#ffee00",
  mizzed: "#ff00cc",
  carpool: "#00ffff",
  bar: "#ff00cc",
  club: "#8800ff",
  venue: "#00ffff",
  park: "#39ff14",
  outz: "#ff6600",
  cafe: "#39ff14",
  shop: "#ffb23d",
  bath: "#0044ff",
  adult: "#ff00cc",
  gigz: "#8800ff",
  sells: "#39ff14",
  giftz: "#ccff00",
  plus: "#ff2400",
  "host-home": "#ff2400",
  "host-hotel": "#ff2400",
  "host-car": "#ff2400",
  "host-hole": "#ff2400",
  "host-group": "#ff2400",
  "dark-room": "#ff2400",
  sling: "#ff2400",
  "glory-hole": "#ff2400",
  trail: "#ff2400",
  happening: "#ff2400",
  "looking-now": "#ff2400",
  "looking-later": "#ff2400",
  "goon-buds": "#ff2400",
};

const DAY_COLOR: Record<string, string> = {
  mon: "#8800ff",
  tue: "#0044ff",
  wed: "#ffee00",
  thu: "#00ffff",
  fri: "#ff00cc",
  sat: "#39ff14",
  sun: "#ff6600",
};

function svg(body: string) {
  return `<svg viewBox="0 0 24 24" class="wp__mark" aria-hidden="true">${body}</svg>`;
}

const G: Record<WaypointId, string> = {
  eventz: svg(
    `<rect x="5" y="6.5" width="14" height="13.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M5 6.5h14v4H5z"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 4.5v4M16 4.5v4"/>`,
  ),
  hauz: svg(
    `<path fill="currentColor" d="M3.5 11.2 12 3.8l8.5 7.4v9.5H14v-6H10v6H3.5z"/>`,
  ),
  zenegade: svg(
    `<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" d="M6 6h12L6 18h12"/><path stroke="#00ffff" stroke-width="1.6" d="M5 15.5 19 8.5"/>`,
  ),
  afterz: svg(
    `<path fill="currentColor" d="M13.2 4.2a7.4 7.4 0 1 0 6.4 11.2 6.2 6.2 0 1 1-6.4-11.2z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 8h6m0 0-2.2-2.2M20 8l-2.2 2.2"/>`,
  ),
  mizzed: svg(
    `<path fill="currentColor" d="M3.5 6.2h10.2c.9 0 1.6.7 1.6 1.6v6.2c0 .9-.7 1.6-1.6 1.6H8.2L4.4 18.8V15.6H3.5c-.9 0-1.6-.7-1.6-1.6V7.8c0-.9.7-1.6 1.6-1.6z"/><path fill="currentColor" opacity=".9" d="M10.8 9.6h9.2c.8 0 1.5.7 1.5 1.5v5.2c0 .8-.7 1.5-1.5 1.5h-1.2v2.4l-3.2-2.4H10.8c-.8 0-1.5-.7-1.5-1.5v-5.2c0-.8.7-1.5 1.5-1.5z"/>`,
  ),
  carpool: svg(
    `<path fill="currentColor" d="M6.2 9.2h11.6l1.7 3.2v5.2H16v-1.6H8v1.6H4.5v-5.2z"/><circle cx="7.4" cy="17.6" r="1.5" fill="#050506"/><circle cx="16.6" cy="17.6" r="1.5" fill="#050506"/><path fill="currentColor" d="M8 6.6h8l1.4 2.6H6.6z"/>`,
  ),
  bar: svg(
    `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6 4.8h12L12 13.2 6 4.8z"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 13.2V20M8.5 20h7"/><circle cx="15.6" cy="7.2" r="1.2" fill="currentColor"/>`,
  ),
  club: svg(
    `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 4.2v2.2M12 17.6v2.2M4.2 12h2.2M17.6 12h2.2"/>`,
  ),
  venue: svg(
    `<path fill="currentColor" d="M4.5 19.5V8.2L12 4.2l7.5 4v11.3H4.5z"/><path fill="#050506" d="M10.2 12.2h3.6v7.3h-3.6z"/>`,
  ),
  park: svg(
    `<path fill="currentColor" d="M12 3.4 16.8 12H7.2z"/><path fill="currentColor" d="m12 7 6 9.2H6z"/><path fill="currentColor" d="M11 16.2h2V21h-2z"/>`,
  ),
  outz: svg(
    `<path fill="currentColor" d="m3.2 16.8 5.4-7.4 3.6 4.8L16.4 9l4.4 7.8z"/>`,
  ),
  cafe: svg(
    `<path fill="none" stroke="currentColor" stroke-width="1.8" d="M5.5 9.2h10.2v6.2c0 2.2-1.8 3.6-4 3.6H9.5c-2.2 0-4-1.4-4-3.6z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M15.7 10.4h2.4c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2h-2.4"/><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M9 4.8c.6.8.6 1.6 0 2.4M12 4.8c.6.8.6 1.6 0 2.4"/>`,
  ),
  shop: svg(
    `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7.2 9.2 8.4 20h7.2l1.2-10.8z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 9.2c0-2.2 1.2-4 3-4s3 1.8 3 4"/>`,
  ),
  bath: svg(
    `<path fill="currentColor" d="M12 4.2c3.6 4.4 6.6 7.4 6.6 10.2A6.6 6.6 0 0 1 12 21a6.6 6.6 0 0 1-6.6-6.6C5.4 11.6 8.4 8.6 12 4.2z"/>`,
  ),
  adult: svg(
    `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7.2 9.2 8.4 20h7.2l1.2-10.8z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 9.2c0-2.2 1.2-4 3-4s3 1.8 3 4"/><path fill="currentColor" d="M10.4 13.2h3.2v1.4h-3.2z"/>`,
  ),
  gigz: svg(
    `<rect x="5" y="6.5" width="14" height="13.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M5 6.5h14v4H5z"/><path fill="currentColor" d="m12 12.2 1 2.1 2.3.2-1.8 1.5.6 2.2L12 16.9l-2.1 1.3.6-2.2-1.8-1.5 2.3-.2z"/>`,
  ),
  sells: svg(
    `<path fill="currentColor" d="M4.6 10.2h14.8v9.4H4.6z"/><path fill="currentColor" d="M4.2 7.4h15.6l-1.4 2.8H5.6z"/><path fill="#050506" d="M10.6 13.4h2.8v6.2h-2.8z"/>`,
  ),
  giftz: svg(
    `<rect x="4.5" y="10.2" width="15" height="9.4" rx="1" fill="currentColor"/><path fill="currentColor" d="M4.5 7.4h15v3.2h-15z"/><path fill="#050506" d="M11.2 7.4h1.6v12.2h-1.6z"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 7.4c-2.4-2.6-5.2-.4-3.2 1.8C10.4 10.4 12 7.4 12 7.4c1.6 3 3.6.8 3.2-1.8-1.2-1.8-3.2.2-3.2 1.8z"/>`,
  ),
  plus: svg(`<text x="12" y="16.2" text-anchor="middle" fill="currentColor" font-size="9.2" font-weight="800" font-family="Barlow Condensed, Arial Narrow, sans-serif">18+</text>`),
  "host-home": svg(
    `<path fill="currentColor" d="M5 19.4V9.6L12 4.4l7 5.2v9.8H14v-5.4H10v5.4z"/>`,
  ),
  "host-hotel": svg(
    `<path fill="currentColor" d="M4.4 14.2h15.2v5.2H4.4zM6 10.4c0-1.6 1.2-2.8 2.8-2.8h2.2c1.6 0 2.8 1.2 2.8 2.8v3.8H6z"/>`,
  ),
  "host-car": svg(
    `<path fill="currentColor" d="M5.8 10h12.4l1.8 3.4v5H16.2v-1.4H7.8V18.4H4v-5z"/><circle cx="7.4" cy="18.2" r="1.4" fill="#050506"/><circle cx="16.6" cy="18.2" r="1.4" fill="#050506"/>`,
  ),
  "host-hole": svg(
    `<rect x="4.4" y="6.4" width="15.2" height="11.2" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 6.4 12 3.6 16 6.4"/>`,
  ),
  "host-group": svg(
    `<circle cx="8.4" cy="8.4" r="2.4" fill="currentColor"/><circle cx="15.6" cy="8.4" r="2.4" fill="currentColor"/><path fill="currentColor" d="M3.6 18.6c.4-3 2.2-4.6 4.8-4.6s4.4 1.6 4.8 4.6H3.6zm7.2 0c.4-3 2.2-4.6 4.8-4.6s4.4 1.6 4.8 4.6h-9.6z"/>`,
  ),
  "dark-room": svg(
    `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7.2 12h9.6"/>`,
  ),
  sling: svg(
    `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M5 19.4 12 4.6l7 14.8"/><path stroke="currentColor" stroke-width="2" d="M8.4 14.6h7.2"/>`,
  ),
  "glory-hole": svg(
    `<rect x="5" y="5" width="14" height="14" rx="2.4" fill="none" stroke="currentColor" stroke-width="2"/>`,
  ),
  trail: svg(
    `<circle cx="16.6" cy="8.2" r="2.1" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.2 10.2 10.6 13.4 5.8 13.2M10.6 13.4 8.2 18.4M10.6 13.4 14.8 16.6"/>`,
  ),
  happening: svg(`<path fill="none" stroke="currentColor" stroke-width="1.8" d="M5 6h14v14H5zM8 3v6M16 3v6"/><path fill="currentColor" d="m12 10 1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>`),
  "looking-now": svg(`<path fill="none" stroke="currentColor" stroke-width="1.8" d="M2.8 12s3.4-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.4 5.2-9.2 5.2S2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/>`),
  "looking-later": svg(`<circle cx="10.5" cy="11" r="6.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M10.5 6.8V11l3 2"/><path fill="currentColor" d="M18 10.5a5.2 5.2 0 1 0 3.5 8.7A4.5 4.5 0 1 1 18 10.5z"/>`),
  "goon-buds": svg(`<path fill="none" stroke="currentColor" stroke-width="1.7" d="M4 13c0-3 2-5 4.5-5 1.5 0 2.7.7 3.5 1.8C12.8 8.7 14 8 15.5 8 18 8 20 10 20 13s-2.2 5-5 5c-1.2 0-2.2-.4-3-1.1-.8.7-1.8 1.1-3 1.1-2.8 0-5-2-5-5z"/><path stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="m8 12 1.4 2L12 10l2.6 4L16 12"/>`),
};

export type WaypointOpts = {
  id: WaypointId;
  selected?: boolean;
  scoop?: string;
  color?: string;
  logoUrl?: string;
  alternateLogoUrl?: string;
  avatarUrl?: string;
  badgeId?: WaypointId;
  bloom?: boolean;
  size?: number;
};

const ZAYDARK_USER_IDS = new Set<WaypointId>([
  "host-home", "host-hotel", "host-car", "host-hole", "host-group", "dark-room",
  "sling", "glory-hole", "trail", "happening", "looking-now", "looking-later", "goon-buds",
]);

function shellFamily(id: WaypointId) {
  if (id === "eventz" || id === "plus") return "ticket";
  if (id === "zenegade" || id === "afterz") return "long";
  if (id === "hauz") return "house";
  if (id === "mizzed") return "speech";
  if (ZAYDARK_USER_IDS.has(id)) return "zaydark";
  if (["venue", "bar", "club", "park", "cafe", "shop", "bath", "adult"].includes(id)) return "place";
  return "shield";
}

function shellPath(family: string, cx: number, cy: number, r: number) {
  const x0 = cx - r, x1 = cx + r, y0 = cy - r, y1 = cy + r;
  const q = r * .2;
  if (family === "ticket") return `M${x0 + q},${y0}H${cx - q}Q${cx},${y0 + q} ${cx + q},${y0}H${x1 - q}V${cy - q}Q${x1 - q * .7},${cy} ${x1},${cy + q}V${y1}H${x0}V${cy + q}Q${x0 + q * .7},${cy} ${x0},${cy - q}V${y0}Z`;
  if (family === "long") return `M${x0 + q},${y0}H${x1 - q}L${x1},${y0 + q}V${cy + r * .45}L${cx},${y1 + r * .68} ${x0},${cy + r * .45}V${y0 + q}Z`;
  if (family === "house") return `M${x0 + q},${cy - r * .15} ${cx},${y0} ${x1 - q},${cy - r * .15}V${y1 - q}L${cx},${y1 + r * .68} ${x0 + q},${y1 - q}Z`;
  if (family === "speech") return `M${x0 + q},${y0}H${x1 - q}L${x1},${y0 + q}V${y1 - q}L${x1 - q},${y1}H${cx + q},${cx},${y1 + r * .68} ${cx - q},${y1}H${x0 + q}L${x0},${y1 - q}V${y0 + q}Z`;
  if (family === "zaydark") return `M${x0 + q},${y0}H${x1 - q}L${x1},${y0 + q}V${cy + r * .45}L${cx},${y1 + r * .68} ${x0},${cy + r * .45}V${y0 + q}Z`;
  return `M${x0 + q},${y0}H${x1 - q}L${x1},${y0 + q}V${y1 - q}L${cx},${y1 + r * .68} ${x0},${y1 - q}V${y0 + q}Z`;
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

export function waypointSize(zoom: number, selected: boolean): number {
  const z = Math.max(10, Math.min(20, zoom));
  const zoomProgress = Math.max(0, Math.min(1, (z - 12) / 4));
  const base = selected ? 57 : 31 + (42 - 31) * zoomProgress;
  const blockProgress = Math.max(0, Math.min(1, (z - 16) / 2));
  const scaled = base * 1.2 * (1 + blockProgress * 0.15);
  return Math.round(scaled * 10) / 10;
}

export function waypointHtml(opts: WaypointOpts) {
  const D = opts.size ?? 42;
  const color = opts.color ?? WAYPOINT_COLOR[opts.id];
  const scoop = opts.scoop;
  const family = shellFamily(opts.id);
  const pad = Math.round(D * 0.22);
  const sw = Math.max(1, D * 0.0425);
  const cx = pad + D / 2;
  const cy = pad + D / 2;
  const r = D / 2 - sw / 2;
  const scoopR = D * 0.3;
  const scoopCy = scoop ? cy + r + scoopR * 0.55 : cy;
  const integratedTip = ["long", "house", "speech", "zaydark", "place", "shield"].includes(family);
  const attachY = scoop ? scoopCy + scoopR * 0.2 : cy + r * 0.62;
  const tipY = (scoop ? scoopCy + scoopR : cy + r) + D * 0.34;
  const tipW = D * 0.3;
  const w = Math.ceil(pad * 2 + D);
  const h = Math.ceil(tipY + pad * 0.4);
  const fid = `wg${opts.id}${D}${scoop ? "s" : ""}${opts.bloom ? "b" : ""}`;
  const mark = D * 0.58;
  const markX = cx - mark / 2;
  const markY = cy - mark / 2;
  const glowW = sw * 1.6;
  const scoopStroke = Math.max(1, sw * 0.85);
  const bloom = opts.bloom
    ? `<defs><linearGradient id="${fid}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff00cc"/><stop offset=".25" stop-color="#ccff00"/><stop offset=".5" stop-color="#00ffff"/><stop offset=".75" stop-color="#8800ff"/><stop offset="1" stop-color="#ff00cc"/></linearGradient></defs>`
    : "";
  const ring = opts.bloom ? `url(#${fid}b)` : color;
  const mainPath = shellPath(family, cx, cy, r);
  const clipId = `${fid}clip`;
  const markContent = opts.avatarUrl
    ? `<image class="wp-avatar" href="${escapeAttribute(opts.avatarUrl)}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2.28}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
    : opts.logoUrl
    ? `<image class="wp-logo${opts.alternateLogoUrl ? " wp-logo--primary" : ""}" href="${escapeAttribute(opts.logoUrl)}" x="${markX}" y="${markY}" width="${mark}" height="${mark}" preserveAspectRatio="xMidYMid meet"/>${opts.alternateLogoUrl ? `<image class="wp-logo wp-logo--alternate" href="${escapeAttribute(opts.alternateLogoUrl)}" x="${markX}" y="${markY}" width="${mark}" height="${mark}" preserveAspectRatio="xMidYMid meet"/>` : ""}`
    : `<g transform="translate(${markX} ${markY}) scale(${mark / 24})" fill="#fff" stroke="#fff" color="#fff">${G[opts.id].replace('<svg viewBox="0 0 24 24" class="wp__mark" aria-hidden="true">', "").replace("</svg>", "")}</g>`;
  const badgeD = D * .38;
  const badgeCx = cx + r * .78;
  const badgeCy = cy - r * .72;
  const badgeMark = badgeD * .62;
  const badge = opts.badgeId ? `<g class="wp-badge"><path d="${shellPath("place", badgeCx, badgeCy, badgeD / 2)}" fill="#050506" stroke="${ring}" stroke-width="${Math.max(1, sw * .75)}"/><g transform="translate(${badgeCx - badgeMark / 2} ${badgeCy - badgeMark / 2}) scale(${badgeMark / 24})" fill="#fff" stroke="#fff" color="#fff">${G[opts.badgeId].replace('<svg viewBox="0 0 24 24" class="wp__mark" aria-hidden="true">', "").replace("</svg>", "")}</g></g>` : "";
  const scoopCircle = scoop
    ? `<circle class="wp-scoop-ring" cx="${cx}" cy="${scoopCy}" r="${scoopR}" fill="#050506" stroke="${ring}" stroke-width="${scoopStroke}"/>
       <text x="${cx}" y="${scoopCy + 1}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-size="${Math.max(8, D * 0.26)}" font-weight="800">${escapeXml(scoop)}</text>`
    : "";
  const cls = ["wp", `wp--${opts.id}`, `wp--${D}`, opts.selected ? "is-selected" : "", scoop ? "has-scoop" : "", opts.bloom ? "is-bloom" : ""]
    .filter(Boolean)
    .join(" ");
  return `<div class="${cls}" style="--wp:${color};width:${w}px;height:${h}px">
    <svg class="wp-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      ${bloom}<defs><clipPath id="${clipId}"><path d="${mainPath}"/></clipPath></defs>
      ${integratedTip || scoop ? "" : `<polygon points="${cx - tipW},${attachY} ${cx + tipW},${attachY} ${cx},${tipY}" fill="${ring}"/>`}
      <path class="wp-glow-ring" d="${mainPath}" fill="none" stroke="${ring}" stroke-width="${glowW}"/>
      <path d="${mainPath}" fill="#050506" stroke="${ring}" stroke-width="${sw}"/>
      ${markContent}
      ${scoopCircle}
      ${badge}
    </svg>
  </div>`;
}

function escapeXml(value: string) {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&" + "amp;", "<": "&" + "lt;", ">": "&" + "gt;" }[ch] ?? ch));
}

function escapeAttribute(value: string) {
  return escapeXml(value).replace(/["']/g, ch => ch === '"' ? "&quot;" : "&#39;");
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
