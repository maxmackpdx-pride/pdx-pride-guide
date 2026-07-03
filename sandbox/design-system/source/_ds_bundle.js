/* @ds-bundle: {"format":4,"namespace":"PDXPrideGuideDesignSystem_b20420","components":[{"name":"Avatar","sourcePath":"components/brand/Avatar.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Countdown","sourcePath":"components/data-display/Countdown.jsx"},{"name":"EventCard","sourcePath":"components/data-display/EventCard.jsx"},{"name":"PlaceCard","sourcePath":"components/data-display/PlaceCard.jsx"},{"name":"PosterCard","sourcePath":"components/data-display/PosterCard.jsx"},{"name":"StatCard","sourcePath":"components/data-display/StatCard.jsx"},{"name":"StatPill","sourcePath":"components/data-display/StatPill.jsx"},{"name":"StickerBadge","sourcePath":"components/data-display/StickerBadge.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"FilterChip","sourcePath":"components/forms/FilterChip.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Divider","sourcePath":"components/layout/Divider.jsx"},{"name":"HeroBanner","sourcePath":"components/layout/HeroBanner.jsx"},{"name":"Marquee","sourcePath":"components/layout/Marquee.jsx"},{"name":"SectionHeader","sourcePath":"components/layout/SectionHeader.jsx"},{"name":"MapLegend","sourcePath":"components/map/MapLegend.jsx"},{"name":"MapPanel","sourcePath":"components/map/MapPanel.jsx"}],"sourceHashes":{"components/brand/Avatar.jsx":"9ad86941833b","components/brand/Logo.jsx":"388d6e2f334e","components/data-display/Badge.jsx":"fedf9781384c","components/data-display/Countdown.jsx":"e04e58e062e5","components/data-display/EventCard.jsx":"1c56d6227efa","components/data-display/PlaceCard.jsx":"5154e4a39231","components/data-display/PosterCard.jsx":"63c8f9748a23","components/data-display/StatCard.jsx":"673841d98d5b","components/data-display/StatPill.jsx":"174c9d5345b0","components/data-display/StickerBadge.jsx":"23b96038aac6","components/forms/Button.jsx":"07695dfedb2b","components/forms/FilterChip.jsx":"1e7482e9c840","components/forms/IconButton.jsx":"89732c11c272","components/forms/SearchInput.jsx":"3b79d835144a","components/layout/Divider.jsx":"b875a2551a50","components/layout/HeroBanner.jsx":"2b2d5f4e4926","components/layout/Marquee.jsx":"abeec8625ba3","components/layout/SectionHeader.jsx":"28d8bb3d132b","components/map/MapLegend.jsx":"aa074007e17d","components/map/MapPanel.jsx":"704459619f61","ui_kits/pride-guide/AdminScreen.jsx":"a720dc61ab1b","ui_kits/pride-guide/AppShell.jsx":"8e0d7c60b46c","ui_kits/pride-guide/EventsScreen.jsx":"9a8dc8d08c2b","ui_kits/pride-guide/HomeScreen.jsx":"72b837a12e4d","ui_kits/pride-guide/HubScreen.jsx":"92b3afca3e8e","ui_kits/pride-guide/PlacesScreen.jsx":"5d978e9ef9f4","ui_kits/pride-guide/data.js":"d6ed8ee68faa"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PDXPrideGuideDesignSystem_b20420 = window.PDXPrideGuideDesignSystem_b20420 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Avatar, the community member chip. Circular photo or initials inside a
   rainbow gradient ring (the signature). Ring can also be a single day color
   or neutral. Optional status dot. */
const CSS = `
.pdxAvatar{ position:relative; display:inline-flex; flex:none; border-radius:999px;
  padding:2px; background:var(--rainbow-bar); }
.pdxAvatar--day{ background:var(--_c,var(--neon-cyan)); }
.pdxAvatar--neutral{ background:var(--ink-border-strong); }
.pdxAvatar__inner{ width:100%; height:100%; border-radius:999px; overflow:hidden;
  border:2px solid var(--ink-1000); background:var(--ink-800);
  display:flex; align-items:center; justify-content:center; }
.pdxAvatar__inner img{ width:100%; height:100%; object-fit:cover; display:block; }
.pdxAvatar__initials{ font-family:var(--font-display); font-weight:900; color:#fff; line-height:1;
  text-transform:uppercase; }
.pdxAvatar__dot{ position:absolute; right:0; bottom:0; border-radius:999px;
  border:2px solid var(--ink-900); background:var(--neon-green); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-avatar-css")) {
  const s = document.createElement("style");
  s.id = "pdx-avatar-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const SIZES = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 84
};
const DAY = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};

/** Avatar, rainbow-ring member chip. */
function Avatar({
  src,
  name = "",
  size = "md",
  ring = "rainbow",
  // rainbow | neutral | MON..SUN day key
  status = false,
  // show a status dot
  statusColor = "var(--neon-green)",
  className = "",
  style = {},
  ...rest
}) {
  const px = SIZES[size] || size;
  const isDay = DAY[ring];
  const ringCls = ring === "rainbow" ? "" : isDay ? "pdxAvatar--day" : "pdxAvatar--neutral";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?";
  const dotSize = Math.max(9, Math.round(px * 0.26));
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `pdxAvatar ${ringCls} ${className}`,
    style: {
      width: px,
      height: px,
      "--_c": isDay || undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__inner"
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__initials",
    style: {
      fontSize: px * 0.4
    }
  }, initials)), status && /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__dot",
    style: {
      width: dotSize,
      height: dotSize,
      background: statusColor
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxLogo{ display:inline-flex; align-items:center; gap:.6em; text-decoration:none; }
.pdxLogo__img{ display:block; width:var(--_sz,56px); height:var(--_sz,56px);
  border-radius:22.6%; flex:none; }
.pdxLogo__wm{ display:flex; flex-direction:column; font-family:var(--font-display); font-weight:900;
  text-transform:uppercase; line-height:.86; letter-spacing:.01em; }
.pdxLogo__wm span{ display:block; }
.pdxLogo--light .pdxLogo__wm{ color:var(--text-hi); }
.pdxLogo--dark .pdxLogo__wm{ color:var(--ink-1000); }
.pdxLogo__rainbow{
  background:var(--grad-rainbow); -webkit-background-clip:text; background-clip:text;
  color:transparent; padding-right:.08em; margin-right:-.08em;
}
/* stacked (icon over centered wordmark) */
.pdxLogo--stacked{ flex-direction:column; gap:.5em; text-align:center; }
.pdxLogo--stacked .pdxLogo__wm{ align-items:center; }
/* wordmark only, bigger, hero use */
.pdxLogo--wordmark .pdxLogo__wm{ line-height:.84; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-logo-css")) {
  const s = document.createElement("style");
  s.id = "pdx-logo-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Logo, the official lockup: the app-icon mark + stacked wordmark
 * (PDX / PRIDE / GUIDE, PRIDE in rainbow). Per brand rule the mark
 * always appears with the wordmark unless `variant="icon"`.
 */
function Logo({
  variant = "lockup",
  // lockup | stacked | icon | wordmark
  size = 56,
  // icon px (drives wordmark scale in lockup/stacked)
  tone = "light",
  // light (on dark) | dark (on paper)
  src = "assets/logo.png",
  alt = "PDX Pride Guide",
  className = "",
  href,
  ...rest
}) {
  const showIcon = variant !== "wordmark";
  const showText = variant !== "icon";
  // wordmark font-size ~= 40% of icon size in lockup, larger standalone
  const wmSize = variant === "wordmark" ? size : Math.round(size * 0.42);
  const cls = ["pdxLogo", `pdxLogo--${variant}`, `pdxLogo--${tone}`, className].filter(Boolean).join(" ");
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, showIcon && /*#__PURE__*/React.createElement("img", {
    className: "pdxLogo__img",
    src: src,
    alt: showText ? "" : alt,
    style: {
      "--_sz": `${size}px`
    },
    "aria-hidden": showText ? "true" : undefined
  }), showText && /*#__PURE__*/React.createElement("span", {
    className: "pdxLogo__wm",
    style: {
      fontSize: `${wmSize}px`
    }
  }, /*#__PURE__*/React.createElement("span", null, "PDX"), /*#__PURE__*/React.createElement("span", {
    className: "pdxLogo__rainbow"
  }, "PRIDE"), /*#__PURE__*/React.createElement("span", null, "GUIDE")));
  if (href) {
    return /*#__PURE__*/React.createElement("a", _extends({
      className: cls,
      href: href,
      "aria-label": alt
    }, rest), inner);
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    role: "img",
    "aria-label": alt
  }, rest), inner);
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Badges are Anton, uppercase, near-square corners. Two looks:
   solid neon fill with black text, OR neon outline. Used for admission,
   day, place category, status ("GRAND OPENING"), and generic tags. */
const CSS = `
.pdxBadge{
  display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-display); font-weight:700;
  letter-spacing:.06em; text-transform:uppercase; white-space:nowrap;
  line-height:1; border-radius:3px; border:2px solid transparent;
}
.pdxBadge--sm{ font-size:.625rem; padding:4px 7px 3px; }
.pdxBadge--md{ font-size:.75rem; padding:5px 9px 4px; }
.pdxBadge--lg{ font-size:.9375rem; padding:7px 12px 5px; }

/* solid fill (black text) */
.pdxBadge--solid{ background:var(--_c,var(--lime)); color:var(--text-inverse); border-color:var(--_c,var(--lime)); }
/* outline (colored text) */
.pdxBadge--outline{ background:transparent; color:var(--_c,var(--lime)); border-color:var(--_c,var(--lime)); }
/* paper fill (white-ish, black text) for day + neutral status */
.pdxBadge--paper{ background:var(--paper); color:var(--paper-ink); border-color:var(--paper); }
/* glow (GRAND OPENING) */
.pdxBadge--glow{ box-shadow:0 0 16px -2px var(--_c,var(--yellow)); }

.pdxBadge__dot{ width:7px; height:7px; border-radius:var(--radius-pill); background:currentColor; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-badge-css")) {
  const s = document.createElement("style");
  s.id = "pdx-badge-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
  yellow: "var(--yellow)",
  blue: "var(--blue)",
  red: "var(--red)",
  neutral: "var(--text-lo)"
};

/* Admission enum -> color + default label (solid) */
const ADMISSION = {
  FREE: {
    color: "lime",
    label: "Free"
  },
  TICKETED: {
    color: "cyan",
    label: "Ticketed"
  },
  SUGGESTED_DONATION: {
    color: "amber",
    label: "Donation"
  }
};
/* Day -> color (paper look by default like the detail modal "FRI") */
const DAY = {
  THU: "cyan",
  FRI: "pink",
  SAT: "green",
  SUN: "orange"
};
/* Place category -> color + label */
const CATEGORY = {
  bars: {
    color: "pink",
    label: "Bars & Clubs"
  },
  food: {
    color: "orange",
    label: "Restaurants"
  },
  cafes: {
    color: "green",
    label: "Cafes"
  },
  venues: {
    color: "cyan",
    label: "Venues"
  },
  services: {
    color: "purple",
    label: "Services"
  },
  shops: {
    color: "amber",
    label: "Shops"
  },
  hotels: {
    color: "blue",
    label: "Hotels"
  }
};

/** Badge, the Anton neon tag. Admission / day / category / status / generic. */
function Badge({
  children,
  color = "lime",
  variant = "solid",
  // solid | outline | paper
  size = "sm",
  glow = false,
  dot = false,
  admission,
  day,
  category,
  className = "",
  ...rest
}) {
  let c = color,
    label = children,
    v = variant;
  if (admission && ADMISSION[admission]) {
    c = ADMISSION[admission].color;
    if (label == null) label = ADMISSION[admission].label;
  }
  if (day && DAY[day]) {
    c = DAY[day];
    if (label == null) label = day;
    if (variant === "solid") v = "paper";
  }
  if (category && CATEGORY[category]) {
    c = CATEGORY[category].color;
    if (label == null) label = CATEGORY[category].label;
  }
  const cls = ["pdxBadge", `pdxBadge--${v}`, `pdxBadge--${size}`, glow ? "pdxBadge--glow" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      "--_c": COLORS[c] || c
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "pdxBadge__dot"
  }), label);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Countdown.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxCountdown{ display:flex; align-items:stretch; gap:12px; flex-wrap:wrap; }
.pdxCountdown__unit{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-width:96px; padding:16px 14px 10px;
  background:rgba(255,255,255,.02);
  border:var(--bw-hair) solid rgba(255,255,255,.16); border-radius:var(--radius-sm);
}
.pdxCountdown__num{
  font-family:var(--font-display); font-weight:900; font-size:clamp(2.25rem,5vw,3.5rem); line-height:.9;
  color:var(--_c,var(--lime)); font-variant-numeric:tabular-nums; letter-spacing:.02em;
  /* off-center, slightly hand-drawn black sticker outline + neon glow underneath */
  text-shadow:
    2px 3px 0 #000, 3px 2px 0 #000,
    -1px -1px 0 #000, 1px -1px 0 #000, -1px 2px 0 #000,
    0 0 18px color-mix(in srgb, var(--_c,var(--lime)) 60%, transparent);
}
.pdxCountdown__label{
  font-family:var(--font-mono); font-size:.5625rem; font-weight:var(--fw-bold);
  letter-spacing:.2em; text-transform:uppercase; color:var(--text-lo); margin-top:8px;
}
.pdxCountdown--sm .pdxCountdown__unit{ min-width:64px; padding:9px 8px 6px; }
.pdxCountdown--sm .pdxCountdown__num{ font-size:1.6rem; }
.pdxCountdown__done{
  font-family:var(--font-display); font-weight:900; text-transform:uppercase; color:var(--_c,var(--lime));
  font-size:clamp(1.5rem,4vw,2.5rem); letter-spacing:.02em;
  text-shadow:0 0 22px color-mix(in srgb, var(--_c,var(--lime)) 60%, transparent);
}
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-countdown-css")) {
  const s = document.createElement("style");
  s.id = "pdx-countdown-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const ACCENTS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  purple: "var(--purple)",
  amber: "var(--amber)"
};
function diff(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms % 86400000 / 3600000),
    m: Math.floor(ms % 3600000 / 60000),
    s: Math.floor(ms % 60000 / 1000),
    done: ms === 0
  };
}

