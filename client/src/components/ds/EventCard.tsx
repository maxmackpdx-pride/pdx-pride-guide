// @ts-nocheck
import React from "react";

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
.pdxRow:hover,
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
.pdxRow__venue a{ color:var(--neon-cyan,#19E3FF); font-weight:600; text-decoration:none; }
.pdxRow__venue a:hover{ text-decoration:underline; color:#7af0ff; }
.pdxRow__address{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); }
.pdxRow__ticket{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.68rem;
  letter-spacing:.08em; text-transform:uppercase; color:#000; background:var(--neon-lime,#39FF14);
  border-radius:2px; padding:4px 9px 3px; text-decoration:none; display:inline-flex; width:fit-content; margin-top:2px; }
.pdxRow__ticket:hover{ filter:brightness(1.08); text-decoration:none; color:#000; }

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

const DAY_BASE = { MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };
const ADM_LABEL = { FREE:"Free", TICKETED:"Ticketed", DOOR_FEE:"Door fee", SUGGESTED_DONATION:"Donation" };
const AGE_LABEL = { ALL_AGES:"All ages", "18_PLUS":"18+", "21_PLUS":"21+" };

/** EventCard, the list-view row. */
export function EventCard({
  title, venue, when, day = "FRI", image,
  types = [], admission, age, going,
  saved, onSave, href,
  venueHref, address, ticketHref, ticketLabel = "Get tickets",
  className = "", style = {}, ...rest
}) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <Tag className={`pdxRow ${className}`} href={href} style={{ "--_day": base, ...style }} {...rest}>
      <div className="pdxRow__thumb">
        {image ? <img src={image} alt="" /> : <span className="pdxRow__thumbPh">{(title || "?").charAt(0)}</span>}
      </div>
      <div className="pdxRow__main">
        <div className="pdxRow__tags">
          <span className="pdxRowTag pdxRowTag--day">{day}</span>
          {types.slice(0, 2).map((t, i) => <span className="pdxRowTag pdxRowTag--type" key={i}>{t}</span>)}
          {metaBits && <span className="pdxRowTag pdxRowTag--meta">{metaBits}</span>}
        </div>
        <h3 className="pdxRow__title">{title}</h3>
        {venue && (
          <div className="pdxRow__venue">
            {venueHref
              ? <a href={venueHref} target="_blank" rel="noopener noreferrer" onClick={stop}>{venue} ↗</a>
              : <b>{venue}</b>}
          </div>
        )}
        {address && <div className="pdxRow__address">{address}</div>}
        {ticketHref && (
          <a className="pdxRow__ticket" href={ticketHref} target="_blank" rel="noopener noreferrer" onClick={stop}>
            {ticketLabel} →
          </a>
        )}
        {when && <div className="pdxRow__when">{when}</div>}
      </div>
      <div className="pdxRow__aside">
        {onSave && (
          <button type="button" className="pdxRow__save" aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save event"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(); }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          </button>
        )}
        {going != null && <span className="pdxRow__going"><span className="dot" />{going} Going</span>}
      </div>
    </Tag>
  );
}
