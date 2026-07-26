/* @ds-bundle: {"format":4,"namespace":"PDXPrideGuideDesignSystem_b20420","components":[{"name":"AVATAR_RINGS","sourcePath":"components/brand/Avatar.jsx"},{"name":"Avatar","sourcePath":"components/brand/Avatar.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"AdCard","sourcePath":"components/data-display/AdCard.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"BoardCard","sourcePath":"components/data-display/BoardCard.jsx"},{"name":"Countdown","sourcePath":"components/data-display/Countdown.jsx"},{"name":"EventCard","sourcePath":"components/data-display/EventCard.jsx"},{"name":"FeedItem","sourcePath":"components/data-display/FeedItem.jsx"},{"name":"PlaceCard","sourcePath":"components/data-display/PlaceCard.jsx"},{"name":"PosterCard","sourcePath":"components/data-display/PosterCard.jsx"},{"name":"StatCard","sourcePath":"components/data-display/StatCard.jsx"},{"name":"StatPill","sourcePath":"components/data-display/StatPill.jsx"},{"name":"StickerBadge","sourcePath":"components/data-display/StickerBadge.jsx"},{"name":"ActionRow","sourcePath":"components/forms/ActionRow.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"FilterChip","sourcePath":"components/forms/FilterChip.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"SearchInput","sourcePath":"components/forms/SearchInput.jsx"},{"name":"Divider","sourcePath":"components/layout/Divider.jsx"},{"name":"HeroBanner","sourcePath":"components/layout/HeroBanner.jsx"},{"name":"InfoTile","sourcePath":"components/layout/InfoTile.jsx"},{"name":"Marquee","sourcePath":"components/layout/Marquee.jsx"},{"name":"NavBar","sourcePath":"components/layout/NavBar.jsx"},{"name":"SectionHeader","sourcePath":"components/layout/SectionHeader.jsx"},{"name":"MapLegend","sourcePath":"components/map/MapLegend.jsx"},{"name":"MapPanel","sourcePath":"components/map/MapPanel.jsx"}],"sourceHashes":{"components/brand/Avatar.jsx":"ce004f4c96fc","components/brand/Logo.jsx":"c756c98e8a4e","components/brand/tweaks-panel.jsx":"d259e3a86f73","components/data-display/AdCard.jsx":"490f2abc08d6","components/data-display/Badge.jsx":"ee915dcfab3f","components/data-display/BoardCard.jsx":"53a72ab17ce1","components/data-display/Countdown.jsx":"787324578a45","components/data-display/EventCard.jsx":"2ebc6a4ef236","components/data-display/FeedItem.jsx":"56ea5af4164d","components/data-display/PlaceCard.jsx":"098aa8def963","components/data-display/PosterCard.jsx":"ebfe2b0305af","components/data-display/StatCard.jsx":"63b6a348f247","components/data-display/StatPill.jsx":"174c9d5345b0","components/data-display/StickerBadge.jsx":"0b7f0f9925bc","components/forms/ActionRow.jsx":"63cfe2fd1020","components/forms/Button.jsx":"9526beca36e9","components/forms/FilterChip.jsx":"1e7482e9c840","components/forms/IconButton.jsx":"12d76d316b42","components/forms/SearchInput.jsx":"3b79d835144a","components/layout/Divider.jsx":"50a2f82aee50","components/layout/HeroBanner.jsx":"2b2d5f4e4926","components/layout/InfoTile.jsx":"4304735ab7b0","components/layout/Marquee.jsx":"2fdb9a9fed61","components/layout/NavBar.jsx":"ba130e124d62","components/layout/SectionHeader.jsx":"28d8bb3d132b","components/map/MapLegend.jsx":"6624f2ef6e07","components/map/MapPanel.jsx":"0852478a16e9","ds-index.js":"964a5ab4ca35","ds-page.js":"f4cdb7b04677","guidelines/motion-library.data.js":"bc8044217969","guidelines/tweaks-panel.jsx":"d259e3a86f73","ui_kits/zaylist/AboutScreen.jsx":"074220245ab8","ui_kits/zaylist/AdminScreen.jsx":"f087197dae2a","ui_kits/zaylist/AppShell.jsx":"9730b4dd3e40","ui_kits/zaylist/EventDetailScreen.jsx":"276d89d0eaad","ui_kits/zaylist/EventsScreen.jsx":"cb57e97b2169","ui_kits/zaylist/HomeScreen.jsx":"e9e45969fd9e","ui_kits/zaylist/HubScreen.jsx":"1d74298566ad","ui_kits/zaylist/NudeBeachesScreen.jsx":"dfb8551389ae","ui_kits/zaylist/PlacesScreen.jsx":"5d978e9ef9f4","ui_kits/zaylist/ProfileScreen.jsx":"08dd1fd5d3e5","ui_kits/zaylist/ScheduleScreen.jsx":"9b83b13e09d5","ui_kits/zaylist/data.js":"a732ba0af6a1","ui_kits/zaylist/tweaks-panel.jsx":"6591467622ed"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PDXPrideGuideDesignSystem_b20420 = window.PDXPrideGuideDesignSystem_b20420 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
const AVATAR_RINGS = {
  progress: {
    ring: "conic-gradient(#E40303,#FF8C00,#FFED00,#008026,#24408E,#FFFFFF,#F6A9B8,#55CDFC,#000000,#784F17,#E40303)",
    label: "Progress"
  },
  rainbow: {
    ring: "conic-gradient(#E40303,#FF8C00,#FFED00,#008026,#24408E,#732982,#E40303)",
    label: "Rainbow"
  },
  lesbian: {
    ring: "conic-gradient(#D52D00,#FF9A56,#FFFFFF,#D362A4,#A30262,#D52D00)",
    label: "Lesbian"
  },
  "gay-men": {
    ring: "conic-gradient(#078D70,#26CEAA,#FFFFFF,#98E8C1,#5BCEFA,#078D70)",
    label: "Gay men"
  },
  bisexual: {
    ring: "conic-gradient(#D60270,#D60270,#9B4F96,#0038A8,#0038A8,#D60270)",
    label: "Bisexual"
  },
  transgender: {
    ring: "conic-gradient(#5BCEFA,#F5A9B8,#FFFFFF,#F5A9B8,#5BCEFA,#5BCEFA)",
    label: "Transgender"
  },
  nonbinary: {
    ring: "conic-gradient(#FCF434,#FFFFFF,#9C59D1,#000000,#FCF434)",
    label: "Nonbinary"
  },
  pansexual: {
    ring: "conic-gradient(#FF218C,#FFD800,#21B1FF,#FF218C)",
    label: "Pansexual"
  },
  genderfluid: {
    ring: "conic-gradient(#FF76A4,#FFFFFF,#C011D7,#333333,#2F3CBE,#FF76A4)",
    label: "Genderfluid"
  },
  genderqueer: {
    ring: "conic-gradient(#B57EDC,#FFFFFF,#4A8123,#B57EDC)",
    label: "Genderqueer"
  },
  intersex: {
    ring: "conic-gradient(#FFD800,#FFD800,#79007F,#FFD800)",
    label: "Intersex"
  },
  asexual: {
    ring: "conic-gradient(#000000,#A3A3A3,#FFFFFF,#810081,#000000)",
    label: "Asexual"
  },
  aromantic: {
    ring: "conic-gradient(#3DA542,#FFFFFF,#ABABAB,#5ECF66,#3DA542)",
    label: "Aromantic"
  },
  agender: {
    ring: "conic-gradient(#BABABA,#FFFFFF,#B4F8C8,#FFFFFF,#BABABA)",
    label: "Agender"
  },
  leather: {
    ring: "conic-gradient(#000000,#000000,#FFFFFF,#000000,#0000FF,#000000)",
    label: "Leather"
  },
  bear: {
    ring: "conic-gradient(#623818,#623818,#FEEF9C,#623818,#000000,#623818)",
    label: "Bear"
  },
  chain: {
    ring: "repeating-conic-gradient(from 0deg,#8a919c 0deg 8deg,#c8d0dc 8deg 16deg,#5f6670 16deg 24deg,#dfe5ee 24deg 32deg)",
    label: "Chain",
    lock: true
  },
  none: {
    ring: "none",
    label: "No ring",
    none: true
  }
};
const SIZES = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 84
};
const TINTS = ["#00FFFF", "#FF00CC", "#CCFF00", "#FF6600", "#8800FF", "#39FF14"];
function tintFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Avatar, flag ring member chip. */
function Avatar({
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
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?";
  const bg = tint || (name ? tintFor(name) : "#222");
  const dotSize = Math.max(9, Math.round(px * 0.26));
  const mod = spec.none ? "pdxAvatar--none" : spec.lock ? "pdxAvatar--chain" : "";
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `pdxAvatar ${mod} ${className}`,
    style: {
      "--_size": px + "px",
      "--_ring": spec.ring,
      ...style
    },
    title: title || (name ? `${name} · ${spec.label}` : spec.label)
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__inner"
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__fallback",
    style: {
      background: bg,
      color: bg === "#222" ? "#999" : "#000"
    }
  }, initials)), !spec.none && /*#__PURE__*/React.createElement("span", {
    className: `pdxAvatar__shimmer ${spec.lock ? "pdxAvatar__shimmer--chain" : ""}`,
    "aria-hidden": "true"
  }), spec.lock && /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__lock",
    "aria-hidden": "true"
  }, "\uD83D\uDD12"), status && /*#__PURE__*/React.createElement("span", {
    className: "pdxAvatar__status",
    style: {
      width: dotSize,
      height: dotSize,
      background: statusColor
    }
  }));
}
Object.assign(__ds_scope, { AVATAR_RINGS, Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.pdxLogo{ display:inline-flex; align-items:center; gap:.6em; text-decoration:none; }
.pdxLogo__img{ display:block; width:var(--_sz,56px); height:var(--_sz,56px);
  border-radius:22.6%; flex:none; }
.pdxLogo__full{ display:block; height:var(--_fh,72px); width:auto; flex:none; }
.pdxLogo__wm{ display:flex; flex-direction:column; font-family:var(--font-display); font-weight:900;
  text-transform:uppercase; line-height:.86; letter-spacing:.01em; }
.pdxLogo__wm span{ display:block; }
.pdxLogo--light .pdxLogo__wm{ color:var(--text-hi); }
.pdxLogo--dark .pdxLogo__wm{ color:var(--ink-1000); }
.pdxLogo__rainbow{
  background:var(--grad-rainbow); -webkit-background-clip:text; background-clip:text;
  color:transparent; padding-right:.08em; margin-right:-.08em;
}
.pdxLogo__tm{ font-size:.34em; vertical-align:top; line-height:1; font-weight:700; margin-left:.04em; }
/* full baked lockup (badge + wordmark as one image) */
.pdxLogo--full{ gap:0; }
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
 * Logo, the official lockup: the app face tile + ZAYLIST wordmark
 * (spectrum gradient). Per brand rule the mark
 * always appears with the wordmark unless `variant="icon"`.
 */
function Logo({
  variant = "lockup",
  // full | lockup | stacked | icon | wordmark
  size = 56,
  // icon px (drives wordmark scale in lockup/stacked)
  tone = "light",
  // light (on dark) | dark (on paper)
  tm = true,
  // append the ™ mark to the live-text wordmark
  src = "app-face/icons/zaylist-512.png",
  fullSrc = "assets/logo-lockup.png",
  alt = "Zaylist",
  className = "",
  href,
  ...rest
}) {
  const showIcon = variant !== "wordmark" && variant !== "full";
  const showText = variant !== "icon" && variant !== "full";
  // wordmark font-size ~= 40% of icon size in lockup, larger standalone
  const wmSize = variant === "wordmark" ? size : Math.round(size * 0.42);
  const cls = ["pdxLogo", `pdxLogo--${variant}`, `pdxLogo--${tone}`, className].filter(Boolean).join(" ");

  // `full` renders the baked horizontal lockup (badge + wordmark as one image).
  const inner = variant === "full" ? /*#__PURE__*/React.createElement("img", {
    className: "pdxLogo__full",
    src: fullSrc,
    alt: "",
    style: {
      "--_fh": `${size}px`
    },
    "aria-hidden": "true"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, showIcon && /*#__PURE__*/React.createElement("img", {
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
  }, /*#__PURE__*/React.createElement("span", null, "ZAYLIST", tm && /*#__PURE__*/React.createElement("sup", {
    className: "pdxLogo__tm"
  }, "\u2122"))));
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

// components/brand/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// components/data-display/AdCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* AdCard, affiliate ad built to read as a real event card (tokens/glass.css §2.14).
   variant "grid" = green events-grid slot (logo well, PARTNER/LOCAL tags, SHOP NOW
   glass button, AD dot). variant "feed" = red in-feed slot (glowing AFFILIATE badge,
   close ✕, logo well, red title, mono subcopy + code line). */
const CSS = `
.pdxAd{
  --_c:var(--green);
  position:relative; overflow:hidden; display:flex; flex-direction:column;
  border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
}
.pdxAd__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
  mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); }
.pdxAd__well{ position:relative; height:230px; display:flex; align-items:center; justify-content:center;
  border-radius:13px 13px 0 0; overflow:hidden; border-bottom:4px solid var(--_c);
  background:radial-gradient(130% 130% at 50% 40%, color-mix(in srgb, var(--_c) 32%, #050506), #050506 72%); }
.pdxAd__well img{ max-width:64%; max-height:88px; object-fit:contain; position:relative; z-index:2; }
.pdxAd__logo{ font-family:var(--font-display); font-weight:900; font-size:2rem; letter-spacing:.24em;
  text-transform:uppercase; color:var(--_c); text-shadow:0 0 24px color-mix(in srgb,var(--_c) 60%,transparent); }
.pdxAd__tag{ position:absolute; top:14px; left:14px; z-index:3; padding:5px 12px; border-radius:5px;
  font-family:var(--font-display); font-weight:800; font-size:.64rem; letter-spacing:.08em; text-transform:uppercase; }
.pdxAd__tag--grid{ background:var(--lime); color:#050506; box-shadow:0 0 16px -4px var(--lime); }
.pdxAd__tag--feed{ display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--_c);
  text-shadow:0 0 10px color-mix(in srgb,var(--_c) 80%,transparent); }
.pdxAd__tag--feed .d{ width:7px; height:7px; border-radius:50%; background:var(--_c); box-shadow:0 0 8px var(--_c); }
.pdxAd__close{ position:absolute; top:12px; right:12px; z-index:3; width:30px; height:30px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center; cursor:pointer; color:#c8c4bb;
  background:rgba(6,6,8,.6); border:1px solid #2a2a32; }
.pdxAd__body{ position:relative; z-index:3; padding:14px 16px 16px; display:flex; flex-direction:column; gap:11px; }
.pdxAd__tags{ display:flex; gap:7px; }
.pdxAd__pill{ font-family:var(--font-display); font-weight:700; font-size:.6rem; letter-spacing:.08em;
  text-transform:uppercase; padding:2px 7px 1px; border-radius:2px; }
.pdxAd__pill--solid{ background:#fff; color:#000; }
.pdxAd__pill--out{ border:1px solid #33333c; color:#b7b4bd; }
.pdxAd__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase; font-size:1.6rem;
  line-height:1; color:#fff; }
.pdxAd__title--feed{ color:var(--_c); text-shadow:0 0 20px color-mix(in srgb,var(--_c) 40%,transparent); }
.pdxAd__desc{ margin:0; font-size:.92rem; line-height:1.5; color:#8a8792; }
.pdxAd__sub{ margin:0; font-family:ui-monospace,monospace; font-size:.74rem; line-height:1.6; letter-spacing:.04em;
  text-transform:uppercase; color:#8a8792; }
.pdxAd__note{ font-family:var(--font-display); font-weight:800; font-size:.95rem; letter-spacing:.02em;
  text-transform:uppercase; color:var(--_c); }
.pdxAd__foot{ display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding-top:12px; border-top:1px solid #16161b; }
.pdxAd__ad{ display:inline-flex; align-items:center; gap:8px; font-family:ui-monospace,monospace; font-size:.74rem;
  letter-spacing:.1em; text-transform:uppercase; color:#8a8792; }
.pdxAd__ad .d{ width:8px; height:8px; border-radius:50%; background:var(--pink); box-shadow:0 0 8px var(--pink); }
.pdxAd__code{ padding:14px 16px 16px; display:flex; flex-direction:column; gap:4px; position:relative; z-index:3; }
.pdxAd__codeBig{ font-family:var(--font-display); font-weight:900; font-size:1.4rem; letter-spacing:.02em;
  text-transform:uppercase; color:#fff; }
:root[data-calm="true"] .pdxAd, :root[data-calm="true"] .pdxAd__refract{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-ad-css")) {
  const s = document.createElement("style");
  s.id = "pdx-ad-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** AdCard, affiliate ad that mirrors a real event card. */
function AdCard({
  variant = "grid",
  logo,
  logoText = "Logo",
  title,
  description,
  cta = "Shop now",
  tags = [],
  note,
  subcopy,
  code,
  onClose,
  onClick,
  className = "",
  style = {},
  ...rest
}) {
  const accent = variant === "feed" ? "var(--red)" : "var(--green)";
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxAd ${className}`,
    style: {
      "--_c": accent,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__refract",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__well"
  }, variant === "feed" ? /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__tag pdxAd__tag--feed"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d"
  }), "Affiliate") : /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__tag pdxAd__tag--grid"
  }, "Affiliate"), variant === "feed" && /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__close",
    onClick: onClose,
    role: "button",
    "aria-label": "Dismiss ad"
  }, "\xD7"), logo ? /*#__PURE__*/React.createElement("img", {
    src: logo,
    alt: title || "ad"
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__logo"
  }, logoText)), variant === "feed" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__body",
    style: {
      borderBottom: "1px solid #16161b"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `pdxAd__title pdxAd__title--feed`
  }, title), subcopy && /*#__PURE__*/React.createElement("p", {
    className: "pdxAd__sub"
  }, subcopy)), /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__code"
  }, note && /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__codeBig"
  }, note), code && /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__sub"
  }, code))) : /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__body"
  }, tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__tags"
  }, tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `pdxAd__pill ${i === 0 ? "pdxAd__pill--solid" : "pdxAd__pill--out"}`
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "pdxAd__desc"
  }, description), note && /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__note"
  }, note), /*#__PURE__*/React.createElement("div", {
    className: "pdxAd__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxAd__ad"
  }, /*#__PURE__*/React.createElement("span", {
    className: "d"
  }), "Ad"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "pdx-glass-btn",
    style: {
      "--_c": "var(--green)",
      fontSize: ".82rem",
      padding: "10px 18px"
    },
    onClick: e => {
      e.preventDefault();
      onClick && onClick();
    }
  }, cta, " \u2192"))));
}
Object.assign(__ds_scope, { AdCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/AdCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tags. Deep Glass chrome (tokens/glass.css §1.7): mono uppercase on a tinted
   plate, 7px radius, black-keyed border, 1px inner bevel, soft accent glow.
   ONE solid-fill tag per card. Everything else on that card is tinted, or the
   card reads as competing stickers. */
const CSS = `
.pdxBadge{
  --_c:var(--lime); --c:var(--_c);
  display:inline-flex; align-items:center; gap:7px;
  font-family:var(--font-mono); font-weight:600;
  letter-spacing:.14em; text-transform:uppercase; white-space:nowrap;
  line-height:1; border-radius:var(--chrome-radius-tag); border:1px solid transparent;
}
.pdxBadge--sm{ font-size:.65625rem; padding:6px 11px; }
.pdxBadge--md{ font-size:.75rem; padding:7px 13px; }
.pdxBadge--lg{ font-size:.875rem; padding:9px 15px; }

/* solid fill: the one loud tag per card. Lit acid, black text. */
.pdxBadge--solid{ color:#0a0a0a; background:var(--acid-lit-tag); border-color:#000;
  box-shadow:var(--chrome-bevel), 0 0 18px -9px var(--_c); }
/* outline: the default tinted plate every other tag uses */
.pdxBadge--outline{ color:var(--_c);
  background:color-mix(in srgb, var(--_c) 12%, #08080b);
  border-color:color-mix(in srgb, var(--_c) 38%, #101014);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07), 0 0 18px -9px var(--_c); }
/* paper fill (white-ish, black text) for day + neutral status */
.pdxBadge--paper{ background:var(--paper); color:var(--paper-ink); border-color:#000;
  box-shadow:var(--chrome-bevel), 0 0 16px -10px rgba(255,255,255,.5); }
/* neutral: no accent, no glow */
.pdxBadge--neutral{ color:#b8b5ad; background:#111114; border-color:#26262e; box-shadow:none; }
/* glow (GRAND OPENING) */
.pdxBadge--glow{ box-shadow:var(--chrome-bevel), 0 0 20px -4px var(--_c); }

.pdxBadge__dot{ width:6px; height:6px; border-radius:var(--radius-pill);
  background:var(--_c); box-shadow:0 0 8px var(--_c); }
.pdxBadge--solid .pdxBadge__dot, .pdxBadge--paper .pdxBadge__dot{ background:currentColor; box-shadow:none; }
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
  variant = "outline",
  // outline | solid | paper | neutral
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

// components/data-display/BoardCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* BoardCard, community-board post card on the glass surface (tokens/glass.css §2.4).
   Keyed to a board color (Missed Connections magenta, Gifting lime, Gigs violet),
   with a faint oversized line-motif bled into the top-right and a GIVE/ISO
   direction chip + rail. */
const CSS = `
.pdxBoardCard{
  --_c:var(--pink);
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:9px;
  padding:16px 18px 16px 22px; border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxBoardCard:hover{ transform:translateY(-4px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 60px -26px color-mix(in srgb,var(--_c) 80%,transparent); }
.pdxBoardCard > *{ position:relative; z-index:3; }
.pdxBoardCard__motif{ position:absolute; top:-14px; right:-10px; z-index:1; width:150px; height:150px;
  color:var(--_c); opacity:.10; pointer-events:none; }
.pdxBoardCard__rail{ position:absolute; left:0; top:14px; bottom:14px; width:3px; border-radius:3px; z-index:2; }
.pdxBoardCard__rail--give{ background:var(--_c); box-shadow:0 0 10px -2px var(--_c); }
.pdxBoardCard__rail--iso{ background:repeating-linear-gradient(180deg,var(--_c) 0 5px,transparent 5px 10px); opacity:.85; }
.pdxBoardCard__top{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.pdxBoardCard__board{ font-family:var(--font-display); font-weight:800; font-size:.86rem; letter-spacing:.04em;
  text-transform:uppercase; color:var(--_c); -webkit-text-stroke:1px #000; paint-order:stroke fill; }
.pdxBoardCard__dir{ white-space:nowrap; padding:3px 11px 2px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase; }
.pdxBoardCard__dir--give{ background:var(--_c); color:#050506; }
.pdxBoardCard__dir--iso{ background:color-mix(in srgb,var(--_c) 20%,#050506); border:1px solid var(--_c); color:var(--_c); }
.pdxBoardCard__meta{ font-family:var(--font-body); font-size:.82rem; color:var(--text-lo); }
.pdxBoardCard__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.28rem; line-height:1.02; color:#fff; margin:1px 0 0; }
.pdxBoardCard__text{ font-family:var(--font-body); font-size:.9rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxBoardCard__foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:2px; }
.pdxBoardCard__where{ font-family:var(--font-body); font-size:.8rem; color:var(--text-faint); }
.pdxBoardCard__cta{ font-family:var(--font-display); font-weight:800; font-size:.74rem; letter-spacing:.05em;
  text-transform:uppercase; color:var(--_c); }
:root[data-calm="true"] .pdxBoardCard{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-boardcard-css")) {
  const s = document.createElement("style");
  s.id = "pdx-boardcard-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const BOARD = {
  spotted: {
    c: "var(--board-spotted)",
    label: "Missed Connection",
    give: "Giving",
    iso: "ISO"
  },
  gifting: {
    c: "var(--board-gifting)",
    label: "Gifting",
    give: "Giving",
    iso: "ISO"
  },
  gigs: {
    c: "var(--board-gigs)",
    label: "Gigs",
    give: "Offering",
    iso: "Looking"
  }
};
const S = kids => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    width: "100%",
    height: "100%"
  }
}, kids);
const MOTIF = {
  spotted: S(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M7 7h4v5c0 2-1.5 3.5-4 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 7h4v5c0 2-1.5 3.5-4 4"
  }))),
  giftGive: S(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "9",
    width: "16",
    height: "11",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 13h16M12 9v11M12 9C9 3 4 5 6 8M12 9c3-6 8-4 6-1"
  }))),
  giftIso: S(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "10",
    r: "6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m20 20-5.5-5.5"
  }))),
  gigsGive: S(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7"
  }))),
  gigsIso: S(/*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "14",
    r: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "14",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 14h2M6 8l2 2M18 8l-2 2"
  })))
};

/** BoardCard, community-board post card (Missed Connections / Gifting / Gigs). */
function BoardCard({
  board = "spotted",
  kind,
  title,
  meta,
  where,
  text,
  cta = "Reply",
  href,
  className = "",
  style = {},
  ...rest
}) {
  const b = BOARD[board] || BOARD.spotted;
  const dir = kind === "give" || kind === "iso" ? kind : null;
  const dirLabel = dir === "give" ? b.give : dir === "iso" ? b.iso : null;
  const motifKey = board === "spotted" ? "spotted" : board === "gifting" ? kind === "iso" ? "giftIso" : "giftGive" : kind === "iso" ? "gigsIso" : "gigsGive";
  const Tag = href ? "a" : "div";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxBoardCard ${className}`,
    href: href,
    style: {
      "--_c": b.c,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxBoardCard__motif",
    "aria-hidden": "true"
  }, MOTIF[motifKey]), dir && /*#__PURE__*/React.createElement("span", {
    className: `pdxBoardCard__rail pdxBoardCard__rail--${dir}`,
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxBoardCard__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxBoardCard__board"
  }, b.label), dirLabel && /*#__PURE__*/React.createElement("span", {
    className: `pdxBoardCard__dir pdxBoardCard__dir--${dir}`
  }, dirLabel), meta && /*#__PURE__*/React.createElement("span", {
    className: "pdxBoardCard__meta"
  }, meta)), /*#__PURE__*/React.createElement("h3", {
    className: "pdxBoardCard__title"
  }, title), text && /*#__PURE__*/React.createElement("p", {
    className: "pdxBoardCard__text"
  }, text), /*#__PURE__*/React.createElement("div", {
    className: "pdxBoardCard__foot"
  }, where ? /*#__PURE__*/React.createElement("span", {
    className: "pdxBoardCard__where"
  }, where) : /*#__PURE__*/React.createElement("span", null), cta && /*#__PURE__*/React.createElement("span", {
    className: "pdxBoardCard__cta"
  }, cta, " \u2192")));
}
Object.assign(__ds_scope, { BoardCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/BoardCard.jsx", error: String((e && e.message) || e) }); }

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

/** Countdown, ticking boxes to a target date (events). Lime glow. */
function Countdown({
  target = "2026-07-16T19:00:00",
  size = "md",
  accent = "lime",
  doneLabel = "It's here!",
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
   Deep glass: the shell with --c = the day colour, both sheens, the rainbow
   top seam, the thumb on the poster-well treatment, and the glass button as the
   primary CTA. Flyer thumbnail left, text right, 5px solid LEFT border in the
   day colour. Claim keeps a hard cyan offset, the one deliberate exception.
   Day colours are data; calm mode flattens them. */
const CSS = `
.pdxRow{
  --_day: var(--day-fri); --_c: var(--_day);
  position:relative; display:grid; grid-template-columns:84px 1fr auto; gap:16px; align-items:center;
  padding:12px 16px 12px 14px; overflow:visible;
  border-radius:var(--radius-md); text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014); border-left:5px solid var(--_c);
  box-shadow:
    0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  /* backwards only: both/forwards locks the transform and kills the hover lift.
     No resting bloom pulse either, it caused scroll jank on dense lists. */
  animation:pgDirCardIn .55s var(--ease-out) backwards;
  animation-delay:calc(var(--i, 0) * 40ms);
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxRow > *{ position:relative; z-index:3; }
/* Two sheens: the diagonal gloss on ::after, the specular hot spot as a span. */
.pdxRow::after{ content:""; position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen); }
.pdxRow__sheenSpec{ position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen-specular); }
.pdxRow__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  pointer-events:none; animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
  mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent); }