/** Countdown, ticking boxes to a target date (Pride weekend). Lime glow. */
function Countdown({
  target = "2026-07-16T19:00:00",
  size = "md",
  accent = "lime",
  doneLabel = "It's Pride!",
  className = "",
  style = {},
  ...rest
}) {
  const [t, setT] = React.useState(() => diff(target));
  React.useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const accentVar = ACCENTS[accent] || accent;
  if (t.done) {
    return /*#__PURE__*/React.createElement("div", _extends({
      className: `pdxCountdown ${className}`,
      style: {
        "--_c": accentVar,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      className: "pdxCountdown__done"
    }, doneLabel));
  }
  const pad = n => String(n).padStart(2, "0");
  const units = [{
    n: t.d,
    l: "Days"
  }, {
    n: t.h,
    l: "Hrs"
  }, {
    n: t.m,
    l: "Min"
  }, {
    n: t.s,
    l: "Sec"
  }];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxCountdown pdxCountdown--${size} ${className}`,
    role: "timer",
    "aria-live": "off",
    style: {
      "--_c": accentVar,
      ...style
    }
  }, rest), units.map((u, i) => /*#__PURE__*/React.createElement("div", {
    className: "pdxCountdown__unit",
    key: u.l
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxCountdown__num"
  }, i === 0 ? u.n : pad(u.n)), /*#__PURE__*/React.createElement("span", {
    className: "pdxCountdown__label"
  }, u.l))));
}
Object.assign(__ds_scope, { Countdown });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Countdown.jsx", error: String((e && e.message) || e) }); }

// components/data-display/EventCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* EventCard, the canonical list-view row (source: EVENTS_GUIDE.md).
   Same data as the board card as a horizontal row: flyer thumbnail left, text
   right, and a 4px solid LEFT border in the day color (in place of the poster
   stripe). Day colors are data; calm mode flattens them. */
const CSS = `
.pdxRow{
  --_day: var(--day-fri);
  position:relative; display:grid; grid-template-columns:84px 1fr auto; gap:16px; align-items:center;
  padding:12px 16px 12px 14px; background:var(--surface-card);
  border:2px solid var(--border-default); border-left:5px solid var(--_day);
  border-radius:var(--radius-md); text-decoration:none; color:inherit; overflow:hidden;
  transition:transform var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out),
             box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
a.pdxRow:hover{ transform:translateY(-1px); text-decoration:none; background:var(--surface-card-hover);
  box-shadow:0 0 18px color-mix(in srgb, var(--_day) 24%, transparent); }

.pdxRow__thumb{ width:84px; height:96px; border-radius:var(--radius-sm); overflow:hidden;
  background:linear-gradient(135deg,#131313,#1d1d1d); position:relative; flex:none; }
.pdxRow__thumb img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.pdxRow__thumbPh{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:var(--fw-black); font-size:1.6rem; color:var(--_day); opacity:.8; }

.pdxRow__main{ min-width:0; display:flex; flex-direction:column; gap:5px; }
.pdxRow__tags{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.pdxRowTag{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.62rem;
  letter-spacing:.08em; text-transform:uppercase; padding:2px 7px 1px; border-radius:2px; line-height:1.1; }
.pdxRowTag--day{ background:#fff; color:#000; }
.pdxRowTag--type{ border:1px solid var(--border-strong); color:var(--text-lo); }
.pdxRowTag--meta{ border:1px solid var(--border-strong); color:var(--text-mid); }
.pdxRow__title{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  font-size:1.3125rem; line-height:1.02; color:var(--text-hi); margin:1px 0 0;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pdxRow__when{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); }
.pdxRow__when b{ color:#888; font-weight:var(--fw-semibold); }

.pdxRow__aside{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
.pdxRow__going{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-display);
  font-weight:var(--fw-bold); font-size:.68rem; letter-spacing:.06em; text-transform:uppercase;
  color:var(--neon-yellow); border:1px solid var(--neon-yellow); border-radius:999px; padding:3px 10px 2px; }
.pdxRow__going .dot{ width:6px; height:6px; border-radius:999px; background:var(--neon-yellow);
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
.pdxRow__save{ border:0; background:transparent; color:var(--text-faint); cursor:pointer; padding:2px;
  display:flex; transition:color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-spring); }
.pdxRow__save:hover{ color:var(--neon-magenta); }
.pdxRow__save:active{ transform:scale(.85); }
.pdxRow__save[aria-pressed="true"]{ color:var(--neon-magenta); }

@media (max-width:560px){
  .pdxRow{ grid-template-columns:64px 1fr; }
  .pdxRow__thumb{ width:64px; height:78px; }
  .pdxRow__aside{ grid-column:1 / -1; flex-direction:row; align-items:center; justify-content:space-between; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-row-css")) {
  const s = document.createElement("style");
  s.id = "pdx-row-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const DAY_BASE = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const ADM_LABEL = {
  FREE: "Free",
  TICKETED: "Ticketed",
  SUGGESTED_DONATION: "Donation"
};
const AGE_LABEL = {
  ALL_AGES: "All ages",
  "18_PLUS": "18+",
  "21_PLUS": "21+"
};

/** EventCard, the list-view row. */
function EventCard({
  title,
  venue,
  when,
  day = "FRI",
  image,
  types = [],
  admission,
  age,
  going,
  saved,
  onSave,
  href,
  className = "",
  style = {},
  ...rest
}) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  const whenLine = when || [venue].filter(Boolean).join("");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxRow ${className}`,
    href: href,
    style: {
      "--_day": base,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__thumb"
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__thumbPh"
  }, (title || "?").charAt(0))), /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxRowTag pdxRowTag--day"
  }, day), types.slice(0, 2).map((t, i) => /*#__PURE__*/React.createElement("span", {
    className: "pdxRowTag pdxRowTag--type",
    key: i
  }, t)), metaBits && /*#__PURE__*/React.createElement("span", {
    className: "pdxRowTag pdxRowTag--meta"
  }, metaBits)), /*#__PURE__*/React.createElement("h3", {
    className: "pdxRow__title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__when"
  }, venue && /*#__PURE__*/React.createElement("b", null, venue), venue && when ? " · " : "", when)), /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__aside"
  }, onSave && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxRow__save",
    "aria-pressed": saved,
    "aria-label": saved ? "Saved" : "Save event",
    onClick: e => {
      e.preventDefault();
      onSave();
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "20",
    height: "20",
    fill: saved ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
  }))), going != null && /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__going"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), going, " Going")));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/PlaceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* PlaceCard = the venue/place directory card. Neon border in the category
   color, category badge, optional GRAND OPENING flag, address / hours / phone
   with icons, description, website + instagram links, and an optional
   "Upcoming Pride Events" sublist. */
const CSS = `
.pdxPlace{
  display:flex; flex-direction:column; gap:12px;
  padding:var(--pad-card);
  background:var(--ink-1000);
  border:2px solid var(--_c,var(--pink)); border-radius:var(--radius-md);
  box-shadow:0 0 24px -14px var(--_c,var(--pink));
}
.pdxPlace__opening{ align-self:flex-start; margin-bottom:2px; }
.pdxPlace__cat{ align-self:flex-start; }
.pdxPlace__name{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.375rem; line-height:1.02; letter-spacing:.01em; color:var(--text-hi); }
.pdxPlace__rows{ display:flex; flex-direction:column; gap:5px; }
.pdxPlace__row{ display:flex; align-items:flex-start; gap:8px;
  font-family:var(--font-body); font-size:var(--body-sm); color:var(--text-lo); }
.pdxPlace__row svg{ width:14px; height:14px; margin-top:2px; flex:none; opacity:.85; }
.pdxPlace__desc{ font-family:var(--font-body); font-size:var(--body-sm); line-height:1.5; color:var(--text-mid); }
.pdxPlace__links{ display:flex; flex-wrap:wrap; gap:16px; margin-top:2px; }
.pdxPlace__link{ display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-body); font-weight:var(--fw-bold); font-size:var(--body-sm);
  color:var(--_c,var(--pink)); text-decoration:none; }
.pdxPlace__link:hover{ text-decoration:underline; text-underline-offset:3px; }
.pdxPlace__link svg{ width:15px; height:15px; }
.pdxPlace__events{ margin-top:2px; padding-top:14px; border-top:1px solid var(--border-default); }
.pdxPlace__eventsHead{ display:flex; align-items:center; gap:8px; margin-bottom:10px;
  font-family:var(--font-display); font-weight:700; font-size:.8125rem; letter-spacing:.06em;
  text-transform:uppercase; color:var(--text-mid); }
.pdxPlace__eventsHead svg{ width:14px; height:14px; }
.pdxPlace__event{ padding:8px 0 8px 12px; border-left:3px solid var(--_ec,var(--cyan)); }
.pdxPlace__eventDate{ font-family:var(--font-body); font-weight:var(--fw-bold); font-size:var(--body-sm);
  color:var(--_ec,var(--cyan)); }
.pdxPlace__eventTitle{ font-family:var(--font-body); font-size:var(--body-sm); color:var(--text-hi); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-place-css")) {
  const s = document.createElement("style");
  s.id = "pdx-place-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const CAT_COLOR = {
  bars: "var(--pink)",
  food: "var(--orange)",
  cafes: "var(--green)",
  venues: "var(--cyan)",
  services: "var(--purple)",
  shops: "var(--amber)",
  hotels: "var(--blue)"
};
const DAY_COLOR = {
  THU: "var(--cyan)",
  FRI: "var(--pink)",
  SAT: "var(--green)",
  SUN: "var(--orange)"
};
function Icon({
  d
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, d);
}
const PIN = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
  d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "10",
  r: "3"
}));
const CLOCK = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));
const PHONE = /*#__PURE__*/React.createElement("path", {
  d: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"
});
const GLOBE = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"
}));
const IG = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "3",
  width: "18",
  height: "18",
  rx: "5"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "17.5",
  cy: "6.5",
  r: "1",
  fill: "currentColor",
  stroke: "none"
}));
const CAL = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 2v4M8 2v4M3 10h18"
}));

/** PlaceCard, the venue / place directory card. */
function PlaceCard({
  name,
  category = "bars",
  categoryLabel,
  address,
  hours,
  phone,
  description,
  website,
  instagram,
  grandOpening = false,
  events = [],
  className = "",
  ...rest
}) {
  const accent = CAT_COLOR[category] || "var(--pink)";
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxPlace ${className}`,
    style: {
      "--_c": accent
    }
  }, rest), grandOpening && /*#__PURE__*/React.createElement("span", {
    className: "pdxPlace__opening"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    color: "yellow",
    glow: true,
    size: "sm"
  }, "Grand Opening")), /*#__PURE__*/React.createElement("span", {
    className: "pdxPlace__cat"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    category: category,
    size: "sm"
  }, categoryLabel)), /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__name"
  }, name), /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__rows"
  }, address && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__row"
  }, /*#__PURE__*/React.createElement(Icon, {
    d: PIN
  }), address), hours && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__row"
  }, /*#__PURE__*/React.createElement(Icon, {
    d: CLOCK
  }), hours), phone && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__row"
  }, /*#__PURE__*/React.createElement(Icon, {
    d: PHONE
  }), phone)), description && /*#__PURE__*/React.createElement("p", {
    className: "pdxPlace__desc"
  }, description), (website || instagram) && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__links"
  }, website && /*#__PURE__*/React.createElement("a", {
    className: "pdxPlace__link",
    href: website,
    onClick: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement(Icon, {
    d: GLOBE
  }), "Website"), instagram && /*#__PURE__*/React.createElement("a", {
    className: "pdxPlace__link",
    href: "#",
    onClick: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement(Icon, {
    d: IG
  }), instagram)), events.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__events"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__eventsHead"
  }, /*#__PURE__*/React.createElement(Icon, {
    d: CAL
  }), "Upcoming Pride Events"), events.map((ev, i) => /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__event",
    key: i,
    style: {
      "--_ec": DAY_COLOR[ev.day] || accent
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__eventDate"
  }, ev.date), /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__eventTitle"
  }, ev.title)))));
}
Object.assign(__ds_scope, { PlaceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/PlaceCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/PosterCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* PosterCard, the canonical event "board card" (source: EVENTS_GUIDE.md).
   Vertical poster card: a 2:3 flyer with a thin day-color stripe along its
   bottom edge, then a meta block (white day tag + outline type tags + meta
   tag, title, venue, when-line, details link), then an optional attendance
   footer. The card carries the day color as an ambient glow that slow-pulses.
   Day colors are DATA: pass `day` (MON..SUN); calm mode flattens them. */
const CSS = `
.pdxBoard{
  --_day: var(--day-fri);
  position:relative; display:flex; flex-direction:column;
  background:linear-gradient(160deg,rgba(255,255,255,.045),transparent 30%),var(--surface-card);
  border:2px solid var(--border-default); border-radius:var(--radius-md);
  overflow:hidden; text-decoration:none; color:inherit; cursor:pointer;
  box-shadow:0 0 14px color-mix(in srgb, var(--_day) 18%, transparent);
  animation:pdxPulse var(--dur-pulse) ease-in-out infinite;
  --dc:var(--_day);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out),
             border-color var(--dur-base) var(--ease-out);
}
a.pdxBoard:hover{ transform:translateY(-2px); text-decoration:none; border-color:color-mix(in srgb,var(--_day) 40%,var(--border-default));
  box-shadow:0 0 28px color-mix(in srgb, var(--_day) 40%, transparent); }

