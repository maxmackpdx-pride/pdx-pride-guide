import { type HubEventRow } from "./HubEvents";

function dayDotClass(day?: string) {
  const map: Record<string, string> = {
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
    MON: "d-mon",
    TUE: "d-tue",
    WED: "d-wed",
  };
  return day ? map[day] ?? "" : "";
}

type Props = {
  /** Events the member is going to / hosting — the "RSVP'd" set. */
  events: HubEventRow[];
};

/**
 * The hub news feed. Posting is disabled for now, so instead of a social
 * composer this surfaces the member's own event involvement: the events they
 * RSVP'd to (and host) plus the venues hosting them. A live change-feed lands
 * in a later PR.
 */
export default function HubFeed({ events }: Props) {
  return (
    <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div className="kick" style={{ color: "var(--panel-cyan)", letterSpacing: ".16em" }}>
          Your scene
        </div>
        <h1 className="h1" style={{ marginTop: 6 }}>
          Latest from your events
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
          Events you RSVP'd to and the venues hosting them.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: ".02em",
            }}
          >
            Nothing here yet
          </div>
          <p style={{ margin: "10px auto 0", maxWidth: 340, fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
            RSVP to an event and updates from it, and the venue hosting it, will show up here.
          </p>
        </div>
      ) : (
        events.map((e) => (
          <article key={e.id} className="card fitem" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
              <span className={`dot ${dayDotClass(e.dayOfWeek)}`} style={{ marginTop: 7, flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#fff",
                    lineHeight: 1.1,
                    textTransform: "uppercase",
                  }}
                >
                  {e.title}
                </div>
                <div className="kick" style={{ letterSpacing: ".06em", marginTop: 6 }}>
                  {e.when}
                </div>
                {e.going != null && (
                  <div className="kick" style={{ letterSpacing: ".06em", marginTop: 4, color: "var(--board-muted)" }}>
                    {e.going} going
                  </div>
                )}
              </div>
              {e.chip && (
                <span className="kick" style={{ letterSpacing: ".12em", flex: "none" }}>
                  {e.chip}
                </span>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
