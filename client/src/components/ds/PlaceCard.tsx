// @ts-nocheck
import React, { useState } from "react";
import { Badge } from "./Badge";
import { Share2 } from "lucide-react";
import { placeGoogleMapsUrl, telHref } from "@/lib/placeLinks";
import { placePath } from "@shared/placeSlug";
import { sharePageLink } from "@/lib/shareEvent";
import VenueFollowButton from "@/components/VenueFollowButton";
import { PlaceCardMap } from "./PlaceCardMap";

/* PlaceCard = directory card - Card System.html "DIRECTORY CARDS" SoT
   (Directory cards redesign.zip). Shell composed from .pdx-glass-card +
   --glass-card-* keyed to the category accent, dual sheen (card ::after +
   .pdx-glass-sheen--specular), shared .pdx-refract-seam, 8% --neon-bloom,
   soft logo orb (not boxed poster floor), neon logo, 6px hover lift.
   Nonprofit keeps rainbow --_edge. */
const CSS = `
/* Little directory cards - SoT: 03-directory-cards / design image
   OLED near-black slab, soft category bloom, solid cat chip, neon logo.
   Follow/Share only on hover so resting state matches the clean design. */
.pdxPlace{
  position:relative; display:inline-block; width:100%; break-inside:avoid;
  margin:0 0 22px; border-radius:16px; cursor:default;
  animation:pgDirCardIn .55s var(--ease-out,ease) backwards;
  --c: var(--_c, var(--pink));
  --dir-gm: 60;
}
/* Master deep-glass slab - COMPOSED, not restated.
   The node carries .pdx-glass-card .pdx-glass-rebind, so fill, keyline, blur,
   corner sheen and floor bloom all come from --glass-card-* recomputed against
   the category accent (--c). The only outer glow is the 8% --neon-bloom.
   The old .pdxPlace__glow three-layer neon cloud (a retired thick glow frame)
   and the two hand-rolled shadow stacks are gone. */
.pdxPlace .pdxPlace__body{
  position:relative; z-index:1; border-radius:16px; overflow:hidden;
  box-shadow:var(--glass-card-shadow), var(--neon-bloom);
  padding:18px 16px 16px;
  display:flex; flex-direction:column; gap:12px;
  transition:filter .16s ease, box-shadow .16s ease, border-color .16s ease;
}
/* Rainbow / specialty edge (nonprofit, healthcare, realestate).
   Same --glass-card-bg, clipped to the padding box so the gradient border
   shows through the transparent 2px rim. */
.pdxPlace--edge .pdxPlace__body{
  background:var(--glass-card-bg), var(--_edge, linear-gradient(var(--c), var(--c)));
  background-origin:border-box;
  background-clip:padding-box, padding-box, border-box;
  border:2px solid transparent;
}
/* Second sheen: the corner sheen is .pdx-glass-card::after, the specular
   lower-right lobe is the shared .pdx-glass-sheen--specular primitive. */
/* Refract seam: shared .pdx-refract-seam. Only the inset is tightened here. */
.pdxPlace__seam{ left:10px; right:10px; }
.pdxPlace__seam.pdx-rainbow-rule{ left:10px; right:10px; box-shadow:none !important; }
.pdxPlace--clickable{ cursor:pointer; transition:transform .16s ease; }
.pdxPlace--clickable:hover{ transform:translateY(-6px) !important; }
.pdxPlace--clickable:hover .pdxPlace__body{
  filter:brightness(1.06) saturate(1.08);
}
/* Logo well - soft category orb under neon mark */
.pdxPlace__media{
  position:relative; height:148px; border-radius:0; overflow:visible;
  box-sizing:border-box;
  background:transparent;
  border:none;
  display:flex; align-items:center; justify-content:center;
  padding:14px 12px 8px; margin-bottom:0;
}
.pdxPlace__mediaGlow{
  position:absolute; left:50%; top:52%; width:86%; height:92%;
  transform:translate(-50%,-50%); border-radius:50%;
  background:radial-gradient(ellipse closest-side,
    color-mix(in srgb, var(--c) 38%, transparent),
    color-mix(in srgb, var(--c) 12%, transparent) 48%,
    transparent 72%);
  filter:blur(24px); z-index:2; pointer-events:none;
}
.pdxPlace__mediaScan{
  position:absolute; inset:0; pointer-events:none; opacity:.1; z-index:1;
  background:repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.16) 3px 4px);
}
.pdxPlace__logo{
  position:relative; z-index:3;
  max-width:100%; max-height:108px; width:auto; height:auto;
  object-fit:contain; object-position:center;
  mix-blend-mode:screen;
  filter:contrast(1.35) brightness(1.08) drop-shadow(0 0 16px color-mix(in srgb, var(--c) 55%, transparent));
}
.pdxPlace__logo--fallback{
  max-width:58%; max-height:96px; mix-blend-mode:normal;
  filter:drop-shadow(0 0 14px color-mix(in srgb, var(--c) 55%, transparent));
}
/* Solid category chip - filled accent, black type */
.pdxPlace__cat .pdxBadge,
.pdxPlace__cat [class*="Badge"],
.pdxPlace__cat > *{
  background:var(--c) !important;
  color:#050506 !important;
  border:none !important;
  box-shadow:none !important;
  font-weight:800 !important;
  letter-spacing:.05em;
  border-radius:6px !important;
  padding:5px 10px !important;
}
.pdxPlace__badges{ display:flex; flex-wrap:wrap; gap:7px; align-items:center; position:relative; z-index:1; }
.pdxPlace__opening{ }
.pdxPlace__name{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.38rem; line-height:1.02; letter-spacing:.01em; color:#fff; position:relative; z-index:1; }
.pdxPlace__grandDate{
  font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:0.98rem; line-height:1.1; letter-spacing:.04em;
  color:var(--neon-yellow,#FFEE00);
  margin-top:4px;
  text-shadow:0 0 12px color-mix(in srgb, var(--neon-yellow,#FFEE00) 55%, transparent);
  position:relative; z-index:1;
}
.pdxPlace__rows{ display:flex; flex-direction:column; gap:6px; position:relative; z-index:1; }
.pdxPlace__row{ display:flex; align-items:flex-start; gap:8px;
  font-family:var(--font-body); font-size:.86rem; color:#c4c0b6; line-height:1.4; }
.pdxPlace__row svg{ width:14px; height:14px; margin-top:2px; flex:none; opacity:1;
  stroke:var(--c); color:var(--c); }
/* Body copy - soft grey, not bright white. Clamp to 3 lines so long blurbs
   don't blow out card height (uniformity). */
.pdxPlace__desc{ margin:0; font-family:var(--font-body); font-size:.9rem; line-height:1.5;
  color:#8e8a82; position:relative; z-index:1;
  display:-webkit-box; -webkit-line-clamp:3; line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.pdxPlace__links{ display:flex; flex-wrap:wrap; gap:14px; margin-top:2px; position:relative; z-index:1; }
.pdxPlace__link{ display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-body); font-weight:var(--fw-bold,700); font-size:.86rem;
  color:var(--c); text-decoration:none; }
.pdxPlace__link:hover{ text-decoration:underline; text-underline-offset:3px; }
.pdxPlace__link svg{ width:15px; height:15px; }
.pdxPlace__events{ margin-top:2px; padding-top:12px; border-top:1px solid #1e1e24; position:relative; z-index:1; }
.pdxPlace__eventsHead{ display:flex; align-items:center; gap:8px; margin-bottom:9px;
  font-family:var(--font-display); font-weight:700; font-size:.78rem; letter-spacing:.06em;
  text-transform:uppercase; color:#8e8a82; }
.pdxPlace__eventsHead svg{ width:14px; height:14px; }
.pdxPlace__event{ padding:7px 0 7px 12px; border-left:3px solid var(--_ec,var(--cyan)); }
.pdxPlace__eventDate{ font-family:var(--font-body); font-weight:var(--fw-bold,700); font-size:.84rem;
  color:var(--_ec,var(--cyan)); }
.pdxPlace__eventTitle{ font-family:var(--font-body); font-size:.84rem; color:#fff; }
/* "+N more events" collapse link - keeps the schedule from running the card long */
.pdxPlace__eventsMore{ display:inline-block; margin-top:9px; padding-left:12px;
  font-family:var(--font-body); font-weight:var(--fw-bold,700); font-size:.8rem;
  color:var(--c); text-decoration:none; }
a.pdxPlace__eventsMore:hover{ text-decoration:underline; text-underline-offset:3px; }
.pdxPlace__eventsMore--static{ color:#8e8a82; }
.pdxPlace__promoters{ margin-top:2px; padding-top:12px; border-top:1px solid #1e1e24;
  font-family:var(--font-body); font-size:.82rem; color:#8e8a82; position:relative; z-index:1; }
.pdxPlace__promotersLabel{ font-family:var(--font-display); font-weight:700; font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase; color:#8e8a82; margin-bottom:6px; }
.pdxPlace__promoterChips{ display:flex; flex-wrap:wrap; gap:6px; }
.pdxPlace__promoterChip{ padding:3px 9px; border-radius:99px; font-size:.78rem;
  border:1px solid color-mix(in srgb, var(--c) 45%, transparent); color:var(--c); }
.pdxPlace__row a{ color:inherit; text-decoration:none; }
.pdxPlace__row a:hover{ text-decoration:underline; text-underline-offset:2px; }
/* Actions hidden at rest - design little cards are clean; show on hover/focus */
.pdxPlace__actions{
  position:absolute; top:10px; right:10px; z-index:4;
  display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;
  max-width:calc(100% - 20px);
  opacity:0; pointer-events:none;
  transition:opacity .16s ease;
}
.pdxPlace:hover .pdxPlace__actions,
.pdxPlace:focus-within .pdxPlace__actions{
  opacity:1; pointer-events:auto;
}
.pdxPlace__share{
  display:flex; align-items:center; gap:5px;
  padding:6px 11px; border-radius:999px; cursor:pointer;
  background:rgba(0,0,0,.72); border:1px solid color-mix(in srgb, var(--c) 60%, transparent);
  color:var(--c); font-family:var(--font-display); font-weight:700;
  font-size:.68rem; letter-spacing:.04em; text-transform:uppercase;
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
}
.pdxPlace__share:disabled{ opacity:.6; cursor:default; }
/* Main content column (full + compact share the same wrapper) */
.pdxPlace__main{
  display:flex; flex-direction:column; gap:12px; min-width:0;
  flex:1 1 auto; position:relative; z-index:1;
}
/* Compact wide - Directory dock list (design handoff 2026-07-28).
   Classes: pdxPlace--compact (from prop) and/or pdxPlace--wide (Directory). */
.pdxPlace--compact,
.pdxPlace--wide{ margin:0; }
.pdxPlace--compact .pdxPlace__body,
.pdxPlace--wide .pdxPlace__body{
  flex-direction:column; align-items:stretch; gap:0;
  padding:10px 14px 10px 10px; border-radius:12px;
}
.pdxPlace__compactRow{ display:contents; }
.pdxPlace--compact .pdxPlace__compactRow,
.pdxPlace--wide .pdxPlace__compactRow{
  display:grid; grid-template-columns:92px minmax(0,1fr) auto auto;
  align-items:center; gap:14px; min-width:0;
}
.pdxPlace--compact .pdxPlace__main,
.pdxPlace--wide .pdxPlace__main{ gap:5px; }
.pdxPlace--compact .pdxPlace__media,
.pdxPlace--wide .pdxPlace__media{
  flex:0 0 92px; width:92px; min-height:0; height:56px; padding:0; margin:0;
}
.pdxPlace--compact .pdxPlace__logo,
.pdxPlace--wide .pdxPlace__logo{ max-height:52px; }
.pdxPlace--compact .pdxPlace__logo--fallback,
.pdxPlace--wide .pdxPlace__logo--fallback{ max-height:48px; max-width:88%; }
.pdxPlace--compact .pdxPlace__mediaGlow,
.pdxPlace--wide .pdxPlace__mediaGlow{
  width:100%; height:118%; filter:blur(16px);
}
.pdxPlace--compact .pdxPlace__name,
.pdxPlace--wide .pdxPlace__name{
  font-size:1.06rem;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.pdxPlace--compact .pdxPlace__row a,
.pdxPlace--wide .pdxPlace__row a{
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0;
}
.pdxPlace--compact .pdxPlace__row,
.pdxPlace--wide .pdxPlace__row{ min-width:0; }
.pdxPlace--compact .pdxPlace__cat .pdxBadge,
.pdxPlace--compact .pdxPlace__cat [class*="Badge"],
.pdxPlace--compact .pdxPlace__cat > *,
.pdxPlace--compact .pdxPlace__opening .pdxBadge,
.pdxPlace--compact .pdxPlace__opening [class*="Badge"],
.pdxPlace--compact .pdxPlace__opening > *,
.pdxPlace--wide .pdxPlace__cat .pdxBadge,
.pdxPlace--wide .pdxPlace__cat [class*="Badge"],
.pdxPlace--wide .pdxPlace__cat > *,
.pdxPlace--wide .pdxPlace__opening .pdxBadge,
.pdxPlace--wide .pdxPlace__opening [class*="Badge"],
.pdxPlace--wide .pdxPlace__opening > *{
  font-size:.62rem !important; padding:3px 7px !important; border-radius:5px !important;
}
.pdxPlace--compact .pdxPlace__row,
.pdxPlace--wide .pdxPlace__row{ font-size:.78rem; }
.pdxPlace--compact .pdxPlace__row svg,
.pdxPlace--wide .pdxPlace__row svg{ width:12px; height:12px; }
.pdxPlace--compact .pdxPlace__badges,
.pdxPlace--wide .pdxPlace__badges{ gap:6px; }
.pdxPlace--compact .pdxPlace__actions,
.pdxPlace--wide .pdxPlace__actions{ top:6px; right:8px; }
.pdxPlaceMap{ display:contents; }
.pdxPlaceMap__toggle{
  min-width:76px; min-height:44px; padding:8px 10px;
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  border-radius:999px; cursor:pointer; color:var(--c);
  font-family:var(--font-display); font-weight:800; font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase;
}
.pdxPlaceMap__toggle:focus-visible{ outline:3px solid var(--chrome-focus,var(--cyan)); outline-offset:3px; }
.pdxPlaceMap__chevron{ transition:transform .24s var(--ease-out,ease); }
.pdxPlaceMap--expanded .pdxPlaceMap__chevron{ transform:rotate(180deg); }
.pdxPlaceMap__reveal{
  grid-column:1 / -1;
  display:grid; grid-template-rows:0fr; opacity:0;
  transition:grid-template-rows .34s var(--ease-out,ease), opacity .2s ease, margin-top .34s var(--ease-out,ease);
}
.pdxPlaceMap--expanded .pdxPlaceMap__reveal{ grid-template-rows:1fr; opacity:1; margin-top:10px; }
.pdxPlaceMap__well{
  position:relative; min-height:0; overflow:hidden; border-radius:10px;
  background:var(--map-surface-bg,#06060a); border:1px solid #000;
  box-shadow:var(--map-frame-shadow); isolation:isolate;
}
.pdxPlaceMap--expanded .pdxPlaceMap__well{ min-height:clamp(176px,24vw,230px); }
.pdxPlaceMap__live{ position:absolute; inset:0; }
.pdxPlaceMap__live .leaflet-container{ height:100%; width:100%; background:var(--map-surface-bg,#06060a); }
.pdxPlaceMap__tiles{ position:absolute; inset:0; opacity:0; transition:opacity .24s ease; }
.pdxPlaceMap__tiles--ready{ opacity:.76; }
.pdxPlaceMap__tiles img{ position:absolute; width:256px; height:256px; max-width:none; user-select:none; }
.pdxPlaceMap__loading{
  position:absolute; inset:0;
  background:linear-gradient(105deg,#08080b 20%,#15151c 38%,#08080b 56%);
  background-size:200% 100%; animation:pdxPlaceMapLoad 1.2s linear infinite;
}
.pdxPlaceMap__well::after{
  content:""; position:absolute; inset:0; z-index:2; pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.18),transparent 42%,rgba(0,0,0,.86));
}
.pdxPlaceMap__pin{
  position:absolute; z-index:3; left:50%; top:46%; transform:translate(-50%,-50%);
  display:grid; place-items:center; color:var(--c);
  filter:drop-shadow(0 3px 5px #000) drop-shadow(0 0 7px color-mix(in srgb,var(--c) 48%,transparent));
  animation:pdxPlaceMapPin .38s var(--ease-out,ease) both;
}
.pdxPlaceMap__caption{
  position:absolute; z-index:3; left:14px; right:14px; bottom:12px;
  display:flex; align-items:flex-end; justify-content:space-between; gap:12px;
}
.pdxPlaceMap__caption strong{
  min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  font-family:var(--font-display); font-size:1rem; text-transform:uppercase; color:#fff;
}
.pdxPlaceMap__caption span{
  flex:none; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:.62rem; letter-spacing:.06em; color:#aaa;
}
@keyframes pdxPlaceMapLoad{to{background-position:-200% 0}}
@keyframes pdxPlaceMapPin{from{opacity:0;transform:translate(-50%,-75%) scale(.72)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
/* Upcoming-events flag: card accent + day-color dot (compact only) */
.pdxPlace__upcoming{
  flex:none; align-self:center; display:inline-flex; align-items:center; gap:8px;
  padding:6px 12px 5px; border-radius:6px;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:11.7px; letter-spacing:.14em; text-transform:uppercase;
  color:var(--c);
  background:color-mix(in srgb, var(--c) 14%, #08080b);
  border:1px solid color-mix(in srgb, var(--c) 55%, #101014);
  white-space:nowrap;
  box-shadow:
    0 0 0 1px #000,
    0 6px 14px -10px color-mix(in srgb, var(--c) 80%, transparent);
  position:relative; z-index:1;
}
.pdxPlace__upcomingDot{
  width:9px; height:9px; border-radius:50%; flex:none;
}
@keyframes pgDirCardIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
html.calm-mode .pdxPlace,
:root[data-calm="true"] .pdxPlace{ --dir-gm:0; animation:none !important; }
/* Calm seam behavior comes from the shared .pdx-refract-seam calm rules. */
html.calm-mode .pdxPlace__body,
:root[data-calm="true"] .pdxPlace__body{
  backdrop-filter:none; -webkit-backdrop-filter:none;
  /* --neon-bloom collapses to none under calm, which is not a valid
     box-shadow list item, so calm re-states the token on its own. */
  box-shadow:var(--glass-card-shadow);
}
html.calm-mode .pdxPlace__actions,
:root[data-calm="true"] .pdxPlace__actions{
  opacity:1; pointer-events:auto;
}
html.calm-mode .pdxPlace__upcoming,
:root[data-calm="true"] .pdxPlace__upcoming{
  box-shadow:0 0 0 1px #000;
}
html.calm-mode .pdxPlaceMap__reveal,
html.calm-mode .pdxPlaceMap__chevron,
html.calm-mode .pdxPlaceMap__tiles,
:root[data-calm="true"] .pdxPlaceMap__reveal,
:root[data-calm="true"] .pdxPlaceMap__chevron,
:root[data-calm="true"] .pdxPlaceMap__tiles{ transition:none !important; }
html.calm-mode .pdxPlaceMap__pin,
html.calm-mode .pdxPlaceMap__loading,
:root[data-calm="true"] .pdxPlaceMap__pin,
:root[data-calm="true"] .pdxPlaceMap__loading{ animation:none !important; }
@media (prefers-reduced-motion:reduce){
  .pdxPlaceMap__reveal,.pdxPlaceMap__chevron,.pdxPlaceMap__tiles{ transition:none !important; }
  .pdxPlaceMap__pin,.pdxPlaceMap__loading{ animation:none !important; }
}
@media (max-width:620px){
  .pdxPlace--compact .pdxPlace__compactRow,.pdxPlace--wide .pdxPlace__compactRow{
    grid-template-columns:64px minmax(0,1fr) auto auto; gap:9px;
  }
  .pdxPlace--compact .pdxPlace__media,.pdxPlace--wide .pdxPlace__media{ flex-basis:64px; width:64px; }
  .pdxPlaceMap__toggle{ min-width:44px; width:44px; padding:0; }
  .pdxPlaceMap__toggle span{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
  .pdxPlaceMap__caption{ align-items:flex-start; flex-direction:column; gap:3px; }
}
`;
if (typeof document !== "undefined") {
  let s = document.getElementById("pdx-place-css");
  if (!s) {
    s = document.createElement("style");
    s.id = "pdx-place-css";
    document.head.appendChild(s);
  }
  s.textContent = CSS;
}

