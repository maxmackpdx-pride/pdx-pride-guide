import type React from "react";
import type { Event } from "@shared/schema";
import EventTagsRow from "./EventTagsRow";
import AttendanceCluster from "./AttendanceCluster";
import ScrollReveal from "./ScrollReveal";

const DAY_COLORS: Record<string, string> = {
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

type EventBoardCardProps = {
  event: Event;
  onOpenDetails: () => void;
  revealDelay?: number;
  layout?: "stack" | "grid";
};

export default function EventBoardCard({
  event,
  onOpenDetails,
  revealDelay = 0,
  layout = "stack",
}: EventBoardCardProps) {
  const dayColor = DAY_COLORS[event.dayOfWeek || ""] || "#fff";
  const time = event.dateStart
    ? new Date(event.dateStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = event.dateStart
    ? new Date(event.dateStart).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
    : "";

  return (
    <ScrollReveal delay={revealDelay}>
      <article
        className={`event-board-card event-board-card--${layout}`}
        data-testid={`event-card-${event.id}`}
        style={{ "--card-day-color": dayColor } as React.CSSProperties}
      >
        <header className="event-board-card__head">
          <button
            type="button"
            className="event-board-card__open"
            onClick={onOpenDetails}
            aria-label={`Open details for ${event.title}`}
          >
            {event.posterImageUrl ? (
              <div className="event-board-card__poster">
                <img src={event.posterImageUrl} alt="" />
                <span className="event-board-card__day" style={{ background: dayColor }} aria-hidden="true" />
              </div>
            ) : (
              <div className="event-board-card__poster event-board-card__poster--empty" style={{ borderColor: `${dayColor}55` }}>
                <span className="event-board-card__day" style={{ background: dayColor }} aria-hidden="true" />
              </div>
            )}
            <div className="event-board-card__meta">
              <EventTagsRow event={event} size="sm" className="event-card-tags--list" />
              <h3 className="display event-board-card__title">{event.title}</h3>
              <p className="event-board-card__venue">{event.venueName}</p>
              <p className="event-board-card__when">
                {dateLabel}{time ? ` · ${time}` : ""}{event.neighborhood ? ` · ${event.neighborhood}` : ""}
              </p>
              <span className="event-board-card__details-link">Event details →</span>
            </div>
          </button>
        </header>

        <div
          className="event-board-card__attendance"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <AttendanceCluster
            eventId={event.id}
            embedded
            variant="card"
            liveSocket={false}
          />
        </div>
      </article>
    </ScrollReveal>
  );
}