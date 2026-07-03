// @ts-nocheck
import React from "react";

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
  box-shadow:none;
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out),
             border-color var(--dur-base) var(--ease-out);
}
.pdxBoard:hover,
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

const DAY_BASE = { MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };
const DAY_TEXT = { MON:"var(--day-mon-text)", TUE:"var(--day-tue-text)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };

const ADM_LABEL = { FREE:"Free", TICKETED:"Ticketed", DOOR_FEE:"Door fee", SUGGESTED_DONATION:"Donation" };
const AGE_LABEL = { ALL_AGES:"All ages", "18_PLUS":"18+", "21_PLUS":"21+" };

/** PosterCard, the event board card. */
export function PosterCard({
  title, venue, when, day = "FRI", image,
  types = [], admission, age, claimable = false,
  going, onRsvp, href, showLink = true,
  className = "", style = {}, ...rest
}) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const dayt = DAY_TEXT[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  return (
    <Tag className={`pdxBoard ${className}`} href={href}
      style={{ "--_day": base, "--_dayt": dayt, ...style }} {...rest}>
      <div className="pdxBoard__poster">
        {image
          ? <img className="pdxBoard__img" src={image} alt="" />
          : <div className="pdxBoard__ph"><span className="pdxBoard__phTitle">{title}</span></div>}
        {showLink && (
          <span className="pdxBoard__linkchip" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4" /></svg>
          </span>
        )}
        <span className="pdxBoard__stripe" />
      </div>

      <div className="pdxBoard__meta">
        <div className="pdxBoard__tags">
          <span className="pdxTag pdxTag--day">{day}</span>
          {types.map((t, i) => <span className="pdxTag pdxTag--type" key={i}>{t}</span>)}
          {metaBits && <span className="pdxTag pdxTag--meta">{metaBits}</span>}
          {claimable && <span className="pdxTag pdxTag--claim">Claimable</span>}
        </div>
        <h3 className="pdxBoard__title">{title}</h3>
        {venue && <div className="pdxBoard__venue">{venue}</div>}
        {when && <div className="pdxBoard__when">{when}</div>}
        <span className="pdxBoard__link">Event details &rarr;</span>

        {(going != null || onRsvp) && (
          <div className="pdxBoard__foot">
            {going != null
              ? <span className="pdxBoard__going"><span className="dot" />{going} Going</span>
              : <span />}
            {onRsvp && <button type="button" className="pdxBoard__rsvp"
              onClick={(e) => { e.preventDefault(); onRsvp(); }}>I'll be there</button>}
          </div>
        )}
      </div>
    </Tag>
  );
}
