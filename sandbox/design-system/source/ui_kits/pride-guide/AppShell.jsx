/* AppShell, header nav + footer for the Pride Guide UI kit. */
const { Logo: PGLogo, Button: PGBtn, StatPill: PGStatPill } = window.PDXPrideGuideDesignSystem_b20420;

const NAV = [
  { key: "home", label: "Home", nav: true },
  { key: "events", label: "Events", nav: true },
  { key: "promoters", label: "Promoters" },
  { key: "pridewerk", label: "Pride Werk" },
  { key: "gifting", label: "Gifting" },
  { key: "spotted", label: "Spotted!" },
  { key: "places", label: "Places", nav: true },
  { key: "about", label: "About" },
];

function Avatar({ size = 40 }) {
  return (
    <span className="pg-avatar pg-avatar--fallback" style={{ width: size, height: size }}>
      <span style={{ width: "100%", height: "100%", borderRadius: "999px", border: "2px solid var(--ink-1000)",
        display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink-800)",
        color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: size * 0.36 }}>TC</span>
    </span>
  );
}

function Header({ route, onNav }) {
  const activeColor = { home: "var(--neon-yellow)", events: "var(--neon-cyan)", places: "var(--neon-magenta)", hub: "var(--neon-cyan)" };
  return (
    <header className="pg-header">
      <div className="pg-header__bar">
        <a href="#home" onClick={(e) => { e.preventDefault(); onNav("home"); }} style={{ display: "flex" }}>
          <PGLogo variant="lockup" size={48} src="../../assets/logo.png" />
        </a>
        <nav className="pg-nav">
          {NAV.map((l) => (
            <button key={l.key}
              className={`pg-nav__link ${route === l.key ? "is-active" : ""}`}
              style={{ "--_c": activeColor[l.key] || "var(--neon-cyan)" }}
              onClick={() => onNav(l.nav ? l.key : route)}>
              {l.label}
            </button>
          ))}
          <span className="pg-nav__sep" />
          <button className={`pg-nav__link ${route === "hub" ? "is-active" : ""}`}
            style={{ "--_c": "var(--neon-cyan)" }} onClick={() => onNav("hub")}>Hub</button>
          <button className="pg-nav__link" style={{ "--_c": "var(--neon-magenta)" }} onClick={() => onNav("admin")}>Admin</button>
        </nav>
        <div className="pg-header__spacer" />
        <PGBtn className="pg-menuBtn" accent="lime" size="sm">Menu</PGBtn>
        <Avatar size={40} />
      </div>
      <div className="pdx-seam" />
    </header>
  );
}

function Footer({ onNav }) {
  return (
    <footer className="pg-footer">
      <div className="pdx-seam" />
      <div className="pg-footer__inner">
        <div className="pg-footer__top">
          <div>
            <PGLogo variant="lockup" size={44} src="../../assets/logo.png" />
            <span className="pg-footer__note" style={{ marginTop: 14 }}>
              Built by the scene, for the scene. No sponsors, no logins, no cover charge.
            </span>
          </div>
          <div className="pg-footer__links">
            <a href="#" onClick={(e) => e.preventDefault()}>JSON API</a>
            <a href="#" onClick={(e) => e.preventDefault()}>llms.txt</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNav && onNav("events"); }}>Submit an Event</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Buy Us a Coffee</a>
          </div>
        </div>
        <div className="pg-footer__bar">
          <span>© 2026 PDX Pride Guide. A community project.</span>
          <span className="pg-footer__protest">Pride is a protest. Take care of each other. ✦</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { PGHeader: Header, PGFooter: Footer, PGAvatar: Avatar });