.pdxBoard__poster{ position:relative; aspect-ratio:2/3; background:linear-gradient(135deg,#131313,#1d1d1d);
  overflow:hidden; }
.pdxBoard__img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.pdxBoard__ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  padding:20px; text-align:center; }
.pdxBoard__phTitle{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  line-height:.95; color:rgba(255,255,255,.42); font-size:1.5rem; }
.pdxBoard__stripe{ position:absolute; left:0; right:0; bottom:0; height:4px; background:var(--_day); }
.pdxBoard__linkchip{ position:absolute; top:9px; right:9px; width:28px; height:28px; border-radius:999px;
  display:flex; align-items:center; justify-content:center; background:rgba(5,5,7,.72);
  border:1px solid rgba(255,255,255,.16); color:#fff; backdrop-filter:blur(4px); }
.pdxBoard__linkchip svg{ width:13px; height:13px; }

.pdxBoard__meta{ padding:14px 16px 16px; display:flex; flex-direction:column; gap:8px; flex:1; }
.pdxBoard__tags{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.pdxTag{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.65rem;
  letter-spacing:.08em; text-transform:uppercase; padding:3px 8px 2px; border-radius:2px; line-height:1.1; }
.pdxTag--day{ background:#fff; color:#000; }
.pdxTag--type{ border:1px solid var(--border-strong); color:var(--text-lo); }
.pdxTag--meta{ border:1px solid var(--border-strong); color:var(--text-mid); }
.pdxTag--claim{ border:1px solid var(--neon-yellow); color:var(--neon-yellow); }

.pdxBoard__title{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  font-size:var(--title-md); line-height:1.05; color:var(--text-hi); margin:2px 0 0; }
.pdxBoard__venue{ font-family:var(--font-body); font-size:var(--body-sm); color:#888; }
.pdxBoard__when{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); }
.pdxBoard__link{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.8rem;
  letter-spacing:.05em; text-transform:uppercase; color:var(--_dayt,var(--_day)); margin-top:2px;
  display:inline-flex; align-items:center; gap:5px; }

.pdxBoard__foot{ display:flex; align-items:center; justify-content:space-between; gap:10px;
  margin-top:auto; padding-top:10px; border-top:1px solid var(--border-faint); }
.pdxBoard__going{ display:inline-flex; align-items:center; gap:7px; font-family:var(--font-display);
  font-weight:var(--fw-bold); font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
  color:var(--neon-yellow); border:1px solid var(--neon-yellow); border-radius:999px; padding:4px 11px 3px; }
.pdxBoard__going .dot{ width:6px; height:6px; border-radius:999px; background:var(--neon-yellow);
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBoard__rsvp{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase; color:#000; background:var(--neon-yellow);
  border:0; border-radius:2px; padding:5px 12px 4px; cursor:pointer; }
.pdxBoard__rsvp:hover{ filter:brightness(1.08); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-board-css")) {
  const s = document.createElement("style");
  s.id = "pdx-board-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const DAY_BASE = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const DAY_TEXT = {
  MON: "var(--day-mon-text)",
  TUE: "var(--day-tue-text)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const ADM_LABEL = {
  FREE: "Free",
  TICKETED: "Ticketed",
  SUGGESTED_DONATION: "Donation"
};
const AGE_LABEL = {
  ALL_AGES: "All ages",
  "18_PLUS": "18+",
  "21_PLUS": "21+"
};

/** PosterCard, the event board card. */
function PosterCard({
  title,
  venue,
  when,
  day = "FRI",
  image,
  types = [],
  admission,
  age,
  claimable = false,
  going,
  onRsvp,
  href,
  showLink = true,
  className = "",
  style = {},
  ...rest
}) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const dayt = DAY_TEXT[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxBoard ${className}`,
    href: href,
    style: {
      "--_day": base,
      "--_dayt": dayt,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__poster"
  }, image ? /*#__PURE__*/React.createElement("img", {
    className: "pdxBoard__img",
    src: image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__ph"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__phTitle"
  }, title)), showLink && /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__linkchip",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__stripe"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__tags"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxTag pdxTag--day"
  }, day), types.map((t, i) => /*#__PURE__*/React.createElement("span", {
    className: "pdxTag pdxTag--type",
    key: i
  }, t)), metaBits && /*#__PURE__*/React.createElement("span", {
    className: "pdxTag pdxTag--meta"
  }, metaBits), claimable && /*#__PURE__*/React.createElement("span", {
    className: "pdxTag pdxTag--claim"
  }, "Claimable")), /*#__PURE__*/React.createElement("h3", {
    className: "pdxBoard__title"
  }, title), venue && /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__venue"
  }, venue), when && /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__when"
  }, when), /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__link"
  }, "Event details \u2192"), (going != null || onRsvp) && /*#__PURE__*/React.createElement("div", {
    className: "pdxBoard__foot"
  }, going != null ? /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__going"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), going, " Going") : /*#__PURE__*/React.createElement("span", null), onRsvp && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxBoard__rsvp",
    onClick: e => {
      e.preventDefault();
      onRsvp();
    }
  }, "I'll be there"))));
}
Object.assign(__ds_scope, { PosterCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/PosterCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* StatCard = the admin dashboard tile: big accent number, uppercase label,
   optional "VIEW ->" action. Neon border in the accent color, rounded. */
const CSS = `
.pdxStatCard{
  display:flex; flex-direction:column; gap:10px;
  padding:18px 18px 16px; min-height:150px;
  background:var(--ink-1000);
  border:2px solid var(--_c,var(--lime)); border-radius:var(--radius-md);
  box-shadow:0 0 22px -12px var(--_c,var(--lime));
  text-decoration:none; color:inherit;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxStatCard:hover{ transform:translateY(var(--hover-lift));
  box-shadow:0 0 26px -6px var(--_c,var(--lime)); text-decoration:none; }
.pdxStatCard__num{ font-family:var(--font-display); font-weight:900; font-size:2.75rem;
  line-height:.85; color:var(--_c,var(--lime));
  text-shadow:0 0 20px color-mix(in srgb, var(--_c,var(--lime)) 45%, transparent); }
.pdxStatCard__label{ font-family:var(--font-display); font-weight:700; font-size:.9375rem;
  letter-spacing:.04em; text-transform:uppercase; color:var(--text-lo); line-height:1.08; flex:1; }
.pdxStatCard__action{ font-family:var(--font-display); font-weight:700; font-size:.8125rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--_c,var(--lime));
  display:inline-flex; align-items:center; gap:6px; }
.pdxStatCard--sm{ min-height:120px; padding:14px; }
.pdxStatCard--sm .pdxStatCard__num{ font-size:2rem; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-statcard-css")) {
  const s = document.createElement("style");
  s.id = "pdx-statcard-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)",
  blue: "var(--blue)"
};

/** StatCard, a big-number dashboard tile with a neon border. */
function StatCard({
  value,
  label,
  action = "View",
  color = "lime",
  size = "md",
  href,
  onClick,
  className = "",
  ...rest
}) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  const cls = ["pdxStatCard", size === "sm" ? "pdxStatCard--sm" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    href: href,
    onClick: onClick,
    style: {
      "--_c": COLORS[color] || color,
      textAlign: "left",
      cursor: href || onClick ? "pointer" : "default"
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxStatCard__num"
  }, value), /*#__PURE__*/React.createElement("span", {
    className: "pdxStatCard__label"
  }, label), action && /*#__PURE__*/React.createElement("span", {
    className: "pdxStatCard__action"
  }, action, " ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2192")));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* StatPill = the little count pills: "1 EVENTS", "3 ACTION ITEMS",
   "52 EVENTS", "1 TOTAL", "1 POSTS", "LIVE". Rounded pill, accent-colored
   number, gray label. Outline or solid. Optional leading icon/dot. */
const CSS = `
.pdxStatPill{
  display:inline-flex; align-items:center; gap:7px;
  padding:6px 13px 5px; border-radius:var(--radius-pill);
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.05em; text-transform:uppercase; white-space:nowrap;
  border:2px solid var(--_c,var(--lime)); background:transparent; color:var(--text-lo);
}
.pdxStatPill__num{ color:var(--_c,var(--lime)); }
.pdxStatPill__icon{ display:inline-flex; color:var(--_c,var(--lime)); }
.pdxStatPill__icon svg{ width:14px; height:14px; }
.pdxStatPill__dot{ width:8px; height:8px; border-radius:var(--radius-pill); background:var(--_c,var(--lime)); }

/* solid */
.pdxStatPill--solid{ background:var(--_c,var(--lime)); border-color:var(--_c,var(--lime)); color:var(--text-inverse); }
.pdxStatPill--solid .pdxStatPill__num,
.pdxStatPill--solid .pdxStatPill__icon,
.pdxStatPill--solid .pdxStatPill__dot{ color:var(--text-inverse); background-color:currentColor; }
.pdxStatPill--solid .pdxStatPill__num{ background:none; }

.pdxStatPill--sm{ font-size:var(--chrome-xs); padding:4px 10px 3px; }
.pdxStatPill--glow{ box-shadow:0 0 16px -3px var(--_c,var(--lime)); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-statpill-css")) {
  const s = document.createElement("style");
  s.id = "pdx-statpill-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)"
};

/** StatPill, a compact count pill (number + label). */
function StatPill({
  count,
  children,
  color = "lime",
  variant = "outline",
  // outline | solid
  size = "md",
  glow = false,
  dot = false,
  icon = null,
  className = "",
  ...rest
}) {
  const cls = ["pdxStatPill", `pdxStatPill--${variant}`, size === "sm" ? "pdxStatPill--sm" : "", glow ? "pdxStatPill--glow" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      "--_c": COLORS[color] || color
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "pdxStatPill__dot"
  }), icon && /*#__PURE__*/React.createElement("span", {
    className: "pdxStatPill__icon"
  }, icon), count != null && /*#__PURE__*/React.createElement("span", {
    className: "pdxStatPill__num"
  }, count), children);
}
Object.assign(__ds_scope, { StatPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatPill.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StickerBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxSticker{
  --_bg:var(--lime); --_fg:var(--text-inverse); --_rot:-4deg;
  display:inline-block; transform:rotate(var(--_rot));
  font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  letter-spacing:.02em; line-height:.98;
  padding:10px 16px 8px; border-radius:var(--radius-sm);
  background:var(--_bg); color:var(--_fg);
  border:var(--bw-chunk) solid var(--ink-1000);
  box-shadow:var(--shadow-hard);
  transition:transform var(--dur-base) var(--ease-spring);
  will-change:transform;
}
.pdxSticker:hover{ transform:rotate(calc(var(--_rot) * -0.5)) scale(1.04); }
.pdxSticker--sm{ font-size:.9rem; padding:6px 11px 4px; box-shadow:var(--shadow-hard-sm); }
.pdxSticker--md{ font-size:1.4rem; }
.pdxSticker--lg{ font-size:2.2rem; padding:14px 22px 11px; box-shadow:var(--shadow-hard-lg); }

/* fills */
.pdxSticker--lime{ --_bg:var(--lime); --_fg:var(--text-inverse); }
.pdxSticker--pink{ --_bg:var(--pink); --_fg:var(--text-inverse); }
.pdxSticker--cyan{ --_bg:var(--cyan); --_fg:var(--text-inverse); }
.pdxSticker--purple{ --_bg:var(--purple); --_fg:#fff; }
.pdxSticker--yellow{ --_bg:var(--yellow); --_fg:var(--text-inverse); }
.pdxSticker--rainbow{ --_fg:var(--text-inverse); background:var(--grad-rainbow); }
/* paper/outline treatment */
.pdxSticker--paper{ --_bg:var(--paper); --_fg:var(--ink-1000); }
.pdxSticker--outline{ background:transparent; color:var(--_oc,var(--lime));
  border-color:var(--_oc,var(--lime)); box-shadow:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-sticker-css")) {
  const s = document.createElement("style");
  s.id = "pdx-sticker-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * StickerBadge, the collage slogan sticker. Rotated, chunky display type
 * on a hard-shadow neon chip. "KEEP PORTLAND WEIRD", "PRIDE IS A PROTEST".
 */
function StickerBadge({
  children,
  color = "lime",
  size = "md",
  rotate = -4,
  className = "",
  style = {},
  ...rest
}) {
  const cls = ["pdxSticker", `pdxSticker--${color}`, `pdxSticker--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      "--_rot": `${rotate}deg`,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { StickerBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StickerBadge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Button, canonical btn-neon (source: repo design-system/previews/buttons.html).
   Outlined rectangle, Barlow Condensed 700, sharp corners, and the signature
   brutalist magenta offset shadow. Tactile press: hover lifts up-left and the
   shadow grows; click pushes down-right and the shadow collapses onto it. */
const CSS = `
.pdxBtn{
  --_c: var(--neon-yellow);
  --_sh: rgba(255,0,204,0.36);
  --_shx: rgba(255,0,204,0.5);
  display:inline-flex; align-items:center; justify-content:center; gap:.5em;
  font-family:var(--font-display); font-weight:var(--fw-bold);
  text-transform:uppercase; letter-spacing:.08em; line-height:1;
  border:2px solid var(--_c); color:var(--_c); background:rgba(0,0,0,0.62);
  border-radius:2px; cursor:pointer; white-space:nowrap; text-decoration:none;
  box-shadow:4px 4px 0 var(--_sh);
  transition:background var(--dur-fast) var(--ease-out),
             color var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out);
}
.pdxBtn:hover{ text-decoration:none; background:var(--_c); color:#000;
  transform:translate(-1px,-1px); box-shadow:6px 6px 0 var(--_shx); }
/* tactile click: press down-right onto the shadow */
.pdxBtn:active{ transform:translate(3px,3px); box-shadow:1px 1px 0 var(--_sh);
  transition-duration:60ms; }
.pdxBtn:disabled{ opacity:.4; cursor:not-allowed; transform:none;
  box-shadow:4px 4px 0 var(--_sh); background:rgba(0,0,0,0.62); color:var(--_c); }

/* sizes */
.pdxBtn--sm{ padding:8px 15px; font-size:.75rem; }
.pdxBtn--md{ padding:10px 20px; font-size:.9rem; }
.pdxBtn--lg{ padding:14px 28px; font-size:1.0625rem; }
.pdxBtn--block{ width:100%; }

/* SOLID, filled accent (black text) */
.pdxBtn--solid{ background:var(--_c); color:#000; }
.pdxBtn--solid:hover{ filter:brightness(1.08); }

/* GRADIENT, rainbow / hot fills for special moments (enhancement) */
.pdxBtn--gradient{ color:#000; border-color:transparent; background:var(--grad-hot); background-size:160% 160%;
  box-shadow:4px 4px 0 rgba(0,255,255,0.3); }
.pdxBtn--gradient:hover{ background-position:100% 50%; color:#000; transform:translate(-1px,-1px); }

/* PILL, soft filled, for system dialogs (error boundary, confirms) */
.pdxBtn--pill{ font-family:var(--font-body); font-weight:var(--fw-bold); text-transform:none;
  letter-spacing:0; border:none; border-radius:6px; background:var(--_c); color:#000; box-shadow:none; }
.pdxBtn--pill:hover{ filter:brightness(1.06); transform:none; box-shadow:none; }
.pdxBtn--pill:active{ transform:scale(.98); box-shadow:none; }

/* GHOST, tertiary (rounded, grey to accent) */
.pdxBtn--ghost{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; border:1px solid #333; color:var(--text-lo); background:none;
  border-radius:999px; box-shadow:none; padding-block:8px; }
.pdxBtn--ghost:hover{ border-color:var(--_c); color:var(--_c); background:none; transform:none; }
.pdxBtn--ghost:active{ transform:scale(.98); box-shadow:none; }

.pdxBtn__dot{ width:.5em; height:.5em; border-radius:999px; background:currentColor;
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBtn__arrow{ font-weight:var(--fw-bold); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-btn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-btn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* accent -> {color, complementary brutal-shadow} */
const ACCENTS = {
  lime: {
    c: "var(--neon-yellow)",
    sh: "rgba(255,0,204,0.36)",
    shx: "rgba(255,0,204,0.5)"
  },
  yellow: {
    c: "var(--neon-yellow)",
    sh: "rgba(255,0,204,0.36)",
    shx: "rgba(255,0,204,0.5)"
  },
  cyan: {
    c: "var(--neon-cyan)",
    sh: "rgba(204,255,0,0.30)",
    shx: "rgba(204,255,0,0.45)"
  },
  pink: {
    c: "var(--neon-magenta)",
    sh: "rgba(0,255,255,0.30)",
    shx: "rgba(0,255,255,0.45)"
  },
  magenta: {
    c: "var(--neon-magenta)",
    sh: "rgba(0,255,255,0.30)",
    shx: "rgba(0,255,255,0.45)"
  },
  orange: {
    c: "var(--neon-orange)",
    sh: "rgba(255,0,204,0.32)",
    shx: "rgba(255,0,204,0.46)"
  },
  purple: {
    c: "var(--neon-violet)",
    sh: "rgba(0,255,255,0.30)",
    shx: "rgba(0,255,255,0.45)"
  }
};

/**
 * Button, the canonical neon CTA with the brutalist offset shadow.
 */
function Button({
  children,
  variant = "neon",
  // neon | solid | gradient | pill | ghost
  accent = "lime",
  // lime(=yellow primary) | cyan | pink | orange | purple
  size = "md",
  block = false,
  live = false,
  arrow = false,
  leadingIcon = null,
  trailingIcon = null,
  as = "button",
  className = "",
  style = {},
  ...rest
}) {
  const Tag = as;
  const a = ACCENTS[accent] || ACCENTS.lime;
  const cls = ["pdxBtn", `pdxBtn--${variant}`, `pdxBtn--${size}`, block ? "pdxBtn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    style: {
      "--_c": a.c,
      "--_sh": a.sh,
      "--_shx": a.shx,
      ...style
    }
  }, rest), live && /*#__PURE__*/React.createElement("span", {
    className: "pdxBtn__dot",
    "aria-hidden": "true"
  }), leadingIcon, children, trailingIcon, arrow && /*#__PURE__*/React.createElement("span", {
    className: "pdxBtn__arrow",
    "aria-hidden": "true"
  }, "\u2192"));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/FilterChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* FilterChip = Anton uppercase, outlined rectangle, near-square corners.
   Default: gray outline. Selected: fills (or outlines) in the accent color.
   Matches the events-page filter row and the places category row. */
const CSS = `
.pdxChip{
  display:inline-flex; align-items:center; gap:8px;
  padding:9px 15px 7px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.05em; text-transform:uppercase; white-space:nowrap;
  background:transparent; color:var(--text-mid);
  border:2px solid var(--border-strong); border-radius:4px; cursor:pointer;
  transition:transform var(--dur-fast) var(--ease-spring),
             border-color var(--dur-base) var(--ease-out),
             background var(--dur-base) var(--ease-out),
             color var(--dur-base) var(--ease-out),
             box-shadow var(--dur-base) var(--ease-out);
}
.pdxChip:hover{ border-color:var(--_c,var(--lime)); color:var(--text-hi); }
.pdxChip:active{ transform:scale(var(--press-scale)); }

/* selected, outline look (like "ALL") */
.pdxChip[aria-pressed="true"]{
  color:var(--_c,var(--lime)); border-color:var(--_c,var(--lime));
  box-shadow:0 0 14px -4px var(--_c,var(--lime));
}
/* selected, fill look (opt-in) */
.pdxChip--fill[aria-pressed="true"]{
  color:var(--text-inverse); background:var(--_c,var(--lime)); border-color:var(--_c,var(--lime));
}
.pdxChip--fill[aria-pressed="true"] .pdxChip__count{ color:var(--text-inverse); opacity:.75; }

.pdxChip__count{ font-family:var(--font-body); font-weight:var(--fw-bold);
  font-size:.6875rem; color:var(--text-faint); }
.pdxChip[aria-pressed="true"] .pdxChip__count{ color:var(--_c,var(--lime)); opacity:.9; }
.pdxChip__dot{ width:9px; height:9px; border-radius:var(--radius-pill); background:var(--_c,var(--lime)); flex:none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-chip-css")) {
  const s = document.createElement("style");
  s.id = "pdx-chip-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const ACCENTS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)"
};

/** FilterChip, toggleable Anton filter pill for events + places filters. */
function FilterChip({
  children,
  selected = false,
  onToggle,
  accent = "lime",
  fill = false,
  count,
  showDot = false,
  className = "",
  ...rest
}) {
  const cls = ["pdxChip", fill ? "pdxChip--fill" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-pressed": selected,
    onClick: onToggle,
    style: {
      "--_c": ACCENTS[accent] || accent
    }
  }, rest), showDot && /*#__PURE__*/React.createElement("span", {
    className: "pdxChip__dot"
  }), children, count != null && /*#__PURE__*/React.createElement("span", {
    className: "pdxChip__count"
  }, count));
}
Object.assign(__ds_scope, { FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxIconBtn{
  --_bg:transparent; --_fg:var(--text-hi); --_bd:var(--border-strong);
  display:inline-flex; align-items:center; justify-content:center;
  border:var(--bw-bold) solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-pill); cursor:pointer; flex:none;
  transition:transform var(--dur-fast) var(--ease-spring),
             border-color var(--dur-base) var(--ease-out),
             background var(--dur-base) var(--ease-out),
             color var(--dur-base) var(--ease-out);
}
.pdxIconBtn:active{ transform:scale(var(--press-scale)); }
.pdxIconBtn:disabled{ opacity:.4; cursor:not-allowed; }
.pdxIconBtn svg{ width:1.25em; height:1.25em; }

.pdxIconBtn--sm{ width:34px; height:34px; font-size:14px; }
.pdxIconBtn--md{ width:44px; height:44px; font-size:16px; }
.pdxIconBtn--lg{ width:52px; height:52px; font-size:19px; }

.pdxIconBtn--outline:hover{ --_bd:var(--cyan); color:var(--cyan); }
.pdxIconBtn--solid{ --_bg:var(--pink); --_fg:var(--text-inverse); --_bd:transparent; }
.pdxIconBtn--solid:hover{ box-shadow:var(--glow-pink); background:var(--pink-hot); }
.pdxIconBtn--ghost{ --_bd:transparent; }
.pdxIconBtn--ghost:hover{ background:#ffffff12; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-iconbtn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-iconbtn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** IconButton, square-ish circular button holding a single glyph. */
function IconButton({
  children,
  label,
  variant = "outline",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["pdxIconBtn", `pdxIconBtn--${variant}`, `pdxIconBtn--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxField{ display:flex; flex-direction:column; gap:6px; }
.pdxField__label{
  font-family:var(--font-mono); font-size:var(--meta-sm); font-weight:var(--fw-bold);
  letter-spacing:var(--tracking-kicker); text-transform:uppercase; color:var(--text-meta);
}
.pdxSearch{
  display:flex; align-items:center; gap:10px;
  height:48px; padding:0 16px;
  background:var(--surface-inset); color:var(--text-hi);
  border:var(--bw-bold) solid var(--border-default); border-radius:var(--radius-pill);
  transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxSearch:focus-within{ border-color:var(--cyan); box-shadow:var(--glow-cyan); }
.pdxSearch__icon{ display:flex; color:var(--text-meta); flex:none; }
.pdxSearch__icon svg{ width:18px; height:18px; }
.pdxSearch input{
  flex:1; min-width:0; border:0; outline:0; background:transparent;
  font-family:var(--font-body); font-size:var(--body-md); color:var(--text-hi);
}
.pdxSearch input::placeholder{ color:var(--text-faint); }
.pdxSearch__clear{
  border:0; background:transparent; color:var(--text-meta); cursor:pointer;
  display:flex; padding:4px; border-radius:var(--radius-pill);
}
.pdxSearch__clear:hover{ color:var(--pink); }
.pdxSearch--sm{ height:40px; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-search-css")) {
  const s = document.createElement("style");
  s.id = "pdx-search-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
function SearchGlyph() {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  }));
}

/** SearchInput, rounded search field for filtering the event list. */
function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search events, venues, DJs…",
  label,
  size = "md",
  id,
  ...rest
}) {
  const hasValue = value != null && value !== "";
  return /*#__PURE__*/React.createElement("div", {
    className: "pdxField"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "pdxField__label",
    htmlFor: id
  }, label), /*#__PURE__*/React.createElement("div", {
    className: `pdxSearch ${size === "sm" ? "pdxSearch--sm" : ""}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxSearch__icon"
  }, /*#__PURE__*/React.createElement(SearchGlyph, null)), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: "search",
    value: value,
    onChange: onChange,
    placeholder: placeholder
  }, rest)), hasValue && onClear && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxSearch__clear",
    "aria-label": "Clear search",
    onClick: onClear
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))));
}
Object.assign(__ds_scope, { SearchInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchInput.jsx", error: String((e && e.message) || e) }); }

// components/layout/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Divider = the brand section divider. Default is the thin rainbow FLAG seam
   used under the header, at hero top/bottom, and between page sections.
   Optional centered label or glyph turns it into a labeled section break. */
const CSS = `
.pdxDivider{ display:flex; align-items:center; gap:14px; width:100%; border:0; margin:0; }
.pdxDivider__line{ flex:1; height:3px; border-radius:var(--radius-pill); }
.pdxDivider--rainbow .pdxDivider__line{ background:var(--grad-flag); }
.pdxDivider--glow .pdxDivider__line{ background:var(--_c,var(--lime));
  box-shadow:0 0 14px -2px var(--_c,var(--lime)); }
.pdxDivider--faint .pdxDivider__line{ height:1px; background:var(--border-default); }

/* full-bleed seam (no label), sits flush under sticky headers */
.pdxSeam{ height:3px; width:100%; border:0; margin:0; background:var(--grad-flag); }
.pdxSeam--thin{ height:2px; }

.pdxDivider__label{ font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.1em; text-transform:uppercase; color:var(--text-mid); white-space:nowrap; }
.pdxDivider__glyph{ color:var(--_c,var(--lime)); font-size:.9rem; line-height:1; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-divider-css")) {
  const s = document.createElement("style");
  s.id = "pdx-divider-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  amber: "var(--amber)"
};

/**
 * Divider / Seam. Default renders the thin rainbow flag seam. Pass `label`
 * or `glyph` for a centered section break; `seam` for a flush full-bleed line.
 */
function Divider({
  variant = "rainbow",
  // rainbow | glow | faint
  color = "lime",
  label,
  glyph,
  seam = false,
  thin = false,
  className = "",
  style = {},
  ...rest
}) {
  if (seam) {
    return /*#__PURE__*/React.createElement("hr", _extends({
      className: `pdxSeam ${thin ? "pdxSeam--thin" : ""} ${className}`,
      style: style
    }, rest));
  }
  const center = label != null || glyph != null;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxDivider pdxDivider--${variant} ${className}`,
    role: "separator",
    style: {
      "--_c": COLORS[color] || color,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxDivider__line"
  }), center && (glyph != null ? /*#__PURE__*/React.createElement("span", {
    className: "pdxDivider__glyph",
    "aria-hidden": "true"
  }, glyph) : /*#__PURE__*/React.createElement("span", {
    className: "pdxDivider__label"
  }, label)), center && /*#__PURE__*/React.createElement("span", {
    className: "pdxDivider__line"
  }));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Divider.jsx", error: String((e && e.message) || e) }); }

