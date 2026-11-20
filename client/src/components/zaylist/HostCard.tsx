import { OrganizerPlanning } from "./OrganizerPlanning";
import RosterChat from "./RosterChat";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useModalA11y } from "@/hooks/useModalA11y";
import { parsePacificDateTime } from "@shared/missedConnections";
import ZaylistPanel from "./ZaylistPanel";
import { EventTeam, Connections, EventGig, ScanLedger } from "./HostOperations";
import PushComposer from "./PushComposer";
import EventMode from "./EventMode";

export interface HostEvent {
  id: number;
  role: string;
  canEditEvent: boolean;
  canManageTeam: boolean;
  canManageList: boolean;
  metrics: { interested:number; going:number; accepted:number; arrived:number; pending:number; drinksServed:number; gifted:number };
  title: string;
  venueName: string | null;
  address: string | null;
  neighborhood: string | null;
  dateStart: string;
  dateEnd: string | null;
  admission: string | null;
  ticketUrl: string | null;
  description: string | null;
  posterImageUrl: string | null;
}

function fmtWhen(iso: string) {
  const time = parsePacificDateTime(iso);
  return time === null ? iso : new Intl.DateTimeFormat(undefined, {
    weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"America/Los_Angeles",
  }).format(time);
}

function toLocalInput(iso: string) {
  const time = parsePacificDateTime(iso);
  if (time === null) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  }).formatToParts(time);
  const value = (type:string) => parts.find(p=>p.type===type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

/**
 * A host's own event as a wide rail card: production wide-card shape,
 * poster full bleed, host information in place of attendee information.
 * Body press opens the owner point of view; the buttons open the public
 * card and the owner view in edit mode.
 */
export default function HostCard({
  event,
  otherEvents,
  startInEdit = false,
}: {
  event: HostEvent;
  otherEvents: HostEvent[];
  startInEdit?: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dialogRef = useModalA11y({open,onClose:()=>setOpen(false)});
  const [door, setDoor] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: event.title,
    venueName: event.venueName ?? "",
    dateStart: toLocalInput(event.dateStart),
    admission: event.admission ?? "",
    ticketUrl: event.ticketUrl ?? "",
    description: event.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const counts = event.metrics;
  const going = counts.going;
  useEffect(() => {
    if (startInEdit && event.canEditEvent) {setEditing(true);setOpen(true);}
  }, [startInEdit,event.canEditEvent]);

  const openOwner = (edit: boolean) => {
    setEditing(edit);
    setOpen(true);
  };

  const save = async () => {
    setError(null);
    try {
      await apiRequest("PUT", `/api/events/${event.id}/edit`, {
        title: form.title.trim(),
        venueName: form.venueName.trim(),
        dateStart: form.dateStart === toLocalInput(event.dateStart) ? event.dateStart : form.dateStart,
        admission: form.admission.trim(),
        ticketUrl: form.ticketUrl.trim(),
        description: form.description,
      });
      setEditing(false);
      setSavedAt(new Date().toLocaleTimeString());
      await Promise.all([
        queryClient.invalidateQueries({queryKey:["/api/hub/workspace"]}),
        queryClient.invalidateQueries({queryKey:["/api/events/mine/claimed"]}),
        queryClient.invalidateQueries({predicate:query=>String(query.queryKey[0]).startsWith("/api/events")}),
      ]);
    } catch (e) {
      setError(parseApiError(e, "Saving did not go through. Try again."));
    }
  };

  return (
    <>
      <article
        className="zl-wide"
        onClick={() => openOwner(false)}
        onKeyDown={(e) => {
          if (e.currentTarget === e.target && (e.key === "Enter" || e.key === " ")) {e.preventDefault();openOwner(false);}
        }}
        tabIndex={0}
        role="button"
        aria-label={`Open host tools for ${event.title}`}
      >
        {event.posterImageUrl ? (
          <img src={event.posterImageUrl} alt="" />
        ) : (
          <div className="zl-wide-fallback">{event.title}</div>
        )}
        <div className="zl-wide-shade" />
        <div className="zl-wide-body">
          <h3 className="zl-wide-title">{event.title}</h3>
          <p className="zl-wide-meta">
            {event.role} · {fmtWhen(event.dateStart)}
            {event.venueName ? ` · ${event.venueName}` : ""}
          </p>
          <div className="zl-wide-stats">
            {typeof going === "number" ? <span className="zl-chip">{going} going</span> : null}
            {counts ? (
              <>
                <span className="zl-chip">{counts.accepted + counts.arrived} on the Zay'list</span>
                {counts.pending ? <span className="zl-chip">{counts.pending} pending</span> : null}
                {counts.arrived ? <span className="zl-chip">{counts.arrived} arrived</span> : null}
              </>
            ) : (
              <span className="zl-chip">Zay'list ready</span>
            )}
          </div>
          <div className="zl-wide-actions">
            <a
              className="zl-btn zl-btn--small"
              href={`/events/${event.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              View live card
            </a>
            {event.canEditEvent && <button
              className="zl-btn zl-btn--small"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openOwner(true);
              }}
            >
              Edit details
            </button>}
            <button
              className="zl-btn zl-btn--small"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDoor(true);
              }}
            >
              Event Mode
            </button>
          </div>
        </div>
      </article>

      {open ? (
        <>
          <div className="zl-overlay-backdrop" onClick={() => setOpen(false)} />
          <div className="zl-overlay" ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Owner view for ${event.title}`}>
            <div className="zl-sheet zl-root" style={{ padding: 18 }}>
              <div className="zl-sheet-head">
                <div className="zl-sheet-head-main">
                  <h2 className="zl-h1" style={{ fontSize: "1.45rem" }}>{event.title}</h2>
                  <p className="zl-sub">
                    {fmtWhen(event.dateStart)}
                    {event.venueName ? ` · ${event.venueName}` : ""}
                    {event.admission ? ` · ${event.admission}` : ""}
                  </p>
                  {savedAt ? <p className="zl-ok" role="status">Details saved · {savedAt}</p> : null}
                </div>
                <button className="zl-close" type="button" onClick={() => setOpen(false)} aria-label="Close owner view">
                  ×
                </button>
              </div>

              {event.posterImageUrl ? (
                <img className="zl-sheet-poster" src={event.posterImageUrl} alt="" style={{ marginTop: 12 }} />
              ) : null}

              {editing ? (
                <div style={{ marginTop: 14 }}>
                  <label className="zl-label" htmlFor={`hc-title-${event.id}`}>Title</label>
                  <input id={`hc-title-${event.id}`} className="zl-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <label className="zl-label" htmlFor={`hc-venue-${event.id}`}>Venue</label>
                  <input id={`hc-venue-${event.id}`} className="zl-input" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
                  <label className="zl-label" htmlFor={`hc-date-${event.id}`}>Starts · Pacific time</label>
                  <input id={`hc-date-${event.id}`} className="zl-input" type="datetime-local" value={form.dateStart} onChange={(e) => setForm({ ...form, dateStart: e.target.value })} />
                  <label className="zl-label" htmlFor={`hc-adm-${event.id}`}>Admission</label>
                  <input id={`hc-adm-${event.id}`} className="zl-input" value={form.admission} onChange={(e) => setForm({ ...form, admission: e.target.value })} />
                  <label className="zl-label" htmlFor={`hc-tix-${event.id}`}>Ticket link</label>
                  <input id={`hc-tix-${event.id}`} className="zl-input" value={form.ticketUrl} onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })} />
                  <label className="zl-label" htmlFor={`hc-desc-${event.id}`}>Description</label>
                  <textarea id={`hc-desc-${event.id}`} className="zl-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  {error ? <p className="zl-error" role="alert">{error}</p> : null}
                  <div className="zl-row" style={{ marginTop: 12 }}>
                    <button className="zl-btn zl-btn--primary" type="button" onClick={() => void save()}>
                      Save details
                    </button>
                    <button
                      className="zl-btn"
                      type="button"
                      onClick={() => {
                        setForm({
                          title: event.title,
                          venueName: event.venueName ?? "",
                          dateStart: toLocalInput(event.dateStart),
                          admission: event.admission ?? "",
                          ticketUrl: event.ticketUrl ?? "",
                          description: event.description ?? "",
                        });
                        setEditing(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="zl-row" style={{ marginTop: 14 }}>
                  {event.canEditEvent && <button className="zl-btn" type="button" onClick={() => setEditing(true)}>
                    Edit details
                  </button>}
                  <a className="zl-btn" href={`/events/${event.id}`}>
                    View live card
                  </a>
                  <button className="zl-btn" type="button" onClick={() => setDoor(true)}>
                    Event Mode
                  </button>
                </div>
              )}

              <details className="zl-tool"><summary>Night in numbers</summary>
                <dl className="zl-stat-strip">{[
                  ["Interested",counts.interested],["Going",counts.going],["Expected",counts.accepted],
                  ["Checked in",counts.arrived],["Drinks served",counts.drinksServed],["Gifted spots",counts.gifted],
                ].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                <p className="zl-note">Interested counts event follows. Going counts active RSVPs. Checked in and drinks served come from door scans.</p>
              </details>
              {event.canManageList && <ScanLedger eventId={event.id}/>}
              {(event.canEditEvent || event.canManageTeam) && <OrganizerPlanning eventId={event.id}/>}
              <EventTeam event={event} otherEvents={otherEvents}/>
              <RosterChat kind="events" id={event.id}/>
              {event.canManageList && <Connections kind="events" id={event.id}/>}
              {event.canEditEvent && <EventGig event={event}/>}
              {(event.canEditEvent || event.canManageTeam) && <PushComposer selectedEvent={event} />}
              <section aria-label="Zay'list" style={{ marginTop: 18 }}>
                <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 4px" }}>Zay'list</h3>
                <ZaylistPanel eventId={event.id} />
              </section>
            </div>
          </div>
        </>
      ) : null}

      {door ? <EventMode eventId={event.id} eventTitle={event.title} onClose={() => setDoor(false)} /> : null}
    </>
  );
}
