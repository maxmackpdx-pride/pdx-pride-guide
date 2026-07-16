// @ts-nocheck
import React, { useState } from "react";
import { Badge } from "./Badge";
import { Share2 } from "lucide-react";
import { placeGoogleMapsUrl, telHref } from "@/lib/placeLinks";
import { placePath } from "@shared/placeSlug";
import { sharePageLink } from "@/lib/shareEvent";
import VenueFollowButton from "@/components/VenueFollowButton";

/* PlaceCard = directory card — Card System.html "DIRECTORY CARDS" SoT
   (Directory cards redesign.zip). OLED glass(c) by category, dual sheen,
   thin dir-refract seam, soft logo orb (not boxed poster floor), neon logo,
   6px hover lift. Nonprofit keeps rainbow --_edge. */
const CSS = `
/* Little directory cards — SoT: 03-directory-cards / design image
   OLED near-black slab, soft category bloom, solid cat chip, neon logo.
   Follow/Share only on hover so resting state matches the clean design. */
.pdxPlace{
  position:relative; display:inline-block; width:100%; break-inside:avoid;
  margin:0 0 22px; border-radius:16px; cursor:default;
  animation:pgDirCardIn .55s var(--ease-out,ease) backwards;
  --c: var(--_c, var(--pink));
  --dir-gm: 60;
}
/* Soft outer neon cloud (always-on) — pink/cyan halo around the little card */
.pdxPlace__glow{
  position:absolute; inset:-6px; border-radius:20px; pointer-events:none; z-index:0;
  box-shadow:
    0 0 18px -2px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.15%), transparent),
    0 0 42px -6px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * .95%), transparent),
    0 0 78px -12px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * .55%), transparent);
}
/* Master OLED glass slab */
.pdxPlace__body{
  position:relative; z-index:1; border-radius:16px; overflow:hidden;
  background:
    radial-gradient(90% 70% at 50% 40%, #000 0%, #000 42%, #030304 78%, color-mix(in srgb, var(--c) 5%, #050408) 100%),
    radial-gradient(110% 70% at 50% 118%, color-mix(in srgb, var(--c) 16%, transparent), transparent 58%);
  border:1.5px solid color-mix(in srgb, var(--c) 62%, #14141a);
  box-shadow:
    0 0 0 1px #000,
    0 28px 56px -22px rgba(0,0,0,.92),
    0 0 22px -6px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.1%), transparent),
    inset 0 1px 0 color-mix(in srgb, var(--c) 48%, rgba(255,255,255,.1)),
    inset 0 0 28px -20px color-mix(in srgb, var(--c) 28%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding:18px 16px 16px;
  display:flex; flex-direction:column; gap:12px;
  transition:filter .16s ease, box-shadow .16s ease, border-color .16s ease;
}
/* Rainbow / specialty edge (nonprofit, healthcare, realestate) */
.pdxPlace--edge .pdxPlace__body{
  background:
    radial-gradient(90% 70% at 50% 40%, #000 0%, #000 42%, #030304 78%, color-mix(in srgb, var(--c) 5%, #050408) 100%) padding-box,
    radial-gradient(110% 70% at 50% 118%, color-mix(in srgb, var(--c) 16%, transparent), transparent 58%) padding-box,
    var(--_edge, linear-gradient(var(--c), var(--c))) border-box;
  border:2px solid transparent;
}
/* Dual sheen — quiet so type stays readable */
.pdxPlace__sheen{
  position:absolute; inset:0; border-radius:inherit; pointer-events:none; z-index:2;
  background:
    linear-gradient(133deg, rgba(255,255,255,.12), rgba(255,255,255,.02) 14%, transparent 36%),
    radial-gradient(70% 55% at 108% 112%, rgba(255,255,255,.08), color-mix(in srgb, var(--c) 10%, transparent) 34%, transparent 66%);
}
/* Very thin top refract — design reads as soft edge glow, not a thick bar */
.pdxPlace__seam{
  position:absolute; top:0; left:10px; right:10px; height:1.5px; margin:0; z-index:5;
  border-radius:0; pointer-events:none; overflow:visible;
  background:linear-gradient(90deg,#ff2d5e,#ff9500,#ffee00,#39ff14,#00ffff,#3a6bff,#8800ff,#ff00cc,#ff2d5e);
  background-size:200% 100%;
  opacity:.55; filter:blur(.35px);
  animation:dirRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
  mask:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
}
.pdxPlace__seam.pdx-rainbow-rule{
  height:1.5px; left:10px; right:10px;
  box-shadow:none !important;
}
.pdxPlace--clickable{ cursor:pointer; transition:transform .16s ease; }
.pdxPlace--clickable:hover{ transform:translateY(-6px) !important; }
.pdxPlace--clickable:hover .pdxPlace__body{
  filter:brightness(1.06) saturate(1.08);
  border-color:color-mix(in srgb, var(--c) 78%, #14141a);
  box-shadow:
    0 0 0 1px #000,
    0 28px 56px -22px rgba(0,0,0,.92),
    0 0 32px -4px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.4%), transparent),
    0 0 14px -2px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.2%), transparent),
    inset 0 1px 0 color-mix(in srgb, var(--c) 55%, rgba(255,255,255,.12)),
    inset 0 0 28px -18px color-mix(in srgb, var(--c) 36%, transparent),
    0 20px 44px -20px rgba(0,0,0,.85);
}
.pdxPlace--clickable:hover .pdxPlace__glow{
  box-shadow:
    0 0 24px -2px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.4%), transparent),
    0 0 56px -6px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * 1.1%), transparent),
    0 0 90px -10px color-mix(in srgb, var(--c) calc(var(--dir-gm,60) * .7%), transparent);
}
/* Logo well — soft category orb under neon mark */
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
/* Solid category chip — filled accent, black type */
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
/* Body copy — soft grey, not bright white */
.pdxPlace__desc{ margin:0; font-family:var(--font-body); font-size:.9rem; line-height:1.5;
  color:#8e8a82; position:relative; z-index:1; }
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
.pdxPlace__promoters{ margin-top:2px; padding-top:12px; border-top:1px solid #1e1e24;
  font-family:var(--font-body); font-size:.82rem; color:#8e8a82; position:relative; z-index:1; }
.pdxPlace__promotersLabel{ font-family:var(--font-display); font-weight:700; font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase; color:#8e8a82; margin-bottom:6px; }
.pdxPlace__promoterChips{ display:flex; flex-wrap:wrap; gap:6px; }
.pdxPlace__promoterChip{ padding:3px 9px; border-radius:99px; font-size:.78rem;
  border:1px solid color-mix(in srgb, var(--c) 45%, transparent); color:var(--c); }
.pdxPlace__row a{ color:inherit; text-decoration:none; }
.pdxPlace__row a:hover{ text-decoration:underline; text-underline-offset:2px; }
/* Actions hidden at rest — design little cards are clean; show on hover/focus */
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
@keyframes pgDirCardIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
html.calm-mode .pdxPlace,
:root[data-calm="true"] .pdxPlace{ --dir-gm:0; animation:none !important; }
html.calm-mode .pdxPlace__seam,
:root[data-calm="true"] .pdxPlace__seam{
  animation:none !important; filter:none;
  background:color-mix(in srgb, var(--c) 55%, #2a2a32);
  background-size:auto; -webkit-mask:none; mask:none; opacity:.9;
}
html.calm-mode .pdxPlace__body,
:root[data-calm="true"] .pdxPlace__body{
  backdrop-filter:none; -webkit-backdrop-filter:none;
}
html.calm-mode .pdxPlace__actions,
:root[data-calm="true"] .pdxPlace__actions{
  opacity:1; pointer-events:auto;
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
  healthcare:"#FF00CC", realestate:"#1A4DFF",
};
const RAINBOW_EDGE = "linear-gradient(120deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#3A6BFF,#8800FF,#FF00CC)";
/** Pink → white neon for Health & Care cards. */
const HEALTHCARE_EDGE = "linear-gradient(125deg,#FF00CC 0%,#FF4DD2 35%,#FFB3EC 70%,#FFFFFF 100%)";
/** Neon navy → white for Real Estate cards. */
const REALESTATE_EDGE = "linear-gradient(125deg,#061A66 0%,#0A1F8C 28%,#1A4DFF 62%,#FFFFFF 100%)";
const DAY_COLOR = { MON:"var(--day-mon,var(--pink))", TUE:"var(--day-tue,var(--orange))", WED:"var(--day-wed,var(--yellow))", THU:"var(--cyan)", FRI:"var(--pink)", SAT:"var(--green)", SUN:"var(--orange)" };

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

/** PlaceCard, the venue / place directory card. */
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
  /** Directory business id — enables Follow me on every venue card */
  businessId?: number;
  isFollowing?: boolean;
  onRequireAuth?: () => void;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  const isHealthcare = category === "healthcare";
  const isRealEstate = category === "realestate";
  const accent = isNonprofit
    ? "var(--cyan)"
    : (CAT_COLOR[category] || "var(--pink)");
  const edge = isNonprofit
    ? RAINBOW_EDGE
    : isHealthcare
      ? HEALTHCARE_EDGE
      : isRealEstate
        ? REALESTATE_EDGE
        : `linear-gradient(${accent},${accent})`;
  const [logoFailed, setLogoFailed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const showLogo = logoUrl && !logoFailed;
  const showFallback = !showLogo && fallbackLogoUrl;

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

  const useSpecialEdge = isNonprofit || isHealthcare || isRealEstate;

  return (
    <article
      className={`pdxPlace pdx-glass-rebind${useSpecialEdge ? " pdxPlace--edge" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--_c": accent, "--c": accent, "--_edge": edge, ...(style || {}) }}
      {...rest}
    >
      <div className="pdxPlace__glow" aria-hidden="true" />
      <div className="pdxPlace__body">
        <div className="pdxPlace__sheen" aria-hidden="true" />
        <div className="pdxPlace__seam dir-refract" aria-hidden="true" />
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
        {grandOpening && grandOpeningDate && (
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
          {hours && <div className="pdxPlace__row"><Icon d={CLOCK} />{hours}</div>}
          {phone && (
            <div className="pdxPlace__row">
              <Icon d={PHONE} />
              <a href={telHref(phone)} onClick={e => e.stopPropagation()}>{phone}</a>
            </div>
          )}
        </div>

        {description && <p className="pdxPlace__desc">{description}</p>}

        {(website || instagram || donateUrl) && (
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

        {events.length > 0 && (
          <div className="pdxPlace__events">
            <div className="pdxPlace__eventsHead"><Icon d={CAL} />Upcoming Pride Events</div>
            {events.map((ev, i) => {
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
          </div>
        )}

        {promoters.length > 0 && (
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
    </article>
  );
}
