/* ScheduleScreen, the weekly timeline view (source: Schedule.pdf export).
   Day columns, a left time axis, events placed by start + duration with
   overlap lanes, colored by day. MY SCHEDULE / ALL EVENTS toggle, filter
   chips with counts, and an "Export to Instagram Stories" CTA. */
const {
  Button: ScBtn, FilterChip: ScChip,
} = window.PDXPrideGuideDesignSystem_b20420;

const DAY_COLOR = { THU: "var(--day-thu)", FRI: "var(--day-fri)", SAT: "var(--day-sat)", SUN: "var(--day-sun)" };
const DAY_TEXT  = { THU: "var(--day-thu)", FRI: "var(--day-fri)", SAT: "var(--day-sat)", SUN: "var(--day-sun)" };
const HH = 64;              // px per hour
const RANGE_START = 11;     // 11 AM
const RANGE_END = 25;       // 1 AM next day

function toDecimal(hour, ampm) {
  let [h, m] = hour.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + (m || 0) / 60;
}
function durationFor(e) {
  const t = e.tags.join(" ").toLowerCase();
  if (/parade|march/.test(t)) return 2;
  if (/sports/.test(t)) return 2.5;
  if (/market|outdoor|beer garden|block party/.test(t)) return 4;
  if (/techno|dance|disco|party|bear/.test(t)) return 4;
  if (/drag|comedy|qtbipoc/.test(t)) return 3;
  return 2.5;
}
function fmt(dec) {
  let h = Math.floor(dec) % 24; const m = Math.round((dec - Math.floor(dec)) * 60);
  const ap = h >= 12 ? "pm" : "am"; let hr = h % 12; if (hr === 0) hr = 12;
  return `${hr}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}

/* greedy cluster + lane packing so only overlapping events split into columns */
function packDay(events) {
  const evs = events.map((e) => {
    const start = toDecimal(e.hour, e.ampm);
    let end = start + durationFor(e);
    if (end > RANGE_END) end = RANGE_END;
    return { ...e, _start: start, _end: end };
  }).sort((a, b) => a._start - b._start || a._end - b._end);

  let clusterEnd = -1, cluster = [];
  const flush = () => {
    const lanes = [];
    cluster.forEach((ev) => {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= ev._start + 0.001) { ev._lane = i; lanes[i] = ev._end; placed = true; break; }
      }
      if (!placed) { ev._lane = lanes.length; lanes.push(ev._end); }
    });
    cluster.forEach((ev) => { ev._lanes = lanes.length; });
    cluster = [];
  };
  evs.forEach((ev) => {
    if (cluster.length && ev._start < clusterEnd - 0.001) { cluster.push(ev); clusterEnd = Math.max(clusterEnd, ev._end); }
    else { if (cluster.length) flush(); cluster = [ev]; clusterEnd = ev._end; }
  });
  if (cluster.length) flush();
  return evs;
}

function Heart({ on, onClick }) {
  return (
    <button className="pg-ev__heart" aria-pressed={on} aria-label={on ? "Saved" : "Save"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>
      <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
  );
}

const FILTERS = [
  { key: "FREE", label: "Free", accent: "lime", test: (e) => e.admission === "FREE" },
  { key: "TICKETED", label: "Ticketed", accent: "cyan", test: (e) => e.admission === "TICKETED" },
  { key: "DONATION", label: "Donation", accent: "amber", test: (e) => e.admission === "SUGGESTED_DONATION" },
  { key: "DRAG", label: "Drag", accent: "pink", test: (e) => e.tags.includes("Drag") },
  { key: "DANCE", label: "Dance", accent: "purple", test: (e) => /Dance|Techno|Disco/.test(e.tags.join(" ")) },
  { key: "SPORTS", label: "Sports", accent: "green", test: (e) => e.tags.includes("Sports") },
  { key: "OUTDOOR", label: "Outdoor", accent: "orange", test: (e) => e.tags.includes("Outdoor") },
  { key: "MARCHES", label: "Marches", accent: "cyan", test: (e) => /March|Parade/.test(e.tags.join(" ")) },
  { key: "ALLAGES", label: "All Ages", accent: "lime", test: (e) => e.tags.includes("All Ages") },
  { key: "21", label: "21+", accent: "pink", test: (e) => e.tags.includes("21+") },
];

function ScheduleScreen({ data, saved, onSave, onRsvp }) {
  const [mine, setMine] = React.useState(false);
  const [active, setActive] = React.useState({});

  const activeKeys = Object.keys(active).filter((k) => active[k]);
  const base = data.EVENTS.filter((e) => {
    if (mine && !saved[e.id]) return false;
    if (activeKeys.length && !activeKeys.every((k) => FILTERS.find((f) => f.key === k).test(e))) return false;
    return true;
  });

  const days = data.DAYS.filter((d) => base.some((e) => e.day === d.key));
  const hours = [];
  for (let h = RANGE_START; h <= RANGE_END; h++) hours.push(h);

  return (
    <div className="pg-sched">
      <div className="pg-container">
        <section style={{ paddingBlock: "var(--space-12) var(--space-6)" }}>
          <span className="pdx-kicker" style={{ color: "var(--text-lo)" }}>Zaylist / Events</span>
          <div style={{ marginTop: 10 }}><span className="pdx-marker">Portland's queer events, all in one place</span></div>
          <h1 className="pdx-display" style={{ fontSize: "var(--display-1)", margin: "16px 0 0" }}>Schedule</h1>
          <p style={{ maxWidth: "54ch", marginTop: 12, color: "var(--text-mid)", fontSize: "var(--body-lg)" }}>
            The whole week, side by side. Flip to just your RSVPs, filter by vibe, and build your nights.
            Take care of each other.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 22 }}>
            <div className="pg-sched__seg">
              <button className={mine ? "is-active" : ""} onClick={() => setMine(true)}>My Schedule</button>
              <button className={!mine ? "is-active" : ""} onClick={() => setMine(false)}>All Events</button>
            </div>
            <span className="pg-sched__count">{base.length} Events</span>
            <div style={{ flex: 1 }} />
            <ScBtn accent="pink" variant="neon" arrow onClick={() => onRsvp && onRsvp()}>Export to Instagram Stories</ScBtn>
          </div>

          <div className="pg-sched__filters" style={{ marginTop: 18 }}>
            <span className="pg-sched__flabel">Filter</span>
            {FILTERS.map((f) => (
              <ScChip key={f.key} accent={f.accent} selected={!!active[f.key]}
                onToggle={() => setActive((m) => ({ ...m, [f.key]: !m[f.key] }))}
                count={data.EVENTS.filter(f.test).length}>
                {f.label}
              </ScChip>
            ))}
          </div>
        </section>
      </div>

      <div className="pg-container" style={{ paddingBottom: "var(--space-16)" }}>
        {days.length === 0 ? (
          <div className="pg-sched__scroll"><div className="pg-sched__empty">
            <b>Nothing saved yet</b>Tap the heart on events to build your schedule.
          </div></div>
        ) : (
          <div className="pg-sched__scroll">
            <div className="pg-sched__inner">
              {/* headers */}
              <div className="pg-sched__headrow">
                <div className="pg-sched__gutter" />
                {days.map((d) => (
                  <div className="pg-sched__dh" key={d.key} style={{ "--_c": DAY_COLOR[d.key] }}>
                    <span className="day">{d.label} {d.date.split(" ")[1]}</span>
                    <span className="cnt">{base.filter((e) => e.day === d.key).length} Events</span>
                  </div>
                ))}
              </div>
              {/* body */}
              <div className="pg-sched__body" style={{ height: (RANGE_END - RANGE_START) * HH }}>
                <div className="pg-sched__axis">
                  {hours.map((h) => (
                    <span className="t" key={h} style={{ top: (h - RANGE_START) * HH }}>{fmt(h)}</span>
                  ))}
                </div>
                {days.map((d) => {
                  const packed = packDay(base.filter((e) => e.day === d.key));
                  return (
                    <div className="pg-sched__col" key={d.key} style={{ "--_hh": HH + "px" }}>
                      {packed.map((e) => {
                        const top = (e._start - RANGE_START) * HH;
                        const height = Math.max(34, (e._end - e._start) * HH - 5);
                        const w = 100 / e._lanes;
                        const compact = height < 70, tiny = height < 48;
                        const narrow = e._lanes > 1;
                        return (
                          <a key={e.id} href="#" className={`pg-ev ${compact ? "pg-ev--compact" : ""} ${tiny ? "pg-ev--tiny" : ""}`}
                            onClick={(ev) => ev.preventDefault()}
                            style={{ top, height, left: `calc(${e._lane * w}% + 3px)`, width: `calc(${w}% - 6px)`,
                              "--_c": DAY_COLOR[d.key], "--_ct": DAY_TEXT[d.key] }}>
                            <span className="pg-ev__time">{narrow ? fmt(e._start) : `${fmt(e._start)} – ${fmt(e._end)}`}</span>
                            <span className="pg-ev__title">{e.title}</span>
                            <span className="pg-ev__venue">{e.venue}</span>
                            <Heart on={!!saved[e.id]} onClick={() => onSave(e.id)} />
                          </a>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PGScheduleScreen: ScheduleScreen });
