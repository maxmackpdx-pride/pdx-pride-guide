// @ts-nocheck
import React from "react";
import LiveWave from "@/components/LiveWave";

/* event-card-list-row: Events page list-view presentation.
   This recreates the approved standalone specimen in React while preserving
   the production component's links, attendance, save and claim behavior. */
const CSS = `
.pdxRow{
  --_day: var(--day-fri);
  --_day-ink: #050506;
  --c: var(--_day);
  --dc: var(--_day);
  position:relative; isolation:isolate; display:grid; grid-template-columns:112px minmax(0,1fr) minmax(116px,auto);
  gap:20px; align-items:center; min-height:168px; padding:16px;
  background:linear-gradient(145deg,rgba(255,255,255,.07),transparent 28%),#09090b;
  border:1px solid color-mix(in srgb,var(--_day) 58%,#202027); border-left:5px solid var(--_day);
  border-radius:14px; text-decoration:none; color:inherit; overflow:hidden;
  box-shadow:
    0 0 0 2px #000,
    inset 0 -18px 34px rgba(0,0,0,.58),
    0 18px 42px rgba(0,0,0,.72),
    0 0 34px -4px color-mix(in srgb,var(--_day) 62%,transparent),
    0 0 18px -2px color-mix(in srgb,var(--_day) 48%,transparent);
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
a.pdxRow:hover,
.ds-listing-card--list:hover .pdxRow,
.ds-listing-card--list:focus-visible .pdxRow{
  transform:translateY(-4px) !important;
  text-decoration:none;
  filter:brightness(1.06) saturate(1.08);
  border-color:color-mix(in srgb,var(--_day) 72%,#101014);
  border-left-color:var(--_day);
  box-shadow:
    0 0 0 2px #000,
    inset 0 -18px 34px rgba(0,0,0,.58),
    0 18px 42px rgba(0,0,0,.72),
    0 0 46px -1px color-mix(in srgb,var(--_day) 72%,transparent),
    0 0 26px 0 color-mix(in srgb,var(--_day) 58%,transparent) !important;
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

/* Full flyer, letterboxed into the list specimen's poster frame. */
.pdxRow__thumb{ width:112px; height:136px; border-radius:9px; overflow:hidden;
  background:#000; position:relative; flex:none;
  box-shadow:0 0 0 1px #000,inset 0 0 0 1px color-mix(in srgb,var(--_day) 38%,transparent); }
.pdxRow__scan{
  position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.35;
  background:var(--poster-well-scan);
}
/* Day-color floor is absolute so the approved poster frame stays fixed. */
.pdxRow__thumbFloor{ position:absolute; left:0; right:0; bottom:0; height:3px;
  background:var(--c,var(--_day)); z-index:2; pointer-events:none; }
/* Full flyer in the thumb - letterbox rather than crop */
.pdxRow__thumb img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:center; z-index:0; }
.pdxRow__thumbPh{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-weight:var(--fw-black); font-size:1.6rem; color:var(--_day); opacity:.8; z-index:0; }

.pdxRow__main{ position:relative; z-index:3; min-width:0; display:flex; flex-direction:column; gap:7px; }
.pdxRow__tags{ display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
.pdxRowTag{ display:inline-flex; min-height:32px; align-items:center; justify-content:center;
  font-family:var(--font-mono,ui-monospace,monospace); font-weight:800; font-size:.72rem;
  letter-spacing:.1em; text-transform:uppercase; padding:5px 11px 4px; border-radius:7px; line-height:1; }
.pdxRowTag--day{ border:1px solid var(--_day); background:var(--_day); color:var(--_day-ink); box-shadow:inset 0 1px 0 rgba(255,255,255,.35); }
.pdxRowTag--type{ border:1px solid #2b2b33; color:#d8d5de; background:#111117; }
.pdxRowTag--meta{ border:1px solid color-mix(in srgb,var(--_day) 68%,#202027); color:var(--_day); background:color-mix(in srgb,var(--_day) 11%,#111117); }
.pdxRowTag--complementary{ border-color:color-mix(in srgb,var(--opposite-neon) 68%,#202027); color:var(--opposite-neon); background:color-mix(in srgb,var(--opposite-neon) 11%,#111117); }
.pdxRow__title{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  font-size:clamp(1.75rem,3vw,2.875rem); line-height:.9; color:var(--text-hi); margin:2px 0 1px;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  -webkit-text-stroke:1.5px #000; paint-order:stroke fill;
  text-shadow:0 2px 4px #000,0 0 12px #000,0 0 25px rgba(0,0,0,.94); }
.pdxRow__when{ font-family:var(--font-body); font-size:1rem; color:var(--text-lo); }
.pdxRow__when b{ color:#888; font-weight:var(--fw-semibold); }
.pdxRow__venue{ color:var(--text-hi); font-size:1.05rem; font-weight:650; }
.pdxRow__venue a{ color:var(--text-hi); font-weight:650; text-decoration:none; }
.pdxRow__venue a:hover{ color:var(--_day); }
.pdxRow__address{ font-family:var(--font-body); font-size:.92rem; color:var(--text-lo); }
/* Primary CTA → glass button */
.pdxRow__ticket.pdx-glass-btn,
.pdxRow__ticket{
  font-family:var(--font-display); font-weight:800; font-size:.88rem;
  letter-spacing:.08em; text-transform:uppercase; color:#fff;
  background:var(--btn-glow-bg,#050506); border:1px solid var(--_day);
  box-shadow:var(--btn-glow-shadow);
  border-radius:9px; min-height:44px; padding:9px 14px 8px; text-decoration:none; display:inline-flex;
  align-items:center; justify-content:center; width:fit-content; margin-top:2px;
  cursor:pointer;
}
.pdxRow__ticket:hover{ filter:brightness(1.08); text-decoration:none; color:var(--_day); }

.pdxRow__aside{ position:relative; z-index:3; display:flex; flex-direction:column; align-items:flex-end; gap:10px; }
.pdxRow__more{ display:inline-flex; min-width:116px; min-height:46px; align-items:center; justify-content:center;
  padding:10px 18px; border:1px solid var(--_day); border-radius:9px; color:#fff;
  background:var(--btn-glow-bg,#050506); box-shadow:var(--btn-glow-shadow);
  font:800 1.0625rem/1 var(--font-display); letter-spacing:.08em; text-transform:uppercase; }
.pdxRow:hover .pdxRow__more{ color:var(--_day); }
.pdxRow__going{ display:inline-flex; align-items:center; gap:6px; font-family:var(--font-display);
  min-height:36px; font-weight:var(--fw-bold); font-size:.78rem; letter-spacing:.08em; text-transform:uppercase;
  color:var(--_day); border:1px solid var(--_day); border-radius:9px; padding:6px 11px 5px;
  background:color-mix(in srgb,var(--_day) 9%,#09090b); }
.pdxRow__going .dot{ width:6px; height:6px; border-radius:999px; background:var(--_day);
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
.pdxRow__save{ border:0; background:transparent; color:var(--text-faint); cursor:pointer; padding:2px;
  display:flex; transition:color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-spring); }
.pdxRow__save:hover{ color:var(--neon-magenta); }
.pdxRow__save:active{ transform:scale(.85); }
.pdxRow__save[aria-pressed="true"]{ color:var(--neon-magenta); }
/* Claim action keeps the production behavior inside the approved glow plate. */
.pdxRow__claim{
  min-height:44px; font-family:var(--font-display); font-weight:800; font-size:.86rem;
  letter-spacing:.08em; text-transform:uppercase; line-height:1;
  padding:9px 14px 8px; color:#fff; border:1px solid var(--_day); border-radius:9px;
  box-shadow:var(--btn-glow-shadow);
  background:var(--btn-glow-bg,#050506);
  cursor:pointer; white-space:nowrap;
}
.pdxRow__claim:hover{ filter:brightness(1.08); color:var(--_day); }
/* Pending = same cyan claim family, secondary treatment. Not a CTA, so no
   solid accent fill and no offset sticker shadow. The retired magenta-fill +
   magenta-offset chip is gone. */
.pdxRow__claim--pending{
  color:var(--_day); cursor:default;
  background:color-mix(in srgb,var(--_day) 10%,#050506);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--_day) 45%,#101014);
}
.pdxRow__claim--pending:hover{ filter:none; }

html.calm-mode .pdxRow,
:root[data-calm="true"] .pdxRow{
  backdrop-filter:none; -webkit-backdrop-filter:none;
  animation:none !important;
  box-shadow:0 0 0 2px #000,0 18px 42px rgba(0,0,0,.72) !important;
}

@media (max-width:720px){
  .pdxRow{ grid-template-columns:82px minmax(0,1fr); gap:13px; min-height:142px; padding:13px; }
  .pdxRow__thumb{ width:82px; height:110px; }
  .pdxRow__title{ font-size:clamp(1.55rem,8vw,2.35rem); }
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
const DAY_INK = { MON:"#fff", TUE:"#fff", WED:"#050506", THU:"#050506",
  FRI:"#050506", SAT:"#050506", SUN:"#050506" };
const DAY_OPPOSITE = { MON:"#CCFF00", TUE:"#FF6600", WED:"#8800FF", THU:"#FF6600",
  FRI:"#CCFF00", SAT:"#FF3030", SUN:"#00FFFF" };
const ADM_LABEL = { FREE:"Free", TICKETED:"Ticketed", DOOR_FEE:"Door fee", SUGGESTED_DONATION:"Donation" };
const AGE_LABEL = { ALL_AGES:"All ages", "18_PLUS":"18+", "21_PLUS":"21+" };

function tagKey(s: string) {
  return String(s).toLowerCase().replace(/[^a-z0-9+]/g, "");
}

/** Skip admission/age meta when type chips already show them (no "DOOR FEE" + "Door fee · 21+"). */
function buildMetaBits(admission?: string, age?: string, types: string[] = []) {
  const covered = new Set(types.map(tagKey));
  const bits: string[] = [];
  if (admission && ADM_LABEL[admission] && !covered.has(tagKey(ADM_LABEL[admission])) && !covered.has(tagKey(admission))) {
    bits.push(ADM_LABEL[admission]);
  }
  if (age && AGE_LABEL[age] && !covered.has(tagKey(AGE_LABEL[age])) && !covered.has(tagKey(age))) {
    bits.push(AGE_LABEL[age]);
  }
  return bits.join(" · ");
}

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
  const dayInk = DAY_INK[day] || "#050506";
  const opposite = DAY_OPPOSITE[day] || "#CCFF00";
  const typeSlice = types.slice(0, 2);
  const metaBits = buildMetaBits(admission, age, typeSlice);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const showClaim = claimPending || claimable;
  return (
    <Tag className={`pdxRow pdx-glass-rebind ${className}`} href={href}
      style={{ "--_day": base, "--_day-ink": dayInk, "--opposite-neon": opposite, "--c": base, "--dc": base, ...style }} {...rest}>
      <span className="pdxRow__sheenSpec" aria-hidden="true" />
      <div className="pdxRow__thumb">
        <span className="pdxRow__scan" aria-hidden="true" />
        {image ? <img src={image} alt="" /> : <span className="pdxRow__thumbPh">{(title || "?").charAt(0)}</span>}
        <span className="pdxRow__thumbFloor" aria-hidden="true" />
      </div>
      <div className="pdxRow__main">
        <div className="pdxRow__tags">
          <span className="pdxRowTag pdxRowTag--day">{day}</span>
          {typeSlice.map((t, i) => <span className={`pdxRowTag pdxRowTag--type${/^SEX[ _-]?POSITIVE$/i.test(t) ? " pdxRowTag--complementary" : ""}`} key={i}>{t}</span>)}
          {metaBits && <span className={`pdxRowTag pdxRowTag--meta${admission === "DOOR_FEE" ? " pdxRowTag--complementary" : ""}`}>{metaBits}</span>}
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
          <a className="pdxRow__ticket pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" href={ticketHref} target="_blank" rel="noopener noreferrer" onClick={stop}>
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
