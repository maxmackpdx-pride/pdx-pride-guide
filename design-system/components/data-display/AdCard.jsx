import React from "react";

/* AdCard, affiliate ad built to read as a real event card (tokens/glass.css §2.14).
   variant "grid" = green events-grid slot (logo well, PARTNER/LOCAL tags, SHOP NOW
   glass button, AD dot). variant "feed" = red in-feed slot (glowing AFFILIATE badge,
   close ✕, logo well, red title, mono subcopy + code line). */
const CSS = `
.pdxAd{
  --_c:var(--green);
  position:relative; overflow:hidden; display:flex; flex-direction:column;
  border-radius:14px; text-decoration:none; color:inherit;
  background:
    radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb, var(--_c) 6%, #050408) 100%),
    radial-gradient(120% 78% at 50% 122%, color-mix(in srgb, var(--_c) 18%, transparent), transparent 56%);
  border:1px solid color-mix(in srgb, var(--_c) 55%, #101014);
  box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95),
    0 0 26px -8px color-mix(in srgb, var(--_c) 78%, transparent),
    0 0 13px -5px color-mix(in srgb, var(--_c) 78%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--_c) 55%, rgba(255,255,255,.12)),
    inset 0 0 34px -26px color-mix(in srgb, var(--_c) 40%, transparent);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  animation:pdxCardIn .5s var(--ease-out) both;
}
.pdxAd__refract{ position:absolute; top:0; left:6px; right:6px; height:2px; z-index:5;
  background:var(--glass-refract); background-size:200% 100%; opacity:.72; filter:blur(.2px);
  animation:pdxRefract 7s linear infinite;
  -webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);
  mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); }
.pdxAd__well{ position:relative; height:230px; display:flex; align-items:center; justify-content:center;
  border-radius:13px 13px 0 0; overflow:hidden; border-bottom:4px solid var(--_c);
  background:radial-gradient(130% 130% at 50% 40%, color-mix(in srgb, var(--_c) 32%, #050506), #050506 72%); }
.pdxAd__well img{ max-width:64%; max-height:88px; object-fit:contain; position:relative; z-index:2; }
.pdxAd__logo{ font-family:var(--font-display); font-weight:900; font-size:2rem; letter-spacing:.24em;
  text-transform:uppercase; color:var(--_c); text-shadow:0 0 24px color-mix(in srgb,var(--_c) 60%,transparent); }
.pdxAd__tag{ position:absolute; top:14px; left:14px; z-index:3; padding:5px 12px; border-radius:5px;
  font-family:var(--font-display); font-weight:800; font-size:.64rem; letter-spacing:.08em; text-transform:uppercase; }
.pdxAd__tag--grid{ background:var(--lime); color:#050506; box-shadow:0 0 16px -4px var(--lime); }
.pdxAd__tag--feed{ display:inline-flex; align-items:center; gap:8px; background:transparent; color:var(--_c);
  text-shadow:0 0 10px color-mix(in srgb,var(--_c) 80%,transparent); }
.pdxAd__tag--feed .d{ width:7px; height:7px; border-radius:50%; background:var(--_c); box-shadow:0 0 8px var(--_c); }
.pdxAd__close{ position:absolute; top:12px; right:12px; z-index:3; width:30px; height:30px; border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center; cursor:pointer; color:#c8c4bb;
  background:rgba(6,6,8,.6); border:1px solid #2a2a32; }
.pdxAd__body{ position:relative; z-index:3; padding:14px 16px 16px; display:flex; flex-direction:column; gap:11px; }
.pdxAd__tags{ display:flex; gap:7px; }
.pdxAd__pill{ font-family:var(--font-display); font-weight:700; font-size:.6rem; letter-spacing:.08em;
  text-transform:uppercase; padding:2px 7px 1px; border-radius:2px; }
.pdxAd__pill--solid{ background:#fff; color:#000; }
.pdxAd__pill--out{ border:1px solid #33333c; color:#b7b4bd; }
.pdxAd__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase; font-size:1.6rem;
  line-height:1; color:#fff; }
.pdxAd__title--feed{ color:var(--_c); text-shadow:0 0 20px color-mix(in srgb,var(--_c) 40%,transparent); }
.pdxAd__desc{ margin:0; font-size:.92rem; line-height:1.5; color:#8a8792; }
.pdxAd__sub{ margin:0; font-family:ui-monospace,monospace; font-size:.74rem; line-height:1.6; letter-spacing:.04em;
  text-transform:uppercase; color:#8a8792; }
.pdxAd__note{ font-family:var(--font-display); font-weight:800; font-size:.95rem; letter-spacing:.02em;
  text-transform:uppercase; color:var(--_c); }
.pdxAd__foot{ display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding-top:12px; border-top:1px solid #16161b; }
.pdxAd__ad{ display:inline-flex; align-items:center; gap:8px; font-family:ui-monospace,monospace; font-size:.74rem;
  letter-spacing:.1em; text-transform:uppercase; color:#8a8792; }
.pdxAd__ad .d{ width:8px; height:8px; border-radius:50%; background:var(--pink); box-shadow:0 0 8px var(--pink); }
.pdxAd__code{ padding:14px 16px 16px; display:flex; flex-direction:column; gap:4px; position:relative; z-index:3; }
.pdxAd__codeBig{ font-family:var(--font-display); font-weight:900; font-size:1.4rem; letter-spacing:.02em;
  text-transform:uppercase; color:#fff; }
:root[data-calm="true"] .pdxAd, :root[data-calm="true"] .pdxAd__refract{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-ad-css")) {
  const s = document.createElement("style");
  s.id = "pdx-ad-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** AdCard, affiliate ad that mirrors a real event card. */
export function AdCard({
  variant = "grid", logo, logoText = "Logo", title, description, cta = "Shop now",
  tags = [], note, subcopy, code, onClose, onClick, className = "", style = {}, ...rest
}) {
  const accent = variant === "feed" ? "var(--red)" : "var(--green)";
  return (
    <div className={`pdxAd ${className}`} style={{ "--_c": accent, ...style }} {...rest}>
      <span className="pdxAd__refract" aria-hidden="true" />
      <div className="pdxAd__well">
        {variant === "feed"
          ? <span className="pdxAd__tag pdxAd__tag--feed"><span className="d" />Affiliate</span>
          : <span className="pdxAd__tag pdxAd__tag--grid">Affiliate</span>}
        {variant === "feed" && <span className="pdxAd__close" onClick={onClose} role="button" aria-label="Dismiss ad">&times;</span>}
        {logo ? <img src={logo} alt={title || "ad"} /> : <span className="pdxAd__logo">{logoText}</span>}
      </div>
      {variant === "feed" ? (
        <>
          <div className="pdxAd__body" style={{ borderBottom: "1px solid #16161b" }}>
            <div className={`pdxAd__title pdxAd__title--feed`}>{title}</div>
            {subcopy && <p className="pdxAd__sub">{subcopy}</p>}
          </div>
          <div className="pdxAd__code">
            {note && <span className="pdxAd__codeBig">{note}</span>}
            {code && <span className="pdxAd__sub">{code}</span>}
          </div>
        </>
      ) : (
        <div className="pdxAd__body">
          {tags.length > 0 && (
            <div className="pdxAd__tags">
              {tags.map((t, i) => <span key={i} className={`pdxAd__pill ${i === 0 ? "pdxAd__pill--solid" : "pdxAd__pill--out"}`}>{t}</span>)}
            </div>
          )}
          <div className="pdxAd__title">{title}</div>
          {description && <p className="pdxAd__desc">{description}</p>}
          {note && <span className="pdxAd__note">{note}</span>}
          <div className="pdxAd__foot">
            <span className="pdxAd__ad"><span className="d" />Ad</span>
            <a href="#" className="pdx-glass-btn" style={{ "--_c": "var(--green)", fontSize: ".82rem", padding: "10px 18px" }}
              onClick={(e) => { e.preventDefault(); onClick && onClick(); }}>{cta} &rarr;</a>
          </div>
        </div>
      )}
    </div>
  );
}
