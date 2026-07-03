// @ts-nocheck
import React from "react";
import { Badge } from "./Badge";

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
  return (
    <div className={`pdxPlace ${className}`} style={{ "--_c": accent }} {...rest}>
      {grandOpening && <span className="pdxPlace__opening"><Badge color="yellow" glow size="sm">Grand Opening</Badge></span>}
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
          {website && (
            <a className="pdxPlace__link" href={website} target="_blank" rel="noopener noreferrer">
              <Icon d={GLOBE} />Website
            </a>
          )}
          {instagram && (
            <a
              className="pdxPlace__link"
              href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
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
    </div>
  );
}
