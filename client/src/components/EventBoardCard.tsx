import type React from "react";
import type { Event } from "@shared/schema";
import EventTagsRow from "./EventTagsRow";
import AttendanceCluster from "./AttendanceCluster";
import ScrollReveal from "./ScrollReveal";
import { formatPacificDateTime } from "@/lib/countdown";

import { DAY_COLORS } from "@shared/eventWeek";

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
  const dayColor = DAY_COLORS[event.dayOfWeek as keyof typeof DAY_COLORS] || "#19e3ff";
  const time = event.dateStart
    ? formatPacificDateTime(event.dateStart, { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = event.dateStart
    ? formatPacificDateTime(event.dateStart, { weekday: "short", month: "short", day: "numeric" })
    : "";
  const soldOut = /\bsold\s*out\b/i.test(`${event.title} ${event.description || ""}`);
  const displayTitle = event.title.replace(/^\s*SOLD\s*OUT\s*[·\-:|]*\s*/i, "").trim() || event.title;

  const glassVars = {
    "--card-day-color": dayColor,
    "--c": dayColor,
    "--_c": dayColor,
    "--_day": dayColor,
  } as React.CSSProperties;

  return (
    <ScrollReveal delay={revealDelay}>
      <article
        className={`event-board-card event-board-card--glass event-board-card--${layout}${soldOut ? " event-board-card--sold-out" : ""}`}
        data-testid={`event-card-${event.id}`}
        style={glassVars}
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
                {soldOut && <span className="event-sold-out-badge event-sold-out-badge--poster">SOLD OUT</span>}
              </div>
            ) : (
              <div className="event-board-card__poster event-board-card__poster--empty" style={{ borderColor: `${dayColor}55` }}>
                <span className="event-board-card__day" style={{ background: dayColor }} aria-hidden="true" />
                {soldOut && <span className="event-sold-out-badge event-sold-out-badge--poster">SOLD OUT</span>}
              </div>
            )}
            <div className="event-board-card__meta">
              {soldOut && <span className="event-sold-out-badge">SOLD OUT</span>}
              <EventTagsRow event={event} size="sm" className="event-card-tags--list" />
              <h3 className="display event-board-card__title">{displayTitle}</h3>
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
            liveSocket={false}
          />
        </div>
      </article>
    </ScrollReveal>
  );
}