:root[data-calm="true"] .pdxRow, :root[data-calm="true"] .pdxRow__refract{ animation:none !important; }
.pdxRow:hover, a.pdxRow:hover{ transform:translateY(-2px) !important; text-decoration:none;
  filter:brightness(1.06) saturate(1.08);
  border-color:color-mix(in srgb,var(--_day) 55%,#101014); border-left-color:var(--_day);
  animation-play-state:paused; }

/* Thumb is a mini poster-well: radial accent floor, scanline, 4px day stripe. */
.pdxRow__thumb{ width:84px; height:96px; border-radius:var(--radius-sm); overflow:hidden;
  background:var(--poster-well-bg); position:relative; flex:none; }
.pdxRow__scan{ position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.35;
  background:var(--poster-well-scan); }
/* Absolute so the thumb stays exactly 84 by 96 whatever the floor height. */
.pdxRow__thumbFloor{ position:absolute; left:0; right:0; bottom:0; height:4px;
  background:var(--_c,var(--_day)); z-index:2; pointer-events:none; }
/* Letterbox, never crop: a flyer is the promoter's art and cropping it lies. */
.pdxRow__thumb img{ position:absolute; inset:0; width:100%; height:100%;
  object-fit:contain; object-position:center; z-index:0; }
.pdxRow__thumbPh{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:var(--fw-black); font-size:1.6rem; color:var(--_day); opacity:.8; z-index:0; }

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

/* Primary CTA is the glass button, solid variant. */
.pdxRow__ticket{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.68rem;
  letter-spacing:.08em; text-transform:uppercase; color:#050506;
  background:var(--glass-btn-solid-bg,var(--_c)); border:var(--glass-btn-solid-border,2px solid #000);
  box-shadow:var(--glass-btn-solid-shadow); border-radius:var(--glass-btn-radius,9px);
  padding:5px 10px 4px; text-decoration:none; display:inline-flex; width:fit-content;
  margin-top:2px; cursor:pointer; }
.pdxRow__ticket:hover{ filter:brightness(1.06); text-decoration:none; color:#050506; }
.pdxRow__address{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); }
.pdxRow__venue a{ color:var(--neon-cyan); font-weight:600; text-decoration:none; }
.pdxRow__venue a:hover{ text-decoration:underline; color:#7af0ff; }
/* Claim keeps a hard offset. It is the one deliberate exception, and it is CYAN,
   not the retired magenta: docs/LIVE_DESIGN_STANDARD.md. */
.pdxRow__claim{ font-family:var(--font-display); font-weight:700; font-size:.58rem;
  letter-spacing:.07em; text-transform:uppercase; line-height:1.3; padding:4px 9px 3px;
  color:var(--claim-sticker-fg,#050506); border:0;
  background:var(--claim-sticker-bg,var(--neon-cyan));
  box-shadow:var(--claim-sticker-shadow,3px 3px 0 rgba(0,255,255,.35));
  cursor:pointer; white-space:nowrap; }
.pdxRow__claim:hover{ filter:brightness(1.06); }
.pdxRow__claim--pending{ background:var(--neon-magenta); cursor:default;
  box-shadow:3px 3px 0 rgba(255,0,204,.35); }
.pdxRow__claim--pending:hover{ filter:none; }

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
  DOOR_FEE: "Door fee",
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
  claimable = false,
  claimPending = false,
  onClaimClick,
  saved,
  onSave,
  href,
  venueHref,
  address,
  ticketHref,
  ticketLabel = "Get tickets",
  className = "",
  style = {},
  ...rest
}) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  const stop = ev => {
    ev.preventDefault();
    ev.stopPropagation();
  };
  const showClaim = claimPending || claimable;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxRow pdx-glass-rebind ${className}`,
    href: href,
    style: {
      "--_day": base,
      "--_c": base,
      "--c": base,
      "--dc": base,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__refract",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__sheenSpec",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__thumb"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__scan",
    "aria-hidden": "true"
  }), image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__thumbPh"
  }, (title || "?").charAt(0)), /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__thumbFloor",
    "aria-hidden": "true"
  })), /*#__PURE__*/React.createElement("div", {
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
  }, title), venue && /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__venue"
  }, venueHref ? /*#__PURE__*/React.createElement("a", {
    href: venueHref,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: stop
  }, venue, " \u2197") : /*#__PURE__*/React.createElement("b", null, venue)), address && /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__address"
  }, address), ticketHref && /*#__PURE__*/React.createElement("a", {
    className: "pdxRow__ticket",
    href: ticketHref,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: stop
  }, ticketLabel, " \u2192"), when && /*#__PURE__*/React.createElement("div", {
    className: "pdxRow__when"
  }, when)), /*#__PURE__*/React.createElement("div", {
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
  }), going, " Going"), showClaim && (claimPending ? /*#__PURE__*/React.createElement("span", {
    className: "pdxRow__claim pdxRow__claim--pending"
  }, "Claim pending") : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxRow__claim",
    onClick: ev => {
      stop(ev);
      onClaimClick && onClaimClick();
    }
  }, "Claim this event \u2192"))));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/FeedItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* FeedItem, hub scene-feed row (tokens/glass.css §2.13): NEUTRAL glass card (the
   corner sheen is a background layer so text stays legible), a conic-rainbow avatar
   ring, an outlined status badge in the status color, body copy, an optional
   attachment chip, and an optional full rainbow top bar for "Looking" posts. */
const CSS = `
.pdxFeed{
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:10px;
  padding:16px 18px; border-radius:14px; color:inherit;
  background:
    linear-gradient(133deg, rgba(255,255,255,.05), rgba(255,255,255,.012) 16%, transparent 40%),
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #050508 100%);
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -12px rgba(255,255,255,.15), inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
}
.pdxFeed__rainbow{ position:absolute; top:0; left:0; right:0; height:3px; z-index:4;
  background:var(--glass-refract); background-size:200% 100%; animation:pdxRefract 7s linear infinite; }
.pdxFeed__head{ display:flex; align-items:center; gap:12px; }
.pdxFeed__avatar{ flex:none; width:44px; height:44px; border-radius:50%; padding:2px;
  background:conic-gradient(from 210deg,#FF00CC,#FF6600,#CCFF00,#39FF14,#00FFFF,#8800FF,#FF00CC); display:inline-flex; }
.pdxFeed__avatar > *{ width:100%; height:100%; border-radius:50%; border:2px solid #050506; object-fit:cover; }
.pdxFeed__avatarFallback{ display:inline-flex; align-items:center; justify-content:center; background:#0a0a0f;
  font-family:var(--font-display); font-weight:900; font-size:1rem; color:#fff; }
.pdxFeed__id{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.pdxFeed__name{ font-family:var(--font-display); font-weight:800; text-transform:uppercase; letter-spacing:.02em;
  font-size:.98rem; color:#fff; }
.pdxFeed__action{ font-family:ui-monospace,monospace; font-size:.72rem; letter-spacing:.04em; color:var(--text-faint); }
.pdxFeed__badge{ flex:none; align-self:flex-start; padding:3px 10px 2px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.62rem; letter-spacing:.05em; text-transform:uppercase;
  background:color-mix(in srgb,var(--_s,var(--cyan)) 16%,transparent); border:1px solid var(--_s,var(--cyan)); color:var(--_s,var(--cyan)); }
.pdxFeed__body{ font-family:var(--font-body); font-size:.92rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxFeed__att{ display:flex; align-items:center; gap:9px; padding:10px 12px; border-radius:10px;
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); }
.pdxFeed__att .dot{ width:9px; height:9px; border-radius:50%; flex:none; background:var(--_a,var(--cyan)); box-shadow:0 0 8px var(--_a,var(--cyan)); }
.pdxFeed__attMain{ display:flex; flex-direction:column; gap:1px; min-width:0; }
.pdxFeed__attTitle{ font-family:var(--font-display); font-weight:800; font-size:.88rem; text-transform:uppercase; color:#fff; }
.pdxFeed__attSub{ font-family:ui-monospace,monospace; font-size:.68rem; letter-spacing:.04em; color:var(--text-faint); }
:root[data-calm="true"] .pdxFeed, :root[data-calm="true"] .pdxFeed__rainbow{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-feed-css")) {
  const s = document.createElement("style");
  s.id = "pdx-feed-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const STATUS = {
  rsvp: "var(--green)",
  submitted: "var(--cyan)",
  looking: "var(--purple)",
  checkin: "var(--green)",
  event: "var(--cyan)",
  host: "var(--cyan)"
};

/** FeedItem, hub scene-feed row on the neutral glass surface. */
function FeedItem({
  name,
  action,
  avatar,
  initial,
  status,
  statusLabel,
  rainbowTop = false,
  children,
  attachment,
  className = "",
  style = {},
  ...rest
}) {
  const sColor = STATUS[status] || "var(--cyan)";
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxFeed ${className}`,
    style: style
  }, rest), rainbowTop && /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__rainbow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxFeed__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__avatar"
  }, avatar ? /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__avatarFallback"
  }, initial || (name || "?").charAt(0))), /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__id"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__name"
  }, name), action && /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__action"
  }, action)), statusLabel && /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__badge",
    style: {
      "--_s": sColor
    }
  }, statusLabel)), children && /*#__PURE__*/React.createElement("p", {
    className: "pdxFeed__body"
  }, children), attachment && /*#__PURE__*/React.createElement("div", {
    className: "pdxFeed__att",
    style: {
      "--_a": attachment.color || sColor
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__attMain"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__attTitle"
  }, attachment.title), attachment.sub && /*#__PURE__*/React.createElement("span", {
    className: "pdxFeed__attSub"
  }, attachment.sub))));
}
Object.assign(__ds_scope, { FeedItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/FeedItem.jsx", error: String((e && e.message) || e) }); }

// components/data-display/PlaceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* PlaceCard = the venue/place directory card. Neon border in the category
   color, category badge, optional GRAND OPENING flag, address / hours / phone
   with icons, description, website + instagram links, and an optional
   "Upcoming Events" sublist. */
const CSS = `
.pdxPlace{
  position:relative; display:flex; flex-direction:column; gap:12px;
  padding:var(--pad-card); overflow:visible;
  --_c:var(--pink); border-radius:var(--radius-md);
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:
    0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
}
.pdxPlace > *{ position:relative; z-index:3; }
.pdxPlace__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  pointer-events:none; animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
  mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent); }
:root[data-calm="true"] .pdxPlace, :root[data-calm="true"] .pdxPlace__refract{ animation:none !important; }
.pdxPlace__opening{ align-self:flex-start; margin-bottom:2px; }
.pdxPlace__cat{ align-self:flex-start; }
/* Logo well: a soft category orb under a neon mark. NOT a boxed poster floor.
   Ported verbatim from client/src/components/ds/PlaceCard.tsx. The screen blend
   plus the contrast pass is what makes the mark read as neon: the directory
   logo PNGs are authored to knock out on black, so containing them in a tinted
   box would render light-background marks as white plates. */
.pdxPlace__media{
  position:relative; height:148px; border-radius:0; overflow:visible;
  box-sizing:border-box;
  background:transparent;
  border:none;
  display:flex; align-items:center; justify-content:center;
  padding:14px 12px 8px; margin-bottom:0; }
.pdxPlace__mediaGlow{
  position:absolute; left:50%; top:52%; width:86%; height:92%;
  transform:translate(-50%,-50%); border-radius:50%;
  background:radial-gradient(ellipse closest-side,
    color-mix(in srgb, var(--_c) 38%, transparent),
    color-mix(in srgb, var(--_c) 12%, transparent) 48%,
    transparent 72%);
  filter:blur(24px); z-index:2; pointer-events:none; }
.pdxPlace__mediaScan{
  position:absolute; inset:0; pointer-events:none; opacity:.1; z-index:1;
  background:repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.16) 3px 4px); }
.pdxPlace__logo{
  position:relative; z-index:3;
  max-width:100%; max-height:108px; width:auto; height:auto;
  object-fit:contain; object-position:center;
  mix-blend-mode:screen;
  filter:contrast(1.35) brightness(1.08) drop-shadow(0 0 16px color-mix(in srgb, var(--_c) 55%, transparent)); }
/* The per-category fallback is flat art, so it keeps normal blend. */
.pdxPlace__logo--fallback{
  max-width:58%; max-height:96px; mix-blend-mode:normal;
  filter:drop-shadow(0 0 14px color-mix(in srgb, var(--_c) 55%, transparent)); }
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
  logoUrl,
  fallbackLogoUrl,
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
  /* A logo that 404s must fall through to the category fallback, not leave a hole. */
  const [logoFailed, setLogoFailed] = React.useState(false);
  const showLogo = logoUrl && !logoFailed;
  const showFallback = !showLogo && fallbackLogoUrl;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxPlace ${className}`,
    style: {
      "--_c": accent
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxPlace__refract",
    "aria-hidden": "true"
  }), grandOpening && /*#__PURE__*/React.createElement("span", {
    className: "pdxPlace__opening"
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    color: "yellow",
    glow: true,
    size: "sm"
  }, "Grand Opening")), (logoUrl || fallbackLogoUrl) && /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__media"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__mediaGlow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxPlace__mediaScan",
    "aria-hidden": "true"
  }), showLogo && /*#__PURE__*/React.createElement("img", {
    className: "pdxPlace__logo",
    src: logoUrl,
    alt: `${name} logo`,
    loading: "lazy",
    onError: () => setLogoFailed(true)
  }), showFallback && /*#__PURE__*/React.createElement("img", {
    className: "pdxPlace__logo pdxPlace__logo--fallback",
    src: fallbackLogoUrl,
    alt: categoryLabel || category,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("span", {
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
  }), "Upcoming Events"), events.map((ev, i) => /*#__PURE__*/React.createElement("div", {
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
  --_day: var(--day-fri); --_c: var(--_day);
  position:relative; display:flex; flex-direction:column; overflow:hidden;
  text-decoration:none; color:inherit; cursor:pointer;
  border-radius:var(--radius-md);
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:
    0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out),
             border-color var(--dur-base) var(--ease-out);
}
a.pdxBoard:hover{ transform:translateY(-6px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 60px -26px color-mix(in srgb,var(--_c) 80%,transparent); }
.pdxBoard__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  pointer-events:none; animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
  mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent); }
:root[data-calm="true"] .pdxBoard, :root[data-calm="true"] .pdxBoard__refract{ animation:none !important; }

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
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxBoard__refract",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
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
  position:relative; display:flex; flex-direction:column; gap:10px;
  padding:18px 18px 16px; min-height:150px; overflow:visible;
  --_c:var(--lime); border-radius:var(--radius-md);
  text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:
    0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxStatCard > *{ position:relative; z-index:3; }
.pdxStatCard__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  pointer-events:none; animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
  mask:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent); }
:root[data-calm="true"] .pdxStatCard, :root[data-calm="true"] .pdxStatCard__refract{ animation:none !important; }
a.pdxStatCard:hover{ transform:translateY(var(--hover-lift));
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 60px -26px color-mix(in srgb,var(--_c) 80%,transparent); text-decoration:none; }
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
    className: "pdxStatCard__refract",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
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
 * on a hard-shadow neon chip. "KEEP PORTLAND WEIRD", "MADE BY THE SCENE".
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

// components/forms/ActionRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ActionRow, promoter-intake row (tokens/glass.css §2.10): glass surface keyed to
   an accent, with a big number, title + lead/rest copy, an outlined status badge,
   and a trailing arrow. Stack a few (Submit=lime, Claim=cyan, Spotted=magenta). */
const CSS = `
.pdxActionRow{
  --_c:var(--lime);
  position:relative; overflow:hidden; display:flex; align-items:center; gap:18px;
  padding:20px 22px; border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 14%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 60%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxActionRow:hover{ transform:translateY(-3px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 48px -22px color-mix(in srgb,var(--_c) 75%,transparent); }
.pdxActionRow > *{ position:relative; z-index:3; }
.pdxActionRow__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
  mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); }
.pdxActionRow__num{ flex:none; font-family:var(--font-display); font-weight:900; font-size:2.4rem;
  line-height:.8; color:var(--_c); text-shadow:0 0 20px color-mix(in srgb,var(--_c) 45%,transparent); font-variant-numeric:tabular-nums; }
.pdxActionRow__main{ flex:1; min-width:0; display:flex; flex-direction:column; gap:7px; }
.pdxActionRow__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.35rem; line-height:1; color:#fff; }
.pdxActionRow__copy{ font-family:var(--font-body); font-size:.92rem; line-height:1.45; color:var(--text-mid); }
.pdxActionRow__copy b{ color:#fff; font-weight:700; }
.pdxActionRow__badge{ align-self:flex-start; padding:4px 11px 3px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.64rem; letter-spacing:.05em; text-transform:uppercase;
  background:color-mix(in srgb,var(--_c) 16%,transparent); border:1px solid var(--_c); color:var(--_c); }
.pdxActionRow__arrow{ flex:none; color:var(--text-lo); }
:root[data-calm="true"] .pdxActionRow, :root[data-calm="true"] .pdxActionRow__refract{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-actionrow-css")) {
  const s = document.createElement("style");
  s.id = "pdx-actionrow-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  cyan: "var(--cyan)",
  pink: "var(--pink)",
  magenta: "var(--pink)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  blue: "var(--blue)"
};

/** ActionRow, numbered promoter-intake action on the glass surface. */
function ActionRow({
  number,
  title,
  lead,
  rest: restCopy,
  badge,
  color = "lime",
  href,
  onClick,
  className = "",
  style = {},
  ...rest
}) {
  const Tag = href ? "a" : onClick ? "button" : "div";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxActionRow ${className}`,
    href: href,
    onClick: onClick,
    style: {
      "--_c": COLORS[color] || color,
      textAlign: "left",
      border: "none",
      cursor: href || onClick ? "pointer" : "default",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__refract",
    "aria-hidden": "true"
  }), number != null && /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__num"
  }, number), /*#__PURE__*/React.createElement("div", {
    className: "pdxActionRow__main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__title"
  }, title), (lead || restCopy) && /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__copy"
  }, lead && /*#__PURE__*/React.createElement("b", null, lead), " ", restCopy), badge && /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__badge"
  }, badge)), /*#__PURE__*/React.createElement("span", {
    className: "pdxActionRow__arrow",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  }))));
}
Object.assign(__ds_scope, { ActionRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/ActionRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Button, canonical CTA. Deep Glass chrome (tokens/glass.css §1.7): black keyline,
   1px top bevel, floor shade, accent bloom. Hover lifts 1px and blooms wider,
   press sinks 1px with the bloom cut. The brutalist magenta offset survives only
   on the deliberate --sticker variant (collage flair, not chrome). */
const CSS = `
.pdxBtn{
  --_c: var(--neon-yellow); --c: var(--_c);
  display:inline-flex; align-items:center; justify-content:center; gap:.5em;
  font-family:var(--font-display); font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; line-height:1;
  border:0; border-radius:var(--chrome-radius-md); cursor:pointer; white-space:nowrap; text-decoration:none;
  color:#fff; background:var(--chrome-ink-fill);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 18%, transparent), var(--chrome-bevel-dark),
    inset 0 -10px 16px -12px rgba(0,0,0,.7), 0 10px 24px -16px color-mix(in srgb, var(--_c) 50%, transparent);
  transition:transform var(--dur-fast) var(--ease-out),
             filter var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out);
}
.pdxBtn:hover:not(:disabled){ text-decoration:none; transform:translateY(-1px); filter:brightness(1.12);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 34%, transparent), inset 0 1px 0 rgba(255,255,255,.16),
    0 14px 30px -16px color-mix(in srgb, var(--_c) 70%, transparent); }
.pdxBtn:active:not(:disabled){ transform:translateY(1px); transition-duration:60ms;
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 20%, transparent), inset 0 2px 6px rgba(0,0,0,.7); }
.pdxBtn:focus-visible{ outline:none;
  box-shadow:var(--chrome-keyline), var(--chrome-focus), var(--chrome-bevel-dark); }
.pdxBtn:disabled{ cursor:not-allowed; transform:none; filter:none;
  color:#5f5f68; background:#111114;
  box-shadow:var(--chrome-keyline), inset 0 1px 0 rgba(255,255,255,.05); }

/* sizes */
.pdxBtn--sm{ padding:9px 16px; font-size:.8125rem; letter-spacing:.10em; border-radius:var(--chrome-radius-sm); }
.pdxBtn--md{ padding:14px 26px; font-size:1.0625rem; }
.pdxBtn--lg{ padding:17px 34px; font-size:1.25rem; letter-spacing:.08em; border-radius:var(--chrome-radius-lg); }
.pdxBtn--block{ width:100%; }

/* SOLID, the primary. Lit acid fill, black text, bloom on the floor. */
.pdxBtn--solid{ color:#07070a; background:var(--acid-lit);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), var(--chrome-bloom), var(--chrome-drop); }
.pdxBtn--solid:hover:not(:disabled){ filter:brightness(1.05); background:var(--acid-lit-hover);
  box-shadow:var(--chrome-keyline), inset 0 1px 0 rgba(255,255,255,.85), var(--chrome-bloom-hover), var(--chrome-drop); }
.pdxBtn--solid:active:not(:disabled){ background:var(--acid-lit-press);
  box-shadow:var(--chrome-keyline), var(--chrome-press); }
.pdxBtn--solid:focus-visible{ box-shadow:var(--chrome-keyline), var(--chrome-focus), var(--chrome-bevel); }
.pdxBtn--lg.pdxBtn--solid{ box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), var(--chrome-bloom-lg), var(--chrome-drop); }
.pdxBtn--sm.pdxBtn--solid{ box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom-sm), 0 2px 4px rgba(0,0,0,.6); }

/* NEON, the default secondary. Inherits the base glass chassis. */
.pdxBtn--neon{ color:#fff; }

/* OUTLINE, quiet tertiary that still keys to the accent */
.pdxBtn--outline{ font-weight:700; color:var(--_c); background:rgba(255,255,255,.025);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--_c) 26%, transparent), inset 0 1px 0 rgba(255,255,255,.06); }
.pdxBtn--outline:hover:not(:disabled){ transform:none; filter:none; background:color-mix(in srgb, var(--_c) 8%, transparent);
  box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--_c) 50%, transparent), inset 0 1px 0 rgba(255,255,255,.06); }

/* STICKER, the collage CTA (e.g. "Claim this event"). Flair, not chrome.
   The flat magenta offset is retired: it is now a lit plate on a black
   keyline with its own accent blooming on the floor. Keeps the tilt. */
.pdxBtn--sticker{ --c:var(--_c); color:var(--_c); border:2px solid var(--_c); background:rgba(0,0,0,.62);
  border-radius:var(--chrome-radius-tag); box-shadow:var(--sticker-lit); }
.pdxBtn--sticker:hover:not(:disabled){ background:var(--_c); color:#000; transform:translateY(-2px);
  box-shadow:var(--sticker-lit-hover); filter:none; }
.pdxBtn--sticker:active:not(:disabled){ transform:translateY(1px); box-shadow:var(--sticker-lit-press); }

/* GRADIENT, rainbow / hot fills for special moments (enhancement) */
.pdxBtn--gradient{ color:#000; background:var(--grad-hot); background-size:160% 160%;
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-floor), 0 12px 28px -14px rgba(0,255,255,.55), var(--chrome-drop); }
.pdxBtn--gradient:hover:not(:disabled){ background-position:100% 50%; color:#000; }

/* PILL, soft filled, for system dialogs (error boundary, confirms) */
.pdxBtn--pill{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; border-radius:6px; background:var(--_c); color:#000; box-shadow:none; }
.pdxBtn--pill:hover:not(:disabled){ filter:brightness(1.06); transform:none; box-shadow:none; }
.pdxBtn--pill:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

/* GHOST, tertiary */
.pdxBtn--ghost{ font-family:var(--font-body); font-weight:var(--fw-semibold); text-transform:none;
  letter-spacing:0; color:var(--text-lo); background:none; border-radius:999px;
  padding-block:8px; box-shadow:none; }
.pdxBtn--ghost:hover:not(:disabled){ color:#fff; background:rgba(255,255,255,.05); transform:none; filter:none; box-shadow:none; }
.pdxBtn--ghost:active:not(:disabled){ transform:scale(.98); box-shadow:none; }

.pdxBtn__dot{ width:.5em; height:.5em; border-radius:999px; background:currentColor;
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
.pdxBtn__arrow{ font-weight:800; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-btn-css")) {
  const s = document.createElement("style");
  s.id = "pdx-btn-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* accent -> color. The bloom is derived from the accent itself now,
   so there is no second complementary-shadow hue to carry. */
const ACCENTS = {
  lime: {
    c: "var(--neon-yellow)"
  },
  yellow: {
    c: "var(--neon-yellow)"
  },
  cyan: {
    c: "var(--neon-cyan)"
  },
  pink: {
    c: "var(--neon-magenta)"
  },
  magenta: {
    c: "var(--neon-magenta)"
  },
  orange: {
    c: "var(--neon-orange)"
  },
  purple: {
    c: "var(--neon-violet)"
  }
};

/**
 * Button, the canonical neon CTA with the brutalist offset shadow.
 */
function Button({
  children,
  variant = "neon",
  // neon | solid | outline | gradient | pill | ghost | sticker
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
/* IconButton, square glass plate holding a single glyph. Deep Glass chrome
   (tokens/glass.css §1.7): ink radial fill, keyline ring, 1px top bevel. */
const CSS = `
.pdxIconBtn{
  --_c:var(--neon-cyan); --c:var(--_c);
  display:inline-flex; align-items:center; justify-content:center;
  border:1px solid #000; color:#c8c4bb; cursor:pointer; flex:none;
  border-radius:var(--chrome-radius-md);
  background:radial-gradient(130% 110% at 50% 0%, rgba(255,255,255,.06), #0b0b0f 62%, #08080b);
  box-shadow:0 0 0 1px #1c1c22, inset 0 1px 0 rgba(255,255,255,.1);
  transition:color var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out),
             background var(--dur-base) var(--ease-out);
}
.pdxIconBtn:hover:not(:disabled){ color:#fff; box-shadow:0 0 0 1px #2e2e38, inset 0 1px 0 rgba(255,255,255,.14); }
.pdxIconBtn:active:not(:disabled){ box-shadow:0 0 0 1px #1c1c22, var(--chrome-press); }
.pdxIconBtn:focus-visible{ outline:none; box-shadow:var(--chrome-keyline), var(--chrome-focus), inset 0 1px 0 rgba(255,255,255,.1); }
.pdxIconBtn:disabled{ opacity:.4; cursor:not-allowed; }
.pdxIconBtn svg{ width:1.06em; height:1.06em; stroke:currentColor; stroke-width:2.2;
  stroke-linecap:round; stroke-linejoin:round; fill:none; }

.pdxIconBtn--sm{ width:34px; height:34px; font-size:14px; border-radius:var(--chrome-radius-sm); }
.pdxIconBtn--md{ width:42px; height:42px; font-size:16px; }
.pdxIconBtn--lg{ width:52px; height:52px; font-size:19px; border-radius:var(--chrome-radius-lg); }

.pdxIconBtn--outline:hover:not(:disabled){ color:var(--_c);
  box-shadow:0 0 0 1px color-mix(in srgb, var(--_c) 40%, transparent), inset 0 1px 0 rgba(255,255,255,.14); }
/* SOLID, lit acid plate with the bloom on the floor */
.pdxIconBtn--solid{ color:#07070a; border:1px solid #000; background:var(--acid-lit);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom-sm); }
.pdxIconBtn--solid:hover:not(:disabled){ color:#07070a; filter:brightness(1.05); background:var(--acid-lit-hover);
  box-shadow:var(--chrome-keyline), var(--chrome-bevel), var(--chrome-bloom); }
.pdxIconBtn--ghost{ border-color:transparent; background:none; box-shadow:none; }
.pdxIconBtn--ghost:hover:not(:disabled){ background:rgba(255,255,255,.05); box-shadow:none; }
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
.pdxDivider--rainbow .pdxDivider__line{ position:relative; overflow:hidden;
  background:linear-gradient(90deg,var(--neon-cyan),var(--neon-yellow),var(--neon-magenta),var(--neon-orange),var(--neon-cyan));
  background-size:200% 100%;
  animation:pdxSeamFlow 3.4s linear infinite, pdxSeamGlow 3.4s var(--ease-inout) infinite; }
.pdxDivider--rainbow .pdxDivider__line::after{ content:""; position:absolute; top:-1px; bottom:-1px; left:0; width:24%;
  transform:translateX(-165%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen; pointer-events:none; animation:pdxSeamGlint 3.4s var(--ease-inout) infinite; }
.pdxDivider--glow .pdxDivider__line{ background:var(--_c,var(--lime));
  box-shadow:0 0 14px -2px var(--_c,var(--lime)); }
.pdxDivider--faint .pdxDivider__line{ height:1px; background:var(--border-default); }

/* full-bleed seam (no label), sits flush under sticky headers. Animated flag sweep. */
.pdxSeam{ position:relative; height:3px; width:100%; border:0; margin:0; overflow:hidden;
  background:linear-gradient(90deg,var(--neon-cyan),var(--neon-yellow),var(--neon-magenta),var(--neon-orange),var(--neon-cyan));
  background-size:200% 100%;
  animation:pdxSeamFlow 3.4s linear infinite, pdxSeamGlow 3.4s var(--ease-inout) infinite; }
.pdxSeam::after{ content:""; position:absolute; top:-1px; bottom:-1px; left:0; width:24%;
  transform:translateX(-165%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.95),transparent);
  mix-blend-mode:screen; pointer-events:none; animation:pdxSeamGlint 3.4s var(--ease-inout) infinite; }
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

// components/layout/InfoTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* InfoTile, infrastructure-grid tile (tokens/glass.css §2.11): glass surface with
   a 4px left accent border, no title glow. Title in the accent, body copy, optional
   arrow. Use in a 2-up / responsive grid to route to sections. */
const CSS = `
.pdxInfoTile{
  --_c:var(--purple);
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:9px;
  padding:20px 22px; border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 14%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 40%, #101014); border-left:4px solid var(--_c);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 22px -10px color-mix(in srgb, var(--_c) 55%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 40%, rgba(255,255,255,.1));
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxInfoTile:hover{ transform:translateY(-3px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 40px -18px color-mix(in srgb,var(--_c) 70%,transparent); }
.pdxInfoTile > *{ position:relative; z-index:3; }
.pdxInfoTile__name{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.4rem; line-height:1; color:var(--_c); }
.pdxInfoTile__desc{ font-family:var(--font-body); font-size:.92rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxInfoTile__arrow{ margin-top:auto; font-family:var(--font-display); font-weight:800; font-size:.74rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--_c); display:inline-flex; align-items:center; gap:6px; }
:root[data-calm="true"] .pdxInfoTile{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-infotile-css")) {
  const s = document.createElement("style");
  s.id = "pdx-infotile-css";
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
  blue: "var(--blue)",
  violet: "var(--neon-violet)"
};

/** InfoTile, infrastructure-grid tile with a left accent border. */
function InfoTile({
  title,
  description,
  action,
  color = "purple",
  href,
  className = "",
  style = {},
  ...rest
}) {
  const Tag = href ? "a" : "div";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `pdxInfoTile ${className}`,
    href: href,
    style: {
      "--_c": COLORS[color] || color,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "pdxInfoTile__name"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "pdxInfoTile__desc"
  }, description), action && /*#__PURE__*/React.createElement("span", {
    className: "pdxInfoTile__arrow"
  }, action, " ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2192")));
}
Object.assign(__ds_scope, { InfoTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/InfoTile.jsx", error: String((e && e.message) || e) }); }

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
  items = ["Events", "July 16–19", "Keep Portland Weird", "Take Care of Each Other"],
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

// components/layout/NavBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* NavBar, the mobile bottom navigation bar (tokens/glass.css §2.8). Deep-glass
   surface with a glowing-cyan pull handle on top; the active tab lights in its
   neon accent with a tinted fill + glow. Feed it `items` of { key, label, icon,
   accent } and the active key. */
const CSS = `
.pdxNav{
  position:relative; display:flex; align-items:stretch; gap:6px; padding:14px 12px 12px;
  border-radius:18px 18px 0 0; background:radial-gradient(120% 120% at 50% 0%, #0d0d12 0%, #050506 70%);
  border:1px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 0 34px -10px rgba(0,0,0,.95), inset 0 2px 3px rgba(0,0,0,.6),
    0 0 24px -14px var(--cyan);
}
.pdxNav__handle{ position:absolute; top:6px; left:50%; transform:translateX(-50%); width:46px; height:4px;
  border-radius:99px; background:var(--cyan); box-shadow:0 0 12px 1px var(--cyan);
  animation:pdxPullHandle 2.2s var(--ease-inout) infinite; }
.pdxNav__tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 6px 8px;
  border:1px solid transparent; border-radius:12px; background:transparent; cursor:pointer; text-decoration:none;
  font-family:var(--font-display); font-weight:700; font-size:.64rem; letter-spacing:.05em; text-transform:uppercase;
  color:#777; transition:color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
.pdxNav__tab svg{ width:22px; height:22px; }
.pdxNav__tab--active{ color:var(--_c); transform:scale(1.04);
  background:color-mix(in srgb,var(--_c) 16%,#0a0a0a); border:1px solid var(--_c);
  box-shadow:0 0 14px -2px var(--_c), inset 0 0 12px -6px var(--_c); }
:root[data-calm="true"] .pdxNav__handle{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-nav-css")) {
  const s = document.createElement("style");
  s.id = "pdx-nav-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}
const COLORS = {
  lime: "var(--lime)",
  cyan: "var(--cyan)",
  pink: "var(--pink)",
  green: "var(--green)",
  orange: "var(--orange)",
  purple: "var(--purple)",
  blue: "var(--blue)",
  magenta: "var(--pink)"
};

/** NavBar, the deep-glass mobile bottom nav with a glowing pull handle. */
function NavBar({
  items = [],
  active,
  onSelect,
  handle = true,
  className = "",
  style = {},
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: `pdxNav ${className}`,
    style: style
  }, rest), handle && /*#__PURE__*/React.createElement("span", {
    className: "pdxNav__handle",
    "aria-hidden": "true"
  }), items.map(it => {
    const on = it.key === active;
    const c = COLORS[it.accent] || it.accent || "var(--cyan)";
    return /*#__PURE__*/React.createElement("a", {
      key: it.key,
      href: it.href || "#",
      className: `pdxNav__tab ${on ? "pdxNav__tab--active" : ""}`,
      style: {
        "--_c": c
      },
      "aria-current": on ? "page" : undefined,
      onClick: e => {
        if (onSelect) {
          e.preventDefault();
          onSelect(it.key);
        }
      }
    }, it.icon, it.label);
  }));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/NavBar.jsx", error: String((e && e.message) || e) }); }

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
/* MapLegend = the map key. Ported from live `.map-legend` chrome in
   client/src/components/ds/mapTheme.ts (LIVE_MAP_CHROME_CSS) and index.css:
   an OLED glass well, and swatches that are the pin shape itself (black core +
   3px day ring), never glowing dots. Sits bottom-left over the map by default;
   the home strip uses the horizontal variant. */
const CSS = `
.pdxLegend{
  color:#c8c5bc; padding:14px 16px; border-radius:16px;
  display:flex; flex-direction:column; gap:8px;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.05), transparent 55%),
    radial-gradient(90% 80% at 50% 100%, rgba(0,0,0,.55), transparent 60%),
    #08080c;
  border:1px solid rgba(255,255,255,.07);
  box-shadow:
    0 0 0 1px #000,
    0 18px 40px -16px rgba(0,0,0,.92),
    inset 0 1px 0 rgba(255,255,255,.07),
    inset 0 -10px 28px -14px rgba(0,0,0,.75);
}
.pdxLegend__row{ display:flex; align-items:center; gap:8px;
  font-family:var(--font-display); font-weight:700; font-size:.65rem;
  letter-spacing:.08em; text-transform:uppercase; color:#c8c5bc; }
/* Swatch keeps the pin shape: black core, 3px ring, inward shadow only. */
.pdxLegend__sw{ width:12px; height:12px; border-radius:999px; flex:none; box-sizing:border-box;
  background:#000; border:3px solid var(--_c,var(--day-sat));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85); }
.pdxLegend__sw--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF)); }
.pdxLegend__row--multi{ margin-top:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,.08); }
/* Home strip: one horizontal row */
.pdxLegend--home{ flex-direction:row; align-items:center; gap:14px; padding:10px 14px; }
.pdxLegend--home .pdxLegend__row--multi{ margin-top:0; padding-top:0; border-top:0; padding-left:12px; border-left:1px solid rgba(255,255,255,.08); }
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
  home = false,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `pdxLegend ${home ? "pdxLegend--home" : ""} ${className}`,
    "aria-label": "Map key"
  }, rest), days.map(d => /*#__PURE__*/React.createElement("div", {
    className: "pdxLegend__row",
    key: d.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxLegend__sw",
    style: {
      "--_c": d.c
    }
  }), d.label)), multi && /*#__PURE__*/React.createElement("div", {
    className: "pdxLegend__row pdxLegend__row--multi"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdxLegend__sw pdxLegend__sw--multi"
  }), "Multi-day"));
}
Object.assign(__ds_scope, { MapLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapLegend.jsx", error: String((e && e.message) || e) }); }

// components/map/MapPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MapPanel = the map surface used by Events, the home strip, Directory and the
   beaches. Values ported from client/src/components/ds/mapTheme.ts:
   MAP_SURFACE_BG, MAP_PIN_SIZE, mapFrameShadow, mapGridBackground,
   mapVignetteBackground/Inset, mapLightShaftBackground, mapPinStyle,
   mapPinMultiStyle, mapChipStyle, LIVE_MAP_CHROME_CSS.

   Frame rule from docs/LIVE_DESIGN_STANDARD.md: thin black outline plus
   inward-only deboss. No outer neon or neutral bloom on any map surface, and
   no bloom on any pin. In production the plate is Leaflet + CARTO dark tiles;
   the grid background stands in when tiles are offline. */
const CSS = `
.pdxMap{
  position:relative; overflow:hidden; width:100%; border-radius:16px;
  background:
    repeating-linear-gradient(0deg, transparent 0 38px, rgba(255,255,255,.022) 38px 39px),
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,.022) 46px 47px),
    radial-gradient(120% 90% at 60% 40%, #101018 0%, #06060A 70%);
  border:1px solid #000;
  box-shadow:
    0 0 0 1px #000,
    inset 0 0 0 1px rgba(0,0,0,.85),
    inset 0 2px 3px rgba(0,0,0,.9),
    inset 0 0 28px -8px rgba(0,0,0,.95),
    inset 0 0 52px 10px rgba(0,0,0,.42),
    inset 0 4px 10px -2px rgba(0,0,0,.75),
    inset 0 -1px 0 rgba(255,255,255,.045);
}
/* Hole-rim vignette over the tiles. z400, pointer-events none. */
.pdxMap__vignette{ position:absolute; inset:0; z-index:400; pointer-events:none; border-radius:inherit;
  background:radial-gradient(128% 128% at 50% 50%, transparent 48%, rgba(0,0,0,.18) 72%, rgba(0,0,0,.48) 100%);
  box-shadow:inset 0 0 18px 2px rgba(0,0,0,.48), inset 0 0 56px 10px rgba(0,0,0,.4); }
/* Diagonal light shaft. z401. */
.pdxMap__shaft{ position:absolute; top:-20%; bottom:-20%; left:48%; width:70px; z-index:401; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015) 50%, transparent);
  transform:rotate(14deg); filter:blur(1px); opacity:.85; }

.pdxMap__pins{ position:absolute; inset:0; z-index:2; }
/* Pin: 18px, black core, 3px ring, thin black ring + inward hole only. */
.pdxMap__pin{ position:absolute; width:18px; height:18px; border-radius:999px; box-sizing:border-box;
  transform:translate(-50%,-50%);
  background:#000; border:3px solid var(--_c,var(--day-sat));
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.85), inset 0 -1px 0 rgba(255,255,255,.06); }
.pdxMap__pin--multi{ border:2px solid #000;
  background:conic-gradient(var(--purple,#8800FF),var(--blue,#1A4DFF),var(--cyan,#00FFFF),var(--green,#39FF14),var(--yellow,#FFEE00),var(--orange,#FF6600),var(--pink,#FF00CC),var(--purple,#8800FF)); }
/* RSVP feedback is a scale pulse, never an outer bloom. */
@keyframes pdxMapPinRsvp{ 0%,100%{ transform:translate(-50%,-50%) scale(1); opacity:1 } 50%{ transform:translate(-50%,-50%) scale(1.14); opacity:.92 } }
.pdxMap__pin--rsvp{ animation:pdxMapPinRsvp 2.2s ease-in-out infinite; }
:root[data-calm="true"] .pdxMap__pin--rsvp{ animation:none !important; }

.pdxMap__legend{ position:absolute; left:16px; bottom:28px; z-index:500; }
.pdxMap__legend--home{ left:50%; right:auto; transform:translateX(-50%); bottom:14px; }
/* Chips: lime text, thin black edge, inset lime outline, no outer glow. */
.pdxMap__chip{ position:absolute; z-index:1001; display:inline-flex; align-items:center; gap:5px;
  padding:6px 10px; cursor:pointer; border-radius:0;
  font-family:var(--font-display); font-size:.6rem; font-weight:700;
  letter-spacing:.08em; text-transform:uppercase; color:var(--lime,#CCFF00);
  background:rgba(5,5,7,.88); border:1px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 1px 2px rgba(0,0,0,.75);
  outline:1px solid color-mix(in srgb, var(--lime,#CCFF00) 70%, #000); outline-offset:-2px; }
.pdxMap__chip svg{ width:12px; height:12px; }
.pdxMap__chip--expand{ top:10px; right:10px; }
.pdxMap__chip--locate{ bottom:12px; right:12px; }
:root[data-calm="true"] .pdxMap__chip{ outline-color:#555; }
/* Leaflet attribution, ported values. */
.pdxMap__attr{ position:absolute; bottom:0; right:0; z-index:500;
  background:rgba(0,0,0,.65); color:var(--text-faint,#8a8a8a); font-size:9px; padding:2px 5px; }
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
/** No recognizable day reads neutral white, never a borrowed day color. */
const UNKNOWN_DAY = "#FFFFFF";
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
  day: "SAT",
  rsvp: true
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

/** MapPanel, the debossed OLED map surface with day-ringed pins. */
function MapPanel({
  pins = DEFAULT_PINS,
  height = 420,
  legend = true,
  legendVariant = "corner",
  legendDays,
  expandable = false,
  onExpand,
  locate = false,
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
  }, rest), showCityLabel && /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__label",
    style: {
      left: "44%",
      top: "46%"
    }
  }, "Portland"), /*#__PURE__*/React.createElement("div", {
    className: "pdxMap__pins"
  }, pins.map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `pdxMap__pin ${p.multi ? "pdxMap__pin--multi" : ""} ${p.rsvp ? "pdxMap__pin--rsvp" : ""}`,
    style: {
      left: `${p.x}%`,
      top: `${p.y}%`,
      "--_c": p.color || DAY_COLOR[p.day] || UNKNOWN_DAY
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pdxMap__vignette",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pdxMap__shaft",
    "aria-hidden": "true"
  }), expandable && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxMap__chip pdxMap__chip--expand",
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
  })), "Expand"), locate && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pdxMap__chip pdxMap__chip--locate"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 11l19-8-8 19-2-9-9-2Z"
  })), "You"), legend && /*#__PURE__*/React.createElement("div", {
    className: `pdxMap__legend ${legendVariant === "home" ? "pdxMap__legend--home" : ""}`
  }, /*#__PURE__*/React.createElement(__ds_scope.MapLegend, {
    days: legendDays,
    home: legendVariant === "home"
  })), /*#__PURE__*/React.createElement("span", {
    className: "pdxMap__attr"
  }, "Leaflet | \xA9 OpenStreetMap \xA9 CARTO"));
}
Object.assign(__ds_scope, { MapPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapPanel.jsx", error: String((e && e.message) || e) }); }

// ds-index.js
try { (() => {
/* The index. One entry per specimen; the page and the sidebar both read this.
   nav  = short sidebar label. t = full title in the caption.
   st   = shipped (default) | queued | draft.
   c    = component paths whose .d.ts feed the props table. */
window.DS_NS = "PDXPrideGuideDesignSystem_b20420";
window.DS_BANDS = [{
  band: null,
  groups: [{
    n: "Read me",
    d: "What this system is, where the ground truth lives, the caveats, and how to ask for any of it.",
    items: [{
      rules: "handoff/Zaylist Rebrand Prompt.md",
      f: "guidelines/readme.html",
      w: 980,
      h: 2600,
      nav: "Read me",
      t: "Design system read me",
      s: "The whole written standard: sources, site map, content fundamentals, visual foundations, signature effects, page patterns, iconography, avatars, components, caveats and known code gaps."
    }, {
      f: "guidelines/prompts.html",
      w: 980,
      h: 2400,
      nav: "Prompts",
      t: "Prompts",
      s: "How to ask for anything in this system, in the words the system already uses: the vocabulary index, say-this-not-that, six copyable prompt recipes, the guardrails worth repeating, and the difference between using the system and changing it."
    }]
  }]
}, {
  band: "A · Language",
  c: "--neon-yellow",
  d: "The measurable layer. Everything downstream is assembled out of these four groups, so they come first.",
  groups: [{
    n: "Color",
    d: "Surfaces, the context primaries, the nine-stop spectrum, and the two colour systems that carry data rather than decoration.",
    items: [{
      f: "guidelines/color-surfaces.html",
      w: 900,
      h: 520,
      nav: "Surfaces & text",
      t: "Surfaces & text",
      s: "Near-black base, hard borders, warm text."
    }, {
      f: "guidelines/color-primaries.html",
      w: 1000,
      h: 1000,
      nav: "Context primaries",
      t: "Context primaries",
      s: "Acid yellow is the default action colour, not the only one. Hub and settings are cyan, admin is magenta, the owner desk is violet, Rooster Rock is orange and Sauvie Island is acid green. One data-context attribute rebinds --accent and --c for a whole subtree.",
      st: "queued"
    }, {
      f: "guidelines/color-neon.html",
      w: 760,
      h: 1500,
      nav: "Neon & spectrum",
      t: "Neon palette & spectrum",
      s: "One neon per element, yellow is primary, plus the nine-stop spectrum tape with hex, RGB and hue reference."
    }, {
      f: "guidelines/color-days.html",
      w: 900,
      h: 430,
      nav: "Day colors",
      t: "Day colors",
      s: "Mon to Sun keys. Data, not decoration. Toggle calm mode in the sidebar to watch them flatten."
    }, {
      f: "guidelines/color-boards.html",
      w: 720,
      h: 270,
      nav: "Board accents",
      t: "Community board accents",
      s: "One identity color per board, softened on utility surfaces."
    }, {
      f: "guidelines/color-utility.html",
      w: 880,
      h: 560,
      nav: "Utility layer",
      t: "Utility layer",
      s: "Ink panels, mono kickers and the status ramp: the data-dense register."
    }]
  }, {
    n: "Type & space",
    d: "Two families and a 4px grid. Both specimens read their numbers back from the token files at load.",
    items: [{
      f: "guidelines/type-body.html",
      w: 880,
      h: 1220,
      nav: "Type system",
      t: "Type system",
      s: "Barlow Condensed display, Inter body, mono utility, with the full display to meta scale."
    }, {
      f: "guidelines/spacing.html",
      w: 760,
      h: 700,
      nav: "Spacing & radius",
      t: "Spacing & radius",
      s: "The 4px scale, semantic gaps and the radius ramp, each value read from tokens/layout.css when the page loads."
    }]
  }, {
    n: "Voice",
    d: "How the system sounds. The third half of the language, and the one most often skipped.",
    items: [{
      f: "guidelines/copy-rules.html",
      w: 1000,
      h: 1500,
      nav: "Copy rules",
      t: "Copy rules",
      s: "The register with write-this and not-this, the name pun, scene vernacular, mantras, casing and the event line."
    }]
  }, {
    n: "Icons",
    d: "One drawing standard, 32 glyphs.",
    items: [{
      f: "guidelines/icons.html",
      w: 880,
      h: 440,
      nav: "Line icon library",
      t: "Line icon library",
      s: "All 32 brand icons on a 24px grid, 2.2 stroke, round caps, spectrum-colored. Inherit currentColor when inlined."
    }]
  }]
}, {
  band: "B · Brand",
  c: "--neon-cyan",
  d: "The parts that are Zaylist rather than good practice: the treatments, the written standard, and the app face.",
  groups: [{
    n: "Treatments",
    d: "The card shell every surface shares, plus the three effects that carry the brand without a logo in sight.",
    items: [{
      f: "guidelines/brand-bloom.html",
      w: 900,
      h: 900,
      nav: "Lit plate & bloom",
      t: "Lit plate & floor bloom",
      s: "The flat 4px magenta offset is retired. Posters, markers, tape and collage now read as a lit plate on a black keyline with the element's own accent blooming on the floor, the same idiom as the seam, chips and tags.",
      st: "queued"
    }, {
      f: "guidelines/brand-motifs.html",
      w: 700,
      h: 300,
      nav: "Seam, markers & tags",
      t: "Seam, markers & tags",
      s: "Animated flowing seam (route loader), kicker chip, filled sticker tags.",
      st: "queued"
    }, {
      f: "guidelines/card-system.html",
      w: 1180,
      h: 4200,
      nav: "Card system",
      t: "Card system, deep glass",
      c: ["data-display/EventCard", "data-display/PosterCard", "data-display/PlaceCard", "data-display/StatCard"],
      s: "One shell drives Events, the Directory, the ads and every board. The accent contract, the anatomy layer by layer, the four surfaces, the modal as the open state of the same object, motion, and the token table. Housing is queued on the same shell."
    }, {
      f: "guidelines/brand-glitch.html",
      w: 900,
      h: 820,
      nav: "Glitch",
      t: "Glitch",
      s: "The slow RGB glitch on the nav and hero wordmark: cycle, active window, offsets, ghost filters, and the off switch. Copyable markup and CSS."
    }]
  }, {
    n: "Brand guide",
    d: "The written standard for everything that has no token: the mark, imagery, voice, accessibility, trademark.",
    items: [{
      f: "brand-guide/Zaylist Brand Guide v2.html",
      w: 1180,
      h: 1400,
      nav: "Brand guide",
      t: "Brand guide",
      s: "Thirteen sections: the mark, the city lockup, clear space, glow, monochrome, backgrounds, misuse, applications, essence, grid, imagery, voice, accessibility and trademark. Scroll inside the frame.",
      scroll: 1
    }]
  }, {
    n: "App face",
    d: "The one artifact with its own end-to-end package.",
    items: [{
      f: "app-face/App Face Standards.html",
      w: 1180,
      h: 2600,
      nav: "App Face Standards",
      t: "App Face Standards",
      s: "The spec, verbatim from the handoff package in app-face/. Anatomy, the six iOS appearances, the two web build paths, every shipped export, and the files themselves. Downloads are live."
    }]
  }]
}, {
  band: "C · Surfaces",
  c: "--neon-magenta",
  d: "Everything you can put on a screen: the shared glass chassis, the components built on it, and how all of it moves.",
  groups: [{
    n: "Glass",
    d: "One token set drives every card, tile, inbox, map, row and nav surface in the system.",
    items: [{
      f: "guidelines/glass-cards.html",
      w: 1200,
      h: 1500,
      nav: "Glass surface system",
      t: "Glass surface system",
      s: "The source of truth: bevel, bloom, refract seam and the poster well, with every surface that inherits them."
    }]
  }, {
    n: "Components",
    d: "Everything shipped as a React component, previewed from the compiled bundle. Each entry copies a working import line and expands its real props table, read live from the .d.ts.",
    items: [{
      jsx: "<Button accent=\"lime\" arrow>View as schedule</Button>\n<Button variant=\"solid\" accent=\"cyan\" size=\"sm\">RSVP</Button>\n<IconButton label=\"Filter\" icon={<FilterIcon />} />\n<SearchInput placeholder=\"Search events, places, people\" onChange={setQ} />\n<FilterChip active accent=\"magenta\">Tonight</FilterChip>",
      f: "components/forms/forms.card.html",
      w: 700,
      h: 520,
      nav: "Buttons & inputs",
      t: "Buttons, inputs & filters",
      s: "The home hero glass pill, neon CTAs, icon buttons, search, filter chips.",
      st: "queued",
      c: ["forms/Button", "forms/IconButton", "forms/SearchInput", "forms/FilterChip"]
    }, {
      jsx: "<Badge accent=\"cyan\">Ticketed</Badge>\n<StatPill label=\"Going\" value={128} />\n<Countdown to=\"2026-07-16T18:00:00-07:00\" />\n<StickerBadge accent=\"yellow\">Free</StickerBadge>",
      f: "components/data-display/data-display.card.html",
      w: 700,
      h: 360,
      nav: "Badges & pills",
      t: "Badges, pills, countdown & stickers",
      s: "Labels, counts, the event countdown, slogan stickers.",
      st: "queued",
      c: ["data-display/Badge", "data-display/StatPill", "data-display/Countdown", "data-display/StickerBadge"]
    }, {
      jsx: "<BoardCard board=\"spotted\" title=\"Blue jacket at Darcelle\" body={post.body} author={post.author} />\n<AdCard sponsor=\"Rooster Rock Farm Stand\" href=\"/go/rrfs\" />\n<FeedItem kind=\"rsvp\" author={user} event={event} at={ts} />",
      f: "components/data-display/board-ad-feed.card.html",
      w: 900,
      h: 620,
      nav: "Board, ad & feed",
      t: "Board, ad & feed cards",
      s: "Community board posts with motifs, affiliate ad slots, hub scene-feed items on glass.",
      c: ["data-display/BoardCard", "data-display/AdCard", "data-display/FeedItem"]
    }, {
      jsx: "<SectionHeader kicker=\"Up next\" title=\"Thursday\" accent=\"cyan\" />\n<Divider variant=\"rainbow\" />",
      f: "components/layout/layout.card.html",
      w: 700,
      h: 420,
      nav: "Headers & dividers",
      t: "Section headers & dividers",
      s: "Section openers and spectrum dividers.",
      c: ["layout/SectionHeader", "layout/Divider"]
    }, {
      jsx: "<InfoTile accent=\"violet\" label=\"Venues\" value={42} note=\"Directory\" />\n<ActionRow n={1} title=\"Claim your venue\" href=\"/promoters/claim\" />\n<NavBar user={user} unread={3} onCalmToggle={toggleCalm} />",
      f: "components/layout/infra-action-nav.card.html",
      w: 900,
      h: 560,
      nav: "Infra & action rows",
      t: "Infra tiles, action rows & nav",
      s: "Left-accent infrastructure tiles, numbered promoter action rows, and the nav bar shell.",
      c: ["layout/InfoTile", "forms/ActionRow", "layout/NavBar"]
    }, {
      jsx: "<Avatar name=\"Tucker\" ring=\"progress\" size=\"lg\" />\n<Avatar name=\"Rowan\" ring=\"aromantic\" size=\"md\" />\n<Logo variant=\"lockup\" size={56} src=\"app-face/icons/zaylist-512.png\" />",
      f: "components/brand/avatars.card.html",
      w: 700,
      h: 420,
      nav: "Avatars & rings",
      t: "Avatars & identity rings",
      s: "Identity ring around the face, all eighteen from the live avatarRings.ts. Progress is the default.",
      c: ["brand/Avatar", "brand/Logo"]
    }]
  }, {
    n: "Motion",
    d: "How surfaces behave. Easings, durations, the signature keyframes, the wider ambient library, and calm mode over all of it.",
    items: [{
      f: "guidelines/motion.html",
      w: 980,
      h: 3400,
      nav: "Motion, loaders & seams",
      t: "Motion, loaders & seams",
      s: "Easings and durations, the seam engine and Seam Charge route loader, spectrum loaders, pull to refresh, entrances, ambient loops, the flag-ring bloom, the add-ons, and calm mode. Every pdx* keyframe here comes from tokens/effects.css; the page never redeclares one. The RSVP button in the sparks demo is the solid Button from 09.1, so this panel is queued with it.",
      st: "queued"
    }, {
      f: "guidelines/motion-library.html",
      w: 1000,
      h: 2600,
      nav: "Motion library",
      t: "Motion library",
      s: "The fifteen ambient and surface motions outside the seam, loader and entrance sets: the two aurora layers, spectrum wave, divider flow, word glitch, sticker float, board flicker, schedule entrance, attendance pop, sheet up, inbox overlay, holo sheen, the hero parallax, the hero overlay videos and the generic parallax containers. Every card copies a Claude-ready rules block, or take all fifteen at once."
    }]
  }]
}, {
  band: "D · Patterns",
  c: "--neon-orange",
  d: "Page-level surfaces that are composed rather than componentized. Bigger than a component, smaller than a page.",
  groups: [{
    n: "Nav bar",
    d: "Two navigation models: one header row on desktop, two bars on mobile that split identity from movement.",
    items: [{
      f: "guidelines/nav-desktop.html",
      w: 1400,
      h: 1500,
      nav: "Desktop",
      t: "Desktop nav",
      s: "The header row: wordmark, primary links with the Boards dropdown, Hub with its unread dot, the avatar menu, calm toggle, the signed-out Join button, and the seam. Ported from Nav.tsx and siteNav.ts. The Join button is drawn from the same chrome atoms as 09.1, so it is queued with the rest of the button work.",
      st: "queued"
    }, {
      f: "guidelines/mobile-nav.html",
      w: 900,
      h: 2100,
      nav: "Mobile",
      t: "Mobile nav",
      s: "Both bars. Top: Home and About segmented pair, alert bolt, avatar cluster or Join. Bottom: the five-tab dock, every active accent, the two tab sheets, and the full spec."
    }]
  }, {
    n: "Hub & feed",
    d: "The signed-in home: a three-column shell, five feed tabs, eleven card kinds.",
    items: [{
      f: "guidelines/hub-feed.html",
      w: 1100,
      h: 2100,
      nav: "Hub shell & news feed",
      t: "Hub shell & news feed",
      s: "Rail sections and accents, the right rails, feed tabs and predicates, card kinds, card anatomy. Ported from hub/HubV2.tsx and shared/hubFeed.ts."
    }]
  }, {
    n: "Floating inbox",
    d: "One overlay surface for everything, and it never navigates.",
    items: [{
      f: "guidelines/floating-inbox.html",
      w: 1100,
      h: 2400,
      nav: "Inbox, queue & desk",
      t: "Inbox, admin queue, owner desk & stats",
      s: "The navy-framed sheet and desktop button, every admin category with its endpoints, all six owner-desk kinds, the bar-chart stats, and the sheet palette. Ported from InboxOverlay.tsx and docs/floating-inbox.md. Queue actions now use the outline Button from 09.1, so they are queued with it.",
      st: "queued"
    }]
  }, {
    n: "Maps",
    d: "Large enough to be its own pattern rather than a component: four map surfaces, every pin, and all the chrome.",
    items: [{
      jsx: "<MapPanel pins={pins} height={320} legend locate />\n<MapLegend cats={DIR_CATS} />",
      f: "components/map/map.card.html",
      w: 900,
      h: 2600,
      nav: "Map surfaces & pins",
      t: "Map surfaces & pins",
      s: "The Events board, the home strip, the Directory island and the two beaches, plus pins, the key, and all map chrome. Ported from ds/mapTheme.ts.",
      c: ["map/MapPanel", "map/MapLegend"]
    }]
  }]
}, {
  band: "E · In use",
  c: "--day-mon-text",
  d: "The payoff. Everything above, assembled and working.",
  groups: [{
    n: "The live site",
    d: "Interactive. Click through it, then compare any surface against its specimen above.",
    items: [{
      f: "ui_kits/zaylist/index.html",
      w: 1280,
      h: 860,
      nav: "Full site",
      t: "Zaylist, full site",
      s: "Home, Events, Schedule, Directory, Hub and Admin.",
      scroll: 1
    }, {
      f: "ui_kits/zaylist/index.html#nudebeaches",
      w: 1280,
      h: 860,
      nav: "Nude Beaches",
      t: "Nude Beaches",
      s: "Rooster Rock and Collins Beach: live conditions band, refresh bar, map with the queer-corner legend, and the real trip logistics (fees, checklist, wildlife-area rules, farm stops).",
      scroll: 1
    }, {
      f: "ui_kits/zaylist/index.html#profile",
      w: 1280,
      h: 860,
      nav: "Public profile",
      t: "Public profile",
      s: "A member profile at /u/handle: hero, Followers / Hosting / Attended / Going strip, accent marquee, hosting rails, Top 8, The Big One, Going, Updates and the flyer stash.",
      scroll: 1
    }]
  }]
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "ds-index.js", error: String((e && e.message) || e) }); }

// ds-page.js
try { (() => {
/* Sidebar + page builder for the design system reference. */
(() => {
  const NS = window.DS_NS,
    BANDS = window.DS_BANDS;
  const nav = document.getElementById("nav"),
    host = document.getElementById("sections");
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const itemSlug = it => {
    if (!it.f) return slug(it.t);
    const m = it.f.match(/([^/]+)\.html(#(.+))?$/);
    return slug(m ? m[3] ? m[1] + "-" + m[3] : m[1] : it.f);
  };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let gi = 0;
  for (const b of BANDS) {
    if (b.band) {
      nav.insertAdjacentHTML("beforeend", '<div class="band" data-band="' + slug(b.band) + '" style="--bc:var(' + b.c + ')"><span>' + b.band + '</span><i></i></div>');
      const bh = document.createElement("div");
      bh.className = "bandhead";
      bh.dataset.band = slug(b.band);
      bh.style.setProperty("--bc", "var(" + b.c + ")");
      bh.innerHTML = '<h2>' + b.band + '</h2><span class="d">' + b.d + '</span>';
      host.appendChild(bh);
    }
    for (const g of b.groups) {
      const gn = String(gi++).padStart(2, "0"),
        gid = slug(g.n);
      nav.insertAdjacentHTML("beforeend", '<div class="grp" data-grp="' + gid + '"><b>' + gn + '</b>' + g.n + '</div>');
      const sec = document.createElement("section");
      sec.className = "grp";
      sec.id = gid;
      if (b.c) sec.style.setProperty("--bc", "var(" + b.c + ")");
      sec.dataset.band = b.band ? slug(b.band) : "";
      sec.innerHTML = '<div class="grp-head"><span class="n">' + gn + '</span><h3>' + g.n + '</h3><span class="d">' + g.d + '</span></div>';
      let ii = 0;
      for (const it of g.items) {
        ii++;
        const aid = gid + "/" + itemSlug(it),
          st = it.st || "shipped";
        const tag = st === "queued" ? '<span class="tag q">queued</span>' : st === "draft" ? '<span class="tag d">draft</span>' : '<span class="tag sec-count"></span>';
        nav.insertAdjacentHTML("beforeend", '<a class="item" data-grp="' + gid + '" data-for="' + aid + '" href="#' + aid + '"><span class="n">' + gn + "." + ii + '</span><span>' + it.nav + '</span>' + tag + '</a>' + (it.f && !it.scroll ? '<div class="subs" data-for="' + aid + '"></div>' : ''));
        const art = document.createElement("article");
        art.id = aid;
        art.dataset.screenLabel = gn + "." + ii;
        const copy = it.c ? "const { " + it.c.map(c => c.split("/")[1]).join(", ") + " } = window." + NS + ";" : it.f || "";
        const acts = ['<button class="btn js-copy" data-copy="' + copy.replace(/"/g, "&quot;") + '">' + (it.c ? "Copy import" : "Copy path") + '</button>'];
        if (it.jsx) acts.push('<button class="btn js-copy" data-copy="' + it.jsx.replace(/"/g, "&quot;") + '">Copy JSX</button>');
        if (it.c) acts.push('<button class="btn js-props" data-c="' + it.c.join(",") + '">Props</button>');
        if (it.rules) acts.push('<button class="btn js-rules" data-src="' + it.rules + '">Copy the rules block</button>');
        const body = it.f ? '<div class="frame" data-w="' + it.w + '" data-h="' + it.h + '"' + (it.scroll ? ' data-scroll="1"' : '') + '><div class="scaler"><iframe loading="lazy" src="' + encodeURI(it.f) + '" width="' + it.w + '" height="' + it.h + '" scrolling="' + (it.scroll ? "auto" : "no") + '"></iframe></div></div>' : '<div class="nopreview">Preview queued. Props below are live from the source .d.ts.</div>';
        art.innerHTML = '<div class="cap"><h4>' + it.t + '</h4><span class="chip ' + st + '">' + st + '</span>' + (it.f ? '<span class="path">' + it.f + '</span>' : '') + '<span class="acts">' + acts.join("") + '</span>' + '<span class="sub">' + it.s + '</span></div>' + body + (it.jsx ? '<pre class="snippet">' + esc(it.jsx) + '</pre>' : '') + (it.c ? '<div class="props hidden"></div>' : '');
        sec.appendChild(art);
      }
      host.appendChild(sec);
    }
  }

  /* Stats read from the manifest, never hand-typed. */
  fetch("_ds_manifest.json").then(r => r.json()).then(m => {
    const comps = (m.components || []).filter(c => /^[A-Z][a-z]/.test(c.name));
    document.getElementById("st-comps").textContent = comps.length;
    if (Array.isArray(m.tokens)) document.getElementById("st-tokens").textContent = m.tokens.length;
  }).catch(() => {});
  /* Spectrum stops: counted off --grad-rainbow itself. The tape wraps, so the
     repeated first colour at 100% is not a stop. */
  (() => {
    const el = document.getElementById("st-stops");
    const g = getComputedStyle(document.documentElement).getPropertyValue("--grad-rainbow");
    const hexes = (g.match(/#[0-9a-f]{3,8}/gi) || []).map(s => s.toLowerCase());
    if (el && hexes.length) el.textContent = new Set(hexes).size;
  })();

  /* Copy to clipboard. */
  addEventListener("click", e => {
    const b = e.target.closest(".js-copy");
    if (!b) return;
    navigator.clipboard.writeText(b.dataset.copy).then(() => {
      const t = b.textContent;
      b.textContent = "Copied";
      b.classList.add("done");
      setTimeout(() => {
        b.textContent = t;
        b.classList.remove("done");
      }, 1200);
    }).catch(() => {});
  });

  /* The paste-into-Claude rules block, fetched from the handoff package. */
  addEventListener("click", async e => {
    const b = e.target.closest(".js-rules");
    if (!b) return;
    const label = b.textContent;
    b.textContent = "Reading…";
    try {
      const txt = await (await fetch(b.dataset.src)).text();
      await navigator.clipboard.writeText(txt);
      b.textContent = "Copied " + Math.round(txt.length / 1000) + "k";
      b.classList.add("done");
    } catch (err) {
      b.textContent = "Unavailable";
    }
    setTimeout(() => {
      b.textContent = label;
      b.classList.remove("done");
    }, 1600);
  });

  /* Props tables, parsed live from the .d.ts. */
  const dts = {};
  function parseDts(src, name) {
    const i = src.indexOf("interface " + name + "Props");
    if (i < 0) return null;
    const start = src.indexOf("{", i);
    if (start < 0) return null;
    let depth = 0,
      j = start;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (ch === "{") depth++;else if (ch === "}") {
        depth--;
        if (!depth) break;
      }
    }
    const rows = [];
    let doc = "";
    for (const raw of src.slice(start + 1, j).split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("/**") || line.startsWith("*") || line.startsWith("*/")) {
        if (line.startsWith("/**")) doc = "";
        doc += " " + line.replace(/^\/\*\*|^\*\/|^\*/, "").replace(/\*\/$/, "").trim();
        continue;
      }
      const m = line.match(/^(\w+)(\?)?\s*:\s*(.+?);?$/);
      if (m) {
        rows.push({
          k: m[1],
          req: !m[2],
          t: m[3].replace(/;$/, ""),
          d: doc.trim()
        });
        doc = "";
      } else doc = "";
    }
    return rows;
  }
  addEventListener("click", async e => {
    const b = e.target.closest(".js-props");
    if (!b) return;
    const panel = b.closest("article").querySelector(".props");
    if (!panel.classList.contains("hidden")) {
      panel.classList.add("hidden");
      b.classList.remove("done");
      return;
    }
    panel.classList.remove("hidden");
    b.classList.add("done");
    if (panel.dataset.loaded) return;
    panel.dataset.loaded = "1";
    panel.innerHTML = '<div class="empty">Reading source…</div>';
    let out = "";
    for (const path of b.dataset.c.split(",")) {
      const name = path.split("/")[1];
      if (!dts[path]) {
        try {
          dts[path] = await (await fetch("components/" + path + ".d.ts")).text();
        } catch (err) {
          dts[path] = "";
        }
      }
      const rows = dts[path] ? parseDts(dts[path], name) : null;
      out += '<h5>' + name + '</h5>';
      if (!rows || !rows.length) {
        out += '<div class="empty">components/' + path + '.d.ts unreadable from here.</div>';
        continue;
      }
      out += '<table>' + rows.map(r => '<tr><td class="k">' + r.k + (r.req ? '<span class="req">*</span>' : '') + '</td><td class="t">' + esc(r.t) + '</td><td class="d">' + esc(r.d) + '</td></tr>').join("") + '</table>';
    }
    panel.innerHTML = out;
  });

  /* Calm mode, propagated into every frame. */
  let calm = false;
  const calmBtn = document.getElementById("calm");
  const applyCalm = doc => {
    try {
      doc.documentElement.setAttribute("data-calm", calm ? "true" : "false");
    } catch (e) {}
  };
  calmBtn.addEventListener("click", () => {
    calm = !calm;
    calmBtn.classList.toggle("on", calm);
    applyCalm(document);
    document.querySelectorAll(".frame iframe").forEach(fr => {
      try {
        if (fr.contentDocument) applyCalm(fr.contentDocument);
      } catch (e) {}
    });
  });

  /* Scaling: scoped to the frame that changed, rAF-debounced. */
  function measure(f) {
    if (f.dataset.scroll) return +f.dataset.h;
    const fr = f.querySelector("iframe");
    let h = +f.dataset.h;
    try {
      const d = fr.contentDocument;
      if (d && d.body) {
        const real = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
        if (real > 40) {
          h = real;
          fr.height = real;
          f.dataset.h = real;
        }
      }
    } catch (e) {}
    return h;
  }
  function scaleOf(f) {
    return Math.min(1, (f.clientWidth || f.parentElement.clientWidth) / +f.dataset.w);
  }
  function fitOne(f) {
    const s = scaleOf(f);
    f.querySelector(".scaler").style.transform = "scale(" + s + ")";
    f.style.height = Math.round(measure(f) * s) + "px";
  }
  const pending = new Set();
  let raf = 0;
  function schedule(f) {
    pending.add(f);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const list = [...pending];
      pending.clear();
      list.forEach(fitOne);
    });
  }
  const fitAll = () => document.querySelectorAll(".frame").forEach(schedule);
  addEventListener("resize", fitAll);

  /* Section drill-in: the headings inside each panel become sidebar children. */
  const HEAD = "h1,h2,h3,.lbl,.cap,.sec-title";
  function indexSections(fr) {
    const art = fr.closest("article"),
      rail = nav.querySelector('.subs[data-for="' + CSS.escape(art.id) + '"]');
    const countEl = nav.querySelector('a.item[data-for="' + CSS.escape(art.id) + '"] .sec-count');
    let d;
    try {
      d = fr.contentDocument;
    } catch (e) {
      return;
    }
    if (!d) return;
    const seen = new Set(),
      heads = [];
    d.querySelectorAll(HEAD).forEach(el => {
      const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
      if (!txt || txt.length > 60 || seen.has(txt)) return;
      seen.add(txt);
      heads.push({
        el,
        txt
      });
    });
    if (countEl && heads.length > 2) countEl.textContent = heads.length + " §";
    if (!rail || heads.length < 2) return;
    if (rail._heads && rail._heads.length === heads.length) {
      rail._heads = heads;
      rail._art = art;
      return;
    }
    rail.innerHTML = heads.map((h, i) => '<a href="#' + art.id + '" data-i="' + i + '"' + (i > 2 ? ' class="extra"' : '') + '><span class="n">·' + String(i + 1).padStart(2, "0") + '</span><span>' + esc(h.txt) + '</span></a>').join("") + (heads.length > 3 ? '<button class="more">+ ' + (heads.length - 3) + ' more</button>' : "");
    rail._heads = heads;
    rail._art = art;
  }
  nav.addEventListener("click", e => {
    const more = e.target.closest(".more");
    if (more) {
      const rail = more.closest(".subs");
      rail.classList.toggle("open");
      more.textContent = rail.classList.contains("open") ? "− collapse" : "+ " + (rail._heads.length - 3) + " more";
      return;
    }
    const sub = e.target.closest(".subs a");
    if (!sub) return;
    e.preventDefault();
    const rail = sub.closest(".subs"),
      h = rail._heads[+sub.dataset.i],
      art = rail._art;
    const frame = art.querySelector(".frame");
    const inner = h.el.getBoundingClientRect().top - h.el.ownerDocument.documentElement.getBoundingClientRect().top;
    const target = scrollY + frame.getBoundingClientRect().top + inner * scaleOf(frame) - 24;
    window.scrollTo({
      top: Math.max(0, target),
      behavior: "smooth"
    });
  });
  function onFrameLoad(fr) {
    const f = fr.closest(".frame");
    schedule(f);
    let d = null;
    try {
      d = fr.contentDocument;
    } catch (e) {
      return;
    }
    if (!d) return;
    if (calm) applyCalm(d);
    if (f.dataset.scroll) return;
    if (!f.dataset.observed && window.ResizeObserver) {
      f.dataset.observed = "1";
      try {
        new ResizeObserver(() => schedule(f)).observe(d.documentElement);
      } catch (e) {}
    }
    try {
      indexSections(fr);
    } catch (e) {
      console.error("indexSections failed", f.parentElement && f.parentElement.id, e);
    }
  }
  /* Frames are lazy, `load` also fires for the about:blank placeholder, and some
     panels render their own body after load (readme.html builds itself from
     readme.md). So a frame is re-indexed on every tick until its heading count
     holds steady across three passes. indexSections is idempotent. */
  function hasContent(fr) {
    try {
      const d = fr.contentDocument;
      return !!(d && d.readyState === "complete" && d.body && d.body.childElementCount > 0);
    } catch (e) {
      return false;
    }
  }
  function headCount(fr) {
    try {
      return fr.contentDocument.querySelectorAll(HEAD).length;
    } catch (e) {
      return -1;
    }
  }
  const state = new WeakMap();
  function tryIndex(fr) {
    const st = state.get(fr) || {
      n: -1,
      stable: 0
    };
    if (st.stable >= 3) return true;
    if (!hasContent(fr)) {
      state.set(fr, st);
      return false;
    }
    const n = headCount(fr);
    st.stable = n === st.n ? st.stable + 1 : 0;
    st.n = n;
    state.set(fr, st);
    onFrameLoad(fr);
    return st.stable >= 3;
  }
  function nudgeLoad(fr) {
    if (fr.dataset.nudged) return;
    fr.dataset.nudged = "1";
    fr.loading = "eager";
    if (!hasContent(fr)) fr.src = fr.getAttribute("src");
  }
  document.querySelectorAll(".frame iframe").forEach(fr => {
    fr.addEventListener("load", () => {
      schedule(fr.closest(".frame"));
      tryIndex(fr);
    });
  });
  /* IntersectionObserver is unreliable inside some preview hosts, so proximity is
     measured directly: every tick, any frame within a screen and a half of the
     viewport is forced to load, and any loaded frame is re-indexed. */
  function pass() {
    let left = 0;
    document.querySelectorAll(".frame").forEach(f => {
      const fr = f.querySelector("iframe");
      if (!fr) return;
      const st = state.get(fr);
      if (st && st.stable >= 3) return;
      left++;
      const r = f.getBoundingClientRect();
      if (r.bottom > -1200 && r.top < innerHeight + 1200) nudgeLoad(fr);
      tryIndex(fr);
    });
    return left;
  }
  const ticker = setInterval(() => {
    if (!pass()) clearInterval(ticker);
  }, 500);
  addEventListener("scroll", pass, {
    passive: true
  });
  pass();
  fitAll();

  /* Search across items, their sections, groups and bands. */
  const q = document.getElementById("q");
  q.addEventListener("input", () => {
    const v = q.value.trim().toLowerCase();
    const liveBands = new Set();
    document.querySelectorAll("section.grp").forEach(sec => {
      let any = false;
      sec.querySelectorAll("article").forEach(a => {
        const hit = !v || a.textContent.toLowerCase().includes(v) || a.id.includes(v);
        a.classList.toggle("hidden", !hit);
        if (hit) any = true;
      });
      sec.classList.toggle("hidden", !any);
      nav.querySelectorAll('.grp[data-grp="' + CSS.escape(sec.id) + '"]').forEach(n => n.classList.toggle("hidden", !any));
      if (any && sec.dataset.band) liveBands.add(sec.dataset.band);
    });
    document.querySelectorAll(".band,.bandhead").forEach(el => {
      if (!el.dataset.band) return;
      el.classList.toggle("hidden", !!v && !liveBands.has(el.dataset.band));
    });
    nav.querySelectorAll("a.item").forEach(l => {
      const art = document.getElementById(l.dataset.for);
      const off = !!art && art.classList.contains("hidden");
      l.classList.toggle("hidden", off);
      const rail = nav.querySelector('.subs[data-for="' + CSS.escape(l.dataset.for) + '"]');
      if (rail) rail.classList.toggle("hidden", off);
    });
  });

  /* Active item tracking, on scroll rather than IntersectionObserver. */
  const links = [...nav.querySelectorAll("a.item")];
  let track = 0;
  function markActive() {
    track = 0;
    const arts = [...document.querySelectorAll("article")].filter(a => !a.classList.contains("hidden"));
    let cur = arts[0];
    for (const a of arts) {
      if (a.getBoundingClientRect().top <= innerHeight * 0.28) cur = a;else break;
    }
    const id = cur && cur.id;
    links.forEach(l => l.classList.toggle("on", l.dataset.for === id));
  }
  addEventListener("scroll", () => {
    if (!track) track = requestAnimationFrame(markActive);
  }, {
    passive: true
  });
  markActive();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ds-page.js", error: String((e && e.message) || e) }); }

// guidelines/motion-library.data.js
try { (() => {
/* The motion library. Ported from the live client; keyframes and timing are
   the real values. Each entry renders a card and a Claude-ready rules block. */
const MOTIONS = [{
  t: "Aurora, atmosphere layer",
  where: "Home hero, behind everything (HeroAurora.tsx)",
  rule: "Three large blurred colour orbs drift and breathe behind the hero on independent long loops, so the background never visibly repeats. Violet, cyan and magenta. This is the outer of the two aurora layers: the letter orbs sit in front of it, tighter and one per letter.",
  timing: "auroraA 19s / auroraB 23s / auroraC 27s, all ease-in-out infinite. Deliberately coprime so the three never resynchronise.",
  demo: '<div class="aurora"><i></i><i></i><i></i></div>',
  css: `@keyframes auroraA { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(9%,12%) scale(1.25); } }
@keyframes auroraB { 0%,100% { transform: translate(0,0) scale(1.1); } 50% { transform: translate(-11%,-8%) scale(.9); } }
@keyframes auroraC { 0%,100% { transform: translate(0,0) scale(1); }   50% { transform: translate(7%,-10%) scale(1.2); } }

.hero-aurora__orb { position: absolute; width: 56%; height: 66%; border-radius: 50%; filter: blur(30px); opacity: .55; }
.hero-aurora__orb--a { background: var(--neon-violet);  animation: auroraA 19s ease-in-out infinite; }
.hero-aurora__orb--b { background: var(--neon-cyan);    animation: auroraB 23s ease-in-out infinite; }
.hero-aurora__orb--c { background: var(--neon-magenta); animation: auroraC 27s ease-in-out infinite; }

/* <HeroAurora /> renders exactly three orbs and nothing else. */`
}, {
  t: "Spectrum wave",
  where: "Full-bleed band under section headers",
  rule: "A continuous spectrum band scrolls sideways at a walking pace. It is one smooth gradient tiled at 288px, never hard colour stops, and the first and last stop are the same colour so the tile seam never shows. Slow enough to read as ambient rather than as a loader.",
  timing: "spectrum-wave-scroll 22s linear infinite. Tile width 288px.",
  demo: '<div class="wave"></div>',
  css: `@keyframes spectrum-wave-scroll { to { background-position: 288px 0; } }

.pdx-spectrum-wave {
  /* A smooth spectrum, never hard stops. The band is one continuous
     gradient tiled at its own width, so the seam is invisible: the
     first and last colour must match. */
  background: linear-gradient(90deg,
    #FF19D6 0%, #FF5319 14.3%, #FFD119 28.6%, #9CFF19 42.9%,
    #19F7FF 57.1%, #1956FF 71.4%, #E419FF 85.7%, #FF19D6 100%);
  background-repeat: repeat-x;
  background-size: 288px 100%;   /* one tile: the loop distance must equal this */
  animation: spectrum-wave-scroll 22s linear infinite;
}`
}, {
  t: "Rainbow divider flow",
  where: "The seam under the header and above the footer",
  rule: "The flag gradient travels right to left under a static second layer, so the seam reads as light moving through it rather than the rule itself sliding. It uses --rainbow-bar-loop, which wraps back to cyan, so the point where the tile repeats is invisible. The plain --rainbow-bar ends on orange and shows a hard orange-to-cyan join when tiled.",
  timing: "rainbow-divider-flow 6s linear infinite. Two background layers; only the first one moves.",
  demo: '<div class="rdiv"></div>',
  css: `@keyframes rainbow-divider-flow {
  from { background-position: 360px 0, 0 0; }
  to   { background-position: 0 0,     0 0; }
}

.pdx-rainbow-rule {
  height: 3px;
  /* --rainbow-bar-loop, never --rainbow-bar. The plain bar ends on orange,
     so tiling it butts orange straight against cyan and the join shows as a
     hard band. The loop token wraps back to cyan and the seam disappears. */
  background: var(--rainbow-bar-loop), var(--ink-900);
  background-size: 360px 100%, 100% 100%;
  background-repeat: repeat-x, no-repeat;
  animation: rainbow-divider-flow 6s linear infinite;
}`
}, {
  t: "Word glitch",
  where: "A single emphasised word in About copy",
  rule: "One word in a headline throws a cyan and magenta text-shadow split for two frames roughly every five seconds, then rests. Hard cuts, never a tween. One word per screen, never body copy.",
  timing: "aboutWordGlitch 5s steps(1) infinite. Active window 92 to 96 percent, about 200ms. Offset never exceeds 2px.",
  demo: '<span class="gword">Zaylist</span>',
  css: `@keyframes aboutWordGlitch {
  0%, 92%, 100% { text-shadow: none; transform: none; }
  93% { text-shadow: -2px 0 var(--cyan), 2px 0 var(--pink); transform: translateX(1px); }
  95% { text-shadow:  2px 0 var(--cyan), -2px 0 var(--pink); transform: translateX(-1px); }
}

.about__word--glitch { animation: aboutWordGlitch 5s steps(1) infinite; }`
}, {
  t: "Sticker float",
  where: "Tilted stickers on About and the promoter pages",
  rule: "Each sticker keeps its own tilt and bobs a few pixels on a slow loop. Two rates are in use so a cluster never moves in lockstep. The rotation is baked into every keyframe so the float never straightens the sticker.",
  timing: "aboutStickerFloat 3.2s and aboutPgStickerFloat 3.4s, both ease-in-out infinite. Travel 5 to 6px.",
  demo: '<div class="float"><span>Free</span><span>Hire me</span></div>',
  css: `@keyframes aboutStickerFloat {
  0%, 100% { transform: rotate(3deg) translateY(0); }
  50%      { transform: rotate(3deg) translateY(-6px); }
}
@keyframes aboutPgStickerFloat {
  0%, 100% { transform: rotate(-2deg) translateY(0); }
  50%      { transform: rotate(-2deg) translateY(-5px); }
}

/* Keep the tilt inside every keyframe, or the sticker snaps upright mid-float. */
.about__sticker    { animation: aboutStickerFloat 3.2s ease-in-out infinite; }
.about__sticker--pg{ animation: aboutPgStickerFloat 3.4s ease-in-out infinite; }`
}, {
  t: "Board flicker",
  where: "Board headings on the community boards",
  rule: "A neon-sign flicker: the heading jitters two pixels and dips in opacity for four frames near the end of a long cycle, then holds steady. It should be easy to miss.",
  timing: "board-flickr 7s linear infinite. Active window 92 to 96 percent.",
  demo: '<span class="flick">Gifting</span>',
  css: `@keyframes board-flickr {
  0%, 100% { opacity: 1;   transform: translateX(0); }
  92%      { opacity: 1; }
  93%      { opacity: .94; transform: translateX(-2px); }
  94%      { opacity: 1;   transform: translateX(2px); }
  95%      { opacity: .96; }
  96%      { opacity: 1;   transform: translateX(0); }
}

.board__title { animation: board-flickr 7s linear infinite; }`
}, {
  t: "Schedule card in",
  where: "Schedule grid cards on load and on filter change",
  rule: "Cards fade up six pixels, staggered down the column. Short and flat: the schedule is dense, so a longer entrance reads as lag.",
  timing: "scheduleCardIn .3s ease both, stagger 70ms per card. Cap the stagger so a long list does not delay the last card past ~500ms.",
  demo: '<div class="stack"><i></i><i></i><i></i><i></i></div>',
  css: `@keyframes scheduleCardIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sch-card { animation: scheduleCardIn .3s ease both; }
.sch-card:nth-child(2) { animation-delay: .07s; }
.sch-card:nth-child(3) { animation-delay: .14s; }
/* ...cap the delay around .5s however deep the list goes. */`
}, {
  t: "Attendance pop",
  where: "Attendance bubbles when someone RSVPs",
  rule: "A new face springs in from zero with an overshoot, the only place in the system that uses a spring curve. It marks a person arriving, so it is allowed to be bouncy.",
  timing: "attendance-pop-in .6s cubic-bezier(.34, 1.56, .64, 1). Overshoot peaks at 1.18 at 60 percent.",
  demo: '<span class="pop"></span>',
  css: `@keyframes attendance-pop-in {
  0%   { transform: scale(0);    opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}

.attendance__bubble { animation: attendance-pop-in .6s cubic-bezier(.34, 1.56, .64, 1); }`
}, {
  t: "Sheet up",
  where: "The attendance sheet and every bottom sheet on mobile",
  rule: "The sheet slides up from fully offscreen with no fade and no scale. Movement alone reads as physical; adding opacity makes it feel like a dialog instead of a surface.",
  timing: "attendance-sheet-up .25s ease-out. The side-panel variant is the same duration on translateX.",
  demo: '<span class="sheet"></span>',
  css: `@keyframes attendance-sheet-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes attendance-panel-in   { from { transform: translateX(100%); } to { transform: translateX(0); } }

.attendance__sheet { animation: attendance-sheet-up .25s ease-out; }
.attendance__panel { animation: attendance-panel-in .25s cubic-bezier(.2, .8, .2, 1); }`
}, {
  t: "Inbox overlay in",
  where: "The floating inbox sheet",
  rule: "The navy sheet rises sixteen pixels and settles from a slight scale-down while fading in. Fast, because the inbox is opened constantly and never navigates.",
  timing: "inbox-overlay-in .2s ease-out for the sheet, inbox-overlay-fade .2s for the scrim behind it.",
  demo: '<span class="overlay"></span>',
  css: `@keyframes inbox-overlay-in {
  from { transform: translateY(16px) scale(.98); opacity: 0; }
  to   { transform: translateY(0) scale(1);      opacity: 1; }
}
@keyframes inbox-overlay-fade { from { opacity: 0; } to { opacity: 1; } }

.inbox-overlay        { animation: inbox-overlay-in .2s var(--ease-out); }
.inbox-overlay__scrim { animation: inbox-overlay-fade .2s var(--ease-out); }`
}, {
  t: "Flyer stash holo",
  where: "The flyer stash on a public profile",
  rule: "A wide holographic sheen creeps across the stash plate, like light moving over a foil card. Three times the tile width, so the pass is long and slow.",
  timing: "stashHolo 4.5s linear infinite. background-size 300%, travelling 0 to 300 percent.",
  demo: '<div class="holo"></div>',
  css: `@keyframes stashHolo {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

.stash__plate {
  background: linear-gradient(110deg, /* dark base with two faint color bands */ );
  background-size: 300% 100%;
  animation: stashHolo 4.5s linear infinite;
}`
}, {
  t: "Aurora, letter orbs",
  where: "Home hero, one orb per letter of ZAYLIST (HomeHero.tsx, .home-hero__aurora)",
  rule: "The inner aurora layer. Seven blurred orbs sit between the grain and the wordmark, one under each letter, each coloured by that letter's position in the spectrum tape. They share one float loop but every orb starts 1.4 seconds earlier than the last, so the glow travels across the word instead of pulsing as a block. Same family as the atmosphere layer behind it: same blur, same breathing, tighter and keyed to type.",
  timing: "One shared float loop; animationDelay is i * -1.4s per orb. Negative delays start them mid-cycle rather than staggering the start.",
  demo: '<div class="orbs"><i style="--x:8%;--o:#FF19D6;animation-delay:0s"></i><i style="--x:22%;--o:#FF196C;animation-delay:-1.4s"></i><i style="--x:36%;--o:#FFD119;animation-delay:-2.8s"></i><i style="--x:50%;--o:#9CFF19;animation-delay:-4.2s"></i><i style="--x:64%;--o:#19F7FF;animation-delay:-5.6s"></i><i style="--x:78%;--o:#1956FF;animation-delay:-7s"></i><i style="--x:92%;--o:#E419FF;animation-delay:-8.4s"></i></div>',
  css: `/* Colors are sampled from the spectrum tape at each letter's position.
   Do not recolor them individually: they are one gradient, taken apart. */
const LETTER_ORBS = [
  { letter: "Z", color: "#FF19D6", left: "16%", top: "42%" },
  { letter: "A", color: "#FF196C", left: "28%", top: "46%" },
  { letter: "Y", color: "#FFD119", left: "40%", top: "40%" },
  { letter: "L", color: "#9CFF19", left: "50%", top: "48%" },
  { letter: "I", color: "#19F7FF", left: "60%", top: "42%" },
  { letter: "S", color: "#1956FF", left: "70%", top: "46%" },
  { letter: "T", color: "#E419FF", left: "82%", top: "40%" },
];
// style={{ background: orb.color, left: orb.left, top: orb.top,
//          animationDelay: \`\${i * -1.4}s\` }}

.home-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(38px);
  animation: floatOrb 5s ease-in-out infinite, glowPulse 3.2s ease-in-out infinite;
}`
}, {
  t: "Hero parallax",
  where: "Home hero, the whole layer stack",
  rule: "Scroll only, never pointer, and vertical only. The hero writes a normalised -1 to 1 position into --py and each layer multiplies it by its own depth. The value is eased toward the target at five percent per frame, so the stack lags the scroll slightly instead of tracking it exactly.",
  timing: "requestAnimationFrame loop, lerp factor 0.05. Range clamped to -1 to 1 over 55 percent of the viewport height. Not started at all under calm mode or reduced motion.",
  demo: '<div class="plx"><i></i><i></i><i></i></div>',
  css: `/* The hero owns one variable; every layer reads it at its own depth. */
const readScroll = () => {
  const r = el.getBoundingClientRect(), vh = window.innerHeight || 1;
  return Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh * 0.55)));
};
const tick = () => {
  currentY += (targetY - currentY) * 0.05;   // lag, do not track exactly
  el.style.setProperty("--py", currentY.toFixed(4));
  raf = requestAnimationFrame(tick);
};
window.addEventListener("scroll", () => { targetY = readScroll(); }, { passive: true });