const CAT_COLOR = {
  bars:"var(--pink)", food:"var(--orange)", cafes:"var(--green)", venues:"var(--cyan)",
  services:"var(--purple)", shops:"var(--amber)", hotels:"var(--blue)",
  healthcare:"#FF00CC", realestate:"#1A4DFF", campgrounds:"#39FF14", groups:"#FFD700",
};
const RAINBOW_EDGE = "linear-gradient(120deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#3A6BFF,#8800FF,#FF00CC)";
/** Pink → white neon for Health & Care cards. */
const HEALTHCARE_EDGE = "linear-gradient(125deg,#FF00CC 0%,#FF4DD2 35%,#FFB3EC 70%,#FFFFFF 100%)";
/** Neon navy → white for Real Estate cards. */
const REALESTATE_EDGE = "linear-gradient(125deg,#061A66 0%,#0A1F8C 28%,#1A4DFF 62%,#FFFFFF 100%)";
/** Lime green → dark forest green for Campgrounds cards. */
const CAMPGROUND_EDGE = "linear-gradient(125deg,#B8FF3C 0%,#39FF14 28%,#0F8A3D 62%,#064E2A 100%)";
/** White → gold neon for Clubs & Groups cards. */
const GROUP_EDGE = "linear-gradient(125deg,#FFFFFF 0%,#FFF3C4 32%,#FFD700 68%,#C9A227 100%)";
const DAY_COLOR = { MON:"var(--day-mon,var(--pink))", TUE:"var(--day-tue,var(--orange))", WED:"var(--day-wed,var(--yellow))", THU:"var(--cyan)", FRI:"var(--pink)", SAT:"var(--green)", SUN:"var(--orange)" };
/** Max upcoming events shown on a directory card before collapsing to "+N more"
   (keeps cards a consistent height instead of dumping a full year of schedule). */
