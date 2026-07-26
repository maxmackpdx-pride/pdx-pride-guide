/* EventDetailScreen, the single-event page (a core live-site surface).
   Opens when a card is clicked: full header, action bar (tickets, calendar,
   share, directions, RSVP, save), a facts panel, description, and "more that day". */
const {
  Button: EdBtn, Badge: EdBadge, EventCard: EdRow,
} = window.PDXPrideGuideDesignSystem_b20420;

const ED_DAY = { MON: "var(--day-mon)", TUE: "var(--day-tue)", WED: "var(--day-wed)", THU: "var(--day-thu)", FRI: "var(--day-fri)", SAT: "var(--day-sat)", SUN: "var(--day-sun)" };
const ED_DAYNAME = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
const ED_ADM = { FREE: "Free", TICKETED: "Ticketed", SUGGESTED_DONATION: "Suggested donation", DOOR_FEE: "Door fee" };
const ED_MONTH = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };

function edAge(e) { return e.tags.includes("21+") ? "21+" : e.tags.includes("18+") ? "18+" : e.tags.includes("All Ages") ? "All ages" : null; }
function edTypes(e) { return e.tags.filter((t) => !["21+", "18+", "All Ages", "Headliner", "Legendary", "Sex Positive", "ASL"].includes(t)); }

