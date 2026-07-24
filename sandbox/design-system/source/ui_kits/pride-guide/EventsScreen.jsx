/* EventsScreen, the browse view: page hero, map strip, sticky filter bar,
   and a board of poster cards (grid) or rows (list). */
const {
  Button: EvBtn, MapPanel: EvMap, FilterChip: EvChip, SearchInput: EvSearch,
  PosterCard: EvPoster, EventCard: EvRow, StatPill: EvStatPill, Badge: EvBadge,
} = window.ZaylistDesignSystem_b20420;

function GridIcon({ on }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ListIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
}

function EventsScreen({ data, saved, onSave, onRsvp }) {
  const [q, setQ] = React.useState("");
  const [days, setDays] = React.useState({});
  const [view, setView] = React.useState("grid");

  const dayOn = Object.keys(days).some((k) => days[k]);
  const filtered = data.EVENTS.filter((e) => {
    if (dayOn && !days[e.day]) return false;
    if (q) {
      const hay = `${e.title} ${e.venue} ${e.neighborhood} ${e.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const when = window.pgWhenLine, ageOf = window.pgAgeOf, typesOf = window.pgTypesOf;
  const mapPins = data.EVENTS.map((e, i) => ({
    x: 22 + ((i * 37) % 60), y: 20 + ((i * 53) % 60), day: e.day,
  }));

  return (
    <div className="pg-events">
      {/* page hero */}
      <div className="pg-container">
        <section style={{ paddingBlock: "var(--space-16) var(--space-10)" }}>
          <span className="pdx-marker">Portland Pride Week 2026 · July 13 to 19</span>
          <h1 className="pdx-display" style={{ fontSize: "var(--display-1)", margin: "18px 0 0" }}>
            Events<br /><span style={{ color: "var(--neon-cyan)" }}>Guide</span>
          </h1>
          <p style={{ maxWidth: "52ch", marginTop: 14, color: "var(--text-mid)", fontSize: "var(--body-lg)" }}>
            Every queer party, parade, show, and gathering for Pride Week 2026 and beyond, all in one place.
          </p>
          <div style={{ marginTop: 22 }}>
            <EvBtn accent="lime" arrow>View as Schedule</EvBtn>
          </div>
        </section>
      </div>

      {/* map strip */}
      <EvMap height={380} pins={mapPins} expandable onExpand={() => {}} />

      {/* sticky filter bar */}
      <div style={{ position: "sticky", top: 73, zIndex: 90, background: "rgba(6,6,9,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border-default)" }}>
        <div className="pg-container" style={{ paddingBlock: 14 }}>
          <div className="pg-toolbar__row">
            <div className="pg-chiprow">
              <EvChip accent="lime" selected={!dayOn} onToggle={() => setDays({})}>All</EvChip>
              {data.DAYS.map((d) => (
                <EvChip key={d.key} accent={d.accent} fill selected={!!days[d.key]}
                  onToggle={() => setDays((m) => ({ ...m, [d.key]: !m[d.key] }))}>
                  {d.key}
                </EvChip>
              ))}
            </div>
            <div className="pg-toolbar__search"><EvSearch value={q} size="sm" onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Search events..." /></div>
            <div className="pg-viewtoggle">
              <button className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><GridIcon /></button>
              <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view"><ListIcon /></button>
            </div>
          </div>
        </div>
      </div>

      {/* board */}
      <div className="pg-container pg-section--tight">
        <div className="pg-results">
          <EvStatPill count={filtered.length} color="lime" icon={<span aria-hidden="true">◎</span>}>Events</EvStatPill>
          <div className="pg-results__sort">Sort <select className="pg-select"><option>Start time</option><option>Day</option><option>Most going</option></select></div>
        </div>

        {filtered.length === 0 ? (
          <div className="pg-empty">
            <span className="pg-empty__big">Nothing here yet</span>
            <span>Try clearing a filter. There's always something happening.</span>
          </div>
        ) : view === "grid" ? (
          <div className="pg-poster-grid">
            {filtered.map((e) => (
              <EvPoster key={e.id} href="#" day={e.day} title={e.title} venue={e.venue}
                when={when(e)} types={typesOf(e)} admission={e.admission} age={ageOf(e)}
                going={e.going} onRsvp={() => onRsvp(e.id)} />
            ))}
          </div>
        ) : (
          <div className="pg-list">
            {filtered.map((e) => (
              <EvRow key={e.id} href="#" day={e.day} title={e.title} venue={e.venue}
                when={`${e.hour} ${e.ampm} · ${e.neighborhood}`} types={typesOf(e)}
                admission={e.admission} age={ageOf(e)} going={e.going}
                saved={!!saved[e.id]} onSave={() => onSave(e.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PGEventsScreen: EventsScreen });