/* Never start the loop at all when motion is off. */
if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
if (document.documentElement.classList.contains("calm-mode")) return;

/* Layer depths, back to front. */
.home-hero__bg       { transform: translateY(calc(var(--py, 0) * 22px)); }
.home-hero__aurora   { transform: translateY(calc(var(--py, 0) * 14px)); }
.home-hero__wordmark { transform: translateY(calc(var(--py, 0) * 6px)); }`
}, {
  t: "Hero overlay videos",
  where: "Home hero and every PageHero photo panel",
  rule: "Looping CC-BY footage blended over the photo on black: light leaks, film grain, scanlines, confetti and rain. They are stacked by preset rather than chosen per page, and several run slowed down so nothing in the layer reads as a loop. Screen blend for anything that adds light, overlay for grain.",
  timing: "lightLeaks screen .308 at 0.5x speed · filmGrain overlay .202 at 0.85x · scanlines screen .09 · confetti screen .2 at 0.75x · rain screen .26. Presets: home = leaks + grain + confetti, panel and atmosphere = leaks + grain.",
  demo: '<div class="ovl"><i class="ovl--leak"></i><i class="ovl--grain"></i><span>photo</span></div>',
  css: `/* From client/src/lib/heroOverlays.ts. Opacities are deliberately odd
   numbers: they were tuned against the real footage, do not round them. */