function edIcsDate(e) {
  const [hh, mm] = e.hour.split(":");
  let h = parseInt(hh, 10) % 12;
  if (e.ampm === "PM") h += 12;
  const mo = ED_MONTH[(e.date.split(" ")[0])] || "07";
  const dd = String(e.date.split(" ")[1] || "16").padStart(2, "0");
  return `2026${mo}${dd}T${String(h).padStart(2, "0")}${(mm || "00").padStart(2, "0")}00`;
}
function edDownloadIcs(e) {
  const dt = edIcsDate(e);
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zaylist//EN", "BEGIN:VEVENT",
    `UID:zaylist-${e.id}@zaylist.com`, `SUMMARY:${e.title}`,
    `LOCATION:${e.venue}, ${e.neighborhood}, Portland OR`, `DESCRIPTION:${(e.blurb || "").replace(/\n/g, " ")}`,
    `DTSTART:${dt}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${e.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Fact({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border-default)" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-faint)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: color || "var(--text-hi)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function EventDetailScreen({ data, id, saved, onSave, onRsvp, onNotify, onOpen, onBack }) {
  const e = data.EVENTS.find((x) => x.id === id);
  if (!e) return (
    <div className="pg-container pg-section"><button onClick={onBack} style={{ background: "none", border: 0, color: "var(--cyan)", cursor: "pointer", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>← All events</button><p style={{ color: "var(--text-lo)" }}>Event not found.</p></div>
  );

  const dayC = ED_DAY[e.day] || "var(--cyan)";
  const age = edAge(e);
  const types = edTypes(e);
  const ticketed = e.admission === "TICKETED" || e.admission === "SUGGESTED_DONATION" || e.admission === "DOOR_FEE";
  const share = () => {
    const t = `${e.title} · Zaylist`;
    if (navigator.share) { navigator.share({ title: t, text: t }).catch(() => {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(`${e.title} — ${e.venue}, ${e.date}`).then(() => onNotify && onNotify("Link copied to clipboard")); }
    else onNotify && onNotify("Share this event");
  };
  const directions = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue + ", Portland OR")}`, "_blank", "noopener");
  const tickets = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(e.title + " " + e.venue + " tickets")}`, "_blank", "noopener");

  const moreThatDay = data.EVENTS.filter((x) => x.day === e.day && x.id !== e.id).slice(0, 4);

  return (
    <div className="pg-eventdetail">
      {/* accent header band */}
      <div style={{ position: "relative", background: "var(--ink-1000)", borderBottom: `1px solid var(--border-default)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(90% 120% at 0% 0%, color-mix(in srgb, ${dayC} 16%, transparent), transparent 60%)`, pointerEvents: "none" }} />
        <div className="pg-container" style={{ position: "relative", paddingBlock: "var(--space-8) var(--space-10)" }}>
          <button onClick={onBack} style={{ background: "none", border: 0, color: "var(--text-lo)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", fontSize: ".85rem", padding: "0 0 18px", display: "inline-flex", gap: 8 }}>← All events</button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", background: "#fff", color: "#000", padding: "4px 10px 3px", borderRadius: 2 }}>{e.day} · {e.date}</span>
            {types.slice(0, 3).map((t, i) => <EdBadge key={i} variant="outline">{t}</EdBadge>)}
            {age && <EdBadge variant="outline" color="cyan">{age}</EdBadge>}
            {e.tags.includes("ASL") && <EdBadge variant="outline" color="lime">ASL</EdBadge>}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", lineHeight: .95, color: "var(--text-hi)", fontSize: "clamp(2.2rem,5vw,3.75rem)", margin: 0, maxWidth: "18ch" }}>{e.title}</h1>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: "6px 18px", alignItems: "center", color: "var(--text-mid)", fontSize: "1.05rem" }}>
            <span style={{ color: dayC, fontWeight: 700 }}>{e.venue}</span>
            <span style={{ color: "var(--text-lo)" }}>{e.neighborhood}</span>
            <span style={{ color: "var(--text-lo)" }}>{ED_DAYNAME[e.day]}, {e.date} · {e.hour} {e.ampm}</span>
            {e.going != null && <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".8rem", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--neon-yellow)", border: "1px solid var(--neon-yellow)", borderRadius: 999, padding: "3px 11px 2px" }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--neon-yellow)" }} />{e.going} Going</span>}
          </div>

          {/* ACTION BAR */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 26 }}>
            {ticketed && <EdBtn accent="lime" onClick={tickets}>Get Tickets</EdBtn>}
            <EdBtn accent="cyan" onClick={() => { onRsvp && onRsvp(e.id); }}>I'll be there</EdBtn>
            <EdBtn variant="ghost" onClick={() => edDownloadIcs(e)}>Add to Calendar</EdBtn>
            <EdBtn variant="ghost" onClick={directions}>Directions</EdBtn>
            <EdBtn variant="ghost" onClick={share}>Share</EdBtn>
            <EdBtn variant="ghost" onClick={() => onSave && onSave(e.id)}>{saved && saved[e.id] ? "♥ Saved" : "♡ Save"}</EdBtn>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="pg-container pg-section--tight">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(260px,1fr)", gap: "var(--space-10)", alignItems: "start" }}>
          {/* left: about */}
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: "1.5rem", color: "var(--text-hi)", margin: "0 0 12px" }}>About this event</h2>
            <p style={{ fontSize: "1.0625rem", lineHeight: 1.65, color: "var(--text-mid)", margin: "0 0 24px", maxWidth: "62ch" }}>{e.blurb}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {e.tags.map((t, i) => (
                <span key={i} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-lo)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "5px 12px" }}>{t}</span>
              ))}
            </div>

            {e.tags.includes("Sex Positive") && (
              <div style={{ marginTop: 22, padding: "14px 16px", background: "color-mix(in srgb, var(--neon-magenta) 8%, var(--ink-800))", border: "1px solid color-mix(in srgb, var(--neon-magenta) 40%, var(--border-default))", borderRadius: "var(--radius-md)", color: "var(--text-mid)", fontSize: 14, lineHeight: 1.5 }}>
                <strong style={{ color: "var(--neon-magenta)" }}>Sex positive.</strong> Listed and tagged honestly. Check the host's page for dress code and consent policy.
              </div>
            )}
          </div>

          {/* right: facts */}
          <aside style={{ background: "var(--surface-card)", border: "2px solid var(--border-default)", borderLeft: `5px solid ${dayC}`, borderRadius: "var(--radius-md)", padding: "6px 18px 16px" }}>
            <Fact label="Day" value={`${ED_DAYNAME[e.day]} · ${e.date}`} />
            <Fact label="Time" value={`${e.hour} ${e.ampm}`} />
            <Fact label="Venue" value={e.venue} color={dayC} />
            <Fact label="Neighborhood" value={e.neighborhood} />
            <Fact label="Admission" value={ED_ADM[e.admission] || "See host"} />
            {age && <Fact label="Age" value={age} />}
            {e.going != null && <Fact label="Going" value={`${e.going}`} color="var(--neon-yellow)" />}
            <div style={{ marginTop: 16 }}>
              <EdBtn accent="lime" size="sm" onClick={ticketed ? tickets : directions} style={{ width: "100%" }}>{ticketed ? "Get Tickets" : "Get Directions"}</EdBtn>
            </div>
          </aside>
        </div>

        {/* more that day */}
        {moreThatDay.length > 0 && (
          <section style={{ marginTop: "var(--space-16)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "var(--space-5)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.5rem", textTransform: "uppercase", color: dayC }}>More on {ED_DAYNAME[e.day]}</span>
              <span style={{ flex: 1, height: 2, background: "var(--border-default)", borderRadius: 999 }} />
            </div>
            <div className="pg-list">
              {moreThatDay.map((x) => (
                <EdRow key={x.id} href="#" day={x.day} title={x.title} venue={x.venue}
                  when={`${x.hour} ${x.ampm} · ${x.neighborhood}`} types={edTypes(x).slice(0, 2)}
                  admission={x.admission} age={x.tags.includes("21+") ? "21_PLUS" : x.tags.includes("All Ages") ? "ALL_AGES" : undefined}
                  going={x.going}
                  onClick={(ev) => { ev.preventDefault(); if (ev.target.closest("button")) return; onOpen(x.id); }} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PGEventDetailScreen: EventDetailScreen });
