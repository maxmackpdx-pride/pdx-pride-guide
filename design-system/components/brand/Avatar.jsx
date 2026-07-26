import React from "react";

/* Avatar, the community member chip (source: repo UserAvatar.tsx + index.css).
   The identity ring renders as a soft multi-color BLOOM behind the photo
   (slow rotate + breathe), not a solid donut. The photo disc sits on top with a
   thin black outline; a light-sweep shimmer rides the halo. `chain` swaps to a
   metal sweep + padlock; `none` drops the glow entirely. */
const CSS = `
.pdxAvatar{ --_size:44px; --_outset:6.5%; --_blur:calc(var(--_size)*.06); --_shblur:calc(var(--_size)*.03); --_outline:2px;
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  width:var(--_size); height:var(--_size); flex:none; overflow:visible; isolation:isolate; z-index:0; }
/* soft identity bloom, behind the photo (z-index -1) */
.pdxAvatar::before{ content:""; position:absolute; inset:calc(var(--_outset)*-1); border-radius:50%; z-index:-1;
  opacity:0; pointer-events:none; background:var(--_ring);
  filter:blur(var(--_blur)) saturate(1.2) brightness(1.12); transform:translateZ(0); will-change:transform,opacity;
  animation:pdxaShimmerSpin 5s linear infinite, pdxaGlowBreathe 2.4s ease-in-out infinite; }
.pdxAvatar--none::before{ display:none; }
/* light sweep on the halo only */
.pdxAvatar__shimmer{ position:absolute; inset:calc(var(--_outset)*-1); border-radius:50%; pointer-events:none; z-index:-1;
  background:conic-gradient(from 0deg, transparent 0deg 40deg, rgba(255,255,255,.66) 58deg, transparent 92deg 360deg);
  filter:blur(var(--_shblur)); opacity:.78; animation:pdxaShimmerSpin 5s linear infinite;
  -webkit-mask:radial-gradient(farthest-side, transparent calc(100% - var(--_outset) - var(--_outline) - 2px), #000 calc(100% - var(--_outset) + 2px));
  mask:radial-gradient(farthest-side, transparent calc(100% - var(--_outset) - var(--_outline) - 2px), #000 calc(100% - var(--_outset) + 2px)); }
.pdxAvatar__shimmer--chain{ background:conic-gradient(from 0deg, transparent 0deg 42deg, rgba(228,234,246,.85) 54deg, transparent 72deg 360deg); animation-duration:3.6s; }
/* photo disc, always above the glow */
.pdxAvatar__inner{ position:relative; z-index:2; width:100%; height:100%; border-radius:50%; overflow:hidden;
  background:#000; box-shadow:0 0 0 var(--_outline) #000, inset 0 0 0 1px rgba(0,0,0,.9); transform:translateZ(0); isolation:isolate;
  transition:transform .2s var(--ease-out, ease); display:flex; align-items:center; justify-content:center; }
.pdxAvatar__inner img{ width:100%; height:100%; object-fit:cover; display:block; }
.pdxAvatar__fallback{ width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:900; font-size:calc(var(--_size)*.38); color:#000; }
.pdxAvatar:hover::before{ animation-duration:2.2s, 1.6s; filter:blur(var(--_blur)) saturate(1.28) brightness(1.22); }
.pdxAvatar:hover .pdxAvatar__shimmer{ animation-duration:1.9s; filter:blur(var(--_shblur)) brightness(1.65); opacity:.95; }
.pdxAvatar:hover .pdxAvatar__inner{ transform:translateZ(0) scale(1.04); }
.pdxAvatar__lock{ position:absolute; bottom:-2px; left:50%; transform:translateX(-50%); z-index:3;
  font-size:calc(var(--_size)*.2); filter:drop-shadow(0 0 4px rgba(180,190,210,.8)); }
.pdxAvatar__status{ position:absolute; right:0; bottom:0; z-index:3; border-radius:999px;
  border:2px solid var(--ink-900); background:var(--green-acid); }
@keyframes pdxaShimmerSpin{ to{ transform:rotate(360deg); } }
@keyframes pdxaGlowBreathe{ 0%,100%{ opacity:.58; } 50%{ opacity:1; } }
:root[data-calm="true"] .pdxAvatar::before, :root[data-calm="true"] .pdxAvatar__shimmer{ animation:none !important; }
:root[data-calm="true"] .pdxAvatar::before{ opacity:.7; }
@media (prefers-reduced-motion: reduce){ .pdxAvatar::before, .pdxAvatar__shimmer{ animation:none !important; } .pdxAvatar::before{ opacity:.7; } }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-avatar-css")) {
  const s = document.createElement("style");
  s.id = "pdx-avatar-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* Flag ring conic gradients (mirror of the site's index.css). */
export const AVATAR_RINGS = {
  progress:    { ring: "conic-gradient(#E40303,#FF8C00,#FFED00,#008026,#24408E,#FFFFFF,#F6A9B8,#55CDFC,#000000,#784F17,#E40303)", label: "Progress" },
  rainbow:     { ring: "conic-gradient(#E40303,#FF8C00,#FFED00,#008026,#24408E,#732982,#E40303)", label: "Rainbow" },
  lesbian:     { ring: "conic-gradient(#D52D00,#FF9A56,#FFFFFF,#D362A4,#A30262,#D52D00)", label: "Lesbian" },
  "gay-men":   { ring: "conic-gradient(#078D70,#26CEAA,#FFFFFF,#98E8C1,#5BCEFA,#078D70)", label: "Gay men" },
  bisexual:    { ring: "conic-gradient(#D60270,#D60270,#9B4F96,#0038A8,#0038A8,#D60270)", label: "Bisexual" },
  transgender: { ring: "conic-gradient(#5BCEFA,#F5A9B8,#FFFFFF,#F5A9B8,#5BCEFA,#5BCEFA)", label: "Transgender" },
  nonbinary:   { ring: "conic-gradient(#FCF434,#FFFFFF,#9C59D1,#000000,#FCF434)", label: "Nonbinary" },
  pansexual:   { ring: "conic-gradient(#FF218C,#FFD800,#21B1FF,#FF218C)", label: "Pansexual" },
  genderfluid: { ring: "conic-gradient(#FF76A4,#FFFFFF,#C011D7,#333333,#2F3CBE,#FF76A4)", label: "Genderfluid" },
  genderqueer: { ring: "conic-gradient(#B57EDC,#FFFFFF,#4A8123,#B57EDC)", label: "Genderqueer" },
  intersex:    { ring: "conic-gradient(#FFD800,#FFD800,#79007F,#FFD800)", label: "Intersex" },
  asexual:     { ring: "conic-gradient(#000000,#A3A3A3,#FFFFFF,#810081,#000000)", label: "Asexual" },
  aromantic:   { ring: "conic-gradient(#3DA542,#FFFFFF,#ABABAB,#5ECF66,#3DA542)", label: "Aromantic" },
  agender:     { ring: "conic-gradient(#BABABA,#FFFFFF,#B4F8C8,#FFFFFF,#BABABA)", label: "Agender" },
  leather:     { ring: "conic-gradient(#000000,#000000,#FFFFFF,#000000,#0000FF,#000000)", label: "Leather" },
  bear:        { ring: "conic-gradient(#623818,#623818,#FEEF9C,#623818,#000000,#623818)", label: "Bear" },
  chain:       { ring: "repeating-conic-gradient(from 0deg,#8a919c 0deg 8deg,#c8d0dc 8deg 16deg,#5f6670 16deg 24deg,#dfe5ee 24deg 32deg)", label: "Chain", lock: true },
  none:        { ring: "none", label: "No ring", none: true },
};

const SIZES = { sm: 32, md: 44, lg: 64, xl: 84 };
const TINTS = ["#00FFFF", "#FF00CC", "#CCFF00", "#FF6600", "#8800FF", "#39FF14"];
function tintFor(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Avatar, flag ring member chip. */
export function Avatar({
  src,
  name = "",
  size = "md",
  ring = "progress",
  tint,
  status = false,
  statusColor = "var(--green-acid)",
  title,
  className = "",
  style = {},
  ...rest
}) {
  const px = SIZES[size] || size;
  const spec = AVATAR_RINGS[ring] || AVATAR_RINGS.progress;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?";
  const bg = tint || (name ? tintFor(name) : "#222");
  const dotSize = Math.max(9, Math.round(px * 0.26));
  const mod = spec.none ? "pdxAvatar--none" : spec.lock ? "pdxAvatar--chain" : "";
  return (
    <span className={`pdxAvatar ${mod} ${className}`}
      style={{ "--_size": px + "px", "--_ring": spec.ring, ...style }}
      title={title || (name ? `${name} · ${spec.label}` : spec.label)} {...rest}>
      <span className="pdxAvatar__inner">
        {src ? <img src={src} alt={name} />
             : <span className="pdxAvatar__fallback" style={{ background: bg, color: bg === "#222" ? "#999" : "#000" }}>{initials}</span>}
      </span>
      {!spec.none && <span className={`pdxAvatar__shimmer ${spec.lock ? "pdxAvatar__shimmer--chain" : ""}`} aria-hidden="true" />}
      {spec.lock && <span className="pdxAvatar__lock" aria-hidden="true">🔒</span>}
      {status && <span className="pdxAvatar__status" style={{ width: dotSize, height: dotSize, background: statusColor }} />}
    </span>
  );
}
