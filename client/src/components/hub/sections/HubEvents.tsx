import { useState } from "react";
import type { ReactNode } from "react";

export type HubEventRow = {
  id: string | number;
  title: string;
  when: string;
  neighborhood?: string;
  admission?: string;
  going?: number | string;
  dayOfWeek?: string;
  chip?: string;
};

type EventsTab = "going" | "hosting" | "saved";

const TABS: Array<{ key: EventsTab; label: string }> = [
  { key: "going", label: "Going" },
  { key: "hosting", label: "Hosting" },
  { key: "saved", label: "Saved" },
];

function dayDotClass(day?: string) {
  const map: Record<string, string> = {
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
    Thu: "d-thu",
    Fri: "d-fri",
    Sat: "d-sat",
    Sun: "d-sun",
  };
  return day ? map[day] ?? "" : "";
}

type Props = {
  going: HubEventRow[];
  hosting: HubEventRow[];
  saved?: HubEventRow[];
  loading?: boolean;
  emptyMessage?: string;
  editorSlot?: ReactNode;
  onEditEvent?: (id: string | number) => void;
};

export default function HubEvents({
  going,
  hosting,
  saved = [],
  loading,
  emptyMessage = "No events in this tab yet.",
  editorSlot,
}: Props) {
  const [tab, setTab] = useState<EventsTab>("going");

  const lists: Record<EventsTab, HubEventRow[]> = { going, hosting, saved };
  const eventList = lists[tab];

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your Pride Week
      </div>
      <h1 className="h1">Your Events</h1>

      {editorSlot}

      <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", margin: "20px 0 22px" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid var(--panel-border)", borderRadius: 12, overflow: "hidden" }}>
        {loading && (
          <div className="kick" style={{ padding: 24, textAlign: "center" }}>
            Loading events…
          </div>
        )}
        {!loading && eventList.length === 0 && (
          <div className="kick" style={{ padding: 24, textAlign: "center" }}>
            {emptyMessage}
          </div>
        )}
        {!loading &&
          eventList.map((e) => (
            <article
              key={e.id}
              className="rowin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                padding: "16px 18px",
                background: "var(--panel-card)",
                borderBottom: "1px solid var(--panel-border)",
              }}
            >
              <span className={`dot ${dayDotClass(e.dayOfWeek)}`} style={{ flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff", lineHeight: 1.05, textTransform: "uppercase" }}>
                  {e.title}
                </div>
                <div className="kick" style={{ letterSpacing: ".06em", marginTop: 6 }}>
                  {e.when}
                  {e.neighborhood ? ` · ${e.neighborhood}` : ""}
                  {e.chip ? ` · ${e.chip}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {e.admission && (
                  <div className="kick" style={{ letterSpacing: ".1em", color: "var(--panel-cyan)" }}>
                    {e.admission}
                  </div>
                )}
                {e.going !== undefined && (
                  <div className="kick" style={{ letterSpacing: ".06em", marginTop: 5 }}>
                    {e.going} going
                  </div>
                )}
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}