// components/layout/HeroBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxHero{ position:relative; overflow:hidden; isolation:isolate;
  background:var(--ink-1000) center/cover no-repeat;
  border-radius:var(--radius-lg); }
.pdxHero--flush{ border-radius:0; }
.pdxHero__img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:-2; }
.pdxHero__scrim{ position:absolute; inset:0; z-index:-1; }
.pdxHero__scrim--bottom{ background:linear-gradient(to top, rgba(5,5,9,.94) 0%, rgba(5,5,9,.55) 32%, transparent 62%); }
.pdxHero__scrim--left{ background:linear-gradient(to right, rgba(5,5,9,.92) 0%, rgba(5,5,9,.62) 34%, transparent 66%); }
.pdxHero__scrim--bl{ background:linear-gradient(to top, rgba(5,5,9,.92), transparent 60%),
  linear-gradient(to right, rgba(5,5,9,.85), transparent 62%); }
.pdxHero__scrim--full{ background:rgba(5,5,9,.55); }
.pdxHero__scrim--none{ display:none; }

.pdxHero__content{ position:relative; display:flex; flex-direction:column;
  padding:clamp(20px,4vw,52px); gap:var(--space-5); }
.pdxHero--bl .pdxHero__content{ align-items:flex-start; justify-content:flex-end; }
.pdxHero--bottom .pdxHero__content{ align-items:flex-start; justify-content:flex-end; }
.pdxHero--center .pdxHero__content{ align-items:center; justify-content:center; text-align:center; }

