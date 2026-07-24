// @ts-nocheck
import React from "react";
import LiveWave from "@/components/LiveWave";

/* EventCard, the canonical list-view row (source: EVENTS_GUIDE.md).
   Deep-glass / OLED-neon (docs/handoffs/deep-glass-2026-07-16/ §2.1):
   --glass-card with --c = day color; sheen; rainbow top seam (base ::before);
   thumb in --poster-well treatment; primary CTA = .pdx-glass-btn.
   Claim keeps brutal sticker. Layout / spacing / type scale unchanged.
   Entrance: pgDirCardIn. */
const CSS = `
.pdxRow{
  /* Day color drives glass fill / bloom / buttons */
  --_day: var(--day-fri);
  --c: var(--_day);
  --dc: var(--_day);
  position:relative; display:grid; grid-template-columns:84px 1fr auto; gap:16px; align-items:center;
  padding:12px 16px 12px 14px;
  background:var(--glass-card-bg);
  border:var(--glass-card-border); border-left:5px solid var(--_day);
  border-radius:var(--radius-md); text-decoration:none; color:inherit; overflow:hidden;
  box-shadow:var(--glass-card-shadow);
  backdrop-filter:blur(var(--glass-card-blur));
  -webkit-backdrop-filter:blur(var(--glass-card-blur));
  /* backwards only - both/forwards locks transform and kills hover lift.
     No infinite box-shadow pulse at rest (scroll jank on dense lists). */
  animation: pgDirCardIn .55s var(--ease-out,ease) backwards;
  animation-delay:calc(var(--i, 0) * 40ms);
  transition:transform var(--dur-base) var(--ease-out), filter var(--dur-base) var(--ease-out),
             border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out),
             background var(--dur-base) var(--ease-out);
}
.pdxRow:hover,
a.pdxRow:hover{
  transform:translateY(-2px) !important;
  text-decoration:none;
  filter:brightness(1.06) saturate(1.08);
  border-color:color-mix(in srgb,var(--_day) 55%,#101014);
  border-left-color:var(--_day);
  animation-play-state:paused;
}

/* Top-left diagonal sheen (::before is reserved for base rainbow seam) */
.pdxRow::after{
  content:""; position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen);
}
.pdxRow__sheenSpec{
  position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen-specular);
}

/* Thumb = mini poster-well (radial accent + scanline + day floor stripe) */
.pdxRow__thumb{ width:84px; height:96px; border-radius:var(--radius-sm); overflow:hidden;
  background:var(--poster-well-bg); position:relative; flex:none; }
.pdxRow__scan{
  position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.35;
  background:var(--poster-well-scan);
}
/* Day-color floor (poster-well 4px) - absolute so thumb size stays 84×96 */
.pdxRow__thumbFloor{ position:absolute; left:0; right:0; bottom:0; height:4px;
  background:var(--c,var(--_day)); z-index:2; pointer-events:none; }
/* Full flyer in the thumb - letterbox rather than crop */
.pdxRow__thumb img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:center; z-index:0; }
.pdxRow__thumbPh{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:var(--fw-black); font-size:1.6rem; color:var(--_day); opacity:.8; z-index:0; }

.pdxRow__main{ position:relative; z-index:1; min-width:0; display:flex; flex-direction:column; gap:5px; }
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
/* Primary CTA → glass button */
.pdxRow__ticket.pdx-glass-btn,
.pdxRow__ticket{
  font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.68rem;
  letter-spacing:.08em; text-transform:uppercase; color:#050506;
  background:var(--glass-btn-solid-bg,var(--c)); border:var(--glass-btn-solid-border,2px solid #000);
  box-shadow:var(--glass-btn-solid-shadow);
  border-radius:9px; padding:5px 10px 4px; text-decoration:none; display:inline-flex; width:fit-content; margin-top:2px;
  cursor:pointer;
}
.pdxRow__ticket:hover{ filter:brightness(1.06); text-decoration:none; color:#050506; }

.pdxRow__aside{ position:relative; z-index:1; display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
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
/* Claim sticker - LIVE standard (docs/LIVE_DESIGN_STANDARD.md) */
.pdxRow__claim{
  font-family:var(--font-display); font-weight:700; font-size:.58rem;
  letter-spacing:.07em; text-transform:uppercase; line-height:1.3;
  padding:4px 9px 3px; color:var(--claim-sticker-fg,#050506); border:0;
  box-shadow:var(--claim-sticker-shadow,3px 3px 0 rgba(0,255,255,.35));
  background:var(--claim-sticker-bg,#00FFFF);
  cursor:pointer; white-space:nowrap;
}
.pdxRow__claim:hover{ filter:brightness(1.06); }
.pdxRow__claim--pending{
  color:var(--claim-sticker-fg,#050506); background:var(--neon-magenta,#FF00CC); cursor:default;
  box-shadow:3px 3px 0 rgba(255,0,204,.35);
}
.pdxRow__claim--pending:hover{ filter:none; }

html.calm-mode .pdxRow,
:root[data-calm="true"] .pdxRow{
  backdrop-filter:none; -webkit-backdrop-filter:none;
  animation:none !important;
}

@media (max-width:560px){
  .pdxRow{ grid-template-columns:64px 1fr; }
  .pdxRow__thumb{ width:64px; height:78px; }
  .pdxRow__aside{ grid-column:1 / -1; flex-direction:row; align-items:center; justify-content:space-between; flex-wrap:wrap; }
}
`;
if (typeof document !== "undefined") {
  let s = document.getElementById("pdx-row-css");
  if (!s) {
    s = document.createElement("style");
    s.id = "pdx-row-css";
    document.head.appendChild(s);
  }
  s.textContent = CSS;
}

