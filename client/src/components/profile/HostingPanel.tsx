import type { CSSProperties, KeyboardEvent } from "react";
import { admissionDisplayLabel } from "@shared/admission";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { ProfileEvent } from "./types";
import "./HostingPanel.css";

type Props = {
  upcoming: ProfileEvent[];
  past: ProfileEvent[];
  displayName?: string | null;
  onEventClick?: (event: ProfileEvent) => void;
};

const DAY_CODES = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
const WEEKDAY_FROM_JS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function dayCode(event: ProfileEvent): string {
  const raw = (event.dayOfWeek || "").trim().toUpperCase();
  if (raw) {
    const code = raw.slice(0, 3);
    if (DAY_CODES.has(code)) return code;
  }
  if (event.dateStart) {
    const d = new Date(event.dateStart);
    if (!Number.isNaN(d.getTime())) return WEEKDAY_FROM_JS[d.getDay()];
  }
  return "FRI";
}

function dayColorVar(code: string): string {
  return `var(--day-${code.toLowerCase()})`;
}

/** Compact when line for upcoming: SAT JUL 18 · 9PM */
function fmtUpcomingWhen(event: ProfileEvent): string {
  if (!event.dateStart) return "";
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return "";
  const day = (event.dayOfWeek || WEEKDAY_FROM_JS[d.getDay()]).toUpperCase().slice(0, 3);
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  const date = d.getDate();
  const time = d
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, "")
    .toUpperCase();
  return `${day} ${mon} ${date} · ${time}`;
}

/** Compact when line for past: OCT 2025 */
function fmtPastWhen(event: ProfileEvent): string {
  if (!event.dateStart) return "";
  const d = new Date(event.dateStart);
  if (Number.isNaN(d.getTime())) return "";
  const mon = d.toLocaleString([], { month: "short" }).toUpperCase();
  return `${mon} ${d.getFullYear()}`;
}

function admissionChrome(admission?: string | null): string | null {
  if (!admission) return null;
  const label = admissionDisplayLabel(admission);
  return label ? label.toUpperCase() : null;
}

function statusLine(event: ProfileEvent, past: boolean): string {
  const count = event.goingCount;
  const adm = admissionChrome(event.admission);
  if (past) {
    if (typeof count === "number" && count > 0) {
      if (event.admission === "TICKETED") return `SOLD OUT · ${count}`;
      return `${count} WENT`;
    }
    if (event.admission === "TICKETED") return "SOLD OUT";
    return adm || "PAST SHOW";
  }
  const parts: string[] = [];
  if (typeof count === "number" && count > 0) parts.push(`${count} GOING`);
  if (adm) parts.push(adm);
  return parts.join(" · ");
}

function HostingCard({
  event,
  past,
  onEventClick,
}: {
  event: ProfileEvent;
  past: boolean;
  onEventClick?: (event: ProfileEvent) => void;
}) {
  const code = dayCode(event);
  const color = dayColorVar(code);
  const when = past ? fmtPastWhen(event) : fmtUpcomingWhen(event);
  const status = statusLine(event, past);
  const interactive = typeof onEventClick === "function";
  const poster = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);

  const style = { "--hp-day": color } as CSSProperties;

  const activate = () => {
    if (interactive) onEventClick!(event);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEventClick!(event);
    }
  };

  return (
    <article
      className={`hp-card${interactive ? " is-clickable" : ""}`}
      style={style}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? activate : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      aria-label={event.title}
    >
      <div className="hp-card__banner">
        {poster && (
          <img className="hp-card__poster" src={poster} alt="" decoding="async" loading="lazy" />
        )}
        <div className="hp-card__banner-scrim" aria-hidden="true" />
        <span className="hp-card__day">{past ? "PAST" : code}</span>
      </div>
      <div className="hp-card__body">
        <h3 className="hp-card__title display">{event.title}</h3>
        {when && <div className="hp-card__when">{when}</div>}
        {event.venueName && <div className="hp-card__venue">{event.venueName}</div>}
        {status && <div className="hp-card__stat">{status}</div>}
      </div>
    </article>
  );
}

function HostingRail({
  label,
  events,
  past,
  emptyCopy,
  onEventClick,
}: {
  label: string;
  events: ProfileEvent[];
  past: boolean;
  emptyCopy: string;
  onEventClick?: (event: ProfileEvent) => void;
}) {
  return (
    <div className="hp-section">
      <div className="hp-section__label display" id={`hp-label-${past ? "past" : "next"}`}>
        {label}
      </div>
      <div
        className="hp-rail"
        role="list"
        aria-labelledby={`hp-label-${past ? "past" : "next"}`}
      >
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} role="listitem">
              <HostingCard event={event} past={past} onEventClick={onEventClick} />
            </div>
          ))
        ) : (
          <p className="hp-empty">{emptyCopy}</p>
        )}
      </div>
    </div>
  );
}

export default function HostingPanel({ upcoming, past, displayName, onEventClick }: Props) {
  const hasUpcoming = upcoming.length > 0;
  const hasPast = past.length > 0;

  if (!hasUpcoming && !hasPast) return null;

  const firstName = (displayName || "").trim().split(/\s+/)[0] || null;

  const emptyNext = firstName
    ? `Nothing up next for ${firstName} yet. New nights land here first.`
    : "Nothing up next yet. New nights land here first.";
  const emptyPast = firstName
    ? `No past shows on ${firstName}'s ledger yet. First one's always special.`
    : "No past shows on the ledger yet. First one's always special.";

  return (
    <section className="hp-panel" aria-label="Hosting">
      <div className="hp-panel__head">
        <span className="hp-panel__kicker">
          <span className="hp-panel__dot" aria-hidden="true" />
          HOSTING
        </span>
        <span className="hp-panel__badge">PROMOTER</span>
      </div>

      {/* Stacked: Up Next first, past events directly under it */}
      {(hasUpcoming || !hasPast) && (
        <HostingRail
          label="UP NEXT"
          events={upcoming}
          past={false}
          emptyCopy={emptyNext}
          onEventClick={onEventClick}
        />
      )}

      {hasPast && (
        <HostingRail
          label="PAST EVENTS"
          events={past}
          past={true}
          emptyCopy={emptyPast}
          onEventClick={onEventClick}
        />
      )}
    </section>
  );
}