/* subtle top rainbow seam so it reads as a branded band */
.pdxHero__seam{ position:absolute; left:0; right:0; top:0; height:4px; background:var(--grad-rainbow); z-index:1; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-hero-css")) {
  const s = document.createElement("style");
  s.id = "pdx-hero-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const SCRIM = {
  bottom: "bottom",
  left: "left",
  "bottom-left": "bl",
  full: "full",
  none: "none"
};

/**
 * HeroBanner, full-bleed brand wallpaper with a legibility scrim and an
 * overlay content slot. Feed it one of the collage hero wallpapers.
 */
function HeroBanner({
  image,
  focal = "center",
  // background-position of the wallpaper
  minHeight = 480,
  scrim = "bottom-left",
  align = "bottom-left",
  // bottom-left | bottom | center
  seam = true,
  flush = false,
  // square corners for full-bleed page tops
  children,
  className = "",
  style = {},
  ...rest
}) {
  const alignKey = align === "center" ? "center" : align === "bottom" ? "bottom" : "bl";
  const cls = ["pdxHero", `pdxHero--${alignKey}`, flush ? "pdxHero--flush" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cls,
    style: {
      minHeight,
      ...style
    }
  }, rest), image && /*#__PURE__*/React.createElement("img", {
    className: "pdxHero__img",
    src: image,
    alt: "",
    style: {
      objectPosition: focal
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: `pdxHero__scrim pdxHero__scrim--${SCRIM[scrim] || "bl"}`
  }), seam && /*#__PURE__*/React.createElement("div", {
    className: "pdxHero__seam",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxHero__content"
  }, children));
}
Object.assign(__ds_scope, { HeroBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/HeroBanner.jsx", error: String((e && e.message) || e) }); }

// components/layout/Marquee.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxMarquee{
  --_bg:var(--pink); --_fg:var(--text-inverse);
  overflow:hidden; white-space:nowrap; background:var(--_bg); color:var(--_fg);
  border-block:var(--bw-bold) solid var(--ink-1000);
  padding-block:8px; position:relative;
}
.pdxMarquee--rainbow{ background:var(--grad-rainbow); }
.pdxMarquee__track{ display:inline-flex; align-items:center; gap:0;
  animation:pdxMarquee var(--_dur,26s) linear infinite; }
.pdxMarquee:hover .pdxMarquee__track{ animation-play-state:paused; }
.pdxMarquee__item{ display:inline-flex; align-items:center; gap:16px; padding:0 16px;
  font-family:var(--font-display); font-weight:700; text-transform:uppercase; font-size:1.05rem; letter-spacing:.04em; }
.pdxMarquee__star{ font-family:var(--font-body); font-weight:var(--fw-bold); opacity:.85; }
@keyframes pdxMarquee{ from{ transform:translateX(0); } to{ transform:translateX(-50%); } }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-marquee-css")) {
  const s = document.createElement("style");
  s.id = "pdx-marquee-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** Marquee, infinite scrolling ticker of slogans / dates. Zine/club motif. */
function Marquee({
  items = ["Pride Weekend", "July 16–19", "Keep Portland Weird", "Take Care of Each Other"],
  color = "pink",
  separator = "✦",
  speed = 26,
  className = "",
  ...rest
}) {
  const loop = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxMarquee ${color === "rainbow" ? "pdxMarquee--rainbow" : ""} ${className}`,
    style: {
      "--_bg": color === "rainbow" ? undefined : `var(--${color})`,
      "--_dur": `${speed}s`
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "pdxMarquee__track"
  }, loop.map((it, i) => /*#__PURE__*/React.createElement("span", {
    className: "pdxMarquee__item",
    key: i
  }, it, /*#__PURE__*/React.createElement("span", {
    className: "pdxMarquee__star",
    "aria-hidden": "true"
  }, separator)))));
}
Object.assign(__ds_scope, { Marquee });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Marquee.jsx", error: String((e && e.message) || e) }); }

// components/layout/SectionHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxSection{ display:flex; align-items:flex-end; justify-content:space-between; gap:20px;
  flex-wrap:wrap; margin-bottom:var(--space-6); }
.pdxSection__lead{ min-width:0; }
.pdxSection__kicker{ display:inline-flex; align-items:center; gap:8px;
  font-family:var(--font-display); font-size:var(--chrome-sm); font-weight:var(--fw-bold);
  letter-spacing:var(--tracking-kicker); text-transform:uppercase; color:var(--_c,var(--pink));
  margin-bottom:10px; }
.pdxSection__kicker::before{ content:""; width:22px; height:3px; border-radius:var(--radius-pill);
  background:var(--_c,var(--pink)); }
.pdxSection__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  line-height:var(--lh-display); letter-spacing:var(--tracking-display); color:var(--text-hi);
  font-size:var(--display-2); margin:0; }
.pdxSection__title .hl{ color:var(--_c,var(--pink)); }
.pdxSection__sub{ font-family:var(--font-body); color:var(--text-mid); font-size:var(--body-md);
  max-width:var(--w-prose); margin-top:10px; }
.pdxSection__action{ flex:none; }
.pdxSection--center{ flex-direction:column; align-items:center; text-align:center; }
.pdxSection--center .pdxSection__kicker::before{ display:none; }
.pdxSection--sm .pdxSection__title{ font-size:var(--display-3); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-section-css")) {
  const s = document.createElement("style");
  s.id = "pdx-section-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const ACCENTS = {
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  purple: "var(--purple)",
  lime: "var(--lime)",
  amber: "var(--amber)"
};

/** SectionHeader, mono kicker + loud display title + optional action. */
function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  accent = "pink",
  align = "left",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = ["pdxSection", align === "center" ? "pdxSection--center" : "", size === "sm" ? "pdxSection--sm" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    style: {
      "--_c": ACCENTS[accent] || accent
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "pdxSection__lead"
  }, kicker && /*#__PURE__*/React.createElement("div", {
    className: "pdxSection__kicker"
  }, kicker), title && /*#__PURE__*/React.createElement("h2", {
    className: "pdxSection__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "pdxSection__sub"
  }, subtitle)), action && /*#__PURE__*/React.createElement("div", {
    className: "pdxSection__action"
  }, action));
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/map/MapLegend.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MapLegend = the day-color key shown on the map. Lime-outlined box, one
   glowing dot per day, plus a rainbow MULTI-DAY swatch. Uses the authoritative
   Pride-week day colors (Mon to Sun). */
const CSS = `
.pdxLegend{
  background:rgba(5,5,7,.82); backdrop-filter:blur(6px);
  border:2px solid var(--lime); border-radius:var(--radius-sm);
  box-shadow:0 0 18px -6px var(--lime);
  padding:12px 16px; display:flex; flex-direction:column; gap:9px;
}
.pdxLegend__row{ display:flex; align-items:center; gap:11px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:var(--text-hi); }
.pdxLegend__dot{ width:15px; height:15px; border-radius:var(--radius-pill);
  background:var(--_c); box-shadow:0 0 9px 0 var(--_c); flex:none; }
.pdxLegend__dot--multi{ background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 9px 0 rgba(255,255,255,.35); }
.pdxLegend__rule{ height:1px; background:var(--border-strong); margin:2px 0; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-legend-css")) {
  const s = document.createElement("style");
  s.id = "pdx-legend-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const WEEK = [{
  label: "Mon",
  c: "var(--day-mon)"
}, {
  label: "Tue",
  c: "var(--day-tue)"
}, {
  label: "Wed",
  c: "var(--day-wed)"
}, {
  label: "Thu",
  c: "var(--day-thu)"
}, {
  label: "Fri",
  c: "var(--day-fri)"
}, {
  label: "Sat",
  c: "var(--day-sat)"
}, {
  label: "Sun",
  c: "var(--day-sun)"
}];

/** MapLegend, the day-color key for the map. */
function MapLegend({
  days = WEEK,
  multi = true,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxLegend ${className}`
  }, rest), days.map(d => /*#__PURE__*/React.createElement("div", {
    className: "pdxLegend__row",
    key: d.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxLegend__dot",
    style: {
      "--_c": d.c
    }
  }), d.label)), multi && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pdxLegend__rule"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxLegend__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxLegend__dot pdxLegend__dot--multi"
  }), "Multi-day")));
}
Object.assign(__ds_scope, { MapLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapLegend.jsx", error: String((e && e.message) || e) }); }

// components/map/MapPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MapPanel = the dark neon map surface used on the Events and Directory pages.
   The tile layer is a Leaflet map in production; here it is a dark faux-street
   background so the branded parts read: glowing day-colored pins, the legend,
   the rainbow seams top and bottom, and the Expand control. Feed it `pins`
   with { x, y, day } (percentages) or { x, y, multi:true }. */
const CSS = `
.pdxMap{
  position:relative; overflow:hidden; width:100%;
  background:
    repeating-linear-gradient(0deg,   transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
    repeating-linear-gradient(90deg,  transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
    radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%);
  border-block:0;
}
/* river */
.pdxMap::before{ content:""; position:absolute; top:-10%; bottom:-10%; left:52%; width:90px;
  background:linear-gradient(180deg, rgba(40,60,90,.35), rgba(20,30,50,.28));
  transform:rotate(12deg); filter:blur(2px); }
.pdxMap__seam{ position:absolute; left:0; right:0; height:3px; background:var(--grad-flag); z-index:4; }
.pdxMap__seam--top{ top:0; } .pdxMap__seam--bottom{ bottom:0; }

.pdxMap__pins{ position:absolute; inset:0; z-index:2; }
.pdxMap__pin{ position:absolute; width:18px; height:18px; border-radius:var(--radius-pill);
  transform:translate(-50%,-50%);
  background:var(--ink-1000); border:3px solid var(--_c,var(--green));
  box-shadow:0 0 12px 1px var(--_c,var(--green)); }
.pdxMap__pin--multi{ border:0;
  background:conic-gradient(var(--purple),var(--blue),var(--cyan),var(--green),var(--yellow),var(--orange),var(--pink),var(--purple));
  box-shadow:0 0 12px 1px rgba(255,255,255,.4); }

.pdxMap__legend{ position:absolute; top:16px; right:16px; z-index:5; }
.pdxMap__expand{ position:absolute; top:16px; right:16px; z-index:6;
  display:inline-flex; align-items:center; gap:7px; padding:8px 14px 6px;
  font-family:var(--font-display); font-weight:700; font-size:var(--chrome-sm);
  letter-spacing:.06em; text-transform:uppercase; color:var(--lime);
  background:rgba(5,5,7,.7); border:2px solid var(--lime); border-radius:4px; cursor:pointer;
  box-shadow:0 0 14px -4px var(--lime); }
.pdxMap__expand svg{ width:14px; height:14px; }
.pdxMap__attr{ position:absolute; bottom:8px; right:12px; z-index:5;
  font-family:var(--font-body); font-size:11px; color:var(--text-faint); }
.pdxMap__label{ position:absolute; z-index:1; transform:translate(-50%,-50%);
  font-family:var(--font-body); font-weight:var(--fw-bold); font-size:12px; letter-spacing:.14em;
  text-transform:uppercase; color:rgba(255,255,255,.16); }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-map-css")) {
  const s = document.createElement("style");
  s.id = "pdx-map-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const DAY_COLOR = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const DEFAULT_PINS = [{
  x: 30,
  y: 32,
  day: "SUN"
}, {
  x: 35,
  y: 42,
  multi: true
}, {
  x: 27,
  y: 55,
  day: "SAT"
}, {
  x: 40,
  y: 40,
  day: "THU"
}, {
  x: 44,
  y: 34,
  day: "FRI"
}, {
  x: 46,
  y: 52,
  day: "SAT"
}, {
  x: 33,
  y: 62,
  day: "SAT"
}, {
  x: 50,
  y: 44,
  day: "SAT"
}, {
  x: 54,
  y: 58,
  day: "SUN"
}, {
  x: 62,
  y: 30,
  day: "SAT"
}, {
  x: 74,
  y: 52,
  day: "SUN"
}, {
  x: 66,
  y: 12,
  day: "SUN"
}];

/** MapPanel, the dark neon map surface with day-colored glowing pins. */
function MapPanel({
  pins = DEFAULT_PINS,
  height = 420,
  legend = true,
  expandable = false,
  onExpand,
  showCityLabel = true,
  className = "",
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxMap ${className}`,
    style: {
      height,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__seam pdxMap__seam--top"
  }), showCityLabel && /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__label",
    style: {
      left: "44%",
      top: "46%"
    }
  }, "Portland"), /*#__PURE__*/React.createElement("div", {
    className: "pdxMap__pins"
  }, pins.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""}`,
    style: {
      left: `${p.x}%`,
      top: `${p.y}%`,
      "--_c": DAY_COLOR[p.day] || "var(--day-sat)"
    }
  }))), expandable ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxMap__expand",
    onClick: onExpand
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
  })), "Expand") : legend && /*#__PURE__*/React.createElement("div", {
    className: "pdxMap__legend"
  }, /*#__PURE__*/React.createElement(__ds_scope.MapLegend, null)), /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__attr"
  }, "Leaflet | \xA9 OpenStreetMap \xA9 CARTO"), /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__seam pdxMap__seam--bottom"
  }));
}
Object.assign(__ds_scope, { MapPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/AdminScreen.jsx
try { (() => {
/* AdminScreen, the moderation dashboard: stat grid + review queue. */
const {
  StatCard: AdStatCard,
  StatPill: AdStatPill,
  Button: AdBtn,
  Badge: AdBadge
} = window.PDXPrideGuideDesignSystem_b20420;
const STATS = [{
  value: 14,
  label: "Registered Users",
  color: "lime"
}, {
  value: 0,
  label: "New Users Today",
  color: "lime"
}, {
  value: 33,
  label: "Active Sessions",
  color: "cyan"
}, {
  value: 47,
  label: "Live Events",
  color: "orange"
}, {
  value: 5,
  label: "Community-Submitted",
  color: "cyan"
}, {
  value: 3,
  label: "Member Check-ins",
  color: "lime"
}, {
  value: 21,
  label: "Active Messages",
  color: "cyan"
}, {
  value: 2,
  label: "Pending Review",
  color: "pink"
}, {
  value: 1,
  label: "Live Gig Posts",
  color: "orange"
}, {
  value: 1,
  label: "Active Gifting",
  color: "cyan"
}, {
  value: 1,
  label: "Missed Connections",
  color: "pink"
}, {
  value: 1,
  label: "Open Feedback",
  color: "purple"
}];
const TABS = ["All Types", "Submissions", "Promoters", "Talent", "Moderation", "Gifting", "Reports", "Feedback"];
function AdminScreen() {
  const [tab, setTab] = React.useState("All Types");
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-container pg-section--tight"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-admin__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-admin__title"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--neon-yellow)",
      fontSize: 22
    },
    "aria-hidden": "true"
  }, "\u25C8"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Admin Dashboard"), /*#__PURE__*/React.createElement("div", {
    className: "pg-admin__sub"
  }, "Signed in as Tucker_PDMAX \xB7 Stats as of Jul 2, 2026, 5:33 PM"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-admin__actions"
  }, /*#__PURE__*/React.createElement(AdStatPill, {
    count: 3,
    color: "pink",
    glow: true
  }, "Action Items"), /*#__PURE__*/React.createElement(AdBtn, {
    variant: "ghost",
    size: "sm"
  }, "Refresh All"), /*#__PURE__*/React.createElement(AdBtn, {
    variant: "ghost",
    size: "sm"
  }, "Log Out"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-statgrid"
  }, STATS.map(s => /*#__PURE__*/React.createElement(AdStatCard, {
    key: s.label,
    value: s.value,
    label: s.label,
    color: s.color,
    href: "#"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pg-tabs"
  }, TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: `pg-tab ${tab === t ? "is-active" : ""}`,
    onClick: () => setTab(t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-lo)",
      fontSize: "var(--body-sm)",
      marginBottom: "var(--space-5)"
    }
  }, "3 pending across submissions, promoters, talent, moderation, gifting, and feedback."), /*#__PURE__*/React.createElement("div", {
    className: "pg-queue-item",
    style: {
      "--_c": "var(--neon-violet)",
      marginBottom: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-queue-item__badges"
  }, /*#__PURE__*/React.createElement(AdBadge, {
    color: "purple",
    variant: "outline"
  }, "Feedback"), /*#__PURE__*/React.createElement(AdBadge, {
    color: "yellow",
    variant: "outline"
  }, "Medium")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      color: "var(--text-hi)",
      fontSize: "1.05rem"
    }
  }, "Mobile"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-mid)",
      fontSize: "var(--body-sm)",
      margin: "6px 0 12px"
    }
  }, "The header is big and always there on mobile. Android Galaxy S26 Ultra. Have a screenshot I can share."), /*#__PURE__*/React.createElement(AdBtn, {
    variant: "neon",
    accent: "yellow",
    size: "sm"
  }, "Mark Resolved")), /*#__PURE__*/React.createElement("div", {
    className: "pg-queue-item",
    style: {
      "--_c": "var(--neon-cyan)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-queue-item__badges"
  }, /*#__PURE__*/React.createElement(AdBadge, {
    color: "cyan",
    variant: "outline"
  }, "Submission"), /*#__PURE__*/React.createElement(AdBadge, {
    day: "SAT"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      color: "var(--text-hi)",
      fontSize: "1.05rem"
    }
  }, "Stank Yes Coach, PDX PRIDE"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-mid)",
      fontSize: "var(--body-sm)",
      margin: "6px 0 12px"
    }
  }, "@Sanctuary \xB7 Sanctuary Club \xB7 info@pdxsanctuary.com. New community submission awaiting review."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(AdBtn, {
    variant: "neon",
    accent: "lime",
    size: "sm"
  }, "Approve"), /*#__PURE__*/React.createElement(AdBtn, {
    variant: "ghost",
    size: "sm"
  }, "Dismiss"))));
}
Object.assign(window, {
  PGAdminScreen: AdminScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/AdminScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/AppShell.jsx
try { (() => {
/* AppShell, header nav + footer for the Pride Guide UI kit. */
const {
  Logo: PGLogo,
  Button: PGBtn,
  StatPill: PGStatPill
} = window.PDXPrideGuideDesignSystem_b20420;
const NAV = [{
  key: "home",
  label: "Home",
  nav: true
}, {
  key: "events",
  label: "Events",
  nav: true
}, {
  key: "promoters",
  label: "Promoters"
}, {
  key: "pridewerk",
  label: "Pride Werk"
}, {
  key: "gifting",
  label: "Gifting"
}, {
  key: "spotted",
  label: "Spotted!"
}, {
  key: "places",
  label: "Places",
  nav: true
}, {
  key: "about",
  label: "About"
}];
function Avatar({
  size = 40
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "pg-avatar pg-avatar--fallback",
    style: {
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: "999px",
      border: "2px solid var(--ink-1000)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--ink-800)",
      color: "#fff",
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: size * 0.36
    }
  }, "TC"));
}
function Header({
  route,
  onNav
}) {
  const activeColor = {
    home: "var(--neon-yellow)",
    events: "var(--neon-cyan)",
    places: "var(--neon-magenta)",
    hub: "var(--neon-cyan)"
  };
  return /*#__PURE__*/React.createElement("header", {
    className: "pg-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-header__bar"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#home",
    onClick: e => {
      e.preventDefault();
      onNav("home");
    },
    style: {
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(PGLogo, {
    variant: "lockup",
    size: 48,
    src: "../../assets/logo.png"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "pg-nav"
  }, NAV.map(l => /*#__PURE__*/React.createElement("button", {
    key: l.key,
    className: `pg-nav__link ${route === l.key ? "is-active" : ""}`,
    style: {
      "--_c": activeColor[l.key] || "var(--neon-cyan)"
    },
    onClick: () => onNav(l.nav ? l.key : route)
  }, l.label)), /*#__PURE__*/React.createElement("span", {
    className: "pg-nav__sep"
  }), /*#__PURE__*/React.createElement("button", {
    className: `pg-nav__link ${route === "hub" ? "is-active" : ""}`,
    style: {
      "--_c": "var(--neon-cyan)"
    },
    onClick: () => onNav("hub")
  }, "Hub"), /*#__PURE__*/React.createElement("button", {
    className: "pg-nav__link",
    style: {
      "--_c": "var(--neon-magenta)"
    },
    onClick: () => onNav("admin")
  }, "Admin")), /*#__PURE__*/React.createElement("div", {
    className: "pg-header__spacer"
  }), /*#__PURE__*/React.createElement(PGBtn, {
    className: "pg-menuBtn",
    accent: "lime",
    size: "sm"
  }, "Menu"), /*#__PURE__*/React.createElement(Avatar, {
    size: 40
  })), /*#__PURE__*/React.createElement("div", {
    className: "pdx-seam"
  }));
}
function Footer({
  onNav
}) {
  return /*#__PURE__*/React.createElement("footer", {
    className: "pg-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdx-seam"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PGLogo, {
    variant: "lockup",
    size: 44,
    src: "../../assets/logo.png"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pg-footer__note",
    style: {
      marginTop: 14
    }
  }, "Built by the scene, for the scene. No sponsors, no logins, no cover charge.")), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault()
  }, "JSON API"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault()
  }, "llms.txt"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav && onNav("events");
    }
  }, "Submit an Event"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault()
  }, "Buy Us a Coffee"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__bar"
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 PDX Pride Guide. A community project."), /*#__PURE__*/React.createElement("span", {
    className: "pg-footer__protest"
  }, "Pride is a protest. Take care of each other. \u2726"))));
}
Object.assign(window, {
  PGHeader: Header,
  PGFooter: Footer,
  PGAvatar: Avatar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/EventsScreen.jsx
try { (() => {
/* EventsScreen, the browse view: page hero, map strip, sticky filter bar,
   and a board of poster cards (grid) or rows (list). */
const {
  Button: EvBtn,
  MapPanel: EvMap,
  FilterChip: EvChip,
  SearchInput: EvSearch,
  PosterCard: EvPoster,
  EventCard: EvRow,
  StatPill: EvStatPill,
  Badge: EvBadge
} = window.PDXPrideGuideDesignSystem_b20420;
function GridIcon({
  on
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7"
  }));
}
function ListIcon() {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
  }));
}
function EventsScreen({
  data,
  saved,
  onSave,
  onRsvp
}) {
  const [q, setQ] = React.useState("");
  const [days, setDays] = React.useState({});
  const [view, setView] = React.useState("grid");
  const dayOn = Object.keys(days).some(k => days[k]);
  const filtered = data.EVENTS.filter(e => {
    if (dayOn && !days[e.day]) return false;
    if (q) {
      const hay = `${e.title} ${e.venue} ${e.neighborhood} ${e.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const when = window.pgWhenLine,
    ageOf = window.pgAgeOf,
    typesOf = window.pgTypesOf;
  const mapPins = data.EVENTS.map((e, i) => ({
    x: 22 + i * 37 % 60,
    y: 20 + i * 53 % 60,
    day: e.day
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-events"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      paddingBlock: "var(--space-16) var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-marker"
  }, "Portland Pride Week 2026 \xB7 July 13 to 19"), /*#__PURE__*/React.createElement("h1", {
    className: "pdx-display",
    style: {
      fontSize: "var(--display-1)",
      margin: "18px 0 0"
    }
  }, "Events", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--neon-cyan)"
    }
  }, "Guide")), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: "52ch",
      marginTop: 14,
      color: "var(--text-mid)",
      fontSize: "var(--body-lg)"
    }
  }, "Every queer party, parade, show, and gathering for Pride Week 2026 and beyond, all in one place."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(EvBtn, {
    accent: "lime",
    arrow: true
  }, "View as Schedule")))), /*#__PURE__*/React.createElement(EvMap, {
    height: 380,
    pins: mapPins,
    expandable: true,
    onExpand: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 73,
      zIndex: 90,
      background: "rgba(6,6,9,.92)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-container",
    style: {
      paddingBlock: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-toolbar__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-chiprow"
  }, /*#__PURE__*/React.createElement(EvChip, {
    accent: "lime",
    selected: !dayOn,
    onToggle: () => setDays({})
  }, "All"), data.DAYS.map(d => /*#__PURE__*/React.createElement(EvChip, {
    key: d.key,
    accent: d.accent,
    fill: true,
    selected: !!days[d.key],
    onToggle: () => setDays(m => ({
      ...m,
      [d.key]: !m[d.key]
    }))
  }, d.key))), /*#__PURE__*/React.createElement("div", {
    className: "pg-toolbar__search"
  }, /*#__PURE__*/React.createElement(EvSearch, {
    value: q,
    size: "sm",
    onChange: e => setQ(e.target.value),
    onClear: () => setQ(""),
    placeholder: "Search events..."
  })), /*#__PURE__*/React.createElement("div", {
    className: "pg-viewtoggle"
  }, /*#__PURE__*/React.createElement("button", {
    className: view === "grid" ? "is-active" : "",
    onClick: () => setView("grid"),
    "aria-label": "Grid view"
  }, /*#__PURE__*/React.createElement(GridIcon, null)), /*#__PURE__*/React.createElement("button", {
    className: view === "list" ? "is-active" : "",
    onClick: () => setView("list"),
    "aria-label": "List view"
  }, /*#__PURE__*/React.createElement(ListIcon, null)))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container pg-section--tight"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-results"
  }, /*#__PURE__*/React.createElement(EvStatPill, {
    count: filtered.length,
    color: "lime",
    icon: /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "\u25CE")
  }, "Events"), /*#__PURE__*/React.createElement("div", {
    className: "pg-results__sort"
  }, "Sort ", /*#__PURE__*/React.createElement("select", {
    className: "pg-select"
  }, /*#__PURE__*/React.createElement("option", null, "Start time"), /*#__PURE__*/React.createElement("option", null, "Day"), /*#__PURE__*/React.createElement("option", null, "Most going")))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "pg-empty"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-empty__big"
  }, "Nothing here yet"), /*#__PURE__*/React.createElement("span", null, "Try clearing a filter. There's always something happening.")) : view === "grid" ? /*#__PURE__*/React.createElement("div", {
    className: "pg-poster-grid"
  }, filtered.map(e => /*#__PURE__*/React.createElement(EvPoster, {
    key: e.id,
    href: "#",
    day: e.day,
    title: e.title,
    venue: e.venue,
    when: when(e),
    types: typesOf(e),
    admission: e.admission,
    age: ageOf(e),
    going: e.going,
    onRsvp: () => onRsvp(e.id)
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "pg-list"
  }, filtered.map(e => /*#__PURE__*/React.createElement(EvRow, {
    key: e.id,
    href: "#",
    day: e.day,
    title: e.title,
    venue: e.venue,
    when: `${e.hour} ${e.ampm} · ${e.neighborhood}`,
    types: typesOf(e),
    admission: e.admission,
    age: ageOf(e),
    going: e.going,
    saved: !!saved[e.id],
    onSave: () => onSave(e.id)
  })))));
}
Object.assign(window, {
  PGEventsScreen: EventsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/EventsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/HomeScreen.jsx
try { (() => {
/* HomeScreen, the landing page: full-bleed hero, then featured board cards
   and a by-day event preview. */
const {
  Countdown: HCountdown,
  StickerBadge: HSticker,
  Button: HBtn,
  PosterCard: HPoster,
  EventCard: HRow,
  SectionHeader: HSection,
  FilterChip: HChip,
  Divider: HDivider
} = window.PDXPrideGuideDesignSystem_b20420;
function whenLine(e) {
  const dayName = {
    THU: "Thu",
    FRI: "Fri",
    SAT: "Sat",
    SUN: "Sun"
  }[e.day] || e.day;
  return `${dayName}, ${e.date} · ${e.hour} ${e.ampm} · ${e.neighborhood}`;
}
function ageOf(e) {
  return e.tags.includes("21+") ? "21_PLUS" : e.tags.includes("All Ages") ? "ALL_AGES" : undefined;
}
function typesOf(e) {
  return e.tags.filter(t => !["21+", "All Ages", "Headliner", "Legendary", "Sex Positive"].includes(t)).slice(0, 2);
}
function Hero({
  onNav
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "pg-hero"
  }, /*#__PURE__*/React.createElement("img", {
    className: "pg-hero__bg",
    src: "../../assets/banners/hero-collage.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__halftone"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__marker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-marker"
  }, "Portland Pride Week 2026 \xB7 July 13 to 19")), /*#__PURE__*/React.createElement("h1", {
    className: "pg-hero__mark"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-hero-row row-white"
  }, "Portland"), /*#__PURE__*/React.createElement("span", {
    className: "pdx-hero-row row-rainbow"
  }, "Pride"), /*#__PURE__*/React.createElement("span", {
    className: "pdx-hero-row row-white"
  }, "Guide")), /*#__PURE__*/React.createElement("p", {
    className: "pg-hero__welcome"
  }, "This is your welcoming spot to discover events, find your people, support queer venues, keep your connections, and ", /*#__PURE__*/React.createElement("strong", null, "take care of each other.")), /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__count"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-hero__count-label"
  }, "Kickoff in"), /*#__PURE__*/React.createElement(HCountdown, {
    target: "2026-07-16T19:00:00"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__cta"
  }, /*#__PURE__*/React.createElement(HBtn, {
    accent: "lime",
    size: "lg",
    arrow: true,
    onClick: () => onNav("events")
  }, "View All Events"), /*#__PURE__*/React.createElement(HBtn, {
    accent: "cyan",
    size: "lg",
    arrow: true,
    onClick: () => onNav("hub")
  }, "Your Hub"))));
}
function HomeScreen({
  data,
  saved,
  onSave,
  onRsvp,
  onNav
}) {
  const featured = data.EVENTS.filter(e => e.featured).slice(0, 4);
  const [day, setDay] = React.useState("SAT");
  const dayRows = data.EVENTS.filter(e => e.day === day).slice(0, 5);
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-home"
  }, /*#__PURE__*/React.createElement(Hero, {
    onNav: onNav
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pg-section"
  }, /*#__PURE__*/React.createElement(HSection, {
    kicker: "Don't Miss",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "The ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "headliners")),
    subtitle: "The big-tent moments: parade, festival, and the legends.",
    accent: "pink",
    action: /*#__PURE__*/React.createElement(HBtn, {
      accent: "lime",
      size: "sm",
      arrow: true,
      onClick: () => onNav("events")
    }, "All Events")
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-poster-grid"
  }, featured.map(e => /*#__PURE__*/React.createElement(HPoster, {
    key: e.id,
    href: "#",
    day: e.day,
    title: e.title,
    venue: e.venue,
    when: whenLine(e),
    types: typesOf(e),
    admission: e.admission,
    age: ageOf(e),
    going: e.going,
    onRsvp: () => onRsvp(e.id)
  })))), /*#__PURE__*/React.createElement(HDivider, {
    variant: "rainbow"
  }), /*#__PURE__*/React.createElement("section", {
    className: "pg-section"
  }, /*#__PURE__*/React.createElement(HSection, {
    kicker: "By the Day",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "What's ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "on")),
    accent: "cyan"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-chiprow",
    style: {
      marginBottom: "var(--space-6)"
    }
  }, data.DAYS.map(d => /*#__PURE__*/React.createElement(HChip, {
    key: d.key,
    accent: d.accent,
    fill: true,
    selected: day === d.key,
    onToggle: () => setDay(d.key),
    count: data.EVENTS.filter(e => e.day === d.key).length
  }, d.label, " ", d.date.split(" ")[1]))), /*#__PURE__*/React.createElement("div", {
    className: "pg-list"
  }, dayRows.map(e => /*#__PURE__*/React.createElement(HRow, {
    key: e.id,
    href: "#",
    day: e.day,
    title: e.title,
    venue: e.venue,
    when: `${e.hour} ${e.ampm} · ${e.neighborhood}`,
    types: typesOf(e),
    admission: e.admission,
    age: ageOf(e),
    going: e.going,
    saved: !!saved[e.id],
    onSave: () => onSave(e.id)
  }))))));
}
Object.assign(window, {
  PGHomeScreen: HomeScreen,
  pgWhenLine: whenLine,
  pgAgeOf: ageOf,
  pgTypesOf: typesOf
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/HubScreen.jsx
try { (() => {
/* HubScreen, the signed-in dashboard: collage hero, profile, stat pills, and
   inbox / weather / pride-week / connections panels. */
const {
  HeroBanner: HbHero,
  Button: HbBtn,
  StatPill: HbStatPill,
  Countdown: HbCountdown,
  StickerBadge: HbSticker
} = window.PDXPrideGuideDesignSystem_b20420;
const WX = [{
  d: "Mon",
  t: "72°"
}, {
  d: "Tue",
  t: "73°"
}, {
  d: "Wed",
  t: "74°"
}, {
  d: "Thu",
  t: "74°"
}, {
  d: "Fri",
  t: "76°"
}, {
  d: "Sat",
  t: "79°",
  hot: true
}, {
  d: "Sun",
  t: "71°"
}];
function Panel({
  title,
  titleColor,
  accent,
  rainbow,
  action,
  children
}) {
  const cls = ["pg-panel", rainbow ? "pg-panel--rainbow" : accent ? "pg-panel--accent" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    style: {
      "--_c": accent
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-panel__title",
    style: {
      "--_c": titleColor
    }
  }, title), action), children);
}
function HubScreen({
  onNav
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-hub"
  }, /*#__PURE__*/React.createElement(HbHero, {
    image: "../../assets/banners/banner-stickers.png",
    minHeight: 420,
    align: "bottom-left",
    flush: true,
    scrim: "bottom-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-marker pdx-marker--cyan"
  }, "Your Hub"), /*#__PURE__*/React.createElement("h1", {
    className: "pdx-display",
    style: {
      fontSize: "var(--display-1)",
      margin: "10px 0 0"
    }
  }, "Your ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--neon-cyan)"
    }
  }, "Hub")), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: "44ch",
      marginTop: 12,
      color: "var(--text-mid)"
    }
  }, "Community-run and free. Manage your submissions and claims, board posts, and inbox threads in one place.")), /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__profile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-hub__avatar pg-avatar--fallback"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: "999px",
      border: "2px solid var(--ink-1000)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--ink-800)",
      color: "#fff",
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 26
    }
  }, "TC")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__name"
  }, "Tucker_PDMAX"), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__handle"
  }, "@hello_tuckercasey \xB7 hello.tuckercasey@gmail.com"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__actions"
  }, /*#__PURE__*/React.createElement(HbBtn, {
    accent: "lime"
  }, "Edit Profile"), /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost"
  }, "Sign Out"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__stats"
  }, /*#__PURE__*/React.createElement(HbStatPill, {
    count: 1,
    color: "cyan"
  }, "Events"), /*#__PURE__*/React.createElement(HbStatPill, {
    count: 1,
    color: "orange"
  }, "Gigs"), /*#__PURE__*/React.createElement(HbStatPill, {
    count: 1,
    color: "cyan"
  }, "Gifting"), /*#__PURE__*/React.createElement(HbStatPill, {
    count: 1,
    color: "pink"
  }, "Spotted"), /*#__PURE__*/React.createElement(HbStatPill, {
    count: 1,
    color: "lime"
  }, "Check-ins")), /*#__PURE__*/React.createElement("div", {
    className: "pg-panel pg-panel--accent",
    style: {
      "--_c": "var(--neon-magenta)",
      marginBottom: "var(--space-5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pg-panel__title",
    style: {
      "--_c": "var(--neon-magenta)",
      display: "block",
      marginBottom: 4
    }
  }, "Site Admin"), /*#__PURE__*/React.createElement("span", {
    className: "pg-panel__body"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--neon-magenta)"
    }
  }, "3"), " items waiting in the review queue.")), /*#__PURE__*/React.createElement(HbBtn, {
    accent: "cyan",
    arrow: true,
    onClick: () => onNav("admin")
  }, "Open Admin")), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__grid",
    style: {
      marginBottom: "var(--space-8)"
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Inbox",
    titleColor: "var(--neon-cyan)",
    accent: "var(--border-default)",
    action: /*#__PURE__*/React.createElement(HbBtn, {
      accent: "cyan",
      size: "sm",
      arrow: true
    }, "Open Inbox")
  }, /*#__PURE__*/React.createElement("p", {
    className: "pg-panel__body"
  }, "No threads yet. Replies from Spotted, Pride Werk, event hosts, and check-ins show up here."), /*#__PURE__*/React.createElement("div", {
    className: "pg-quickrow"
  }, /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost",
    size: "sm"
  }, "Spotted"), /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost",
    size: "sm"
  }, "Pride Werk"), /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost",
    size: "sm"
  }, "Submit Event"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-panel__head",
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-kicker"
  }, "Pride Week \xB7 Jul 13 to 19"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "999px",
      background: "radial-gradient(circle, var(--neon-orange), #b34700)",
      boxShadow: "0 0 16px -2px var(--neon-orange)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement(EvEstimate, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-weather__temp"
  }, "79\xB0"), /*#__PURE__*/React.createElement("span", {
    className: "pg-weather__cond"
  }, "Mostly Clear")), /*#__PURE__*/React.createElement("div", {
    className: "pg-weather__days"
  }, WX.map(w => /*#__PURE__*/React.createElement("div", {
    className: "pg-weather__day",
    key: w.d
  }, /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, w.d), /*#__PURE__*/React.createElement("div", {
    className: "t",
    style: w.hot ? {
      color: "var(--yellow)"
    } : null
  }, w.t))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-panel pg-panel--rainbow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-panel__title"
  }, "Pride Week"), /*#__PURE__*/React.createElement(HbStatPill, {
    variant: "solid",
    color: "lime",
    glow: true,
    dot: true
  }, "Live")), /*#__PURE__*/React.createElement("span", {
    className: "pdx-kicker",
    style: {
      display: "block",
      marginBottom: 12
    }
  }, "Jul 13 to 19 \xB7 Portland"), /*#__PURE__*/React.createElement(HbCountdown, {
    target: "2026-07-16T19:00:00",
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      color: "var(--text-mid)",
      fontSize: "var(--body-sm)",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "999px",
      background: "var(--neon-yellow)"
    }
  }), "Next up: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-hi)"
    }
  }, "Sad Girl Summer, Pride Edition"))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-panel",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: "var(--space-16)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pg-panel__title",
    style: {
      display: "block",
      marginBottom: 4,
      fontSize: "1rem"
    }
  }, "Account Connections"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--neon-yellow)",
      fontSize: "var(--body-sm)"
    }
  }, "Google is linked to this profile.")), /*#__PURE__*/React.createElement(HbBtn, {
    accent: "lime",
    size: "sm"
  }, "Google Linked"))));
}
function EvEstimate() {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: ".72rem",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      background: "var(--yellow)",
      color: "#000",
      padding: "3px 9px 2px",
      borderRadius: "2px"
    }
  }, "Estimate");
}
Object.assign(window, {
  PGHubScreen: HubScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/HubScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/PlacesScreen.jsx
try { (() => {
/* PlacesScreen, the venue directory: map, category filters, count, and a
   masonry-ish grid of PlaceCards. */
const {
  MapPanel: PlMap,
  FilterChip: PlChip,
  PlaceCard: PlCard,
  StatPill: PlStatPill
} = window.PDXPrideGuideDesignSystem_b20420;
function PlacesScreen({
  data
}) {
  const [cat, setCat] = React.useState("all");
  const places = cat === "all" ? data.PLACES : data.PLACES.filter(p => p.category === cat);
  const catColor = {
    all: "lime",
    bars: "pink",
    food: "orange",
    cafes: "green",
    venues: "cyan",
    services: "purple",
    shops: "amber",
    hotels: "cyan"
  };
  const pins = data.PLACES.map((p, i) => ({
    x: 24 + i * 41 % 56,
    y: 22 + i * 47 % 56,
    day: ["SAT", "SUN", "THU", "FRI"][i % 4]
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-places"
  }, /*#__PURE__*/React.createElement(PlMap, {
    height: 340,
    pins: pins,
    expandable: true,
    onExpand: () => {}
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 73,
      zIndex: 90,
      background: "rgba(6,6,9,.92)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-container",
    style: {
      paddingBlock: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-chiprow"
  }, data.PLACE_CATEGORIES.map(c => /*#__PURE__*/React.createElement(PlChip, {
    key: c.key,
    accent: catColor[c.key] || "lime",
    selected: cat === c.key,
    onToggle: () => setCat(c.key)
  }, c.label))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container pg-section--tight"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-results"
  }, /*#__PURE__*/React.createElement(PlStatPill, {
    count: places.length,
    color: "lime",
    icon: /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "\u25CE")
  }, "Places")), /*#__PURE__*/React.createElement("div", {
    className: "pg-place-grid"
  }, places.map((p, i) => /*#__PURE__*/React.createElement(PlCard, {
    key: i,
    name: p.name,
    category: p.category,
    address: p.address,
    hours: p.hours,
    phone: p.phone,
    description: p.description,
    website: p.website,
    instagram: p.instagram,
    grandOpening: p.grandOpening,
    events: p.events
  })))));
}
Object.assign(window, {
  PGPlacesScreen: PlacesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/PlacesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pride-guide/data.js
try { (() => {
/* Real Portland Pride 2026 content pulled from prideguidepdx.com.
   A representative subset across all four days, community-board sample
   posts, and venue directory places. Loaded as window.PDX_DATA.
   Day accents follow the site's map legend:
   THU = cyan, FRI = magenta/pink, SAT = green, SUN = orange. */
(function () {
  var DAY_ACCENT = {
    THU: "cyan",
    FRI: "pink",
    SAT: "green",
    SUN: "orange"
  };
  const EVENTS = [
  // ---- THU JUL 16 (kickoff night) ----
  {
    id: 13,
    day: "THU",
    date: "Jul 16",
    hour: "8:00",
    ampm: "PM",
    title: "Sasha Colby Pride Kick-Off",
    venue: "Star Theater",
    neighborhood: "Old Town",
    admission: "TICKETED",
    featured: true,
    going: 42,
    tags: ["Drag", "21+", "Headliner"],
    blurb: "Headline performance by drag superstar Sasha Colby for Portland Pride Kick-Off."
  }, {
    id: 53,
    day: "THU",
    date: "Jul 16",
    hour: "7:00",
    ampm: "PM",
    title: "Sad Girl Summer, Pride Edition",
    venue: "Black Water",
    neighborhood: "NE Portland",
    admission: "TICKETED",
    going: 1,
    tags: ["Drag", "21+"],
    blurb: "Portland's biggest bummer of a drag show, back and sadder than ever. Bring tissues."
  }, {
    id: 17,
    day: "THU",
    date: "Jul 16",
    hour: "7:05",
    ampm: "PM",
    title: "Portland Pickles Pride Night",
    venue: "Walker Stadium",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["Sports", "All Ages"],
    blurb: "Pride baseball vs. the Gresham Greywolves. On-field activities, vendors, from $12."
  }, {
    id: 52,
    day: "THU",
    date: "Jul 16",
    hour: "9:00",
    ampm: "PM",
    title: "BANG: Queer Techno Transmission",
    venue: "Holocene",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["Techno", "21+"],
    blurb: "Kicking off Pride with a BANG, a new queer-helmed techno night. DJs Sappho, Bro Hoe, Kraftwitch."
  },
  // ---- FRI JUL 17 ----
  {
    id: 51,
    day: "FRI",
    date: "Jul 17",
    hour: "5:00",
    ampm: "PM",
    title: "Midtown Beer Garden Pride",
    venue: "Midtown Beer Garden",
    neighborhood: "Downtown",
    admission: "FREE",
    tags: ["Outdoor", "All Ages"],
    blurb: "Official PrideNW outdoor beer garden, open across Pride weekend on Harvey Milk St."
  }, {
    id: 27,
    day: "FRI",
    date: "Jul 17",
    hour: "7:00",
    ampm: "PM",
    title: "Darcelle XV Friday Night Show",
    venue: "Darcelle XV Showplace",
    neighborhood: "Old Town",
    admission: "TICKETED",
    featured: true,
    going: 18,
    tags: ["Drag", "Legendary"],
    blurb: "Portland's legendary drag cabaret, staging shows since 1967. Doors 7pm, show 8pm. $32."
  }, {
    id: 9,
    day: "FRI",
    date: "Jul 17",
    hour: "9:00",
    ampm: "PM",
    title: "Horse Meat Disco TUFF",
    venue: "Crystal Ballroom",
    neighborhood: "Pearl District",
    admission: "TICKETED",
    tags: ["Disco", "21+"],
    blurb: "Official Pride night celebrating underground dance floors and leather bars. DJ Nick Bertossi."
  }, {
    id: 15,
    day: "FRI",
    date: "Jul 17",
    hour: "9:00",
    ampm: "PM",
    title: "Bearracuda Pride Friday: Vaseline Alley",
    venue: "722 E Burnside",
    neighborhood: "Inner East",
    admission: "TICKETED",
    tags: ["Bears", "21+", "Sex Positive"],
    blurb: "Bearracuda Pride Friday. Theme: Vaseline Alley. Harnesses and fetish gear encouraged."
  },
  // ---- SAT JUL 18 ----
  {
    id: 1,
    day: "SAT",
    date: "Jul 18",
    hour: "12:00",
    ampm: "PM",
    title: "Portland Pride Waterfront Festival",
    venue: "Tom McCall Waterfront Park",
    neighborhood: "Downtown",
    admission: "SUGGESTED_DONATION",
    featured: true,
    going: 220,
    tags: ["Main Stage", "ASL", "All Ages"],
    blurb: "Official PrideNW festival. 2026 theme: Made with Pride. $10 suggested, no one turned away."
  }, {
    id: 31,
    day: "SAT",
    date: "Jul 18",
    hour: "12:00",
    ampm: "PM",
    title: "Rose City Roller Derby: Blood, Sweat & Queers",
    venue: "The Hangar at Oaks Park",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["Sports"],
    blurb: "Rose City Roller Derby home-team championship Pride Night. Food carts plus Plow Stop Bar."
  }, {
    id: 18,
    day: "SAT",
    date: "Jul 18",
    hour: "1:00",
    ampm: "PM",
    title: "Old Town Block Party",
    venue: "Ankeny Alley",
    neighborhood: "Old Town",
    admission: "FREE",
    tags: ["Outdoor", "All Ages"],
    blurb: "Official PrideNW Old Town activation. Unstoppable joy and radical love in Ankeny Alley."
  }, {
    id: 47,
    day: "SAT",
    date: "Jul 18",
    hour: "5:00",
    ampm: "PM",
    title: "Dyke March Portland Pride",
    venue: "Downtown Portland",
    neighborhood: "Downtown",
    admission: "FREE",
    tags: ["March", "All Ages"],
    blurb: "Official PrideNW event. Check portlandpride.org for the exact start and route before attending."
  }, {
    id: 6,
    day: "SAT",
    date: "Jul 18",
    hour: "9:00",
    ampm: "PM",
    title: "RADIANCE by Gaylabration",
    venue: "McMenamins Crystal Ballroom",
    neighborhood: "Pearl District",
    admission: "TICKETED",
    tags: ["Dance", "21+"],
    blurb: "Headliner Matt Suave, with Poundstar, Mircat Dragonfae, and Bro Hoe Sappho."
  },
  // ---- SUN JUL 19 ----
  {
    id: 2,
    day: "SUN",
    date: "Jul 19",
    hour: "11:00",
    ampm: "AM",
    title: "Portland Pride Parade",
    venue: "North Park Blocks to Naito Pkwy",
    neighborhood: "Downtown",
    admission: "FREE",
    featured: true,
    going: 310,
    tags: ["Parade", "All Ages"],
    blurb: "Oregon's largest parade, drawing tens of thousands. Ends at the Waterfront festival."
  }, {
    id: 35,
    day: "SUN",
    date: "Jul 19",
    hour: "2:00",
    ampm: "PM",
    title: "Portland Trans Pride March",
    venue: "North Park Blocks",
    neighborhood: "Downtown",
    admission: "FREE",
    tags: ["March", "All Ages"],
    blurb: "Free, all ages, masks encouraged. Organized by and for the trans community."
  }, {
    id: 21,
    day: "SUN",
    date: "Jul 19",
    hour: "1:00",
    ampm: "PM",
    title: "The Sports Bra Pride Block Party",
    venue: "The Sports Bra",
    neighborhood: "NE Portland",
    admission: "TICKETED",
    tags: ["Outdoor", "All Ages"],
    blurb: "5th annual block party: DJ sets, lifting comp, dance, food carts, kid-friendly activities."
  }, {
    id: 26,
    day: "SUN",
    date: "Jul 19",
    hour: "7:00",
    ampm: "PM",
    title: "Chai & Roses Pride Party",
    venue: "Holocene",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["QTBIPOC", "21+"],
    blurb: "Sunday tea dance for QTBIPOC and allies. DJs Suavecito and DJ Anjali. MC Armaan Singh."
  }, {
    id: 22,
    day: "SUN",
    date: "Jul 19",
    hour: "9:00",
    ampm: "PM",
    title: "Yes Sir Gay Dance Party",
    venue: "REALM PDX",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["Dance", "21+", "Sex Positive"],
    blurb: "Secret warehouse gay underwear night featuring DJ Ottogyro. Location for ticket holders."
  }].map(function (e) {
    return Object.assign({
      accent: DAY_ACCENT[e.day]
    }, e);
  });
  const DAYS = [{
    key: "THU",
    label: "Thu",
    date: "Jul 16",
    accent: "cyan"
  }, {
    key: "FRI",
    label: "Fri",
    date: "Jul 17",
    accent: "pink"
  }, {
    key: "SAT",
    label: "Sat",
    date: "Jul 18",
    accent: "green"
  }, {
    key: "SUN",
    label: "Sun",
    date: "Jul 19",
    accent: "orange"
  }];

  // Venue / place directory (Places page)
  const PLACES = [{
    name: "Camp Bar PDX",
    category: "bars",
    grandOpening: true,
    address: "1125 SW Harvey Milk St",
    description: "Modern inclusive gay bar in downtown Portland's Gayborhood, taking over the historic former Scandals space on Harvey Milk Street. Grand opening June 2026.",
    website: "#",
    instagram: "@campbarpdx"
  }, {
    name: "Friendship Kitchen",
    category: "food",
    address: "2333 NE Glisan St",
    description: "Wife-and-wife owned Vietnamese restaurant serving Impossible egg rolls, shaken beef or tofu, pho, and lemongrass chicken skewers.",
    website: "#",
    instagram: "@friendshipkitchen"
  }, {
    name: "Either/Or",
    category: "cafes",
    address: "4003 N Williams Ave",
    hours: "Mon to Sun 8am to 2pm",
    description: "LGBTQ+-owned coffee bar known for creative coffee cocktails and zero-proof mocktails. A queer-welcoming neighborhood anchor in N Portland.",
    website: "#",
    instagram: "@eitherorcafe"
  }, {
    name: "Alberta Rose Theatre",
    category: "venues",
    address: "3000 NE Alberta St",
    description: "Historic 300-seat theater on Alberta hosting music, burlesque, comedy, and community events with a strong queer presence.",
    events: [{
      day: "SAT",
      date: "Sat, Jul 18 · 8:00 PM",
      title: "BOYeurism: Pride Spectacular"
    }]
  }, {
    name: "Jackie's",
    category: "bars",
    address: "930 SE Sandy Blvd",
    description: "Laid-back queer-friendly bar on SE Sandy. Regular host of LGBTQ+ community nights and Pride events.",
    events: [{
      day: "SUN",
      date: "Sun, Jul 19 · 3:00 PM",
      title: "Lumbertwink Plaid Patio Pride"
    }]
  }, {
    name: "CC Slaughters",
    category: "bars",
    address: "219 NW Davis St",
    hours: "Mon to Sun 2pm to 2:30am",
    phone: "(503) 248-9135",
    description: "Portland's beloved LGBTQ+ nightclub since 1981. Dance floor, drag shows, themed nights, and a welcoming crowd in the heart of Old Town.",
    website: "#",
    instagram: "@slaughterspdx"
  }, {
    name: "Sanctuary Club",
    category: "venues",
    address: "33 NW 9th Ave",
    description: "LGBTQ+-centered event space and club in the Pearl. Hosts drag, dance parties, and community gatherings.",
    events: [{
      day: "SAT",
      date: "Sat, Jul 18 · 9:00 PM",
      title: "Stank Yes Coach, PDX PRIDE"
    }]
  }, {
    name: "Tin Shed Garden Cafe",
    category: "cafes",
    address: "1438 NE Alberta St",
    hours: "Mon to Fri 8am to 2pm, Sat to Sun 7am to 3pm",
    phone: "(503) 288-6966",
    description: "Eco-friendly, dog-friendly breakfast and brunch cafe run by Christie Griffin and Janette Kaden since 2002. Featured on Food Network.",
    instagram: "@tinshedgardencafe"
  }];
  const PLACE_CATEGORIES = [{
    key: "all",
    label: "All"
  }, {
    key: "bars",
    label: "Bars & Clubs"
  }, {
    key: "food",
    label: "Restaurants"
  }, {
    key: "cafes",
    label: "Cafes"
  }, {
    key: "venues",
    label: "Venues"
  }, {
    key: "services",
    label: "Services"
  }, {
    key: "shops",
    label: "Shops"
  }, {
    key: "hotels",
    label: "Hotels"
  }];

  // Community board (Spotted, Free Board, Gigs)
  const COMMUNITY = {
    spotted: [{
      id: "s1",
      accent: "pink",
      where: "Dyke March",
      when: "Sat 5pm",
      text: "You: rainbow suspenders and a golden retriever. Me: handing out free water at the corner. You smiled. I short-circuited. Coffee?"
    }, {
      id: "s2",
      accent: "cyan",
      where: "Sasha Colby line",
      when: "Thu",
      text: "Cutie in the mesh top who let me cut the line at Star Theater, I owe you a drink. You said your name and I forgot it immediately."
    }, {
      id: "s3",
      accent: "purple",
      where: "Waterfront Festival",
      when: "Sat",
      text: "We danced near the north stage, then lost each other in the crowd. You had a hand-painted PROTEST sign."
    }],
    freeboard: [{
      id: "f1",
      accent: "lime",
      title: "3 pairs of platform boots",
      size: "Size 9",
      where: "Pearl District",
      text: "Rehoming gently-worn club platforms. Porch pickup, no questions. Take one pair or all three."
    }, {
      id: "f2",
      accent: "amber",
      title: "Glitter stash plus 2 flags",
      size: "Big box",
      where: "NE Portland",
      text: "Mostly-full biodegradable glitter, a Progress flag, and a Trans flag. Free to a good, sparkly home."
    }, {
      id: "f3",
      accent: "cyan",
      title: "Parade cooler plus canopy",
      size: "10x10",
      where: "SE Portland",
      text: "Shade tent and a wheeled cooler. Borrow board: return it and pay it forward."
    }],
    gigs: [{
      id: "g1",
      accent: "pink",
      role: "DJ, Sunday drag brunch",
      pay: "Paid",
      where: "Stag PDX",
      text: "Last-minute fill-in needed, Sun 11am to 3pm. Disco/pop, bring your own controller. Venmo same day."
    }, {
      id: "g2",
      accent: "purple",
      role: "Muralist, Old Town alley",
      pay: "Small budget plus love",
      where: "Ankeny Alley",
      text: "Community wall for Block Party. We supply paint and lift. You supply the vision. Queer artists prioritized."
    }, {
      id: "g3",
      accent: "lime",
      role: "ASL interpreters",
      pay: "Paid",
      where: "Waterfront main stage",
      text: "PrideNW seeking certified interpreters for main and north stage rotations. Flexible shifts across the weekend."
    }]
  };
  window.PDX_DATA = {
    EVENTS,
    DAYS,
    PLACES,
    PLACE_CATEGORIES,
    COMMUNITY
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pride-guide/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Countdown = __ds_scope.Countdown;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.PlaceCard = __ds_scope.PlaceCard;

__ds_ns.PosterCard = __ds_scope.PosterCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatPill = __ds_scope.StatPill;

__ds_ns.StickerBadge = __ds_scope.StickerBadge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.HeroBanner = __ds_scope.HeroBanner;

__ds_ns.Marquee = __ds_scope.Marquee;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.MapLegend = __ds_scope.MapLegend;

__ds_ns.MapPanel = __ds_scope.MapPanel;

})();