const DAY_BASE = { MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };
const ADM_LABEL = { FREE:"Free", TICKETED:"Ticketed", DOOR_FEE:"Door fee", SUGGESTED_DONATION:"Donation" };
const AGE_LABEL = { ALL_AGES:"All ages", "18_PLUS":"18+", "21_PLUS":"21+" };

/** EventCard, the list-view row. */
export function EventCard({
  title, venue, when, day = "FRI", image,
  types = [], admission, age, going,
  claimable = false, claimPending = false, onClaimClick,
  saved, onSave, href,
  venueHref, address, ticketHref, ticketLabel = "Get tickets",
  /** Opt-in LiveWave beside the going pill (default off). */
  liveWave = false,
  className = "", style = {}, ...rest
}: any) {
  const Tag = href ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const metaBits = [admission && ADM_LABEL[admission], age && AGE_LABEL[age]].filter(Boolean).join(" · ");
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const showClaim = claimPending || claimable;
  return (
    <Tag className={`pdxRow pdx-glass-rebind ${className}`} href={href}
      style={{ "--_day": base, "--c": base, "--dc": base, ...style }} {...rest}>
      <span className="pdxRow__sheenSpec" aria-hidden="true" />
      <div className="pdxRow__thumb">
        <span className="pdxRow__scan" aria-hidden="true" />
        {image ? <img src={image} alt="" /> : <span className="pdxRow__thumbPh">{(title || "?").charAt(0)}</span>}
        <span className="pdxRow__thumbFloor" aria-hidden="true" />
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
          <a className="pdxRow__ticket pdx-glass-btn pdx-glass-btn--solid" href={ticketHref} target="_blank" rel="noopener noreferrer" onClick={stop}>
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
        {going != null && (
          <span className="pdxRow__going">
            <span className="dot" />
            {going} Going
            {liveWave ? <LiveWave /> : null}
          </span>
        )}
        {showClaim && (
          claimPending ? (
            <span className="pdxRow__claim pdxRow__claim--pending" data-testid="tag-claim-pending">Claim pending</span>
          ) : (
            <button
              type="button"
              className="pdxRow__claim"
              data-testid="tag-claim-event"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClaimClick?.(); }}
            >
              Claim this event →
            </button>
          )
        )}
      </div>
    </Tag>
  );
}
