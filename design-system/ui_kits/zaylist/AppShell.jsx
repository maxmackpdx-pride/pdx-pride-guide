/* AppShell, site header + footer for the Zaylist UI kit.
   Nav model mirrors client/src/lib/siteNav.ts (PRIMARY_NAV) on master.
   Footer folders mirror client/src/components/Footer.tsx (FOOTER_FOLDERS). */
const { Logo: PGLogo, Button: PGBtn, Avatar: PGDSAvatar } = window.PDXPrideGuideDesignSystem_b20420;

/* live = a screen exists in this kit; the rest render but stay inert. */
const PRIMARY_NAV = [
  { type: "link", key: "home", label: "Home", live: true },
  { type: "link", key: "about", label: "About", live: true },
  { type: "link", key: "events", label: "Events", live: true },
  { type: "link", key: "places", label: "Places", live: true },
  { type: "link", key: "nudebeaches", label: "Nude Beaches", live: true },
  { type: "dropdown", id: "boards", label: "Boards", items: [
    { key: "gigboard", label: "Gig Board" },
    { key: "gifting", label: "Gifting" },
    { key: "spotted", label: "Missed Connections" },
  ] },
  { type: "link", key: "promoters", label: "Promoters" },
];

const FOOTER_FOLDERS = [
  { id: "explore", title: "Explore", links: [
    { key: "events", label: "Events", live: true },
    { key: "schedule", label: "Schedule", live: true },
    { key: "places", label: "Places", live: true },
    { key: "nudebeaches", label: "Nude Beaches", live: true },
    { key: "spotted", label: "Missed Connections" },
    { key: "gigboard", label: "Gig Board" },
    { key: "gifting", label: "Gifting" },
  ] },
  { id: "participate", title: "Participate", links: [
    { key: "promoters", label: "Submit an Event" },
    { key: "promoters", label: "Claim an Event" },
    { key: "gigboard", label: "Post a Gig" },
    { key: "gifting", label: "Post a Gift / In Search Of" },
    { key: "sponsors", label: "Sponsor the Guide" },
  ] },
  { id: "guide", title: "Guide", links: [
    { key: "about", label: "About", live: true },
    { key: "access", label: "Access & Safety" },
    { key: "contact", label: "Contact" },
    { key: "legal", label: "Legal" },
  ] },
];

const NAV_ACCENT = { home: "var(--neon-yellow)", events: "var(--neon-cyan)", schedule: "var(--neon-yellow)", places: "var(--neon-magenta)", hub: "var(--neon-cyan)", about: "var(--neon-yellow)" };

function Avatar({ size = 40 }) {
  return <PGDSAvatar name="Tucker Casey" ring="progress" size={size} />;
}

function CalmToggle() {
  const [calm, setCalm] = React.useState(false);
  return (
    <button type="button" className={`pg-calm ${calm ? "is-on" : ""}`} aria-pressed={calm}
      onClick={() => { setCalm((v) => !v); document.documentElement.dataset.calm = calm ? "false" : "true"; }}>
      <span className="pg-calm__track"><span className="pg-calm__knob" /></span>
      Calm
    </button>
  );
}

function Header({ route, onNav }) {
  const [openDrop, setOpenDrop] = React.useState(null);
  const go = (item) => { if (item.live) onNav(item.key); setOpenDrop(null); };
  return (
    <header className="pg-header">
      <div className="pg-header__bar">
        <a href="#home" onClick={(e) => { e.preventDefault(); onNav("home"); }} style={{ display: "flex" }}>
          <PGLogo variant="lockup" size={48} src={(window.__resources && window.__resources.zlMark) || "../../app-face/icons/zaylist-512.png"} />
        </a>
        <nav className="pg-nav" aria-label="Primary navigation">
          {PRIMARY_NAV.map((entry) => {
            if (entry.type === "link") {
              return (
                <button key={entry.key}
                  className={`pg-nav__link ${route === entry.key ? "is-active" : ""}`}
                  style={{ "--_c": NAV_ACCENT[entry.key] || "var(--neon-cyan)" }}
                  onClick={() => go(entry)}>
                  {entry.label}
                </button>
              );
            }
            const open = openDrop === entry.id;
            return (
              <div key={entry.id} className={`pg-nav__dd ${open ? "is-open" : ""}`}>
                <button className="pg-nav__link" style={{ "--_c": "var(--neon-lime, var(--neon-yellow))" }}
                  aria-expanded={open} aria-haspopup="menu"
                  onClick={() => setOpenDrop(open ? null : entry.id)}>
                  {entry.label}
                  <svg className="pg-nav__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="pg-nav__panel" role="menu">
                  <span className="pg-nav__panel-label">{entry.label}</span>
                  {entry.items.map((it) => (
                    <button key={it.label} role="menuitem" className="pg-nav__panel-item" onClick={() => go(it)}>{it.label}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="pg-header__spacer" />
        <div className="pg-header__auth">
          <button className={`pg-nav__link pg-nav__link--hub ${route === "hub" ? "is-active" : ""}`}
            style={{ "--_c": "var(--neon-cyan)" }} onClick={() => onNav("hub")}>
            Hub<span className="pg-nav__notify" aria-hidden="true" />
          </button>
          <span className="pg-nav__sep" />
          <button className="pg-nav__link" style={{ "--_c": "var(--neon-magenta)" }} onClick={() => onNav("admin")}>Admin</button>
          <button className="pg-avatarBtn" aria-label="Your public profile" onClick={() => onNav("profile")}><Avatar size={40} /></button>
        </div>
        <CalmToggle />
        <PGBtn className="pg-menuBtn" accent="lime" size="sm">Menu</PGBtn>
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
        <div className="pg-footer__grid">
          <div className="pg-footer__brand-col">
            <PGLogo variant="lockup" size={44} src={(window.__resources && window.__resources.zlMark) || "../../app-face/icons/zaylist-512.png"} />
            <p className="pg-footer__tagline">
              Built by one person in Portland. No committee, no corporate parent, just someone who loves this scene.
            </p>
            <div className="pg-footer__controls">
              <span className="pg-footer__pill">Feedback</span>
              <span className="pg-footer__pill">Notifications</span>
              <span className="pg-footer__pill">Calm mode</span>
            </div>
          </div>
          <nav className="pg-footer__nav" aria-label="Footer">
            {FOOTER_FOLDERS.map((folder) => (
              <div key={folder.id} className="pg-footer__col">
                <div className="pg-footer__col-title">{folder.title}</div>
                <ul className="pg-footer__list">
                  {folder.links.map((l) => (
                    <li key={folder.id + l.label}>
                      <a href="#" className="pg-footer__link"
                        onClick={(e) => { e.preventDefault(); if (l.live && onNav) onNav(l.key); }}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="pg-footer__support">
            <div className="pg-footer__support-title">Free to use, but not free to run.</div>
            <p className="pg-footer__support-copy">Hosting, domains, and the late nights are on one person. Tips keep it going.</p>
            <PGBtn accent="lime" size="sm" arrow>Buy me a coffee</PGBtn>
          </div>
        </div>
        <div className="pg-footer__bar">
          <span>Portland, Oregon. Made by Tucker, for the community, not shareholders.</span>
          <span>© 2026 Zaylist · Free to Browse · Independently Run</span>
        </div>
      </div>
      <div className="pdx-seam pdx-seam--thick" />
    </footer>
  );
}

Object.assign(window, { PGHeader: Header, PGFooter: Footer, PGAvatar: Avatar });
