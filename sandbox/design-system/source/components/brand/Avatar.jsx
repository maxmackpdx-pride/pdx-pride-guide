import React from "react";

/* Avatar, the community member chip. A circular photo or initials inside a
   neon PRIDE-FLAG ring. The ring is IDENTITY: each option is a real pride
   flag (lesbian, transgender, bisexual, pansexual, nonbinary, ...), rendered
   as a neon conic gradient with a matching glow. `rainbow` is the default;
   `neutral` and day keys (MON..SUN) are also available for non-identity use. */
const CSS = `
.pdxAvatar{ position:relative; display:inline-flex; flex:none; border-radius:999px; }
.pdxAvatar__ring{ position:absolute; inset:0; border-radius:999px; padding:var(--_pad,3px); }
.pdxAvatar__inner{ position:relative; width:100%; height:100%; border-radius:999px; overflow:hidden;
  border:2px solid var(--ink-1000); background:var(--ink-800);
  display:flex; align-items:center; justify-content:center; }
.pdxAvatar__inner img{ width:100%; height:100%; object-fit:cover; display:block; }
.pdxAvatar__initials{ font-family:var(--font-display); font-weight:900; color:#fff; line-height:1;
  text-transform:uppercase; }
.pdxAvatar__dot{ position:absolute; right:0; bottom:0; border-radius:999px;
  border:2px solid var(--ink-900); background:var(--neon-green); z-index:2; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-avatar-css")) {
  const s = document.createElement("style");
  s.id = "pdx-avatar-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* Pride flag ring palettes (canonical flag colors) + a representative glow. */
export const AVATAR_FLAGS = {
  rainbow:     { colors: ["#E40303","#FF8C00","#FFED00","#008026","#004DFF","#750787"], glow: "#FF8C00", label: "Rainbow" },
  lesbian:     { colors: ["#D52D00","#FF9A56","#FFFFFF","#D362A4","#A30262"], glow: "#FF3D8B", label: "Lesbian" },
  transgender: { colors: ["#5BCEFA","#F5A9B8","#FFFFFF","#F5A9B8","#5BCEFA"], glow: "#5BCEFA", label: "Transgender" },
  bisexual:    { colors: ["#D60270","#D60270","#9B4F96","#0038A8","#0038A8"], glow: "#B84B9A", label: "Bisexual" },
  pansexual:   { colors: ["#FF218C","#FFD800","#21B1FF"], glow: "#FF218C", label: "Pansexual" },
  nonbinary:   { colors: ["#FCF434","#FFFFFF","#9C59D1","#2C2C2C"], glow: "#FCF434", label: "Nonbinary" },
  genderqueer: { colors: ["#B57EDC","#FFFFFF","#4A8123"], glow: "#B57EDC", label: "Genderqueer" },
  intersex:    { colors: ["#FFD800","#7902AA","#FFD800"], glow: "#FFD800", label: "Intersex" },
  genderfluid: { colors: ["#FF75A2","#FFFFFF","#BE18D6","#000000","#333EBD"], glow: "#FF75A2", label: "Genderfluid" },
  aromantic:   { colors: ["#3DA542","#A7D379","#FFFFFF","#A9A9A9","#111111"], glow: "#3DA542", label: "Aromantic" },
  asexual:     { colors: ["#000000","#A3A3A3","#FFFFFF","#800080"], glow: "#A020F0", label: "Asexual" },
  polysexual:  { colors: ["#F61CB9","#07D569","#1C92F6"], glow: "#F61CB9", label: "Polysexual" },
  neutrois:    { colors: ["#FFFFFF","#1F9F00","#111111"], glow: "#1F9F00", label: "Neutrois" },
  androgyne:   { colors: ["#FE007F","#9832FF","#00B8E7"], glow: "#FE007F", label: "Androgyne" },
  bear:        { colors: ["#623804","#D56300","#FEDD63","#FFFFFF","#000000"], glow: "#D56300", label: "Bear" },
  agender:     { colors: ["#111111","#B9B9B9","#FFFFFF","#B8F483","#FFFFFF","#B9B9B9","#111111"], glow: "#B8F483", label: "Agender" },
  leather:     { colors: ["#111111","#252EFF","#FFFFFF","#252EFF","#111111"], glow: "#252EFF", label: "Leather" },
};

const SIZES = { sm: 32, md: 44, lg: 64, xl: 84 };
const DAY = { MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)", THU:"var(--day-thu)",
  FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };

function ringStyle(ring, px) {
  const pad = Math.max(2, Math.round(px * 0.06));
  const flag = AVATAR_FLAGS[ring];
  if (flag) {
    const stops = [...flag.colors, flag.colors[0]].join(", ");
    return { "--_pad": pad + "px", background: `conic-gradient(from 140deg, ${stops})`,
      boxShadow: `0 0 ${Math.round(px * 0.22)}px ${flag.glow}` };
  }
  if (DAY[ring]) return { "--_pad": pad + "px", background: DAY[ring], boxShadow: `0 0 ${Math.round(px*0.2)}px ${DAY[ring]}` };
  if (ring === "neutral") return { "--_pad": "2px", background: "var(--ink-border-strong)" };
  // default rainbow
  const rb = AVATAR_FLAGS.rainbow;
  return { "--_pad": pad + "px", background: `conic-gradient(from 140deg, ${[...rb.colors, rb.colors[0]].join(", ")})`,
    boxShadow: `0 0 ${Math.round(px * 0.22)}px ${rb.glow}` };
}

/** Avatar, pride-flag ring member chip. */
export function Avatar({
  src,
  name = "",
  size = "md",
  ring = "rainbow",
  status = false,
  statusColor = "var(--neon-green)",
  title,
  className = "",
  style = {},
  ...rest
}) {
  const px = SIZES[size] || size;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("") || "?";
  const dotSize = Math.max(9, Math.round(px * 0.26));
  const flagLabel = AVATAR_FLAGS[ring] && AVATAR_FLAGS[ring].label;
  return (
    <span className={`pdxAvatar ${className}`} style={{ width: px, height: px, ...style }}
      title={title || (flagLabel ? `${name ? name + " · " : ""}${flagLabel} pride` : name) || undefined} {...rest}>
      <span className="pdxAvatar__ring" style={ringStyle(ring, px)} />
      <span className="pdxAvatar__inner" style={{ margin: "var(--_m,0)" }}>
        {src ? <img src={src} alt={name} />
             : <span className="pdxAvatar__initials" style={{ fontSize: px * 0.4 }}>{initials}</span>}
      </span>
      {status && <span className="pdxAvatar__dot" style={{ width: dotSize, height: dotSize, background: statusColor }} />}
    </span>
  );
}
