import React from "react";

/* NavBar, the mobile bottom navigation bar (tokens/glass.css §2.8). Deep-glass
   surface with a glowing-cyan pull handle on top; the active tab lights in its
   neon accent with a tinted fill + glow. Feed it `items` of { key, label, icon,
   accent } and the active key. */
const CSS = `
.pdxNav{
  position:relative; display:flex; align-items:stretch; gap:6px; padding:14px 12px 12px;
  border-radius:18px 18px 0 0; background:radial-gradient(120% 120% at 50% 0%, #0d0d12 0%, #050506 70%);
  border:1px solid #000;
  box-shadow:0 0 0 1px #000, inset 0 0 34px -10px rgba(0,0,0,.95), inset 0 2px 3px rgba(0,0,0,.6),
    0 0 24px -14px var(--cyan);
}
.pdxNav__handle{ position:absolute; top:6px; left:50%; transform:translateX(-50%); width:46px; height:4px;
  border-radius:99px; background:var(--cyan); box-shadow:0 0 12px 1px var(--cyan);
  animation:pdxPullHandle 2.2s var(--ease-inout) infinite; }
.pdxNav__tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 6px 8px;
  border:1px solid transparent; border-radius:12px; background:transparent; cursor:pointer; text-decoration:none;
  font-family:var(--font-display); font-weight:700; font-size:.64rem; letter-spacing:.05em; text-transform:uppercase;
  color:#777; transition:color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
.pdxNav__tab svg{ width:22px; height:22px; }
.pdxNav__tab--active{ color:var(--_c); transform:scale(1.04);
  background:color-mix(in srgb,var(--_c) 16%,#0a0a0a); border:1px solid var(--_c);
  box-shadow:0 0 14px -2px var(--_c), inset 0 0 12px -6px var(--_c); }
:root[data-calm="true"] .pdxNav__handle{ animation:none !important; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-nav-css")) {
  const s = document.createElement("style");
  s.id = "pdx-nav-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const COLORS = { lime:"var(--lime)", cyan:"var(--cyan)", pink:"var(--pink)", green:"var(--green)",
  orange:"var(--orange)", purple:"var(--purple)", blue:"var(--blue)", magenta:"var(--pink)" };

/** NavBar, the deep-glass mobile bottom nav with a glowing pull handle. */
export function NavBar({
  items = [], active, onSelect, handle = true, className = "", style = {}, ...rest
}) {
  return (
    <nav className={`pdxNav ${className}`} style={style} {...rest}>
      {handle && <span className="pdxNav__handle" aria-hidden="true" />}
      {items.map((it) => {
        const on = it.key === active;
        const c = COLORS[it.accent] || it.accent || "var(--cyan)";
        return (
          <a key={it.key} href={it.href || "#"} className={`pdxNav__tab ${on ? "pdxNav__tab--active" : ""}`}
            style={{ "--_c": c }} aria-current={on ? "page" : undefined}
            onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(it.key); } }}>
            {it.icon}
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
