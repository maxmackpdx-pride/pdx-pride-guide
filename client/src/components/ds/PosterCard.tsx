// @ts-nocheck
import React from "react";

/* PosterCard, the canonical event "board card" (source: EVENTS_GUIDE.md).
   Deep-glass / OLED-neon (docs/handoffs/deep-glass-2026-07-16/ §2.1):
   --glass-card with --c = day color; sheen; rainbow top seam (base ::before /
   pdx-rainbow-rule engine); poster in --poster-well (radial + 4px day floor +
   scanline); primary CTAs = .pdx-glass-btn. Claim keeps brutal sticker.
   Layout / spacing / type scale unchanged. Entrance: pgDirCardIn. */
const CSS = `
.pdxBoard{
  /* Day color drives ALL glass chrome (--c rebinds recipes in glass.css) */
  --_day: var(--day-fri);
  --c: var(--_day);
  --dc: var(--_day);
  position:relative; display:flex; flex-direction:column;
  background:var(--glass-card-bg);
  border:var(--glass-card-border); border-radius:var(--radius-md);
  overflow:hidden; text-decoration:none; color:inherit; cursor:pointer;
  box-shadow:var(--glass-card-shadow);
  backdrop-filter:blur(var(--glass-card-blur));
  -webkit-backdrop-filter:blur(var(--glass-card-blur));
  /* Entrance fill-mode backwards only - so hover transform works after entry.
     No infinite box-shadow pulse at rest (dense grids + scroll = paint thrash). */
  animation: pgDirCardIn .55s var(--ease-out,ease) backwards;
  animation-delay:calc(var(--i, 0) * 40ms);
  transition:transform var(--dur-base) var(--ease-out), filter var(--dur-base) var(--ease-out),
             border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxBoard:hover,
a.pdxBoard:hover{
  transform:translateY(-4px) !important;
  text-decoration:none;
  filter:brightness(1.06) saturate(1.08);
  border-color:color-mix(in srgb,var(--_day) 70%,#101014);
  animation-play-state:paused;
}

/* Top-left diagonal sheen (::before is reserved for base rainbow seam) */
.pdxBoard::after{
  content:""; position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen);
}
/* Bottom-right specular sheen (second layer) */
.pdxBoard__sheenSpec{
  position:absolute; inset:0; border-radius:inherit;
  pointer-events:none; z-index:2; background:var(--glass-sheen-specular);
}

/* --poster-well: radial accent well + scanline; 4px day floor via stripe */
.pdxBoard__poster{ position:relative; aspect-ratio:2/3;
  background:var(--poster-well-bg); overflow:hidden; }
.pdxBoard__scan{
  position:absolute; inset:0; pointer-events:none; z-index:1; opacity:.35;
  background:var(--poster-well-scan);
}
/* Full flyer on the card face - never crop art/type off the edges */
.pdxBoard__img{ position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:center; z-index:0; }
.pdxBoard__ph{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  padding:20px; text-align:center; z-index:0; }
.pdxBoard__phTitle{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  line-height:.95; color:rgba(255,255,255,.42); font-size:1.5rem; }
/* Day-color floor (poster-well border-bottom:4px solid var(--c)) */
.pdxBoard__stripe{ position:absolute; left:0; right:0; bottom:0; height:4px; background:var(--c,var(--_day)); z-index:2; }
.pdxBoard__linkchip{ position:absolute; top:9px; right:9px; width:28px; height:28px; border-radius:999px;
  display:flex; align-items:center; justify-content:center; background:rgba(5,5,7,.72);
  border:1px solid rgba(255,255,255,.16); color:#fff; backdrop-filter:blur(4px); z-index:3; }
.pdxBoard__linkchip svg{ width:13px; height:13px; }

.pdxBoard__meta{ position:relative; z-index:1; padding:14px 16px 16px; display:flex; flex-direction:column; gap:8px; flex:1; }
.pdxBoard__tags{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.pdxTag{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.6rem;
  letter-spacing:.08em; text-transform:uppercase; padding:0 6px; border-radius:2px; line-height:1.05; }
.pdxTag--day{ background:#fff; color:#000; }
.pdxTag--type{ border:1px solid var(--border-strong); color:var(--text-lo); }
.pdxTag--meta{ border:1px solid var(--border-strong); color:var(--text-mid); }
/* Inline claim chip (if used in tags row) - Card System cyan sticker */
.pdxTag--claim{
  color:#050506; background:#00FFFF; border:0;
  box-shadow:3px 3px 0 rgba(0,255,255,.35);
}

.pdxBoard__title{ font-family:var(--font-display); font-weight:var(--fw-black); text-transform:uppercase;
  font-size:var(--title-md); line-height:1.05; color:var(--text-hi); margin:2px 0 0; }
.pdxBoard__venue{ font-family:var(--font-body); font-size:var(--body-sm); color:#888; }
.pdxBoard__venue--link{ color:var(--neon-cyan,#19E3FF); text-decoration:none; font-weight:600; }
.pdxBoard__venue--link:hover{ text-decoration:underline; color:#7af0ff; }
.pdxBoard__address{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); line-height:1.35; }
.pdxBoard__when{ font-family:var(--font-body); font-size:var(--meta); color:var(--text-lo); }

/* Dense grid cards: less chrome under the flyer so more posters fit on screen */
.pdxBoard--dense .pdxBoard__meta{ padding:10px 12px 12px; gap:5px; }
.pdxBoard--dense .pdxBoard__title{ font-size:clamp(0.78rem, 1.6vw, 0.95rem); line-height:1.08;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.pdxBoard--dense .pdxBoard__venue{ font-size:0.72rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pdxBoard--dense .pdxBoard__when{ font-size:0.68rem; }
.pdxBoard--dense .pdxBoard__tags{ gap:4px; max-height:1.35em; overflow:hidden; }
.pdxBoard--dense .pdxTag{ font-size:.55rem; padding:0 5px; }
.pdxBoard--dense .pdxBoard__claim{ padding-top:6px; }
.pdxBoard--dense .pdxBoard__claim-tag{ font-size:.55rem; padding:3px 8px 2px; }
.pdxBoard--dense .pdxBoard__foot{ padding-top:6px; }
/* Primary CTA → solid glass button */
.pdxBoard__ticket.pdx-glass-btn,
.pdxBoard__ticket{
  font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.72rem;
  letter-spacing:.08em; text-transform:uppercase; color:#050506;
  background:var(--glass-btn-solid-bg,var(--c)); border:var(--glass-btn-solid-border,2px solid #000);
  box-shadow:var(--glass-btn-solid-shadow);
  border-radius:9px; padding:5px 10px 4px; text-decoration:none; display:inline-flex; width:fit-content;
  margin-top:2px; cursor:pointer;
}
.pdxBoard__ticket:hover{ filter:brightness(1.06); text-decoration:none; color:#050506; }
.pdxBoard__link{ font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.8rem;
  letter-spacing:.05em; text-transform:uppercase; color:var(--_dayt,var(--_day)); margin-top:2px;
  display:inline-flex; align-items:center; gap:5px; }

/* Claim sticker - LIVE standard (not yellow-rim brutal, not default CTA glass).
   docs/LIVE_DESIGN_STANDARD.md · tokens: --claim-sticker-* in effects.css */
.pdxBoard__claim{ margin-top:auto; padding-top:10px; display:flex; }
.pdxBoard__claim-tag{
  font-family:var(--font-display); font-weight:700; font-size:.62rem;
  letter-spacing:.07em; text-transform:uppercase; line-height:1.3;
  padding:5px 10px 4px; color:var(--claim-sticker-fg,#050506); border:0;
  box-shadow:var(--claim-sticker-shadow,3px 3px 0 rgba(0,255,255,.35));
  background:var(--claim-sticker-bg,#00FFFF);
  border-radius:0; cursor:pointer; display:inline-flex; align-items:center; gap:4px;
}
.pdxBoard__claim-tag:hover{ filter:brightness(1.06); }
.pdxBoard__claim-tag--pending{
  color:var(--claim-sticker-fg,#050506); background:var(--neon-magenta,#FF00CC); cursor:default;
  box-shadow:3px 3px 0 rgba(255,0,204,.35);
}
.pdxBoard__claim-tag--pending:hover{ filter:none; }

.pdxBoard__foot{ display:flex; align-items:center; justify-content:space-between; gap:10px;
  margin-top:auto; padding-top:10px; border-top:1px solid var(--border-faint); }
.pdxBoard__going{ display:inline-flex; align-items:center; gap:7px; font-family:var(--font-display);
  font-weight:var(--fw-bold); font-size:.72rem; letter-spacing:.06em; text-transform:uppercase;
  color:var(--neon-yellow); border:1px solid var(--neon-yellow); border-radius:999px; padding:4px 11px 3px; }
.pdxBoard__going .dot{ width:6px; height:6px; border-radius:999px; background:var(--neon-yellow);
  animation:pdxBlink 1.6s var(--ease-inout) infinite; }
@keyframes pdxBlink{ 50%{ opacity:.35; } }
/* RSVP primary CTA → solid glass button */
.pdxBoard__rsvp.pdx-glass-btn,
.pdxBoard__rsvp{
  font-family:var(--font-display); font-weight:var(--fw-bold); font-size:.72rem;
  letter-spacing:.06em; text-transform:uppercase; color:#050506;
  background:var(--neon-yellow,#CCFF00); border:2px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.55);
  color:#050506;
  border-radius:9px; padding:5px 12px 4px; cursor:pointer; white-space:nowrap;
  flex-shrink:0; min-width:max-content;
}
.pdxBoard__rsvp:hover{ filter:brightness(1.06); }

/* Calm: solid slab, no blur / pulse (bloom already zeroed via --dir-gm) */
html.calm-mode .pdxBoard,
:root[data-calm="true"] .pdxBoard{
  backdrop-filter:none; -webkit-backdrop-filter:none;
  animation:none !important;
}
`;
if (typeof document !== "undefined") {
  let s = document.getElementById("pdx-board-css");
  if (!s) {
    s = document.createElement("style");
    s.id = "pdx-board-css";
    document.head.appendChild(s);
  }
  s.textContent = CSS;
}