export const HERO_OVERLAY_LAYERS = {
  lightLeaks: { src: "/overlays/light-leaks.webm", blendMode: "screen",  opacity: 0.308, playbackRate: 0.5  },
  filmGrain:  { src: "/overlays/scanlines.webm",   blendMode: "overlay", opacity: 0.202, playbackRate: 0.85 },
  scanlines:  { src: "/overlays/scanlines.webm",   blendMode: "screen",  opacity: 0.09  },
  confetti:   { src: "/overlays/confetti.webm",    blendMode: "screen",  opacity: 0.2,   playbackRate: 0.75 },
  rain:       { src: "/overlays/rain.webm",        blendMode: "screen",  opacity: 0.26  },
};
export const HERO_OVERLAY_PRESETS = {
  home:       ["lightLeaks", "filmGrain", "confetti"],
  panel:      ["lightLeaks", "filmGrain"],
  atmosphere: ["lightLeaks", "filmGrain"],
};

/* The stack order is fixed and never varies:
   bg photo -> overlay videos -> legibility scrim -> grain -> content. */
.hero__overlay {
  position: absolute; inset: 0; pointer-events: none;
  object-fit: cover; width: 100%; height: 100%;
}
/* muted, loop, playsInline, and drop to nothing under calm / reduced motion. */`
}, {
  t: "Parallax containers",
  where: "Board and Missed Connections photo heroes",
  rule: "The generic version of the hero effect. A container writes a pixel offset into --parallax-y and its layers translate by it, so a surface can opt into depth without owning a scroll listener of its own. The Missed Connections hero adds a ::before that drifts against the photo. Calm mode pins every layer at zero rather than removing the transform, so nothing reflows when you toggle it.",
  timing: "Driven by scroll position, not by a keyframe. Same lerp discipline as the home hero: ease toward the target, never track it exactly.",
  demo: '<div class="plx"><i></i><i></i><i></i></div>',
  css: `/* The contract is one variable. Layers opt in at their own depth. */
