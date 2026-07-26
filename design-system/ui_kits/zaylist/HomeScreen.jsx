/* HomeScreen. Structure mirrors client/src/pages/Home.tsx on master:
   hero → stat strip → up next → seam → community boards → directory teaser. */
const {
  Button: HBtn, PosterCard: HPoster, SectionHeader: HSection, Divider: HDivider,
} = window.PDXPrideGuideDesignSystem_b20420;

function whenLine(e) {
  const dayName = { THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" }[e.day] || e.day;
  return `${dayName}, ${e.date} · ${e.hour} ${e.ampm} · ${e.neighborhood}`;
}
function ageOf(e) { return e.tags.includes("21+") ? "21_PLUS" : e.tags.includes("All Ages") ? "ALL_AGES" : undefined; }
function typesOf(e) { return e.tags.filter((t) => !["21+", "All Ages", "Headliner", "Legendary", "Sex Positive"].includes(t)).slice(0, 2); }

function useCountUp(target, duration = 1400) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!target) { setN(0); return; }
    let raf, start;
    const tick = (t) => {
      if (start == null) start = t;
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

/* Live hero: kicker + wordmark + two CTAs. Stats live in the strip below. */
function Hero({ onNav }) {
  return (
    <section className="pg-hero" aria-label="Zaylist hero">
      <div className="pg-hero__inner">
        <div className="pg-hero__kicker">
          <span className="pg-hero__dot" aria-hidden="true" />
          Portland nights · all year
        </div>
        <img className="pg-hero__wordmark" src={(window.__resources && window.__resources.zlWordmark) || "./untitled---july-24-2026-at-01-41-04-3-mryphizr-xfp7.png"} alt="Zaylist" style={{ width: "min(560px, 82%)", height: "auto", display: "block", margin: "4px 0 30px" }} />
        <div className="pg-hero__cta">
          <a className="pg-hero__btn pg-hero__btn--primary" href="#" onClick={(e) => { e.preventDefault(); onNav("events"); }}>View all events &rarr;</a>
          <a className="pg-hero__btn pg-hero__btn--river" href="#" onClick={(e) => e.preventDefault()}>Headed to the river? &rarr;</a>
        </div>
      </div>
    </section>
  );
}

function StatStrip({ eventCount, placesCount, goingCount }) {
  const n = useCountUp(eventCount);
  const cells = [
    { v: n, label: "next 7 days", grad: "linear-gradient(90deg,#CCFF00,#39FF14)" },
    { v: placesCount, label: "Places to back", grad: "linear-gradient(90deg,#00FFFF,#0044FF)" },
    { v: goingCount, label: "Going to events", grad: "linear-gradient(90deg,#FF00CC,#FF6600)" },
  ];
  return (
    <div className="pg-statstrip" aria-label="Live site stats">
      {cells.map((c, i) => (
        <div className="pg-statstrip__cell" key={c.label}>
          <div className="pg-statstrip__value" style={{ backgroundImage: c.grad }}>{c.v}</div>
          <div className="pg-statstrip__label" style={{ backgroundImage: c.grad }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

const BOARDS = [
  { key: "spotted", name: "Missed Connections", c: "#FF00CC",
    desc: "Anonymous missed connections. Say the thing you didn't get to say.",
    mantra: "Stay kind · stay anonymous · reveal when ready" },
  { key: "gifting", name: "Gifting", c: "#CCFF00",
    desc: "A free board. Give what you can, take what you need. No money changes hands.",
    mantra: "Keep it free · keep it kind · keep it moving" },
  { key: "gigboard", name: "Gig Board", c: "#6E3DFF",
    desc: "Two-way work board. Performers, hosts, crew. Get paid, get help.",
    mantra: "Need work? Need help? Both belong here." },
];

const DIRECTORY_CHIPS = [
  { label: "Bars", color: "var(--cat-bars, #FF00CC)" },
  { label: "Food", color: "var(--cat-food, #FF6600)" },
  { label: "Cafes", color: "var(--cat-cafes, #FFEE00)" },
  { label: "Venues", color: "var(--cat-venues, #00FFFF)" },
  { label: "Shops", color: "var(--cat-shops, #8800FF)" },
];

function HomeScreen({ data, saved, onSave, onRsvp, onNav, onOpen }) {
  const upNext = data.EVENTS.filter((e) => e.featured).slice(0, 4);
  const going = data.EVENTS.reduce((sum, e) => sum + (e.going || 0), 0);

  return (
    <div className="pg-home">
      <Hero onNav={onNav} />
      <div className="pg-container">
        <StatStrip eventCount={data.EVENTS.length} placesCount={data.PLACES.length} goingCount={going} />

        <section className="pg-section pg-upnext" aria-label="Up next">
          <div className="pg-upnext__head">
            <div className="pg-upnext__kicker"><span className="pg-upnext__dot" aria-hidden="true" />Up next</div>
            <span className="pg-upnext__lede">Coming up next on Zaylist:</span>
          </div>
          <div className="pg-poster-grid">
            {upNext.map((e) => (
              <HPoster key={e.id} href="#" day={e.day} title={e.title} venue={e.venue}
                when={whenLine(e)} types={typesOf(e)} admission={e.admission} age={ageOf(e)}
                going={e.going} onRsvp={() => onRsvp(e.id)}
                onClick={(ev) => { ev.preventDefault(); if (ev.target.closest("button")) return; onOpen(e.id); }} />
            ))}
          </div>
        </section>

        <HDivider seam />

        <section className="pg-section pg-boards" aria-label="Community boards">
          <div className="pg-boards__running">
            <div className="pg-boards__kicker"><span className="pg-boards__dot" aria-hidden="true" />The Community Boards</div>
            <a className="pg-boards__all" href="#" onClick={(e) => e.preventDefault()}>All Boards &rarr;</a>
          </div>
          <div className="pg-boards__header">
            <h2 className="pg-boards__title">Show up for <span className="hl">each other</span></h2>
            <p className="pg-boards__sub">Miss a connection, give something away, or line up a gig. The boards where the scene looks out for each other.</p>
          </div>
          <div className="pg-boards__grid">
            {BOARDS.map((b) => (
              <a key={b.key} href="#" className="pg-boards__utility pdx-glass-card pdx-glass-card--left-accent"
                style={{ "--c": b.c }} onClick={(e) => e.preventDefault()}>
                <div className="pg-boards__utility-name">{b.name}</div>
                <p className="pg-boards__utility-desc">{b.desc}</p>
                <div className="pg-boards__utility-mantra">{b.mantra}</div>
              </a>
            ))}
          </div>
          <div className="pg-boards__foot">
            <HBtn accent="lime" size="lg" arrow>Post to a Board</HBtn>
            <span className="pg-boards__foot-note">Free to post. Be kind. Take care of each other.</span>
          </div>
        </section>

        <section className="pg-section pg-dirteaser" aria-label="Directory">
          <div className="pg-dirteaser__kicker">The directory for us</div>
          <h3 className="pg-dirteaser__title">Spend here, keep the nights open</h3>
          <p className="pg-dirteaser__copy">Bars, cafes, shops, and venues that are ours, or truly for us. Filter by category, find them on the map.</p>
          <div className="pg-dirteaser__chips">
            {DIRECTORY_CHIPS.map((c) => (
              <span key={c.label} className="pg-dirteaser__chip" style={{ color: c.color, borderColor: c.color }}>{c.label}</span>
            ))}
          </div>
          <a className="pg-dirteaser__cta" href="#" onClick={(e) => { e.preventDefault(); onNav("places"); }}>Browse the directory &rarr;</a>
        </section>
      </div>
      <div className="pg-seam-wrap"><HDivider seam /></div>
    </div>
  );
}

Object.assign(window, { PGHomeScreen: HomeScreen, pgWhenLine: whenLine, pgAgeOf: ageOf, pgTypesOf: typesOf });
