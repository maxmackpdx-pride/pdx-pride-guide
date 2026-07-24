/* HomeScreen, the landing page: full-bleed hero, then featured board cards
   and a by-day event preview. */
const {
  Countdown: HCountdown, StickerBadge: HSticker, Button: HBtn,
  PosterCard: HPoster, EventCard: HRow, SectionHeader: HSection,
  FilterChip: HChip, Divider: HDivider,
} = window.ZaylistDesignSystem_b20420;

function whenLine(e) {
  const dayName = { THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun" }[e.day] || e.day;
  return `${dayName}, ${e.date} · ${e.hour} ${e.ampm} · ${e.neighborhood}`;
}
function ageOf(e) { return e.tags.includes("21+") ? "21_PLUS" : e.tags.includes("All Ages") ? "ALL_AGES" : undefined; }
function typesOf(e) { return e.tags.filter((t) => !["21+", "All Ages", "Headliner", "Legendary", "Sex Positive"].includes(t)).slice(0, 2); }

function Hero({ onNav }) {
  return (
    <section className="pg-hero">
      <img className="pg-hero__bg" src="../../assets/banners/hero-collage.png" alt="" />
      <div className="pg-hero__halftone" />
      <div className="pg-hero__inner">
        <div className="pg-hero__marker">
          <span className="pdx-marker">Portland Pride Week 2026 · July 13 to 19</span>
        </div>
        <h1 className="pg-hero__mark">
          <span className="pdx-hero-row row-white">Portland</span>
          <span className="pdx-hero-row row-rainbow">Pride</span>
          <span className="pdx-hero-row row-white">Guide</span>
        </h1>
        <p className="pg-hero__welcome">
          This is your welcoming spot to discover events, find your people, support queer venues,
          keep your connections, and <strong>take care of each other.</strong>
        </p>
        <div className="pg-hero__count">
          <span className="pg-hero__count-label">Kickoff in</span>
          <HCountdown target="2026-07-16T19:00:00" />
        </div>
        <div className="pg-hero__cta">
          <HBtn accent="lime" size="lg" arrow onClick={() => onNav("events")}>View All Events</HBtn>
          <HBtn accent="cyan" size="lg" arrow onClick={() => onNav("hub")}>Your Hub</HBtn>
        </div>
      </div>
    </section>
  );
}

function HomeScreen({ data, saved, onSave, onRsvp, onNav }) {
  const featured = data.EVENTS.filter((e) => e.featured).slice(0, 4);
  const [day, setDay] = React.useState("SAT");
  const dayRows = data.EVENTS.filter((e) => e.day === day).slice(0, 5);

  return (
    <div className="pg-home">
      <Hero onNav={onNav} />

      <div className="pg-container">
        <section className="pg-section">
          <HSection kicker="Don't Miss" title={<>The <span className="hl">headliners</span></>}
            subtitle="The big-tent moments: parade, festival, and the legends."
            accent="pink"
            action={<HBtn accent="lime" size="sm" arrow onClick={() => onNav("events")}>All Events</HBtn>} />
          <div className="pg-poster-grid">
            {featured.map((e) => (
              <HPoster key={e.id} href="#" day={e.day} title={e.title} venue={e.venue}
                when={whenLine(e)} types={typesOf(e)} admission={e.admission} age={ageOf(e)}
                going={e.going} onRsvp={() => onRsvp(e.id)} />
            ))}
          </div>
        </section>

        <HDivider variant="rainbow" />

        <section className="pg-section">
          <HSection kicker="By the Day" title={<>What's <span className="hl">on</span></>} accent="cyan" />
          <div className="pg-chiprow" style={{ marginBottom: "var(--space-6)" }}>
            {data.DAYS.map((d) => (
              <HChip key={d.key} accent={d.accent} fill selected={day === d.key}
                onToggle={() => setDay(d.key)} count={data.EVENTS.filter((e) => e.day === d.key).length}>
                {d.label} {d.date.split(" ")[1]}
              </HChip>
            ))}
          </div>
          <div className="pg-list">
            {dayRows.map((e) => (
              <HRow key={e.id} href="#" day={e.day} title={e.title} venue={e.venue}
                when={`${e.hour} ${e.ampm} · ${e.neighborhood}`} types={typesOf(e)}
                admission={e.admission} age={ageOf(e)} going={e.going}
                saved={!!saved[e.id]} onSave={() => onSave(e.id)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { PGHomeScreen: HomeScreen, pgWhenLine: whenLine, pgAgeOf: ageOf, pgTypesOf: typesOf });
