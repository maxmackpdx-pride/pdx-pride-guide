import React from "react";

/* FeedItem, hub scene-feed row (tokens/glass.css §2.13): NEUTRAL glass card (the
   corner sheen is a background layer so text stays legible), a conic-rainbow avatar
   ring, an outlined status badge in the status color, body copy, an optional
   attachment chip, and an optional full rainbow top bar for "Looking" posts. */
const CSS = `
.pdxFeed{
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:10px;
  padding:16px 18px; border-radius:14px; color:inherit;
  background:
    linear-gradient(133deg, rgba(255,255,255,.05), rgba(255,255,255,.012) 16%, transparent 40%),
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #050508 100%);
  border:1px solid rgba(255,255,255,.10);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -12px rgba(255,255,255,.15), inset 0 1px 0 rgba(255,255,255,.08);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
}
.pdxFeed__rainbow{ position:absolute; top:0; left:0; right:0; height:3px; z-index:4;
  background:var(--glass-refract); background-size:200% 100%; animation:pdxRefract 7s linear infinite; }
.pdxFeed__head{ display:flex; align-items:center; gap:12px; }
.pdxFeed__avatar{ flex:none; width:44px; height:44px; border-radius:50%; padding:2px;
  background:conic-gradient(from 210deg,#FF00CC,#FF6600,#CCFF00,#39FF14,#00FFFF,#8800FF,#FF00CC); display:inline-flex; }
.pdxFeed__avatar > *{ width:100%; height:100%; border-radius:50%; border:2px solid #050506; object-fit:cover; }
.pdxFeed__avatarFallback{ display:inline-flex; align-items:center; justify-content:center; background:#0a0a0f;
  font-family:var(--font-display); font-weight:900; font-size:1rem; color:#fff; }
.pdxFeed__id{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.pdxFeed__name{ font-family:var(--font-display); font-weight:800; text-transform:uppercase; letter-spacing:.02em;
  font-size:.98rem; color:#fff; }
.pdxFeed__action{ font-family:ui-monospace,monospace; font-size:.72rem; letter-spacing:.04em; color:var(--text-faint); }
.pdxFeed__badge{ flex:none; align-self:flex-start; padding:3px 10px 2px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.62rem; letter-spacing:.05em; text-transform:uppercase;
  background:color-mix(in srgb,var(--_s,var(--cyan)) 16%,transparent); border:1px solid var(--_s,var(--cyan)); color:var(--_s,var(--cyan)); }
.pdxFeed__body{ font-family:var(--font-body); font-size:.92rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxFeed__att{ display:flex; align-items:center; gap:9px; padding:10px 12px; border-radius:10px;
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); }
.pdxFeed__att .dot{ width:9px; height:9px; border-radius:50%; flex:none; background:var(--_a,var(--cyan)); box-shadow:0 0 8px var(--_a,var(--cyan)); }
.pdxFeed__attMain{ display:flex; flex-direction:column; gap:1px; min-width:0; }
.pdxFeed__attTitle{ font-family:var(--font-display); font-weight:800; font-size:.88rem; text-transform:uppercase; color:#fff; }
.pdxFeed__attSub{ font-family:ui-monospace,monospace; font-size:.68rem; letter-spacing:.04em; color:var(--text-faint); }
:root[data-calm="true"] .pdxFeed, :root[data-calm="true"] .pdxFeed__rainbow{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-feed-css")) {
  const s = document.createElement("style");
  s.id = "pdx-feed-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const STATUS = { rsvp:"var(--green)", submitted:"var(--cyan)", looking:"var(--purple)",
  checkin:"var(--green)", event:"var(--cyan)", host:"var(--cyan)" };

/** FeedItem, hub scene-feed row on the neutral glass surface. */
export function FeedItem({
  name, action, avatar, initial, status, statusLabel, rainbowTop = false,
  children, attachment, className = "", style = {}, ...rest
}) {
  const sColor = STATUS[status] || "var(--cyan)";
  return (
    <div className={`pdxFeed ${className}`} style={style} {...rest}>
      {rainbowTop && <span className="pdxFeed__rainbow" aria-hidden="true" />}
      <div className="pdxFeed__head">
        <span className="pdxFeed__avatar">
          {avatar ? <img src={avatar} alt={name} />
            : <span className="pdxFeed__avatarFallback">{initial || (name || "?").charAt(0)}</span>}
        </span>
        <span className="pdxFeed__id">
          <span className="pdxFeed__name">{name}</span>
          {action && <span className="pdxFeed__action">{action}</span>}
        </span>
        {statusLabel && <span className="pdxFeed__badge" style={{ "--_s": sColor }}>{statusLabel}</span>}
      </div>
      {children && <p className="pdxFeed__body">{children}</p>}
      {attachment && (
        <div className="pdxFeed__att" style={{ "--_a": attachment.color || sColor }}>
          <span className="dot" />
          <span className="pdxFeed__attMain">
            <span className="pdxFeed__attTitle">{attachment.title}</span>
            {attachment.sub && <span className="pdxFeed__attSub">{attachment.sub}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