const MAX_CARD_EVENTS = 3;

function Icon({ d }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const PIN = <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>;
const CLOCK = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
const PHONE = <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />;
const GLOBE = <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>;
const IG = <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>;
const CAL = <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>;

/** @typedef {{ day?: string, date?: string, title?: string, href?: string }} PlaceEvent */

/** PlaceCard, the venue / place directory card.
 *  `variant="compact"` / `layout="compact"` = slim wide dock row (Directory list).
 *  Default = tall little card (profiles / sandbox). */
export function PlaceCard({
  name,
  category = "bars",
  donateUrl,
  categoryLabel,
  address,
  hours,
  phone,
  description,
  website,
  instagram,
  grandOpening = false,
  grandOpeningDate = null,
  events = /** @type {PlaceEvent[]} */ ([]),
  logoUrl,
  fallbackLogoUrl,
  isNonprofit = false,
  lat,
  lng,
  promoters = [],
  businessId,
  isFollowing = false,
  onRequireAuth,
  variant = "full",
  layout,
  className = "",
  style,
  ...rest
}: {
  name: string;
  category?: string;
  donateUrl?: string;
  categoryLabel?: string;
  address?: string;
  hours?: string;
  phone?: string;
  description?: string;
  website?: string;
  instagram?: string;
  grandOpening?: boolean;
  /** Formatted date line under the name (e.g. "JUL 13, 2026"). */
  grandOpeningDate?: string | null;
  events?: Array<{ day?: string; date?: string; title?: string; href?: string }>;
  logoUrl?: string;
  fallbackLogoUrl?: string;
  isNonprofit?: boolean;
  lat?: number | null;
  lng?: number | null;
  promoters?: Array<{ id: number; username: string; displayName?: string | null }>;
  /** Directory business id - enables Follow me on every venue card */
  businessId?: number;
  isFollowing?: boolean;
  onRequireAuth?: () => void;
  /** `compact` = wide dock row; `full` = tall directory little-card. */
  variant?: "full" | "compact";
  /** Alias for variant (Directory dock passes layout="compact"). */
  layout?: "full" | "compact";
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  const isCompact = (layout ?? variant) === "compact";
  const isHealthcare = category === "healthcare";
  const isRealEstate = category === "realestate";
  const isCampground = category === "campgrounds";
  const isGroup = category === "groups";
  const accent = isNonprofit
    ? "var(--cyan)"
    : (CAT_COLOR[category] || "var(--pink)");
  const edge = isNonprofit
    ? RAINBOW_EDGE
    : isHealthcare
      ? HEALTHCARE_EDGE
      : isRealEstate
        ? REALESTATE_EDGE
        : isCampground
          ? CAMPGROUND_EDGE
          : isGroup
            ? GROUP_EDGE
            : `linear-gradient(${accent},${accent})`;
  const [logoFailed, setLogoFailed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const showLogo = logoUrl && !logoFailed;
  const showFallback = !showLogo && fallbackLogoUrl;
  const nextEventDayCode = (events[0]?.day || "").trim().toUpperCase().slice(0, 3);
  const upcomingDayColor = (nextEventDayCode && DAY_COLOR[nextEventDayCode]) || accent;

  const handleShare = async (e) => {
    e.stopPropagation();
    if (businessId == null) return;
    setSharing(true);
    try {
      await sharePageLink(placePath(businessId, name), name);
    } catch (err) {
      if (err?.name !== "AbortError") console.error(err);
    } finally {
      setSharing(false);
    }
  };

  const useSpecialEdge =
    isNonprofit || isHealthcare || isRealEstate || isCampground || isGroup;

  return (
    <article
      className={`pdxPlace pdx-glass-rebind${useSpecialEdge ? " pdxPlace--edge" : ""}${isCompact ? " pdxPlace--compact pdxPlace--wide" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--_c": accent, "--c": accent, "--_edge": edge, ...(style || {}) }}
      {...rest}
    >
      <div className="pdxPlace__body pdx-glass-card pdx-glass-rebind">
        <div className="pdxPlace__sheen pdx-glass-sheen--specular" aria-hidden="true" />
        <div className="pdxPlace__seam pdx-refract-seam" aria-hidden="true" />
        <div className="pdxPlace__actions">
          {businessId != null && (
            <VenueFollowButton
              businessId={businessId}
              initialFollowing={isFollowing}
              variant="card"
              accent={accent}
              onRequireAuth={onRequireAuth}
            />
          )}
          <button type="button" className="pdxPlace__share" onClick={handleShare} disabled={sharing} aria-label={`Share ${name}`}>
            <Share2 size={11} strokeWidth={2.5} /> {sharing ? "…" : "Share"}
          </button>
        </div>
        <div className="pdxPlace__compactRow">
        <div className="pdxPlace__media">
          <div className="pdxPlace__mediaGlow" aria-hidden="true" />
          <div className="pdxPlace__mediaScan" aria-hidden="true" />
          {showLogo && (
            <img
              className="pdxPlace__logo"
              src={logoUrl}
              alt={`${name} logo`}
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          )}
          {showFallback && (
            <img
              className="pdxPlace__logo pdxPlace__logo--fallback"
              src={fallbackLogoUrl}
              alt={categoryLabel || category}
              loading="lazy"
            />
          )}
        </div>

        <div className="pdxPlace__main">
          <div className="pdxPlace__badges">
            {grandOpening && (
              <span className="pdxPlace__opening">
                <Badge color="yellow" glow size="sm">Grand Opening</Badge>
              </span>
            )}
            <span className="pdxPlace__cat">
              <Badge
                category={isNonprofit ? undefined : category}
                color={isNonprofit ? "paper" : undefined}
                size="sm"
              >
                {categoryLabel}
              </Badge>
            </span>
          </div>

          <div className="pdxPlace__name">{name}</div>
          {!isCompact && grandOpening && grandOpeningDate && (
            <div className="pdxPlace__grandDate">{grandOpeningDate}</div>
          )}

          <div className="pdxPlace__rows">
            {address && (
              <div className="pdxPlace__row">
                <Icon d={PIN} />
                <a href={placeGoogleMapsUrl({ address, name, lat, lng })} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  {address}
                </a>
              </div>
            )}
            {!isCompact && hours && <div className="pdxPlace__row"><Icon d={CLOCK} />{hours}</div>}
            {!isCompact && phone && (
              <div className="pdxPlace__row">
                <Icon d={PHONE} />
                <a href={telHref(phone)} onClick={e => e.stopPropagation()}>{phone}</a>
              </div>
            )}
          </div>

          {!isCompact && description && <p className="pdxPlace__desc">{description}</p>}

          {!isCompact && (website || instagram || donateUrl) && (
            <div className="pdxPlace__links">
              {donateUrl && (
                <a className="pdxPlace__link pdxPlace__link--donate" href={donateUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <Icon d={GLOBE} />Donate
                </a>
              )}
              {website && (
                <a className="pdxPlace__link" href={website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <Icon d={GLOBE} />Website
                </a>
              )}
              {instagram && (
                <a
                  className="pdxPlace__link"
                  href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  <Icon d={IG} />{instagram}
                </a>
              )}
            </div>
          )}

          {!isCompact && events.length > 0 && (
            <div className="pdxPlace__events">
              <div className="pdxPlace__eventsHead"><Icon d={CAL} />Upcoming Events</div>
              {events.slice(0, MAX_CARD_EVENTS).map((ev, i) => {
                const row = (
                  <>
                    <div className="pdxPlace__eventDate">{ev.date}</div>
                    <div className="pdxPlace__eventTitle">{ev.title}</div>
                  </>
                );
                return ev.href ? (
                  <a
                    key={i}
                    className="pdxPlace__event pdxPlace__event--link"
                    href={ev.href}
                    onClick={e => e.stopPropagation()}
                    style={{ "--_ec": DAY_COLOR[ev.day] || accent, textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    {row}
                  </a>
                ) : (
                  <div className="pdxPlace__event" key={i} style={{ "--_ec": DAY_COLOR[ev.day] || accent }}>
                    {row}
                  </div>
                );
              })}
              {events.length > MAX_CARD_EVENTS && (
                businessId != null ? (
                  <a
                    className="pdxPlace__eventsMore"
                    href={placePath(businessId, name)}
                    onClick={e => e.stopPropagation()}
                  >
                    +{events.length - MAX_CARD_EVENTS} more event{events.length - MAX_CARD_EVENTS === 1 ? "" : "s"}
                  </a>
                ) : (
                  <div className="pdxPlace__eventsMore pdxPlace__eventsMore--static">
                    +{events.length - MAX_CARD_EVENTS} more event{events.length - MAX_CARD_EVENTS === 1 ? "" : "s"}
                  </div>
                )
              )}
            </div>
          )}

          {!isCompact && promoters.length > 0 && (
            <div className="pdxPlace__promoters">
              <div className="pdxPlace__promotersLabel">Promoters</div>
              <div className="pdxPlace__promoterChips">
                {promoters.map(p => (
                  <span className="pdxPlace__promoterChip" key={p.id}>@{p.username}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isCompact && events.length > 0 && (
          <span className="pdxPlace__upcoming">
            <span
              className="pdxPlace__upcomingDot"
              aria-hidden="true"
              style={{
                background: upcomingDayColor,
                boxShadow: `0 0 8px ${upcomingDayColor}`,
              }}
            />
            {events.length === 1 ? "1 upcoming event" : `${events.length} upcoming events`}
          </span>
        )}
        {isCompact && lat != null && lng != null && (
          <PlaceCardMap
            name={name}
            latitude={lat}
            longitude={lng}
            expanded={mapExpanded}
            onToggle={() => setMapExpanded((value) => !value)}
          />
        )}
        </div>
      </div>
    </article>
  );
}