.parallax-container      { --parallax-y: 0px; }
.parallax-container__bg  { transform: translateY(var(--parallax-y, 0px)); }
.missed-connections-hero.parallax-container::before {
  transform: translateY(var(--parallax-y, 0px));
}

/* Calm pins the offset instead of dropping the transform, so nothing jumps. */
html.calm-mode .missed-connections-hero.parallax-container,
html.calm-mode .missed-connections-hero.parallax-container::before {
  --parallax-y: 0px;
}

/* Write the value from one scroll listener, never one per layer. */
el.style.setProperty("--parallax-y", offset.toFixed(1) + "px");`
}];
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/motion-library.data.js", error: String((e && e.message) || e) }); }

// guidelines/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // data-om-starter: inert presence marker — Claude Design's starter-usage
  // probe reads it. The closed panel renders nothing, so the marker rides
  // the <html> element as an attribute instead of a rendered node — zero
  // elements added, so page CSS (even structural selectors like
  // :nth-child) can never observe it. It records that the page WIRES a
  // tweaks panel, whether or not the panel is open. Keep this effect.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-om-starter', 'tweaks-panel');
    return () => document.documentElement.removeAttribute('data-om-starter');
  }, []);
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/AboutScreen.jsx
try { (() => {
/* AboutScreen, ported from Tucker's About overhaul (the live site's About page).
   Manifesto-led: hero, animated stat band, manifesto, made-by-Tucker, keep-alive,
   community infrastructure (board-accent cards), how-it-works, values, sponsors, FAQ. */
const {
  Button: AbBtn,
  SectionHeader: AbSection,
  StickerBadge: AbSticker
} = window.PDXPrideGuideDesignSystem_b20420;
if (typeof document !== "undefined" && !document.getElementById("pg-about-css")) {
  const s = document.createElement("style");
  s.id = "pg-about-css";
  s.textContent = `
  .pg-about .aw-inner{ max-width:1180px; margin:0 auto; }
  .pg-about details > summary{ list-style:none; cursor:pointer; }
  .pg-about details > summary::-webkit-details-marker{ display:none; }
  .pg-about .faq-ico{ transition:transform .2s var(--ease-out); display:inline-block; }
  .pg-about details[open] > summary .faq-ico{ transform:rotate(45deg); color:var(--lime); }
  .pg-about a.proj:hover{ transform:translateY(-2px); background:var(--surface-card-hover); text-decoration:none; }
  `;
  document.head.appendChild(s);
}
const abBand = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  letterSpacing: ".2em",
  textTransform: "uppercase"
};
const abProse = {
  fontSize: 19,
  lineHeight: 1.6,
  color: "var(--text-mid)",
  margin: "0 0 18px"
};
const abCheck = {
  color: "var(--lime)",
  fontWeight: 900,
  flex: "none"
};
const abValRow = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start"
};
const abInfraCard = accent => ({
  padding: "24px",
  background: "var(--ink-800)",
  border: "2px solid var(--ink-border)",
  borderRadius: 5,
  borderLeft: `3px solid ${accent}`
});
const abSponsor = accent => ({
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "16px 18px",
  background: "var(--ink-800)",
  border: "2px solid var(--ink-border)",
  borderRadius: 5,
  borderLeft: `3px solid ${accent}`
});
function StatCell({
  v,
  label,
  color,
  glow,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "30px 40px",
      borderRight: last ? "none" : "2px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: 52,
      lineHeight: ".82",
      color,
      textShadow: `0 0 22px ${glow}`,
      fontVariantNumeric: "tabular-nums"
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      color: "var(--text-lo)",
      marginTop: 11
    }
  }, label));
}
function Faq({
  q,
  children
}) {
  return /*#__PURE__*/React.createElement("details", {
    style: {
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      padding: "20px 4px",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: ".02em",
      fontSize: 18,
      color: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16
    }
  }, q, /*#__PURE__*/React.createElement("span", {
    className: "faq-ico",
    style: {
      color: "var(--cyan)",
      fontSize: 22
    }
  }, "+")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 4px 20px",
      fontSize: 15,
      lineHeight: 1.62,
      color: "var(--text-mid)",
      maxWidth: 760
    }
  }, children));
}
function AboutScreen() {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const dur = 1100;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const ev = Math.round(p * 94),
    ed = Math.round(p * 7),
    ea = Math.round(p * 2);
  const link = url => () => window.open(url, "_blank", "noopener");
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-about"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "#060609 url(../../assets/festival-posters-wall.jpg) center/cover no-repeat"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(90deg, rgba(6,6,10,.97) 0%, rgba(6,6,10,.88) 36%, rgba(6,6,10,.6) 70%, rgba(6,6,10,.4) 100%), linear-gradient(to top, rgba(6,6,10,.94) 0%, rgba(6,6,10,.2) 60%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      position: "relative",
      padding: "88px 40px 76px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...abBand,
      color: "var(--cyan)",
      marginBottom: 22
    }
  }, "About \xB7 Zaylist"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 104,
      lineHeight: ".82",
      color: "var(--lime)",
      textShadow: "0 0 34px rgba(204,255,0,.4), 0 3px 16px rgba(0,0,0,.7)"
    }
  }, "94 events."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 30,
      lineHeight: 1.05,
      color: "#fff",
      marginTop: 16,
      textShadow: "0 2px 14px rgba(0,0,0,.75)"
    }
  }, "And approximately zero interest in being a sanitized corporate Pride pamphlet.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 13,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(AbBtn, {
    accent: "lime",
    size: "lg",
    onClick: link("https://www.instagram.com/tucker_pdmax")
  }, "Follow Tucker"), /*#__PURE__*/React.createElement(AbBtn, {
    accent: "cyan",
    size: "lg",
    onClick: link("https://www.zaylist.com/events")
  }, "Browse the 94"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-1000)",
      borderTop: "2px solid var(--ink-border)",
      borderBottom: "2px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)"
    }
  }, /*#__PURE__*/React.createElement(StatCell, {
    v: ev,
    label: "Events, and counting",
    color: "var(--lime)",
    glow: "rgba(204,255,0,.35)"
  }), /*#__PURE__*/React.createElement(StatCell, {
    v: ed,
    label: "Days, one guide",
    color: "var(--cyan)",
    glow: "rgba(0,255,255,.35)"
  }), /*#__PURE__*/React.createElement(StatCell, {
    v: ea,
    label: (ea === 1 ? "Admin" : "Admins") + " keeping it clean",
    color: "var(--pink)",
    glow: "rgba(255,0,204,.35)"
  }), /*#__PURE__*/React.createElement(StatCell, {
    v: "$0",
    label: "To browse. Always.",
    color: "var(--orange)",
    glow: "rgba(255,102,0,.35)",
    last: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#070708",
      borderBottom: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...abBand,
      color: "var(--pink)",
      marginBottom: 20
    }
  }, "What this actually is"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: abProse
  }, "events has not even started yet, and this thing already has parties, community events, weird little gems, places to eat, places to shop, gigs, gifting, missed connections, and other necessary homosexual infrastructure."), /*#__PURE__*/React.createElement("p", {
    style: {
      ...abProse,
      margin: "0 0 32px"
    }
  }, "The family friendly newspaper roundup is cute. The local moms' Pride list has its place. But this is for the people who want the whole city, not just the parts a corporation can clean up and sell back to us.")), /*#__PURE__*/React.createElement("div", {
    style: {
      borderLeft: "5px solid var(--pink)",
      padding: "8px 0 8px 26px",
      maxWidth: 900
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      lineHeight: 1,
      color: "var(--paper, #fff)",
      fontSize: 44,
      margin: 0
    }
  }, "Fuck Meta.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Fuck censoring our community.", /*#__PURE__*/React.createElement("br", null), "Fuck pretending queer culture only counts once it has been scrubbed clean for public approval.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#070708",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: ".82fr 1.18fr",
      gap: 44,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: "2px solid var(--ink-border)",
      borderRadius: 6,
      overflow: "hidden",
      background: "#050505"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/tucker-portrait.jpg",
    alt: "Tucker",
    style: {
      width: "100%",
      height: 440,
      objectFit: "cover",
      objectPosition: "center top",
      display: "block"
    }
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(AbSection, {
    kicker: "Who's behind it",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Made by ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "Tucker Max")),
    accent: "lime"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "var(--text-mid)",
      margin: "14px 0 14px"
    }
  }, "I host Yes Coach and STANK, I run LockerRoom at The Eagle, and I host the Digg'n For Bones podcast. I also built this entire site myself, with many different tools. No corporation, no algorithm, no whoever wrote the biggest check. Just me, and the people who show up."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "var(--text-mid)",
      margin: "0 0 14px"
    }
  }, "This year got rough. A lot of you donated and checked in on me, and that is the only reason year three exists."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16.5,
      lineHeight: 1.65,
      color: "var(--text-mid)",
      margin: "0 0 18px",
      fontWeight: 700
    }
  }, "From the bottom of my heart thank you. You showed up for me and I hope this is a way I can show up for you."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(AbBtn, {
    accent: "lime",
    onClick: link("https://www.instagram.com/tucker_pdmax")
  }, "Follow @tucker_pdmax"), /*#__PURE__*/React.createElement(AbBtn, {
    accent: "cyan",
    variant: "ghost",
    onClick: link("https://www.zaylist.com/inbox")
  }, "Message me")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: ".18em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      margin: "36px 0 14px"
    }
  }, "Tucker's projects"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "proj",
    href: "https://members.pdxsanctuary.com/events/93071",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "grid",
      gridTemplateColumns: "96px 1fr",
      gap: 18,
      alignItems: "center",
      padding: 16,
      background: "var(--surface-card)",
      border: "2px solid var(--border-default)",
      borderLeft: "5px solid var(--day-sat)",
      borderRadius: "var(--radius-md)",
      textDecoration: "none",
      color: "inherit",
      boxShadow: "0 0 22px -10px var(--day-sat)",
      transition: "transform .2s var(--ease-out), background .2s"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/tucker-yes-coach.jpg",
    alt: "STANK x Yes Coach",
    style: {
      width: 96,
      height: 96,
      objectFit: "cover",
      borderRadius: "var(--radius-sm)",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: ".6rem",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "var(--day-sat)",
      border: "1px solid var(--day-sat)",
      borderRadius: 2,
      padding: "2px 7px 1px",
      display: "inline-block"
    }
  }, "Event \xB7 Sat"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: "1.35rem",
      lineHeight: 1.02,
      color: "var(--text-hi)",
      margin: "8px 0 3px"
    }
  }, "STANK x Yes Coach"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--meta)",
      color: "var(--text-lo)"
    }
  }, "Sanctuary Club \xB7 This weekend"))), /*#__PURE__*/React.createElement("a", {
    className: "proj",
    href: "https://open.spotify.com/show/0QjCR4IzhAbAssZE2uAdz3",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      display: "grid",
      gridTemplateColumns: "96px 1fr",
      gap: 18,
      alignItems: "center",
      padding: 16,
      background: "var(--surface-card)",
      border: "2px solid var(--border-default)",
      borderLeft: "5px solid var(--purple)",
      borderRadius: "var(--radius-md)",
      textDecoration: "none",
      color: "inherit",
      boxShadow: "0 0 22px -10px var(--purple)",
      transition: "transform .2s var(--ease-out), background .2s"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/diggn-for-bones.jpg",
    alt: "Digg'n For Bones podcast",
    style: {
      width: 96,
      height: 96,
      objectFit: "cover",
      borderRadius: "var(--radius-sm)",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: ".6rem",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      color: "var(--purple)",
      border: "1px solid var(--purple)",
      borderRadius: 2,
      padding: "2px 7px 1px",
      display: "inline-block"
    }
  }, "Podcast \xB7 Season 3"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: "1.35rem",
      lineHeight: 1.02,
      color: "var(--text-hi)",
      margin: "8px 0 3px"
    }
  }, "Digg'n For Bones"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--meta)",
      color: "var(--text-lo)"
    }
  }, "Hosted by Tucker \xB7 new episodes on Spotify")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-1000)",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "52px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 40,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      lineHeight: .96,
      color: "#fff",
      fontSize: 34,
      margin: "0 0 10px"
    }
  }, "Keep this guide alive"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15.5,
      lineHeight: 1.6,
      color: "var(--text-lo)",
      margin: 0
    }
  }, "Servers and domains cost money. Time costs the most. If this pointed you toward one good night, chip in and it stays free for the next person.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(AbBtn, {
    accent: "lime",
    size: "lg",
    onClick: link("https://venmo.com/tucker_pdmax")
  }, "Buy me a coffee"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      color: "var(--text-faint)"
    }
  }, "@tucker_pdmax on Venmo")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-900)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement(AbSection, {
    kicker: "Necessary homosexual infrastructure",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "The whole city, ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "not the sanitized bits")),
    accent: "cyan"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: abInfraCard("var(--board-gigs)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: 23,
      color: "var(--board-gigs)",
      marginBottom: 9
    }
  }, "Gigs"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-mid)",
      margin: 0
    }
  }, "Offer a trade, need work, or want to lend your talents? Check gigs.")), /*#__PURE__*/React.createElement("div", {
    style: abInfraCard("var(--board-gifting)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: 23,
      color: "var(--board-gifting)",
      marginBottom: 9
    }
  }, "Gifting"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-mid)",
      margin: 0
    }
  }, "Need something for events, or have old festival stuff collecting dust? Check gifting.")), /*#__PURE__*/React.createElement("div", {
    style: abInfraCard("var(--board-spotted)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: 23,
      color: "var(--board-spotted)",
      marginBottom: 9
    }
  }, "Missed connections"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-mid)",
      margin: 0
    }
  }, "Trying to find someone during events? Missed Connections exists for a reason."))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-900)",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement(AbSection, {
    kicker: "How it works",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Public by ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "default")),
    subtitle: "Most of the guide goes live the second you post it. Admins only step in for the stuff that actually needs a human.",
    accent: "cyan"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 26,
      background: "var(--ink-800)",
      border: "2px solid var(--lime)",
      borderRadius: 6,
      boxShadow: "0 0 24px -14px var(--lime)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: 21,
      color: "var(--lime)",
      marginBottom: 16
    }
  }, "Goes live instantly"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, ["RSVPs, once you are logged in", "Missed Connections, gigs, gifting, and talent tags", "New events and claims from approved promoters"].map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: abValRow
  }, /*#__PURE__*/React.createElement("span", {
    style: abCheck
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--text-mid)"
    }
  }, x))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 26,
      background: "var(--ink-800)",
      border: "2px solid var(--ink-border)",
      borderRadius: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: 21,
      color: "var(--cyan)",
      marginBottom: 16
    }
  }, "Needs an admin"), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, ["New events and suggestions from anyone not approved yet", "Promoter applications, moderation, and take-down requests", "Gifting reports and site feedback"].map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: abValRow
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--cyan)",
      fontWeight: 900,
      flex: "none"
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--text-mid)"
    }
  }, x)))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#070708",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement(AbSection, {
    kicker: "Transparency",
    title: /*#__PURE__*/React.createElement(React.Fragment, null, "Values & the ", /*#__PURE__*/React.createElement("span", {
      className: "hl"
    }, "rules")),
    accent: "pink"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px 40px",
      maxWidth: 960,
      marginTop: 22
    }
  }, [["Free to browse.", "No paywall, no popup begging for your email."], ["The top spot is not for sale.", "Sponsors welcome if they fit the values. That is the whole bar."], ["Post with a free account.", "That is how spam stays out and names stay on."], ["Your data is not for sale.", "Not now, not later, not for a nice offer."], ["We moderate the clearly over the line stuff.", "But our line sits way further back than the average straight person's."], ["One person builds this.", "Good people help. It is still not a committee."]].map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: abValRow
  }, /*#__PURE__*/React.createElement("span", {
    style: abCheck
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      lineHeight: 1.55,
      color: "var(--text-mid)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#fff"
    }
  }, v[0]), " ", v[1])))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--ink-900)",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.1fr .9fr",
      gap: 40,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...abBand,
      color: "var(--lime)",
      marginBottom: 18
    }
  }, "Sponsors"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      lineHeight: .95,
      color: "#fff",
      fontSize: 40,
      margin: "0 0 16px"
    }
  }, "Looking for sponsors who ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--lime)"
    }
  }, "fit the values")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.62,
      color: "var(--text-mid)",
      maxWidth: 520,
      margin: "0 0 22px"
    }
  }, "I am looking for sponsors, not landlords. If your business actually belongs in this scene and shares what is on this page, you can help keep the whole thing free. You still cannot buy the top spot. Ever."), /*#__PURE__*/React.createElement(AbBtn, {
    accent: "lime",
    onClick: link("https://www.zaylist.com/inbox")
  }, "Pitch a sponsorship")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: abSponsor("var(--lime)")
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--lime)",
      fontWeight: 900,
      fontSize: 18
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--text-mid)"
    }
  }, "Queer owned or genuinely queer loving.")), /*#__PURE__*/React.createElement("div", {
    style: abSponsor("var(--cyan)")
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--cyan)",
      fontWeight: 900,
      fontSize: 18
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--text-mid)"
    }
  }, "Treats its people right. Pays them right.")), /*#__PURE__*/React.createElement("div", {
    style: abSponsor("var(--pink)")
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--pink)",
      fontWeight: 900,
      fontSize: 18
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--text-mid)"
    }
  }, "Does not need us to scrub anything clean first.")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#070708",
      borderTop: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aw-inner",
    style: {
      padding: "60px 40px"
    }
  }, /*#__PURE__*/React.createElement(AbSection, {
    kicker: "FAQ",
    title: "Good questions",
    accent: "cyan"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      marginTop: 14,
      borderBottom: "1px solid var(--ink-border)"
    }
  }, /*#__PURE__*/React.createElement(Faq, {
    q: "What is Zaylist?"
  }, "Everything queer in Portland: parties, shows, marches, and the quiet stuff too. Updated as the scene moves, all year."), /*#__PURE__*/React.createElement(Faq, {
    q: "Where do I find events?"
  }, "The Events page. Every live listing on a map and a board. Filter by day, type, or neighborhood, then open anything for times, venue, and tickets."), /*#__PURE__*/React.createElement(Faq, {
    q: "How is this different from other festival apps?"
  }, "It is free, it is run by a person, and it is built for this city. No corporate feed. No paying to rank. Promoters post, the community shows up."), /*#__PURE__*/React.createElement(Faq, {
    q: "Can my business sponsor?"
  }, "If you belong in the scene, yes. Sponsorship helps keep it free. It does not buy you a higher spot. Ever. Pitch it and I will read it.")))));
}
Object.assign(window, {
  PGAboutScreen: AboutScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/AboutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/AdminScreen.jsx
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
  }, "Stank Yes Coach, PDX FEST"), /*#__PURE__*/React.createElement("p", {
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/AdminScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/AppShell.jsx
try { (() => {
/* AppShell, site header + footer for the Zaylist UI kit.
   Nav model mirrors client/src/lib/siteNav.ts (PRIMARY_NAV) on master.
   Footer folders mirror client/src/components/Footer.tsx (FOOTER_FOLDERS). */
const {
  Logo: PGLogo,
  Button: PGBtn,
  Avatar: PGDSAvatar
} = window.PDXPrideGuideDesignSystem_b20420;

/* live = a screen exists in this kit; the rest render but stay inert. */
const PRIMARY_NAV = [{
  type: "link",
  key: "home",
  label: "Home",
  live: true
}, {
  type: "link",
  key: "about",
  label: "About",
  live: true
}, {
  type: "link",
  key: "events",
  label: "Events",
  live: true
}, {
  type: "link",
  key: "places",
  label: "Places",
  live: true
}, {
  type: "link",
  key: "nudebeaches",
  label: "Nude Beaches",
  live: true
}, {
  type: "dropdown",
  id: "boards",
  label: "Boards",
  items: [{
    key: "gigboard",
    label: "Gig Board"
  }, {
    key: "gifting",
    label: "Gifting"
  }, {
    key: "spotted",
    label: "Missed Connections"
  }]
}, {
  type: "link",
  key: "promoters",
  label: "Promoters"
}];
const FOOTER_FOLDERS = [{
  id: "explore",
  title: "Explore",
  links: [{
    key: "events",
    label: "Events",
    live: true
  }, {
    key: "schedule",
    label: "Schedule",
    live: true
  }, {
    key: "places",
    label: "Places",
    live: true
  }, {
    key: "nudebeaches",
    label: "Nude Beaches",
    live: true
  }, {
    key: "spotted",
    label: "Missed Connections"
  }, {
    key: "gigboard",
    label: "Gig Board"
  }, {
    key: "gifting",
    label: "Gifting"
  }]
}, {
  id: "participate",
  title: "Participate",
  links: [{
    key: "promoters",
    label: "Submit an Event"
  }, {
    key: "promoters",
    label: "Claim an Event"
  }, {
    key: "gigboard",
    label: "Post a Gig"
  }, {
    key: "gifting",
    label: "Post a Gift / In Search Of"
  }, {
    key: "sponsors",
    label: "Sponsor the Guide"
  }]
}, {
  id: "guide",
  title: "Guide",
  links: [{
    key: "about",
    label: "About",
    live: true
  }, {
    key: "access",
    label: "Access & Safety"
  }, {
    key: "contact",
    label: "Contact"
  }, {
    key: "legal",
    label: "Legal"
  }]
}];
const NAV_ACCENT = {
  home: "var(--neon-yellow)",
  events: "var(--neon-cyan)",
  schedule: "var(--neon-yellow)",
  places: "var(--neon-magenta)",
  hub: "var(--neon-cyan)",
  about: "var(--neon-yellow)"
};
function Avatar({
  size = 40
}) {
  return /*#__PURE__*/React.createElement(PGDSAvatar, {
    name: "Tucker Casey",
    ring: "progress",
    size: size
  });
}
function CalmToggle() {
  const [calm, setCalm] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `pg-calm ${calm ? "is-on" : ""}`,
    "aria-pressed": calm,
    onClick: () => {
      setCalm(v => !v);
      document.documentElement.dataset.calm = calm ? "false" : "true";
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-calm__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-calm__knob"
  })), "Calm");
}
function Header({
  route,
  onNav
}) {
  const [openDrop, setOpenDrop] = React.useState(null);
  const go = item => {
    if (item.live) onNav(item.key);
    setOpenDrop(null);
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
    src: window.__resources && window.__resources.zlMark || "../../app-face/icons/zaylist-512.png"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "pg-nav",
    "aria-label": "Primary navigation"
  }, PRIMARY_NAV.map(entry => {
    if (entry.type === "link") {
      return /*#__PURE__*/React.createElement("button", {
        key: entry.key,
        className: `pg-nav__link ${route === entry.key ? "is-active" : ""}`,
        style: {
          "--_c": NAV_ACCENT[entry.key] || "var(--neon-cyan)"
        },
        onClick: () => go(entry)
      }, entry.label);
    }
    const open = openDrop === entry.id;
    return /*#__PURE__*/React.createElement("div", {
      key: entry.id,
      className: `pg-nav__dd ${open ? "is-open" : ""}`
    }, /*#__PURE__*/React.createElement("button", {
      className: "pg-nav__link",
      style: {
        "--_c": "var(--neon-lime, var(--neon-yellow))"
      },
      "aria-expanded": open,
      "aria-haspopup": "menu",
      onClick: () => setOpenDrop(open ? null : entry.id)
    }, entry.label, /*#__PURE__*/React.createElement("svg", {
      className: "pg-nav__chev",
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M6 9l6 6 6-6",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "pg-nav__panel",
      role: "menu"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pg-nav__panel-label"
    }, entry.label), entry.items.map(it => /*#__PURE__*/React.createElement("button", {
      key: it.label,
      role: "menuitem",
      className: "pg-nav__panel-item",
      onClick: () => go(it)
    }, it.label))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pg-header__spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-header__auth"
  }, /*#__PURE__*/React.createElement("button", {
    className: `pg-nav__link pg-nav__link--hub ${route === "hub" ? "is-active" : ""}`,
    style: {
      "--_c": "var(--neon-cyan)"
    },
    onClick: () => onNav("hub")
  }, "Hub", /*#__PURE__*/React.createElement("span", {
    className: "pg-nav__notify",
    "aria-hidden": "true"
  })), /*#__PURE__*/React.createElement("span", {
    className: "pg-nav__sep"
  }), /*#__PURE__*/React.createElement("button", {
    className: "pg-nav__link",
    style: {
      "--_c": "var(--neon-magenta)"
    },
    onClick: () => onNav("admin")
  }, "Admin"), /*#__PURE__*/React.createElement("button", {
    className: "pg-avatarBtn",
    "aria-label": "Your public profile",
    onClick: () => onNav("profile")
  }, /*#__PURE__*/React.createElement(Avatar, {
    size: 40
  }))), /*#__PURE__*/React.createElement(CalmToggle, null), /*#__PURE__*/React.createElement(PGBtn, {
    className: "pg-menuBtn",
    accent: "lime",
    size: "sm"
  }, "Menu")), /*#__PURE__*/React.createElement("div", {
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
    className: "pg-footer__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__brand-col"
  }, /*#__PURE__*/React.createElement(PGLogo, {
    variant: "lockup",
    size: 44,
    src: window.__resources && window.__resources.zlMark || "../../app-face/icons/zaylist-512.png"
  }), /*#__PURE__*/React.createElement("p", {
    className: "pg-footer__tagline"
  }, "Built by one person in Portland. No committee, no corporate parent, just someone who loves this scene."), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__controls"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-footer__pill"
  }, "Feedback"), /*#__PURE__*/React.createElement("span", {
    className: "pg-footer__pill"
  }, "Notifications"), /*#__PURE__*/React.createElement("span", {
    className: "pg-footer__pill"
  }, "Calm mode"))), /*#__PURE__*/React.createElement("nav", {
    className: "pg-footer__nav",
    "aria-label": "Footer"
  }, FOOTER_FOLDERS.map(folder => /*#__PURE__*/React.createElement("div", {
    key: folder.id,
    className: "pg-footer__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__col-title"
  }, folder.title), /*#__PURE__*/React.createElement("ul", {
    className: "pg-footer__list"
  }, folder.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: folder.id + l.label
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "pg-footer__link",
    onClick: e => {
      e.preventDefault();
      if (l.live && onNav) onNav(l.key);
    }
  }, l.label))))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__support"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__support-title"
  }, "Free to use, but not free to run."), /*#__PURE__*/React.createElement("p", {
    className: "pg-footer__support-copy"
  }, "Hosting, domains, and the late nights are on one person. Tips keep it going."), /*#__PURE__*/React.createElement(PGBtn, {
    accent: "lime",
    size: "sm",
    arrow: true
  }, "Buy me a coffee"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-footer__bar"
  }, /*#__PURE__*/React.createElement("span", null, "Portland, Oregon. Made by Tucker, for the community, not shareholders."), /*#__PURE__*/React.createElement("span", null, "\xA9 2026 Zaylist \xB7 Free to Browse \xB7 Independently Run"))), /*#__PURE__*/React.createElement("div", {
    className: "pdx-seam pdx-seam--thick"
  }));
}
Object.assign(window, {
  PGHeader: Header,
  PGFooter: Footer,
  PGAvatar: Avatar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/EventDetailScreen.jsx
try { (() => {
/* EventDetailScreen, the single-event page (a core live-site surface).
   Opens when a card is clicked: full header, action bar (tickets, calendar,
   share, directions, RSVP, save), a facts panel, description, and "more that day". */
const {
  Button: EdBtn,
  Badge: EdBadge,
  EventCard: EdRow
} = window.PDXPrideGuideDesignSystem_b20420;
const ED_DAY = {
  MON: "var(--day-mon)",
  TUE: "var(--day-tue)",
  WED: "var(--day-wed)",
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const ED_DAYNAME = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday"
};
const ED_ADM = {
  FREE: "Free",
  TICKETED: "Ticketed",
  SUGGESTED_DONATION: "Suggested donation",
  DOOR_FEE: "Door fee"
};
const ED_MONTH = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12"
};
function edAge(e) {
  return e.tags.includes("21+") ? "21+" : e.tags.includes("18+") ? "18+" : e.tags.includes("All Ages") ? "All ages" : null;
}
function edTypes(e) {
  return e.tags.filter(t => !["21+", "18+", "All Ages", "Headliner", "Legendary", "Sex Positive", "ASL"].includes(t));
}
function edIcsDate(e) {
  const [hh, mm] = e.hour.split(":");
  let h = parseInt(hh, 10) % 12;
  if (e.ampm === "PM") h += 12;
  const mo = ED_MONTH[e.date.split(" ")[0]] || "07";
  const dd = String(e.date.split(" ")[1] || "16").padStart(2, "0");
  return `2026${mo}${dd}T${String(h).padStart(2, "0")}${(mm || "00").padStart(2, "0")}00`;
}
function edDownloadIcs(e) {
  const dt = edIcsDate(e);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zaylist//EN", "BEGIN:VEVENT", `UID:zaylist-${e.id}@zaylist.com`, `SUMMARY:${e.title}`, `LOCATION:${e.venue}, ${e.neighborhood}, Portland OR`, `DESCRIPTION:${(e.blurb || "").replace(/\n/g, " ")}`, `DTSTART:${dt}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], {
    type: "text/calendar"
  }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Fact({
  label,
  value,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 16,
      padding: "12px 0",
      borderBottom: "1px solid var(--border-default)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 14,
      fontWeight: 600,
      color: color || "var(--text-hi)",
      textAlign: "right"
    }
  }, value));
}
function EventDetailScreen({
  data,
  id,
  saved,
  onSave,
  onRsvp,
  onNotify,
  onOpen,
  onBack
}) {
  const e = data.EVENTS.find(x => x.id === id);
  if (!e) return /*#__PURE__*/React.createElement("div", {
    className: "pg-container pg-section"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: "none",
      border: 0,
      color: "var(--cyan)",
      cursor: "pointer",
      fontFamily: "var(--font-display)",
      textTransform: "uppercase"
    }
  }, "\u2190 All events"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-lo)"
    }
  }, "Event not found."));
  const dayC = ED_DAY[e.day] || "var(--cyan)";
  const age = edAge(e);
  const types = edTypes(e);
  const ticketed = e.admission === "TICKETED" || e.admission === "SUGGESTED_DONATION" || e.admission === "DOOR_FEE";
  const share = () => {
    const t = `${e.title} · Zaylist`;
    if (navigator.share) {
      navigator.share({
        title: t,
        text: t
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${e.title} — ${e.venue}, ${e.date}`).then(() => onNotify && onNotify("Link copied to clipboard"));
    } else onNotify && onNotify("Share this event");
  };
  const directions = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue + ", Portland OR")}`, "_blank", "noopener");
  const tickets = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(e.title + " " + e.venue + " tickets")}`, "_blank", "noopener");
  const moreThatDay = data.EVENTS.filter(x => x.day === e.day && x.id !== e.id).slice(0, 4);
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-eventdetail"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "var(--ink-1000)",
      borderBottom: `1px solid var(--border-default)`,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: `radial-gradient(90% 120% at 0% 0%, color-mix(in srgb, ${dayC} 16%, transparent), transparent 60%)`,
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-container",
    style: {
      position: "relative",
      paddingBlock: "var(--space-8) var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: "none",
      border: 0,
      color: "var(--text-lo)",
      cursor: "pointer",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      fontSize: ".85rem",
      padding: "0 0 18px",
      display: "inline-flex",
      gap: 8
    }
  }, "\u2190 All events"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: ".72rem",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      background: "#fff",
      color: "#000",
      padding: "4px 10px 3px",
      borderRadius: 2
    }
  }, e.day, " \xB7 ", e.date), types.slice(0, 3).map((t, i) => /*#__PURE__*/React.createElement(EdBadge, {
    key: i,
    variant: "outline"
  }, t)), age && /*#__PURE__*/React.createElement(EdBadge, {
    variant: "outline",
    color: "cyan"
  }, age), e.tags.includes("ASL") && /*#__PURE__*/React.createElement(EdBadge, {
    variant: "outline",
    color: "lime"
  }, "ASL")), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      lineHeight: .95,
      color: "var(--text-hi)",
      fontSize: "clamp(2.2rem,5vw,3.75rem)",
      margin: 0,
      maxWidth: "18ch"
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexWrap: "wrap",
      gap: "6px 18px",
      alignItems: "center",
      color: "var(--text-mid)",
      fontSize: "1.05rem"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: dayC,
      fontWeight: 700
    }
  }, e.venue), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-lo)"
    }
  }, e.neighborhood), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-lo)"
    }
  }, ED_DAYNAME[e.day], ", ", e.date, " \xB7 ", e.hour, " ", e.ampm), e.going != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: ".8rem",
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--neon-yellow)",
      border: "1px solid var(--neon-yellow)",
      borderRadius: 999,
      padding: "3px 11px 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "var(--neon-yellow)"
    }
  }), e.going, " Going")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 26
    }
  }, ticketed && /*#__PURE__*/React.createElement(EdBtn, {
    accent: "lime",
    onClick: tickets
  }, "Get Tickets"), /*#__PURE__*/React.createElement(EdBtn, {
    accent: "cyan",
    onClick: () => {
      onRsvp && onRsvp(e.id);
    }
  }, "I'll be there"), /*#__PURE__*/React.createElement(EdBtn, {
    variant: "ghost",
    onClick: () => edDownloadIcs(e)
  }, "Add to Calendar"), /*#__PURE__*/React.createElement(EdBtn, {
    variant: "ghost",
    onClick: directions
  }, "Directions"), /*#__PURE__*/React.createElement(EdBtn, {
    variant: "ghost",
    onClick: share
  }, "Share"), /*#__PURE__*/React.createElement(EdBtn, {
    variant: "ghost",
    onClick: () => onSave && onSave(e.id)
  }, saved && saved[e.id] ? "♥ Saved" : "♡ Save")))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container pg-section--tight"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.6fr) minmax(260px,1fr)",
      gap: "var(--space-10)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontSize: "1.5rem",
      color: "var(--text-hi)",
      margin: "0 0 12px"
    }
  }, "About this event"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: "1.0625rem",
      lineHeight: 1.65,
      color: "var(--text-mid)",
      margin: "0 0 24px",
      maxWidth: "62ch"
    }
  }, e.blurb), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, e.tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: "var(--font-body)",
      fontSize: 13,
      color: "var(--text-lo)",
      border: "1px solid var(--border-strong)",
      borderRadius: 999,
      padding: "5px 12px"
    }
  }, t))), e.tags.includes("Sex Positive") && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      padding: "14px 16px",
      background: "color-mix(in srgb, var(--neon-magenta) 8%, var(--ink-800))",
      border: "1px solid color-mix(in srgb, var(--neon-magenta) 40%, var(--border-default))",
      borderRadius: "var(--radius-md)",
      color: "var(--text-mid)",
      fontSize: 14,
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--neon-magenta)"
    }
  }, "Sex positive."), " Listed and tagged honestly. Check the host's page for dress code and consent policy.")), /*#__PURE__*/React.createElement("aside", {
    style: {
      background: "var(--surface-card)",
      border: "2px solid var(--border-default)",
      borderLeft: `5px solid ${dayC}`,
      borderRadius: "var(--radius-md)",
      padding: "6px 18px 16px"
    }
  }, /*#__PURE__*/React.createElement(Fact, {
    label: "Day",
    value: `${ED_DAYNAME[e.day]} · ${e.date}`
  }), /*#__PURE__*/React.createElement(Fact, {
    label: "Time",
    value: `${e.hour} ${e.ampm}`
  }), /*#__PURE__*/React.createElement(Fact, {
    label: "Venue",
    value: e.venue,
    color: dayC
  }), /*#__PURE__*/React.createElement(Fact, {
    label: "Neighborhood",
    value: e.neighborhood
  }), /*#__PURE__*/React.createElement(Fact, {
    label: "Admission",
    value: ED_ADM[e.admission] || "See host"
  }), age && /*#__PURE__*/React.createElement(Fact, {
    label: "Age",
    value: age
  }), e.going != null && /*#__PURE__*/React.createElement(Fact, {
    label: "Going",
    value: `${e.going}`,
    color: "var(--neon-yellow)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(EdBtn, {
    accent: "lime",
    size: "sm",
    onClick: ticketed ? tickets : directions,
    style: {
      width: "100%"
    }
  }, ticketed ? "Get Tickets" : "Get Directions")))), moreThatDay.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: "var(--space-16)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      fontSize: "1.5rem",
      textTransform: "uppercase",
      color: dayC
    }
  }, "More on ", ED_DAYNAME[e.day]), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 2,
      background: "var(--border-default)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "pg-list"
  }, moreThatDay.map(x => /*#__PURE__*/React.createElement(EdRow, {
    key: x.id,
    href: "#",
    day: x.day,
    title: x.title,
    venue: x.venue,
    when: `${x.hour} ${x.ampm} · ${x.neighborhood}`,
    types: edTypes(x).slice(0, 2),
    admission: x.admission,
    age: x.tags.includes("21+") ? "21_PLUS" : x.tags.includes("All Ages") ? "ALL_AGES" : undefined,
    going: x.going,
    onClick: ev => {
      ev.preventDefault();
      if (ev.target.closest("button")) return;
      onOpen(x.id);
    }
  }))))));
}
Object.assign(window, {
  PGEventDetailScreen: EventDetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/EventDetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/EventsScreen.jsx
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
  onRsvp,
  onNav,
  onOpen
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
  }, "Portland's queer events, all in one place"), /*#__PURE__*/React.createElement("h1", {
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
  }, "Every queer party, parade, show, and gathering in Portland, all in one place."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(EvBtn, {
    accent: "lime",
    arrow: true,
    onClick: () => onNav && onNav("schedule")
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
    onRsvp: () => onRsvp(e.id),
    onClick: ev => {
      ev.preventDefault();
      if (ev.target.closest("button")) return;
      onOpen(e.id);
    }
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
    onSave: () => onSave(e.id),
    onClick: ev => {
      ev.preventDefault();
      if (ev.target.closest("button")) return;
      onOpen(e.id);
    }
  })))));
}
Object.assign(window, {
  PGEventsScreen: EventsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/EventsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/HomeScreen.jsx
try { (() => {
/* HomeScreen. Structure mirrors client/src/pages/Home.tsx on master:
   hero → stat strip → up next → seam → community boards → directory teaser. */
const {
  Button: HBtn,
  PosterCard: HPoster,
  SectionHeader: HSection,
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
function useCountUp(target, duration = 1400) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!target) {
      setN(0);
      return;
    }
    let raf, start;
    const tick = t => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

/* Live hero: kicker + wordmark + two CTAs. Stats live in the strip below. */
function Hero({
  onNav
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "pg-hero",
    "aria-label": "Zaylist hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-hero__dot",
    "aria-hidden": "true"
  }), "Portland nights \xB7 all year"), /*#__PURE__*/React.createElement("img", {
    className: "pg-hero__wordmark",
    src: window.__resources && window.__resources.zlWordmark || "./untitled---july-24-2026-at-01-41-04-3-mryphizr-xfp7.png",
    alt: "Zaylist",
    style: {
      width: "min(560px, 82%)",
      height: "auto",
      display: "block",
      margin: "4px 0 30px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-hero__cta"
  }, /*#__PURE__*/React.createElement("a", {
    className: "pg-hero__btn pg-hero__btn--primary",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("events");
    }
  }, "View all events \u2192"), /*#__PURE__*/React.createElement("a", {
    className: "pg-hero__btn pg-hero__btn--river",
    href: "#",
    onClick: e => e.preventDefault()
  }, "Headed to the river? \u2192"))));
}
function StatStrip({
  eventCount,
  placesCount,
  goingCount
}) {
  const n = useCountUp(eventCount);
  const cells = [{
    v: n,
    label: "next 7 days",
    grad: "linear-gradient(90deg,#CCFF00,#39FF14)"
  }, {
    v: placesCount,
    label: "Places to back",
    grad: "linear-gradient(90deg,#00FFFF,#0044FF)"
  }, {
    v: goingCount,
    label: "Going to events",
    grad: "linear-gradient(90deg,#FF00CC,#FF6600)"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-statstrip",
    "aria-label": "Live site stats"
  }, cells.map((c, i) => /*#__PURE__*/React.createElement("div", {
    className: "pg-statstrip__cell",
    key: c.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-statstrip__value",
    style: {
      backgroundImage: c.grad
    }
  }, c.v), /*#__PURE__*/React.createElement("div", {
    className: "pg-statstrip__label",
    style: {
      backgroundImage: c.grad
    }
  }, c.label))));
}
const BOARDS = [{
  key: "spotted",
  name: "Missed Connections",
  c: "#FF00CC",
  desc: "Anonymous missed connections. Say the thing you didn't get to say.",
  mantra: "Stay kind · stay anonymous · reveal when ready"
}, {
  key: "gifting",
  name: "Gifting",
  c: "#CCFF00",
  desc: "A free board. Give what you can, take what you need. No money changes hands.",
  mantra: "Keep it free · keep it kind · keep it moving"
}, {
  key: "gigboard",
  name: "Gig Board",
  c: "#6E3DFF",
  desc: "Two-way work board. Performers, hosts, crew. Get paid, get help.",
  mantra: "Need work? Need help? Both belong here."
}];
const DIRECTORY_CHIPS = [{
  label: "Bars",
  color: "var(--cat-bars, #FF00CC)"
}, {
  label: "Food",
  color: "var(--cat-food, #FF6600)"
}, {
  label: "Cafes",
  color: "var(--cat-cafes, #FFEE00)"
}, {
  label: "Venues",
  color: "var(--cat-venues, #00FFFF)"
}, {
  label: "Shops",
  color: "var(--cat-shops, #8800FF)"
}];
function HomeScreen({
  data,
  saved,
  onSave,
  onRsvp,
  onNav,
  onOpen
}) {
  const upNext = data.EVENTS.filter(e => e.featured).slice(0, 4);
  const going = data.EVENTS.reduce((sum, e) => sum + (e.going || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-home"
  }, /*#__PURE__*/React.createElement(Hero, {
    onNav: onNav
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement(StatStrip, {
    eventCount: data.EVENTS.length,
    placesCount: data.PLACES.length,
    goingCount: going
  }), /*#__PURE__*/React.createElement("section", {
    className: "pg-section pg-upnext",
    "aria-label": "Up next"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-upnext__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-upnext__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-upnext__dot",
    "aria-hidden": "true"
  }), "Up next"), /*#__PURE__*/React.createElement("span", {
    className: "pg-upnext__lede"
  }, "Coming up next on Zaylist:")), /*#__PURE__*/React.createElement("div", {
    className: "pg-poster-grid"
  }, upNext.map(e => /*#__PURE__*/React.createElement(HPoster, {
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
    onRsvp: () => onRsvp(e.id),
    onClick: ev => {
      ev.preventDefault();
      if (ev.target.closest("button")) return;
      onOpen(e.id);
    }
  })))), /*#__PURE__*/React.createElement(HDivider, {
    seam: true
  }), /*#__PURE__*/React.createElement("section", {
    className: "pg-section pg-boards",
    "aria-label": "Community boards"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__running"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-boards__dot",
    "aria-hidden": "true"
  }), "The Community Boards"), /*#__PURE__*/React.createElement("a", {
    className: "pg-boards__all",
    href: "#",
    onClick: e => e.preventDefault()
  }, "All Boards \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__header"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "pg-boards__title"
  }, "Show up for ", /*#__PURE__*/React.createElement("span", {
    className: "hl"
  }, "each other")), /*#__PURE__*/React.createElement("p", {
    className: "pg-boards__sub"
  }, "Miss a connection, give something away, or line up a gig. The boards where the scene looks out for each other.")), /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__grid"
  }, BOARDS.map(b => /*#__PURE__*/React.createElement("a", {
    key: b.key,
    href: "#",
    className: "pg-boards__utility pdx-glass-card pdx-glass-card--left-accent",
    style: {
      "--c": b.c
    },
    onClick: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__utility-name"
  }, b.name), /*#__PURE__*/React.createElement("p", {
    className: "pg-boards__utility-desc"
  }, b.desc), /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__utility-mantra"
  }, b.mantra)))), /*#__PURE__*/React.createElement("div", {
    className: "pg-boards__foot"
  }, /*#__PURE__*/React.createElement(HBtn, {
    accent: "lime",
    size: "lg",
    arrow: true
  }, "Post to a Board"), /*#__PURE__*/React.createElement("span", {
    className: "pg-boards__foot-note"
  }, "Free to post. Be kind. Take care of each other."))), /*#__PURE__*/React.createElement("section", {
    className: "pg-section pg-dirteaser",
    "aria-label": "Directory"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-dirteaser__kicker"
  }, "The directory for us"), /*#__PURE__*/React.createElement("h3", {
    className: "pg-dirteaser__title"
  }, "Spend here, keep the nights open"), /*#__PURE__*/React.createElement("p", {
    className: "pg-dirteaser__copy"
  }, "Bars, cafes, shops, and venues that are ours, or truly for us. Filter by category, find them on the map."), /*#__PURE__*/React.createElement("div", {
    className: "pg-dirteaser__chips"
  }, DIRECTORY_CHIPS.map(c => /*#__PURE__*/React.createElement("span", {
    key: c.label,
    className: "pg-dirteaser__chip",
    style: {
      color: c.color,
      borderColor: c.color
    }
  }, c.label))), /*#__PURE__*/React.createElement("a", {
    className: "pg-dirteaser__cta",
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav("places");
    }
  }, "Browse the directory \u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "pg-seam-wrap"
  }, /*#__PURE__*/React.createElement(HDivider, {
    seam: true
  })));
}
Object.assign(window, {
  PGHomeScreen: HomeScreen,
  pgWhenLine: whenLine,
  pgAgeOf: ageOf,
  pgTypesOf: typesOf
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/HubScreen.jsx
try { (() => {
/* HubScreen, the signed-in dashboard: hero, profile, stat pills, and
   inbox / weather / event / connections panels. */
const {
  Button: HbBtn,
  StatPill: HbStatPill,
  Countdown: HbCountdown,
  StickerBadge: HbSticker,
  Avatar: HbAvatar
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
  }, /*#__PURE__*/React.createElement("section", {
    className: "pg-hub__hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__hero-wash",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__hero-rainbow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__hero-content"
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
  }, "Community-run and free. Manage your submissions and claims, board posts, and inbox threads in one place."))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__profile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-hub__id"
  }, /*#__PURE__*/React.createElement(HbAvatar, {
    name: "Tucker PDMAX",
    ring: "progress",
    size: 76,
    status: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  }, "Missed Connections"), /*#__PURE__*/React.createElement(HbStatPill, {
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
  }, "No threads yet. Replies from Missed Connections, Gig Werk, event hosts, and check-ins show up here."), /*#__PURE__*/React.createElement("div", {
    className: "pg-quickrow"
  }, /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost",
    size: "sm"
  }, "Missed Connections"), /*#__PURE__*/React.createElement(HbBtn, {
    variant: "ghost",
    size: "sm"
  }, "Gig Werk"), /*#__PURE__*/React.createElement(HbBtn, {
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
  }, "This week's events"), /*#__PURE__*/React.createElement("span", {
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
  }, "Events"), /*#__PURE__*/React.createElement(HbStatPill, {
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
  }, "Portland \xB7 This week"), /*#__PURE__*/React.createElement(HbCountdown, {
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
  }, "Sad Girl Summer, Festival Edition"))))), /*#__PURE__*/React.createElement("div", {
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/HubScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/NudeBeachesScreen.jsx
try { (() => {
/* NudeBeachesScreen. Recreated from master, not reinvented:
   pages/NudeBeaches.tsx (page order), components/NudeBeachesHero.tsx (BoardHero kicker/title/lede
   + BoardStatsBar three stats), components/NudeBeachesHubPanel.tsx (weather + river level /
   water quality + parking sections), shared/nudeBeaches.ts (all constants and copy).
   The snapshot values below stand in for GET /api/nude-beaches. */
const {
  Button: NBBtn,
  MapPanel: NBMap,
  Divider: NBDivider
} = window.PDXPrideGuideDesignSystem_b20420;
const NB_TABS = [{
  key: "rooster-rock",
  label: "Rooster Rock"
}, {
  key: "sauvie-island",
  label: "Sauvie Island"
}];

/* Sample snapshot. Numbers follow the real derivations in shared/nudeBeaches.ts:
   crossingBandLabel(12.4) → "Wade or walk", crossingVerdictFromLevel(12.4) → the advice line. */
const SNAP = {
  fetchedAt: "Sat, Jul 25, 3:40 PM",
  roosterRock: {
    airTempF: 84,
    waterTempF: 71,
    waterTempSite: "Warrendale",
    wind: "NW 8 to 12 mph",
    windStat: {
      value: "NW 8 to 12",
      label: "Wind · mph"
    },
    riverLevelFt: 12.4,
    crossingBand: "Wade or walk",
    crossingAdvice: "The water's low, you can likely wade, or even walk, to Sand Island.",
    todayLowFt: 11.82,
    todayLowAt: "5:40 AM",
    todayHighFt: 13.1,
    todayHighAt: "4:15 PM",
    levelTrend: "Falling",
    crossingWindowNote: "Best crossing window is late morning.",
    weatherSummary: "Sunny and warm through the afternoon.",
    waterClarity: "Likely clear",
    airQuality: "Good · AQI 38"
  },
  sauvieIsland: {
    swimStatusLabel: "PASSED",
    swimColor: "#39FF14",
    lastSampleAt: "Jul 24",
    swimSummary: "Collins Beach is sampled bi-weekly through the Swim Guide. Verify the current sample before you get in.",
    parkingStatusLabel: "DAY PASS",
    parkingNote: "Mandatory on summer weekends through Labor Day. Buy a daily day pass online, seasonal sold-out is not the same as day passes gone.",
    airTempF: 82,
    wind: "N 6 to 10 mph",
    windStat: {
      value: "N 6 to 10",
      label: "Wind · mph"
    },
    dayHigh: 86,
    dayName: "Saturday",
    weatherSummary: "Partly sunny, light wind off the channel."
  }
};
const HERO = {
  "rooster-rock": {
    accent: "#FF6600",
    kicker: "Columbia River · Corbett",
    title: ["Rooster", "Rock"],
    lede: "River level, air and water temps, forecast, directions, and day-use parking pass info, plus a GPS group chat that unlocks once you're actually on the beach."
  },
  "sauvie-island": {
    accent: "#39FF14",
    kicker: "Sauvie Island · Collins Beach",
    title: ["Sauvie", "Island"],
    lede: "Swim Guide water quality, Sauvie Island Parking permits, island weather, and the links Collins Beach travelers use."
  }
};
const ROOSTER_FEES = [{
  label: "Oregon residents",
  value: "$10 / vehicle / day"
}, {
  label: "Out of state",
  value: "$12 / vehicle / day"
}, {
  label: "Annual pass · OR",
  value: "$60 / year"
}, {
  label: "Annual pass · out of state",
  value: "$75 / year"
}];
const ROOSTER_ACTIONS = [{
  label: "Buy day-use permit",
  href: "https://stateparks.oregon.gov/index.cfm?do=visit.day-use",
  primary: true
}, {
  label: "Where to buy passes",
  href: "https://stateparks.oregon.gov/index.cfm?do=v.page&id=30"
}, {
  label: "Official park page",
  href: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=126"
}];
const ROOSTER_MAPS = [{
  label: "Google Maps directions",
  href: "https://www.google.com/maps/dir/?api=1&destination=Rooster+Rock+State+Park%2C+Corbett%2C+OR"
}, {
  label: "Apple Maps directions",
  href: "https://maps.apple.com/?daddr=Rooster+Rock+State+Park,+Corbett,+OR&dirflg=d"
}, {
  label: "Crossing map",
  href: "https://roosterrockcrossing.com/#map"
}, {
  label: "OpenStreetMap",
  href: "https://www.openstreetmap.org/?mlat=45.5446&mlon=-122.2342#map=15/45.5446/-122.2342"
}];
const SAUVIE_MAPS = [{
  label: "Google Maps directions",
  href: "https://www.google.com/maps/dir/?api=1&destination=Collins+Beach,+Sauvie+Island,+OR"
}, {
  label: "Apple Maps directions",
  href: "https://maps.apple.com/?daddr=Collins+Beach,+Sauvie+Island,+OR&dirflg=d"
}, {
  label: "OpenStreetMap",
  href: "https://www.openstreetmap.org/?mlat=45.793&mlon=-122.789#map=14/45.793/-122.789"
}];
const SAUVIE_CHECKLIST = [{
  step: "Check permit status",
  detail: "Weekends and holidays through Labor Day need a beaches permit. Seasonal passes may be sold out, buy a daily $10 day pass online for your date (not the same as season sold-out).",
  link: {
    label: "Sauvie Island Parking",
    href: "https://sauvieislandparking.com/"
  }
}, {
  step: "Check water safety",
  detail: "If you plan to swim, verify the latest Collins Beach sample before you go.",
  link: {
    label: "Swim Guide",
    href: "https://www.theswimguide.org/beach/1792"
  }
}, {
  step: "Review wildlife-area rules",
  detail: "Alcohol is prohibited on all beaches. Day-use hours are 4 a.m. to 10 p.m. Check SICA for road or bridge alerts."
}];
const SAUVIE_RULES = ["Alcohol is strictly prohibited on all beaches in the Sauvie Island Wildlife Area.", "Day-use hours are 4 a.m. to 10 p.m. in the wildlife area.", "Collins Beach is partly clothing-optional, wild, sandy, and on the island's western shore.", "Parking permits are required on busy days through Labor Day, daily day passes are sold online, seasonal sold-out does not mean no parking."];
const SAUVIE_FARMS = [{
  title: "Sauvie Island Farms",
  desc: "Berries, flowers, and u-pick fields, one of the island's classic farm stops on the road to Collins.",
  href: "http://www.sauvieislandfarms.com/"
}, {
  title: "The Pumpkin Patch & Corn Maze",
  desc: "Farm market, animals, and seasonal produce, a Sauvie Island institution year-round.",
  href: "https://www.thepumpkinpatch.com/"
}, {
  title: "Topaz Farm",
  desc: "Organic farm stand with produce, flowers, and pasture-raised eggs, great mid-island detour.",
  href: "https://topazfarm.com/"
}, {
  title: "Columbia Farms U-Pick",
  desc: "Seasonal berries and produce on the north end, check what's picking before you swing by.",
  href: "https://www.columbiafarmsu-pick.com/"
}];

/* BoardStatsBar, variant="band", three stats, no LIVE dot. */
function StatsBar({
  stats
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "nb-band"
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    className: "nb-band__cell",
    key: s.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-band__num",
    style: {
      color: s.color
    }
  }, s.num), /*#__PURE__*/React.createElement("div", {
    className: "nb-band__label"
  }, s.label))));
}
function WeatherSection({
  main,
  mainLabel,
  stats,
  summary,
  extra
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "nb-hub__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__weather-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__kicker"
  }, "Weather"), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__sun",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "30",
    height: "30",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#ffc14a",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__weather-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__weather-main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__weather-value"
  }, main), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__weather-label"
  }, mainLabel)), stats.map(s => /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__weather-stat",
    key: s.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__weather-stat-value"
  }, s.value), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__weather-stat-label"
  }, s.label)))), /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__summary"
  }, summary), extra ? /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__summary",
    style: {
      marginTop: 8
    }
  }, extra) : null);
}
function RoosterHub() {
  const live = SNAP.roosterRock;
  return /*#__PURE__*/React.createElement("div", {
    className: "nb-hub"
  }, /*#__PURE__*/React.createElement(WeatherSection, {
    main: `${live.airTempF}°F`,
    mainLabel: "Air temp",
    stats: [{
      value: live.wind,
      label: "Wind"
    }, {
      value: `${live.waterTempF}°F`,
      label: `Water · ${live.waterTempSite}`
    }, {
      value: live.airQuality.split(" · ")[0],
      label: "Air quality"
    }],
    summary: live.weatherSummary,
    extra: live.waterClarity
  }), /*#__PURE__*/React.createElement("section", {
    className: "nb-hub__section nb-hub__level"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__level-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__kicker"
  }, "River level"), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__badge"
  }, live.crossingBand)), /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__level-value"
  }, live.riverLevelFt.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__level-unit"
  }, "ft")), /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__level-detail"
  }, live.crossingAdvice), /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__level-range"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__range-label"
  }, "Today's low"), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__range-value"
  }, live.todayLowFt.toFixed(2), " ft \xB7 ", live.todayLowAt)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__range-label"
  }, "Today's high"), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__range-value"
  }, live.todayHighFt.toFixed(2), " ft \xB7 ", live.todayHighAt))), /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__advice"
  }, live.levelTrend, " over the last hour. ", live.crossingWindowNote), /*#__PURE__*/React.createElement("a", {
    className: "nb-hub__link",
    href: "https://roosterrockcrossing.com",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Charts & history \u2192")));
}
function SauvieHub() {
  const live = SNAP.sauvieIsland;
  return /*#__PURE__*/React.createElement("div", {
    className: "nb-hub"
  }, /*#__PURE__*/React.createElement(WeatherSection, {
    main: `${live.airTempF}°F`,
    mainLabel: "Air temp",
    stats: [{
      value: live.wind,
      label: "Wind"
    }, {
      value: `${live.dayHigh}°F`,
      label: `${live.dayName} high`
    }, {
      value: live.parkingStatusLabel,
      label: "Parking"
    }],
    summary: live.weatherSummary
  }), /*#__PURE__*/React.createElement("section", {
    className: "nb-hub__section nb-hub__swim",
    style: {
      "--nb-rim": live.swimColor
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__kicker"
  }, "Water quality"), /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__swim-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__swim-value",
    style: {
      color: live.swimColor,
      textShadow: `0 0 22px ${live.swimColor}59`
    }
  }, live.swimStatusLabel), /*#__PURE__*/React.createElement("span", {
    className: "nb-hub__swim-sampled"
  }, "sampled ", live.lastSampleAt)), /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__summary"
  }, live.swimSummary), /*#__PURE__*/React.createElement("a", {
    className: "nb-hub__link",
    href: "https://www.theswimguide.org/beach/1792",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Swim Guide \u2192")), /*#__PURE__*/React.createElement("section", {
    className: "nb-hub__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-hub__kicker"
  }, "Parking permits"), /*#__PURE__*/React.createElement("p", {
    className: "nb-hub__summary"
  }, live.parkingNote), /*#__PURE__*/React.createElement("a", {
    className: "nb-hub__link",
    href: "https://sauvieislandparking.com/",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Sauvie Island Parking \u2192")));
}
function RoosterLogistics() {
  return /*#__PURE__*/React.createElement("div", {
    className: "nb-log"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-log__kicker",
    style: {
      color: HERO["rooster-rock"].accent
    }
  }, "Trip logistics \xB7 Rooster Rock"), /*#__PURE__*/React.createElement("h2", {
    className: "nb-log__title"
  }, "Parking & pass"), /*#__PURE__*/React.createElement("p", {
    className: "nb-log__lede"
  }, "Rooster Rock State Park \xB7 I-84 Exit 25 \xB7 Corbett, OR. Day-use only, pay at the fee machine or the QR on site, or bring an Oregon State Parks pass."), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__fees"
  }, ROOSTER_FEES.map(f => /*#__PURE__*/React.createElement("div", {
    className: "nb-fee",
    key: f.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-fee__label"
  }, f.label), /*#__PURE__*/React.createElement("div", {
    className: "nb-fee__value"
  }, f.value)))), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__actions"
  }, ROOSTER_ACTIONS.map(a => /*#__PURE__*/React.createElement("a", {
    key: a.label,
    className: `nb-maplink ${a.primary ? "is-primary" : ""}`,
    href: a.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, a.label))));
}
function SauvieLogistics() {
  const green = HERO["sauvie-island"].accent;
  return /*#__PURE__*/React.createElement("div", {
    className: "nb-log"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-log__kicker",
    style: {
      color: green
    }
  }, "Trip logistics \xB7 Collins Beach"), /*#__PURE__*/React.createElement("h2", {
    className: "nb-log__title"
  }, "Before you go"), /*#__PURE__*/React.createElement("p", {
    className: "nb-log__lede"
  }, "Three checks before you point the car at the bridge. Collins Beach is wild, sandy, and worth the small bit of prep."), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__steps"
  }, SAUVIE_CHECKLIST.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "nb-step",
    key: s.step
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-step__num",
    style: {
      color: green,
      borderColor: green
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    className: "nb-step__title"
  }, s.step), /*#__PURE__*/React.createElement("p", {
    className: "nb-step__detail"
  }, s.detail), s.link ? /*#__PURE__*/React.createElement("a", {
    className: "nb-step__link",
    href: s.link.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, s.link.label, " \u2192") : null))), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__kicker nb-log__kicker--section",
    style: {
      color: green
    }
  }, "Know the rules"), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__rules"
  }, SAUVIE_RULES.map(r => /*#__PURE__*/React.createElement("div", {
    className: "nb-rule",
    key: r
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: green,
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })), /*#__PURE__*/React.createElement("p", {
    className: "nb-rule__text"
  }, r)))), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__kicker nb-log__kicker--section",
    style: {
      color: "var(--neon-yellow)"
    }
  }, "Farm stops on the drive"), /*#__PURE__*/React.createElement("p", {
    className: "nb-log__lede"
  }, /*#__PURE__*/React.createElement("strong", null, "Cracker Barrel Grocery"), " sits right after the bridge, your last easy stop for snacks, drinks, and supplies before the wildlife area. A few island classics on the drive out:"), /*#__PURE__*/React.createElement("div", {
    className: "nb-log__farms"
  }, SAUVIE_FARMS.map(f => /*#__PURE__*/React.createElement("a", {
    className: "nb-farm",
    key: f.href,
    href: f.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-farm__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nb-farm__title"
  }, f.title), /*#__PURE__*/React.createElement("span", {
    className: "nb-farm__arrow"
  }, "\u2192")), /*#__PURE__*/React.createElement("p", {
    className: "nb-farm__desc"
  }, f.desc)))));
}
function NudeBeachesScreen() {
  const [tab, setTab] = React.useState("rooster-rock");
  const isRooster = tab === "rooster-rock";
  const hero = HERO[tab];
  const r = SNAP.roosterRock,
    s = SNAP.sauvieIsland;
  const stats = isRooster ? [{
    num: `${r.airTempF}°`,
    label: "air temp",
    color: "#FF6600"
  }, {
    num: `${r.waterTempF}°`,
    label: "water temp",
    color: "#19e3ff"
  }, {
    num: r.windStat.value,
    label: r.windStat.label,
    color: "#FF6600"
  }] : [{
    num: s.swimStatusLabel,
    label: "Collins swim",
    color: "#39FF14"
  }, {
    num: `${s.airTempF}°`,
    label: "air temp",
    color: "#39FF14"
  }, {
    num: s.windStat.value,
    label: s.windStat.label,
    color: "#19e3ff"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-nb",
    style: {
      "--nb-accent": hero.accent
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "nb-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-herorow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-boardhero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-boardhero__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "nb-boardhero__dot",
    "aria-hidden": "true"
  }), hero.kicker), /*#__PURE__*/React.createElement("h1", {
    className: "nb-boardhero__title"
  }, hero.title[0], " ", /*#__PURE__*/React.createElement("span", {
    className: "nb-boardhero__title-accent"
  }, hero.title[1])), /*#__PURE__*/React.createElement("p", {
    className: "nb-boardhero__lede"
  }, hero.lede)), /*#__PURE__*/React.createElement("nav", {
    className: "nb-tabs",
    "aria-label": "Beach location"
  }, NB_TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    type: "button",
    className: `nb-tab ${tab === t.key ? "is-active" : ""}`,
    style: {
      "--nb-tab": HERO[t.key].accent
    },
    onClick: () => setTab(t.key)
  }, t.label)))), /*#__PURE__*/React.createElement(StatsBar, {
    stats: stats
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-refresh"
  }, /*#__PURE__*/React.createElement("p", {
    className: "nb-refresh__meta"
  }, isRooster ? "Rooster Rock" : "Sauvie Island", " \xB7 updated ", /*#__PURE__*/React.createElement("strong", null, SNAP.fetchedAt)), /*#__PURE__*/React.createElement(NBBtn, {
    accent: isRooster ? "orange" : "green",
    variant: "outline",
    size: "sm"
  }, "Refresh")), /*#__PURE__*/React.createElement("div", {
    className: "nb-maprow"
  }, isRooster ? /*#__PURE__*/React.createElement(RoosterHub, null) : /*#__PURE__*/React.createElement(SauvieHub, null), /*#__PURE__*/React.createElement("div", {
    className: "nb-mapwrap"
  }, /*#__PURE__*/React.createElement(NBMap, {
    height: isRooster ? 470 : 430,
    legend: false,
    showCityLabel: false,
    pins: isRooster ? [{
      x: 30,
      y: 62,
      day: "SUN"
    }, {
      x: 46,
      y: 54,
      day: "SAT"
    }, {
      x: 58,
      y: 44,
      day: "FRI"
    }, {
      x: 72,
      y: 38,
      day: "FRI"
    }, {
      x: 86,
      y: 30,
      multi: true
    }] : [{
      x: 34,
      y: 70,
      day: "SAT"
    }, {
      x: 48,
      y: 56,
      day: "SAT"
    }, {
      x: 60,
      y: 44,
      day: "THU"
    }, {
      x: 70,
      y: 32,
      multi: true
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    className: "nb-maplinks"
  }, (isRooster ? ROOSTER_MAPS : SAUVIE_MAPS).map(m => /*#__PURE__*/React.createElement("a", {
    key: m.href,
    className: "nb-maplink",
    href: m.href,
    target: "_blank",
    rel: "noopener noreferrer"
  }, m.label))), /*#__PURE__*/React.createElement("section", {
    className: "nb-brats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nb-brats__kicker"
  }, "River Brats \xB7 GPS group chat"), /*#__PURE__*/React.createElement("p", {
    className: "nb-brats__copy"
  }, "The beach chat unlocks once your location puts you on the sand. Coordinates are checked on the server and immediately discarded."), /*#__PURE__*/React.createElement(NBBtn, {
    variant: "outline",
    size: "sm",
    disabled: true
  }, "Locked until you are on the beach")), /*#__PURE__*/React.createElement(NBDivider, {
    seam: true
  }), /*#__PURE__*/React.createElement("section", {
    className: "pg-section"
  }, isRooster ? /*#__PURE__*/React.createElement(RoosterLogistics, null) : /*#__PURE__*/React.createElement(SauvieLogistics, null))));
}
Object.assign(window, {
  PGNudeBeachesScreen: NudeBeachesScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/NudeBeachesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/PlacesScreen.jsx
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
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/PlacesScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/ProfileScreen.jsx
try { (() => {
/* ProfileScreen, the public member profile (/u/:username).
   Mirrors client/src/pages/MemberProfile.tsx + components/profile/* on master:
   hero → stat strip (Followers · Hosting · Attended · Going) →
   hosting panel (Up Next / Past Events) → split (Top 8 + The Big One | Going + Updates)
   → flyer stash → close seam. */
const {
  Avatar: PPAvatar,
  Button: PPBtn,
  Divider: PPDivider
} = window.PDXPrideGuideDesignSystem_b20420;
const PP_MEMBER = {
  displayName: "Tucker Casey",
  username: "tucker_pdmax",
  accent: "#FF00CC",
  pronouns: "he/him",
  /* buildMetaLine(): location · affiliation · Since <memberYear> */
  metaLine: "Portland · Camp Bar PDX · Since 2024",
  isPromoter: true,
  bio: "Host, organizer, and the guy who built this thing. If it is loud, queer, and on a Saturday, I am probably there taking photos of it.",
  stats: {
    followers: 1240,
    hosting: 3,
    attended: 68,
    going: 5
  }
};
const PP_TOP8 = [{
  kind: "user",
  name: "Marisol Vega",
  handle: "marisolvega"
}, {
  kind: "place",
  name: "Camp Bar PDX"
}, {
  kind: "user",
  name: "Dee Okonkwo",
  handle: "deelite"
}, {
  kind: "place",
  name: "Sanctuary Club"
}, {
  kind: "user",
  name: "Ash Lindqvist",
  handle: "ashpdx"
}, {
  kind: "place",
  name: "Alberta Rose Theatre"
}, {
  kind: "user",
  name: "Rae Solis",
  handle: "raesolis"
}, {
  kind: "place",
  name: "CC Slaughters"
}];
function dayColor(day) {
  return {
    THU: "var(--day-thu, #00FFFF)",
    FRI: "var(--day-fri, #FF00CC)",
    SAT: "var(--day-sat, #39FF14)",
    SUN: "var(--day-sun, #FF6600)"
  }[day] || "var(--neon-cyan)";
}
function HostCard({
  e,
  past
}) {
  const adm = (e.admission || "").replace(/_/g, " ");
  const status = past ? e.going ? `ENDED · ${e.going} WENT` : "ENDED" : [e.going ? `${e.going} GOING` : null, adm].filter(Boolean).join(" · ");
  return /*#__PURE__*/React.createElement("article", {
    className: "hp-card",
    style: {
      "--hp-day": dayColor(e.day)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-card__banner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hp-card__day"
  }, past ? "PAST" : e.day)), /*#__PURE__*/React.createElement("div", {
    className: "hp-card__body"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "hp-card__title"
  }, e.title), /*#__PURE__*/React.createElement("div", {
    className: "hp-card__when"
  }, past ? "JUL 2025" : `${e.day} ${e.date.toUpperCase()} · ${e.hour}${e.ampm}`), /*#__PURE__*/React.createElement("div", {
    className: "hp-card__venue"
  }, e.venue), status ? /*#__PURE__*/React.createElement("div", {
    className: "hp-card__stat"
  }, status) : null));
}
function ProfileScreen({
  data
}) {
  const m = PP_MEMBER;
  const hostingNext = data.EVENTS.filter(e => e.featured).slice(0, 3);
  const hostingPast = data.EVENTS.slice(6, 9);
  const going = data.EVENTS.filter(e => !e.featured).slice(0, 4);
  const bigOne = hostingNext[0];
  const stash = data.EVENTS.slice(3, 11);
  const posts = [...(data.COMMUNITY.gigs || []), ...(data.COMMUNITY.gifting || [])].slice(0, 3);
  const partyNames = data.EVENTS.slice(0, 10).map(e => e.title);
  const stats = [{
    n: "1.2K",
    label: "Followers",
    color: "var(--text-hi)"
  }, {
    n: String(m.stats.hosting),
    label: "Hosting",
    color: "var(--neon-magenta)"
  }, {
    n: String(m.stats.attended),
    label: "Attended",
    color: "var(--text-hi)"
  }, {
    n: String(m.stats.going),
    label: "Going",
    color: "var(--neon-yellow)"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "pp-page",
    style: {
      "--pp-accent": m.accent
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-shell"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pp-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__banner",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__scrim",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__rainbow",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__identity"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__avatar"
  }, /*#__PURE__*/React.createElement(PPAvatar, {
    name: m.displayName,
    ring: "progress",
    size: 88
  })), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__name-row"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "pp-hero__name"
  }, m.displayName), m.isPromoter ? /*#__PURE__*/React.createElement("span", {
    className: "pp-role-sticker"
  }, "Promoter") : null), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__subrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-hero__handle"
  }, "@", m.username), /*#__PURE__*/React.createElement("span", {
    className: "pp-hero__chip"
  }, m.pronouns), /*#__PURE__*/React.createElement("span", {
    className: "pp-hero__meta-line"
  }, m.metaLine))), /*#__PURE__*/React.createElement("div", {
    className: "pp-hero__actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pp-btn pp-btn--follow"
  }, "Follow"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pp-btn pp-btn--message"
  }, "Message"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pp-btn pp-btn--outline"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "15",
    height: "15",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 6l-4-4-4 4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v13"
  })), "Share"))), /*#__PURE__*/React.createElement("p", {
    className: "pp-hero__bio"
  }, m.bio))), /*#__PURE__*/React.createElement("div", {
    className: "pp-stats",
    role: "group",
    "aria-label": "Profile stats"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "pp-stats__cell",
    key: s.label
  }, i > 0 ? /*#__PURE__*/React.createElement("span", {
    className: "pp-stats__divider",
    "aria-hidden": "true"
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "pp-stats__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-stats__num",
    style: {
      color: s.color
    }
  }, s.n), /*#__PURE__*/React.createElement("span", {
    className: "pp-stats__label"
  }, s.label))))), /*#__PURE__*/React.createElement("section", {
    className: "hp-panel",
    "aria-label": "Hosting"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-panel__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hp-panel__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hp-panel__dot",
    "aria-hidden": "true"
  }), "HOSTING"), /*#__PURE__*/React.createElement("span", {
    className: "hp-panel__badge"
  }, "PROMOTER")), /*#__PURE__*/React.createElement("div", {
    className: "hp-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-section__label"
  }, "UP NEXT"), /*#__PURE__*/React.createElement("div", {
    className: "hp-rail"
  }, hostingNext.map(e => /*#__PURE__*/React.createElement(HostCard, {
    key: e.id,
    e: e
  })))), /*#__PURE__*/React.createElement("div", {
    className: "hp-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-section__label"
  }, "PAST EVENTS"), /*#__PURE__*/React.createElement("div", {
    className: "hp-rail"
  }, hostingPast.map(e => /*#__PURE__*/React.createElement(HostCard, {
    key: e.id,
    e: e,
    past: true
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "pp-split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-split__left"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pp-top8",
    "aria-label": "Top 8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-top8__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__kick"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__dot",
    "aria-hidden": "true"
  }), "Top 8")), /*#__PURE__*/React.createElement("div", {
    className: "pp-top8__grid"
  }, PP_TOP8.map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "pp-top8__tile",
    key: t.name
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__rank"
  }, i + 1), t.kind === "user" ? /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__avatar"
  }, /*#__PURE__*/React.createElement(PPAvatar, {
    name: t.name,
    ring: "progress",
    size: 58
  })) : /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__logo"
  }, t.name.slice(0, 1)), /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__name"
  }, t.name), /*#__PURE__*/React.createElement("span", {
    className: "pp-top8__meta"
  }, t.kind === "user" ? "@" + t.handle : "Venue"))))), bigOne ? /*#__PURE__*/React.createElement("section", {
    className: "pp-big",
    style: {
      "--c": dayColor(bigOne.day)
    },
    "aria-label": "The big one"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-big__kicker"
  }, "The big one"), /*#__PURE__*/React.createElement("h3", {
    className: "pp-big__title"
  }, bigOne.title), /*#__PURE__*/React.createElement("div", {
    className: "pp-big__when"
  }, bigOne.day, " ", bigOne.date, " \xB7 ", bigOne.hour, " ", bigOne.ampm, " \xB7 ", bigOne.venue), /*#__PURE__*/React.createElement("div", {
    className: "pp-big__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-big__count"
  }, bigOne.going, " going"), /*#__PURE__*/React.createElement(PPBtn, {
    accent: "lime",
    size: "sm"
  }, "RSVP"))) : null), /*#__PURE__*/React.createElement("div", {
    className: "pp-split__right"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pp-rail",
    "aria-label": "Going"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-rail__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__label"
  }, "GOING"), /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__count"
  }, going.length, " UPCOMING")), /*#__PURE__*/React.createElement("div", {
    className: "pp-rail__list"
  }, going.map(e => /*#__PURE__*/React.createElement("div", {
    className: "pp-rail__row",
    key: e.id,
    style: {
      "--c": dayColor(e.day)
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__day"
  }, e.day), /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__title"
  }, e.title), /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__meta"
  }, e.hour, e.ampm, " \xB7 ", e.venue))))), /*#__PURE__*/React.createElement("section", {
    className: "pp-updates",
    "aria-label": "Updates"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__dot",
    "aria-hidden": "true"
  }), "UPDATES"), /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__meta"
  }, "POSTS BY TUCKER CASEY")), /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__rail"
  }, posts.map(p => /*#__PURE__*/React.createElement("article", {
    className: "pp-updates__card",
    key: p.id
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__card-top"
  }, /*#__PURE__*/React.createElement(PPAvatar, {
    name: m.displayName,
    ring: "progress",
    size: 40
  }), /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__card-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__card-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__name"
  }, m.displayName), /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__kick"
  }, p.role ? "Gigs" : "Gifting", " \xB7 2 DAYS AGO")), /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__badge",
    style: {
      color: p.role ? "#b06bff" : "#c8fa3c",
      borderColor: p.role ? "#b06bff" : "#c8fa3c"
    }
  }, p.role ? "GIG" : "GIFT")), /*#__PURE__*/React.createElement("h4", {
    className: "pp-updates__subject"
  }, p.role || p.item), /*#__PURE__*/React.createElement("p", {
    className: "pp-updates__text"
  }, p.text), p.where ? /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__kick"
  }, p.where) : null)), /*#__PURE__*/React.createElement("div", {
    className: "pp-updates__footer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__engage"
  }, "\u2665 ", /*#__PURE__*/React.createElement("b", null, "12"), " LIKE"), /*#__PURE__*/React.createElement("span", {
    className: "pp-updates__engage"
  }, "\uD83D\uDCAC ", /*#__PURE__*/React.createElement("b", null, "3"), " REPLY")))))))), /*#__PURE__*/React.createElement("section", {
    className: "pp-stash",
    "aria-label": "Flyer stash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pp-stash__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__label"
  }, "FLYER STASH"), /*#__PURE__*/React.createElement("span", {
    className: "pp-rail__count"
  }, stash.length, " NIGHTS")), /*#__PURE__*/React.createElement("div", {
    className: "pp-stash__grid"
  }, stash.map((e, i) => /*#__PURE__*/React.createElement("div", {
    className: "pp-stash__tile",
    key: e.id,
    style: {
      "--c": dayColor(e.day)
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pp-stash__role"
  }, i % 3 === 0 ? "MC" : "WENT"), /*#__PURE__*/React.createElement("span", {
    className: "pp-stash__title"
  }, e.title))))), /*#__PURE__*/React.createElement("footer", {
    className: "pp-close"
  }, /*#__PURE__*/React.createElement(PPDivider, {
    seam: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "pp-close__row"
  }, /*#__PURE__*/React.createElement("a", {
    className: "pp-close__url",
    href: "#",
    onClick: e => e.preventDefault()
  }, "zaylist.com/u/", m.username)))));
}
Object.assign(window, {
  PGProfileScreen: ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/ScheduleScreen.jsx
try { (() => {
/* ScheduleScreen, the weekly timeline view (source: Schedule.pdf export).
   Day columns, a left time axis, events placed by start + duration with
   overlap lanes, colored by day. MY SCHEDULE / ALL EVENTS toggle, filter
   chips with counts, and an "Export to Instagram Stories" CTA. */
const {
  Button: ScBtn,
  FilterChip: ScChip
} = window.PDXPrideGuideDesignSystem_b20420;
const DAY_COLOR = {
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const DAY_TEXT = {
  THU: "var(--day-thu)",
  FRI: "var(--day-fri)",
  SAT: "var(--day-sat)",
  SUN: "var(--day-sun)"
};
const HH = 64; // px per hour
const RANGE_START = 11; // 11 AM
const RANGE_END = 25; // 1 AM next day

function toDecimal(hour, ampm) {
  let [h, m] = hour.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + (m || 0) / 60;
}
function durationFor(e) {
  const t = e.tags.join(" ").toLowerCase();
  if (/parade|march/.test(t)) return 2;
  if (/sports/.test(t)) return 2.5;
  if (/market|outdoor|beer garden|block party/.test(t)) return 4;
  if (/techno|dance|disco|party|bear/.test(t)) return 4;
  if (/drag|comedy|qtbipoc/.test(t)) return 3;
  return 2.5;
}
function fmt(dec) {
  let h = Math.floor(dec) % 24;
  const m = Math.round((dec - Math.floor(dec)) * 60);
  const ap = h >= 12 ? "pm" : "am";
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return `${hr}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

/* greedy cluster + lane packing so only overlapping events split into columns */
function packDay(events) {
  const evs = events.map(e => {
    const start = toDecimal(e.hour, e.ampm);
    let end = start + durationFor(e);
    if (end > RANGE_END) end = RANGE_END;
    return {
      ...e,
      _start: start,
      _end: end
    };
  }).sort((a, b) => a._start - b._start || a._end - b._end);
  let clusterEnd = -1,
    cluster = [];
  const flush = () => {
    const lanes = [];
    cluster.forEach(ev => {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= ev._start + 0.001) {
          ev._lane = i;
          lanes[i] = ev._end;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev._lane = lanes.length;
        lanes.push(ev._end);
      }
    });
    cluster.forEach(ev => {
      ev._lanes = lanes.length;
    });
    cluster = [];
  };
  evs.forEach(ev => {
    if (cluster.length && ev._start < clusterEnd - 0.001) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev._end);
    } else {
      if (cluster.length) flush();
      cluster = [ev];
      clusterEnd = ev._end;
    }
  });
  if (cluster.length) flush();
  return evs;
}
function Heart({
  on,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "pg-ev__heart",
    "aria-pressed": on,
    "aria-label": on ? "Saved" : "Save",
    onClick: e => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: on ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
  })));
}
const FILTERS = [{
  key: "FREE",
  label: "Free",
  accent: "lime",
  test: e => e.admission === "FREE"
}, {
  key: "TICKETED",
  label: "Ticketed",
  accent: "cyan",
  test: e => e.admission === "TICKETED"
}, {
  key: "DONATION",
  label: "Donation",
  accent: "amber",
  test: e => e.admission === "SUGGESTED_DONATION"
}, {
  key: "DRAG",
  label: "Drag",
  accent: "pink",
  test: e => e.tags.includes("Drag")
}, {
  key: "DANCE",
  label: "Dance",
  accent: "purple",
  test: e => /Dance|Techno|Disco/.test(e.tags.join(" "))
}, {
  key: "SPORTS",
  label: "Sports",
  accent: "green",
  test: e => e.tags.includes("Sports")
}, {
  key: "OUTDOOR",
  label: "Outdoor",
  accent: "orange",
  test: e => e.tags.includes("Outdoor")
}, {
  key: "MARCHES",
  label: "Marches",
  accent: "cyan",
  test: e => /March|Parade/.test(e.tags.join(" "))
}, {
  key: "ALLAGES",
  label: "All Ages",
  accent: "lime",
  test: e => e.tags.includes("All Ages")
}, {
  key: "21",
  label: "21+",
  accent: "pink",
  test: e => e.tags.includes("21+")
}];
function ScheduleScreen({
  data,
  saved,
  onSave,
  onRsvp
}) {
  const [mine, setMine] = React.useState(false);
  const [active, setActive] = React.useState({});
  const activeKeys = Object.keys(active).filter(k => active[k]);
  const base = data.EVENTS.filter(e => {
    if (mine && !saved[e.id]) return false;
    if (activeKeys.length && !activeKeys.every(k => FILTERS.find(f => f.key === k).test(e))) return false;
    return true;
  });
  const days = data.DAYS.filter(d => base.some(e => e.day === d.key));
  const hours = [];
  for (let h = RANGE_START; h <= RANGE_END; h++) hours.push(h);
  return /*#__PURE__*/React.createElement("div", {
    className: "pg-sched"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-container"
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      paddingBlock: "var(--space-12) var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-kicker",
    style: {
      color: "var(--text-lo)"
    }
  }, "Zaylist / Events"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdx-marker"
  }, "Portland's queer events, all in one place")), /*#__PURE__*/React.createElement("h1", {
    className: "pdx-display",
    style: {
      fontSize: "var(--display-1)",
      margin: "16px 0 0"
    }
  }, "Schedule"), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: "54ch",
      marginTop: 12,
      color: "var(--text-mid)",
      fontSize: "var(--body-lg)"
    }
  }, "The whole week, side by side. Flip to just your RSVPs, filter by vibe, and build your nights. Take care of each other."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      alignItems: "center",
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: mine ? "is-active" : "",
    onClick: () => setMine(true)
  }, "My Schedule"), /*#__PURE__*/React.createElement("button", {
    className: !mine ? "is-active" : "",
    onClick: () => setMine(false)
  }, "All Events")), /*#__PURE__*/React.createElement("span", {
    className: "pg-sched__count"
  }, base.length, " Events"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(ScBtn, {
    accent: "pink",
    variant: "neon",
    arrow: true,
    onClick: () => onRsvp && onRsvp()
  }, "Export to Instagram Stories")), /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__filters",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pg-sched__flabel"
  }, "Filter"), FILTERS.map(f => /*#__PURE__*/React.createElement(ScChip, {
    key: f.key,
    accent: f.accent,
    selected: !!active[f.key],
    onToggle: () => setActive(m => ({
      ...m,
      [f.key]: !m[f.key]
    })),
    count: data.EVENTS.filter(f.test).length
  }, f.label))))), /*#__PURE__*/React.createElement("div", {
    className: "pg-container",
    style: {
      paddingBottom: "var(--space-16)"
    }
  }, days.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__empty"
  }, /*#__PURE__*/React.createElement("b", null, "Nothing saved yet"), "Tap the heart on events to build your schedule.")) : /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__headrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__gutter"
  }), days.map(d => /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__dh",
    key: d.key,
    style: {
      "--_c": DAY_COLOR[d.key]
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "day"
  }, d.label, " ", d.date.split(" ")[1]), /*#__PURE__*/React.createElement("span", {
    className: "cnt"
  }, base.filter(e => e.day === d.key).length, " Events")))), /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__body",
    style: {
      height: (RANGE_END - RANGE_START) * HH
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-sched__axis"
  }, hours.map(h => /*#__PURE__*/React.createElement("span", {
    className: "t",
    key: h,
    style: {
      top: (h - RANGE_START) * HH
    }
  }, fmt(h)))), days.map(d => {
    const packed = packDay(base.filter(e => e.day === d.key));
    return /*#__PURE__*/React.createElement("div", {
      className: "pg-sched__col",
      key: d.key,
      style: {
        "--_hh": HH + "px"
      }
    }, packed.map(e => {
      const top = (e._start - RANGE_START) * HH;
      const height = Math.max(34, (e._end - e._start) * HH - 5);
      const w = 100 / e._lanes;
      const compact = height < 70,
        tiny = height < 48;
      const narrow = e._lanes > 1;
      return /*#__PURE__*/React.createElement("a", {
        key: e.id,
        href: "#",
        className: `pg-ev ${compact ? "pg-ev--compact" : ""} ${tiny ? "pg-ev--tiny" : ""}`,
        onClick: ev => ev.preventDefault(),
        style: {
          top,
          height,
          left: `calc(${e._lane * w}% + 3px)`,
          width: `calc(${w}% - 6px)`,
          "--_c": DAY_COLOR[d.key],
          "--_ct": DAY_TEXT[d.key]
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "pg-ev__time"
      }, narrow ? fmt(e._start) : `${fmt(e._start)} – ${fmt(e._end)}`), /*#__PURE__*/React.createElement("span", {
        className: "pg-ev__title"
      }, e.title), /*#__PURE__*/React.createElement("span", {
        className: "pg-ev__venue"
      }, e.venue), /*#__PURE__*/React.createElement(Heart, {
        on: !!saved[e.id],
        onClick: () => onSave(e.id)
      }));
    }));
  }))))));
}
Object.assign(window, {
  PGScheduleScreen: ScheduleScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/ScheduleScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/data.js
try { (() => {
/* Real Portland Festival 2026 content pulled from zaylist.com.
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
    title: "Sasha Colby Kick-Off",
    venue: "Star Theater",
    neighborhood: "Old Town",
    admission: "TICKETED",
    featured: true,
    going: 42,
    tags: ["Drag", "21+", "Headliner"],
    blurb: "Headline performance by drag superstar Sasha Colby for Kick-Off."
  }, {
    id: 53,
    day: "THU",
    date: "Jul 16",
    hour: "7:00",
    ampm: "PM",
    title: "Sad Girl Summer, Festival Edition",
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
    title: "Portland Pickles Community Night",
    venue: "Walker Stadium",
    neighborhood: "SE Portland",
    admission: "TICKETED",
    tags: ["Sports", "All Ages"],
    blurb: "Community baseball vs. the Gresham Greywolves. On-field activities, vendors, from $12."
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
    blurb: "Kicking off the week with a BANG, a new queer-helmed techno night. DJs Sappho, Bro Hoe, Kraftwitch."
  },
  // ---- FRI JUL 17 ----
  {
    id: 51,
    day: "FRI",
    date: "Jul 17",
    hour: "5:00",
    ampm: "PM",
    title: "Midtown Beer Garden Bash",
    venue: "Midtown Beer Garden",
    neighborhood: "Downtown",
    admission: "FREE",
    tags: ["Outdoor", "All Ages"],
    blurb: "Official FestNW outdoor beer garden, open across events on Harvey Milk St."
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
    blurb: "Official festival night celebrating underground dance floors and leather bars. DJ Nick Bertossi."
  }, {
    id: 15,
    day: "FRI",
    date: "Jul 17",
    hour: "9:00",
    ampm: "PM",
    title: "Bearracuda Friday: Vaseline Alley",
    venue: "722 E Burnside",
    neighborhood: "Inner East",
    admission: "TICKETED",
    tags: ["Bears", "21+", "Sex Positive"],
    blurb: "Bearracuda Friday. Theme: Vaseline Alley. Harnesses and fetish gear encouraged."
  },
  // ---- SAT JUL 18 ----
  {
    id: 1,
    day: "SAT",
    date: "Jul 18",
    hour: "12:00",
    ampm: "PM",
    title: "Portland Waterfront Festival",
    venue: "Tom McCall Waterfront Park",
    neighborhood: "Downtown",
    admission: "SUGGESTED_DONATION",
    featured: true,
    going: 220,
    tags: ["Main Stage", "ASL", "All Ages"],
    blurb: "Official FestNW festival. 2026 theme: Made with Love. $10 suggested, no one turned away."
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
    blurb: "Rose City Roller Derby home-team championship Community Night. Food carts plus Plow Stop Bar."
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
    blurb: "Official FestNW Old Town activation. Unstoppable joy and radical love in Ankeny Alley."
  }, {
    id: 47,
    day: "SAT",
    date: "Jul 18",
    hour: "5:00",
    ampm: "PM",
    title: "Dyke March Portland",
    venue: "Downtown Portland",
    neighborhood: "Downtown",
    admission: "FREE",
    tags: ["March", "All Ages"],
    blurb: "Official FestNW event. Check portlandfestival.org for the exact start and route before attending."
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
    title: "Portland Festival Parade",
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
    title: "Portland Trans March",
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
    title: "The Sports Bra Block Party",
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
    title: "Chai & Roses Dance Party",
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
      title: "BOYeurism: Spectacular"
    }]
  }, {
    name: "Jackie's",
    category: "bars",
    address: "930 SE Sandy Blvd",
    description: "Laid-back queer-friendly bar on SE Sandy. Regular host of LGBTQ+ community nights and festival events.",
    events: [{
      day: "SUN",
      date: "Sun, Jul 19 · 3:00 PM",
      title: "Lumbertwink Plaid Patio Party"
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
      title: "Stank Yes Coach, PDX FEST"
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

  // Canonical accent per community board (mirrors the --board-* tokens):
  //   Missed Connections = magenta ("pink"), Gifting = acid yellow ("lime"), Gigs = violet ("purple").
  const BOARD_ACCENTS = {
    spotted: "pink",
    gifting: "lime",
    gigs: "purple"
  };

  // Community board (Missed Connections, Gifting / Free Board, Gigs)
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
      text: "FestNW seeking certified interpreters for main and north stage rotations. Flexible shifts across the weekend."
    }]
  };
  window.PDX_DATA = {
    EVENTS,
    DAYS,
    PLACES,
    PLACE_CATEGORIES,
    COMMUNITY,
    BOARD_ACCENTS
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/data.js", error: String((e && e.message) || e) }); }

// ui_kits/zaylist/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/zaylist/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AVATAR_RINGS = __ds_scope.AVATAR_RINGS;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.AdCard = __ds_scope.AdCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.BoardCard = __ds_scope.BoardCard;

__ds_ns.Countdown = __ds_scope.Countdown;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.FeedItem = __ds_scope.FeedItem;

__ds_ns.PlaceCard = __ds_scope.PlaceCard;

__ds_ns.PosterCard = __ds_scope.PosterCard;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatPill = __ds_scope.StatPill;

__ds_ns.StickerBadge = __ds_scope.StickerBadge;

__ds_ns.ActionRow = __ds_scope.ActionRow;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SearchInput = __ds_scope.SearchInput;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.HeroBanner = __ds_scope.HeroBanner;

__ds_ns.InfoTile = __ds_scope.InfoTile;

__ds_ns.Marquee = __ds_scope.Marquee;

__ds_ns.NavBar = __ds_scope.NavBar;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.MapLegend = __ds_scope.MapLegend;

__ds_ns.MapPanel = __ds_scope.MapPanel;

})();
