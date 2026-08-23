import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "wouter";

export type HubEventRow = {
  id: string | number;
  title: string;
  when: string;
  neighborhood?: string;
  admission?: string;
  going?: number | string;
  dayOfWeek?: string;
  chip?: string;
  /** ISO / Pacific event start - used to keep “next moves” free of past nights. */
  dateStart?: string | null;
  dateEnd?: string | null;
};

type EventsTab = "going" | "hosting";

const TABS: Array<{ key: EventsTab; label: string }> = [
  { key: "going", label: "Going" },
  { key: "hosting", label: "Hosting" },
];

function dayDotClass(day?: string) {
  const key = String(day || "").trim().toUpperCase().slice(0, 3);
  const map: Record<string, string> = {
    MON: "d-mon",
    TUE: "d-tue",
    WED: "d-wed",
    THU: "d-thu",
    FRI: "d-fri",
    SAT: "d-sat",
    SUN: "d-sun",
  };
  return map[key] ?? "";
}

export type HubEventsFocus = "events" | "checkins";

type Props = {
  going: HubEventRow[];
  hosting: HubEventRow[];
  /** Optional for API compat; Saved tab is not shown until bookmarks ship. */
  saved?: HubEventRow[];
  loading?: boolean;
  emptyMessage?: string;
  editorSlot?: ReactNode;
  onEditEvent?: (id: string | number) => void;
  /** Deep-link from inbox Posts sheet (`?view=posts&section=…`). */
  focusSection?: HubEventsFocus | null;
};

function tabForFocus(focus?: HubEventsFocus | null): EventsTab {
  if (focus === "events") return "hosting";
  if (focus === "checkins") return "going";
  return "going";
}

export default function HubEvents({
  going,
  hosting,
  loading,
  emptyMessage = "No events in this tab yet.",
  editorSlot,
  focusSection = null,
}: Props) {
  const [tab, setTab] = useState<EventsTab>(() => tabForFocus(focusSection));

  useEffect(() => {
    if (!focusSection) return;
    setTab(tabForFocus(focusSection));
    const id = focusSection === "checkins" ? "checkins" : "events";
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [focusSection]);

  const lists: Record<EventsTab, HubEventRow[]> = { going, hosting };
  const eventList = lists[tab];

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your Pride Week
      </div>
      <h1 className="h1">Your Events</h1>

      {editorSlot}

      <div className="hub-events-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="hub-events-panel" id={tab === "going" ? "checkins" : "events"}>
        {loading && (
          <div className="card hub-empty hub-events-empty pdx-glass-rebind">
            <span className="kick">Loading events…</span>
          </div>
        )}

        {!loading && eventList.length === 0 && (
          <div className="card hub-empty hub-events-empty pdx-glass-rebind">
            <span className="kick">{emptyMessage}</span>
            <div className="hub-events-empty__actions">
              {tab === "hosting" ? (
                <Link href="/submit" className="hub-events-empty__link">Submit an event</Link>
              ) : (
                <>
                  <Link href="/events" className="hub-events-empty__link">Browse events</Link>
                  <Link href="/schedule" className="hub-events-empty__link">Open My Schedule</Link>
                </>
              )}
            </div>
          </div>
        )}

        {!loading && eventList.length > 0 && (
          <div className="card hub-events-list pdx-glass-rebind">
            {eventList.map((e) => (
              <article key={e.id} className="hub-thread rowin hub-event-thread">
                <span className={`hub-event-thread__dot dot ${dayDotClass(e.dayOfWeek)}`} aria-hidden />
                <div className="hub-thread__body">
                  <div className="hub-thread__top">
                    <span className="hub-thread__name">{e.title}</span>
                    {(e.admission || e.going !== undefined) && (
                      <div className="hub-event-thread__aside">
                        {e.admission && <span className="hub-event-thread__admission">{e.admission}</span>}
                        {e.going !== undefined && <span className="hub-event-thread__going">{e.going} going</span>}
                      </div>
                    )}
                  </div>
                  <span className="hub-thread__sub">
                    {e.when}
                    {e.neighborhood ? ` · ${e.neighborhood}` : ""}
                    {e.chip ? ` · ${e.chip}` : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
