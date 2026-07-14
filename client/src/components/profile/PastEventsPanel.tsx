import type { CSSProperties } from "react";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { eventDayCssVar, eventYear, ProfileRailHead } from "./ProfileEventRail";
import type { ProfileEvent } from "./types";
import "./PastEventsPanel.css";

type Props = {
  events: ProfileEvent[];
  onEventClick?: (event: ProfileEvent) => void;
  /** Optional override for the count segment (defaults to "{n} ATTENDED"). */
  countLabel?: string;
};

/**
 * Past Events grid: attended events with year badge, title, and venue.
 * Day color drives the top seam via --day-* tokens.
 * Event poster sits behind the day-colored gradient scrim.
 */
export default function PastEventsPanel({ events, onEventClick, countLabel }: Props) {
  if (!events.length) return null;

  const count = countLabel || `${events.length} ATTENDED`;

  return (
    <section className="pp-past-events" aria-label="Past events">
      <ProfileRailHead label="PAST EVENTS" countLabel={count} accent="muted" />
      <div className="pp-past-events__grid" role="list">
        {events.map(event => {
          const day = eventDayCssVar(event);
          const year = eventYear(event);
          const style = { ["--pp-day" as string]: day } as CSSProperties;
          const clickable = typeof onEventClick === "function";
          const poster = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);

          const inner = (
            <>
              {poster && (
                <img className="pp-past-events__poster" src={poster} alt="" decoding="async" loading="lazy" />
              )}
              <div className="pp-past-events__scrim" aria-hidden="true" />
              {year ? (
                <span className="pp-past-events__year">{year}</span>
              ) : (
                <span className="pp-past-events__year pp-past-events__year--empty" />
              )}
              <div className="pp-past-events__body">
                <div className="display pp-past-events__title">{event.title}</div>
                {event.venueName ? (
                  <div className="pp-past-events__venue">{event.venueName}</div>
                ) : null}
              </div>
            </>
          );

          if (clickable) {
            return (
              <button
                key={event.id}
                type="button"
                role="listitem"
                className="pp-past-events__tile pp-past-events__tile--btn"
                style={style}
                onClick={() => onEventClick(event)}
              >
                {inner}
              </button>
            );
          }

          return (
            <article
              key={event.id}
              role="listitem"
              className="pp-past-events__tile"
              style={style}
            >
              {inner}
            </article>
          );
        })}
      </div>
    </section>
  );
}
