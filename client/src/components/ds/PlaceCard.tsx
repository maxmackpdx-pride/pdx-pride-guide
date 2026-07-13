// @ts-nocheck
import React, { useState } from "react";
import { Badge } from "./Badge";
import { Share2 } from "lucide-react";
import { placeGoogleMapsUrl, telHref } from "@/lib/placeLinks";
import { shareBusinessCard } from "@/lib/shareBusinessImage";
import VenueFollowButton from "@/components/VenueFollowButton";

/* PlaceCard = directory card from Queer Directory redesign mockup:
   animated rainbow seam across the top, neon glow frame, logo media well,
   badges, meta rows, links, upcoming events. */
const CSS = `
.pdxPlace{
  position:relative; display:inline-block; width:100%; break-inside:avoid;
  margin:0 0 22px; border-radius:9px; cursor:default;
  animation:pgDirCardIn .55s var(--ease-out,ease) both;
}
.pdxPlace__glow{
  position:absolute; inset:-2px; border-radius:11px; pointer-events:none; z-index:0;
  box-shadow:0 0 24px -2px color-mix(in srgb, var(--_c,var(--pink)) calc(var(--dir-gm,60) * 1%), transparent),
             0 0 62px -14px color-mix(in srgb, var(--_c,var(--pink)) calc(var(--dir-gm,60) * .7%), transparent);
}
.pdxPlace__body{
  position:relative; z-index:1; border-radius:9px; overflow:hidden;
  background:linear-gradient(#0b0b0d,#0b0b0d) padding-box, var(--_edge,linear-gradient(var(--_c,var(--pink)),var(--_c,var(--pink)))) border-box;
  border:2px solid transparent; padding:16px; display:flex; flex-direction:column; gap:12px;
  transition:filter .16s ease, box-shadow .16s ease;
}
/* Shared animated rainbow seam (same system as PlaceModal / site header) */
.pdxPlace__seam.pdx-rainbow-rule{
  position:absolute; left:0; right:0; top:0; height:3px; margin:0; z-index:3;
  border-radius:0; pointer-events:none;
}
.pdxPlace--clickable{ cursor:pointer; }
.pdxPlace--clickable:hover{ transform:translateY(-6px); }
.pdxPlace--clickable:hover .pdxPlace__body{
  filter:brightness(1.08) saturate(1.08);
  box-shadow:0 20px 44px -20px rgba(0,0,0,.85);
}
.pdxPlace__media{
  /* Taller well + real inset so crop-filled neon logos (tight alpha) don't
     clip their glow edges. Flex + explicit max-height beats % height vs padding. */
  position:relative; height:168px; border-radius:6px; overflow:hidden;
  box-sizing:border-box;
  background:radial-gradient(125% 120% at 50% 12%, color-mix(in srgb, var(--_c,var(--pink)) 13%, #050506), #050506 72%);
  border:1px solid color-mix(in srgb, var(--_c,var(--pink)) 34%, transparent);
  display:flex; align-items:center; justify-content:center;
  padding:20px 22px;
}
.pdxPlace__mediaScan{
  position:absolute; inset:0; pointer-events:none; opacity:.5;
  background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.16) 3px 4px);
}
.pdxPlace__logo{
  position:relative; z-index:1;
  max-width:100%; max-height:128px; width:auto; height:auto;
  object-fit:contain; object-position:center;
  filter:drop-shadow(0 0 10px color-mix(in srgb, var(--_c,var(--pink)) 42%, transparent));
}
.pdxPlace__logo--fallback{ max-width:58%; max-height:96px;
  filter:drop-shadow(0 0 12px color-mix(in srgb, var(--_c,var(--pink)) 55%, transparent)); }
.pdxPlace__badges{ display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
.pdxPlace__opening{ }
.pdxPlace__name{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.4rem; line-height:1.02; letter-spacing:.01em; color:#fff; }
.pdxPlace__rows{ display:flex; flex-direction:column; gap:5px; }
.pdxPlace__row{ display:flex; align-items:flex-start; gap:8px;
  font-family:var(--font-body); font-size:.86rem; color:var(--text-lo); }
.pdxPlace__row svg{ width:14px; height:14px; margin-top:2px; flex:none; opacity:.9;
  stroke:var(--_c,var(--pink)); }
.pdxPlace__desc{ margin:0; font-family:var(--font-body); font-size:.9rem; line-height:1.5; color:var(--text-mid); }
.pdxPlace__links{ display:flex; flex-wrap:wrap; gap:14px; margin-top:2px; }
.pdxPlace__link{ display:inline-flex; align-items:center; gap:6px;
  font-family:var(--font-body); font-weight:var(--fw-bold,700); font-size:.86rem;
  color:var(--_c,var(--pink)); text-decoration:none; }
.pdxPlace__link:hover{ text-decoration:underline; text-underline-offset:3px; }
.pdxPlace__link svg{ width:15px; height:15px; }
.pdxPlace__events{ margin-top:2px; padding-top:12px; border-top:1px solid #242424; }
.pdxPlace__eventsHead{ display:flex; align-items:center; gap:8px; margin-bottom:9px;
  font-family:var(--font-display); font-weight:700; font-size:.78rem; letter-spacing:.06em;
  text-transform:uppercase; color:var(--text-mid); }
.pdxPlace__eventsHead svg{ width:14px; height:14px; }
.pdxPlace__event{ padding:7px 0 7px 12px; border-left:3px solid var(--_ec,var(--cyan)); }
.pdxPlace__eventDate{ font-family:var(--font-body); font-weight:var(--fw-bold,700); font-size:.84rem;
  color:var(--_ec,var(--cyan)); }
.pdxPlace__eventTitle{ font-family:var(--font-body); font-size:.84rem; color:#fff; }
.pdxPlace__promoters{ margin-top:2px; padding-top:12px; border-top:1px solid #242424;
  font-family:var(--font-body); font-size:.82rem; color:var(--text-lo); }
.pdxPlace__promotersLabel{ font-family:var(--font-display); font-weight:700; font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase; color:var(--text-mid); margin-bottom:6px; }
.pdxPlace__promoterChips{ display:flex; flex-wrap:wrap; gap:6px; }
.pdxPlace__promoterChip{ padding:3px 9px; border-radius:99px; font-size:.78rem;
  border:1px solid color-mix(in srgb, var(--_c,var(--pink)) 45%, transparent); color:var(--_c,var(--pink)); }
.pdxPlace__row a{ color:inherit; text-decoration:none; }
.pdxPlace__row a:hover{ text-decoration:underline; text-underline-offset:2px; }
.pdxPlace__actions{
  position:absolute; top:10px; right:10px; z-index:4;
  display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;
  max-width:calc(100% - 20px);
}
.pdxPlace__share{
  display:flex; align-items:center; gap:5px;
  padding:6px 11px; border-radius:999px; cursor:pointer;
  background:rgba(0,0,0,.55); border:1px solid color-mix(in srgb, var(--_c,var(--pink)) 60%, transparent);
  color:var(--_c,var(--pink)); font-family:var(--font-display); font-weight:700;
  font-size:.68rem; letter-spacing:.04em; text-transform:uppercase;
}
.pdxPlace__share:disabled{ opacity:.6; cursor:default; }
@keyframes pgDirCardIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
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
  healthcare:"#FF00CC", realestate:"#0B3D2E",
};
const RAINBOW_EDGE = "linear-gradient(120deg,#FF2400,#FF9500,#FFEE00,#39FF14,#00FFFF,#3A6BFF,#8800FF,#FF00CC)";
/** Pink → white neon for Health & Care cards. */
const HEALTHCARE_EDGE = "linear-gradient(125deg,#FF00CC 0%,#FF4DD2 35%,#FFB3EC 70%,#FFFFFF 100%)";
/** Dark green → white neon for Real Estate cards. */
const REALESTATE_EDGE = "linear-gradient(125deg,#062A1F 0%,#0B3D2E 28%,#1F8A52 62%,#FFFFFF 100%)";
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
    setSharing(true);
    try {
      await shareBusinessCard({
        name, categoryLabel: categoryLabel || category, accentColor: isNonprofit ? "venues" : category,
        description, address, hours, phone, logoUrl: logoUrl || fallbackLogoUrl,
      });
    } catch (err) {
      if (err?.name !== "AbortError") console.error(err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <article
      className={`pdxPlace ${className}`}
      style={{ "--_c": accent, "--_edge": edge, ...(style || {}) }}
      {...rest}
    >
      <div className="pdxPlace__glow" aria-hidden="true" />
      <div className="pdxPlace__body">
        <div className="pdxPlace__seam pdx-rainbow-rule" aria-hidden="true" />
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
