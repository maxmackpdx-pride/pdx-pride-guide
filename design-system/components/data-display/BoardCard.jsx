import React from "react";

/* BoardCard, community-board post card on the glass surface (tokens/glass.css §2.4).
   Keyed to a board color (Missed Connections magenta, Gifting lime, Gigs violet),
   with a faint oversized line-motif bled into the top-right and a GIVE/ISO
   direction chip + rail. */
const CSS = `
.pdxBoardCard{
  --_c:var(--pink);
  position:relative; overflow:hidden; display:flex; flex-direction:column; gap:9px;
  padding:16px 18px 16px 22px; border-radius:14px; text-decoration:none; color:inherit;
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
  transition:transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
a.pdxBoardCard:hover{ transform:translateY(-4px); text-decoration:none;
  box-shadow:0 40px 70px -28px rgba(0,0,0,.95), 0 0 60px -26px color-mix(in srgb,var(--_c) 80%,transparent); }
.pdxBoardCard > *{ position:relative; z-index:3; }
.pdxBoardCard__motif{ position:absolute; top:-14px; right:-10px; z-index:1; width:150px; height:150px;
  color:var(--_c); opacity:.10; pointer-events:none; }
.pdxBoardCard__rail{ position:absolute; left:0; top:14px; bottom:14px; width:3px; border-radius:3px; z-index:2; }
.pdxBoardCard__rail--give{ background:var(--_c); box-shadow:0 0 10px -2px var(--_c); }
.pdxBoardCard__rail--iso{ background:repeating-linear-gradient(180deg,var(--_c) 0 5px,transparent 5px 10px); opacity:.85; }
.pdxBoardCard__top{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.pdxBoardCard__board{ font-family:var(--font-display); font-weight:800; font-size:.86rem; letter-spacing:.04em;
  text-transform:uppercase; color:var(--_c); -webkit-text-stroke:1px #000; paint-order:stroke fill; }
.pdxBoardCard__dir{ white-space:nowrap; padding:3px 11px 2px; border-radius:99px; font-family:var(--font-display);
  font-weight:800; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase; }
.pdxBoardCard__dir--give{ background:var(--_c); color:#050506; }
.pdxBoardCard__dir--iso{ background:color-mix(in srgb,var(--_c) 20%,#050506); border:1px solid var(--_c); color:var(--_c); }
.pdxBoardCard__meta{ font-family:var(--font-body); font-size:.82rem; color:var(--text-lo); }
.pdxBoardCard__title{ font-family:var(--font-display); font-weight:900; text-transform:uppercase;
  font-size:1.28rem; line-height:1.02; color:#fff; margin:1px 0 0; }
.pdxBoardCard__text{ font-family:var(--font-body); font-size:.9rem; line-height:1.5; color:var(--text-mid); margin:0; }
.pdxBoardCard__foot{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:2px; }
.pdxBoardCard__where{ font-family:var(--font-body); font-size:.8rem; color:var(--text-faint); }
.pdxBoardCard__cta{ font-family:var(--font-display); font-weight:800; font-size:.74rem; letter-spacing:.05em;
  text-transform:uppercase; color:var(--_c); }
:root[data-calm="true"] .pdxBoardCard{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-boardcard-css")) {
  const s = document.createElement("style");
  s.id = "pdx-boardcard-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const BOARD = {
  spotted: { c: "var(--board-spotted)", label: "Missed Connection", give: "Giving", iso: "ISO" },
  gifting: { c: "var(--board-gifting)", label: "Gifting", give: "Giving", iso: "ISO" },
  gigs:    { c: "var(--board-gigs)",    label: "Gigs", give: "Offering", iso: "Looking" },
};
const S = (kids) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>{kids}</svg>;
const MOTIF = {
  spotted: S(<><path d="M7 7h4v5c0 2-1.5 3.5-4 4" /><path d="M14 7h4v5c0 2-1.5 3.5-4 4" /></>),
  giftGive: S(<><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 13h16M12 9v11M12 9C9 3 4 5 6 8M12 9c3-6 8-4 6-1" /></>),
  giftIso: S(<><circle cx="10" cy="10" r="6" /><path d="m20 20-5.5-5.5" /></>),
  gigsGive: S(<><path d="M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7" /></>),
  gigsIso: S(<><circle cx="7" cy="14" r="4" /><circle cx="17" cy="14" r="4" /><path d="M11 14h2M6 8l2 2M18 8l-2 2" /></>),
};

/** BoardCard, community-board post card (Missed Connections / Gifting / Gigs). */
export function BoardCard({
  board = "spotted", kind, title, meta, where, text, cta = "Reply",
  href, className = "", style = {}, ...rest
}) {
  const b = BOARD[board] || BOARD.spotted;
  const dir = kind === "give" || kind === "iso" ? kind : null;
  const dirLabel = dir === "give" ? b.give : dir === "iso" ? b.iso : null;
  const motifKey = board === "spotted" ? "spotted"
    : board === "gifting" ? (kind === "iso" ? "giftIso" : "giftGive")
    : (kind === "iso" ? "gigsIso" : "gigsGive");
  const Tag = href ? "a" : "div";
  return (
    <Tag className={`pdxBoardCard ${className}`} href={href} style={{ "--_c": b.c, ...style }} {...rest}>
      <span className="pdxBoardCard__motif" aria-hidden="true">{MOTIF[motifKey]}</span>
      {dir && <span className={`pdxBoardCard__rail pdxBoardCard__rail--${dir}`} aria-hidden="true" />}
      <div className="pdxBoardCard__top">
        <span className="pdxBoardCard__board">{b.label}</span>
        {dirLabel && <span className={`pdxBoardCard__dir pdxBoardCard__dir--${dir}`}>{dirLabel}</span>}
        {meta && <span className="pdxBoardCard__meta">{meta}</span>}
      </div>
      <h3 className="pdxBoardCard__title">{title}</h3>
      {text && <p className="pdxBoardCard__text">{text}</p>}
      <div className="pdxBoardCard__foot">
        {where ? <span className="pdxBoardCard__where">{where}</span> : <span />}
        {cta && <span className="pdxBoardCard__cta">{cta} &rarr;</span>}
      </div>
    </Tag>
  );
}
