import React from "react";
import { Badge } from "./Badge.jsx";

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
  bars:"var(--pink)", food:"var(--orange)", cafes:"var(--green)", venues:"var(--cyan)",
  services:"var(--purple)", shops:"var(--amber)", hotels:"var(--blue)",
};
const DAY_COLOR = { THU:"var(--cyan)", FRI:"var(--pink)", SAT:"var(--green)", SUN:"var(--orange)" };

function Icon({ d }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
const PIN = <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>;
const CLOCK = <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
const PHONE = <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />;
const GLOBE = <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>;
const IG = <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>;
const CAL = <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>;

/** PlaceCard, the venue / place directory card. */
export function PlaceCard({
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
  return (
    <div className={`pdxPlace ${className}`} style={{ "--_c": accent }} {...rest}>
      <span className="pdxPlace__refract" aria-hidden="true" />
      {grandOpening && <span className="pdxPlace__opening"><Badge color="yellow" glow size="sm">Grand Opening</Badge></span>}
      {(logoUrl || fallbackLogoUrl) && (
        <div className="pdxPlace__media">
          <div className="pdxPlace__mediaGlow" aria-hidden="true" />
          <div className="pdxPlace__mediaScan" aria-hidden="true" />
          {showLogo && (
            <img className="pdxPlace__logo" src={logoUrl} alt={`${name} logo`} loading="lazy"
              onError={() => setLogoFailed(true)} />
          )}
          {showFallback && (
            <img className="pdxPlace__logo pdxPlace__logo--fallback" src={fallbackLogoUrl}
              alt={categoryLabel || category} loading="lazy" />
          )}
        </div>
      )}
      <span className="pdxPlace__cat"><Badge category={category} size="sm">{categoryLabel}</Badge></span>
      <div className="pdxPlace__name">{name}</div>

      <div className="pdxPlace__rows">
        {address && <div className="pdxPlace__row"><Icon d={PIN} />{address}</div>}
        {hours && <div className="pdxPlace__row"><Icon d={CLOCK} />{hours}</div>}
        {phone && <div className="pdxPlace__row"><Icon d={PHONE} />{phone}</div>}
      </div>

      {description && <p className="pdxPlace__desc">{description}</p>}

      {(website || instagram) && (
        <div className="pdxPlace__links">
          {website && <a className="pdxPlace__link" href={website} onClick={(e)=>e.preventDefault()}><Icon d={GLOBE} />Website</a>}
          {instagram && <a className="pdxPlace__link" href="#" onClick={(e)=>e.preventDefault()}><Icon d={IG} />{instagram}</a>}
        </div>
      )}

      {events.length > 0 && (
        <div className="pdxPlace__events">
          <div className="pdxPlace__eventsHead"><Icon d={CAL} />Upcoming Events</div>
          {events.map((ev, i) => (
            <div className="pdxPlace__event" key={i} style={{ "--_ec": DAY_COLOR[ev.day] || accent }}>
              <div className="pdxPlace__eventDate">{ev.date}</div>
              <div className="pdxPlace__eventTitle">{ev.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