const DAY_BASE = { MON:"var(--day-mon)", TUE:"var(--day-tue)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };
const DAY_TEXT = { MON:"var(--day-mon-text)", TUE:"var(--day-tue-text)", WED:"var(--day-wed)",
  THU:"var(--day-thu)", FRI:"var(--day-fri)", SAT:"var(--day-sat)", SUN:"var(--day-sun)" };

const ADM_LABEL = { FREE:"Free", TICKETED:"Ticketed", DOOR_FEE:"Door fee", SUGGESTED_DONATION:"Donation" };
const AGE_LABEL = { ALL_AGES:"All ages", "18_PLUS":"18+", "21_PLUS":"21+" };

/** Normalize tag text so "DOOR FEE" / "Door fee" / "door_fee" match. */
function tagKey(s: string) {
  return String(s).toLowerCase().replace(/[^a-z0-9+]/g, "");
}

/** Admission/age chip text only when type tags do not already cover it (avoids DOOR FEE + "Door fee · 21+"). */
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

/** PosterCard, the event board card. */
export function PosterCard({
  title, venue, when, day = "FRI", image,
  types = [], admission, age, claimable = false,
  claimPending = false,
  onClaimClick,
  going, onRsvp, href, showLink = true, showDetailsLink = true,
  venueHref, address, ticketHref, ticketLabel = "Get tickets",
  dense = false,
  className = "", style = {}, ...rest
}: any) {
  const cardHref = onRsvp ? undefined : href;
  const detailsHref = onRsvp ? href : undefined;
  const Tag = cardHref ? "a" : "div";
  const base = DAY_BASE[day] || "#fff";
  const dayt = DAY_TEXT[day] || "#fff";
  const metaBits = buildMetaBits(admission, age, types);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const showClaim = claimPending || claimable;
  const claimLabel = dense ? "Claim →" : "Claim this event →";
  return (
    <Tag className={`pdxBoard pdx-glass-rebind${dense ? " pdxBoard--dense" : ""}${className ? ` ${className}` : ""}`} href={cardHref}
      style={{ "--_day": base, "--c": base, "--dc": base, "--_dayt": dayt, ...style }} {...rest}>
      <span className="pdxBoard__sheenSpec" aria-hidden="true" />
      <div className="pdxBoard__poster">
        <span className="pdxBoard__scan" aria-hidden="true" />
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
        </div>
        <h3 className="pdxBoard__title">{title}</h3>
        {venue && (venueHref
          ? <a className="pdxBoard__venue pdxBoard__venue--link" href={venueHref} target="_blank" rel="noopener noreferrer" onClick={stop}>{venue} ↗</a>
          : <div className="pdxBoard__venue">{venue}</div>)}
        {/* Dense grid: neighborhood is already in `when`  -  skip street address to free vertical space */}
        {!dense && address ? <div className="pdxBoard__address">{address}</div> : null}
        {ticketHref && (
          <a className="pdxBoard__ticket pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" href={ticketHref} target="_blank" rel="noopener noreferrer" onClick={stop}>
            {ticketLabel} →
          </a>
        )}
        {when && <div className="pdxBoard__when">{when}</div>}
        {/* Only render when it navigates - dead "Event details" spans on board cards do nothing (card click opens modal). */}
        {showDetailsLink && detailsHref ? (
          <a className="pdxBoard__link" href={detailsHref} onClick={stop}>Event details &rarr;</a>
        ) : null}

        {(going != null || onRsvp) && (
          <div className="pdxBoard__foot">
            {going != null
              ? <span className="pdxBoard__going"><span className="dot" />{going} Going</span>
              : <span />}
            {onRsvp && <button type="button" className="pdxBoard__rsvp pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRsvp(); }}>I'll be there</button>}
          </div>
        )}

        {showClaim && (
          <div className="pdxBoard__claim">
            {claimPending ? (
              <span className="pdxBoard__claim-tag pdxBoard__claim-tag--pending" data-testid="tag-claim-pending">
                {dense ? "Pending" : "Claim pending"}
              </span>
            ) : (
              <button
                type="button"
                className="pdxBoard__claim-tag"
                data-testid="tag-claim-event"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClaimClick?.();
                }}
              >
                {claimLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </Tag>
  );
}
