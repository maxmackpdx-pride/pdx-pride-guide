import type { EventListing } from "@shared/multiDayEvents";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import { parsePacificDateTime } from "@shared/missedConnections";
import EventAttendancePreview from "@/components/EventAttendancePreview";
import type { AttendanceSummary } from "@/lib/attendanceBubble";

function formatTime(value: string): string {
  const ms = parsePacificDateTime(value);
  if (ms == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms)).replace(" ", "").toLowerCase();
}

export default function ScheduleEventCard({
  event,
  attendanceSummary,
  accentColor,
  top,
  height,
  onClick,
}: {
  event: EventListing;
  attendanceSummary?: AttendanceSummary | null;
  accentColor: string;
  top: number;
  height: number;
  onClick: () => void;
}) {
  const posterUrl = resolveEventPosterUrl(event.id, event.posterImageUrl);
  const compact = height < 70;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className="schedule-event-card"
      data-testid={`schedule-event-card-${event.id}`}
      style={{
        position: "absolute",
        top,
        height,
        left: 4,
        right: 4,
        backgroundImage: `url(${posterUrl})`,
      }}
    >
      <div className="schedule-event-card__overlay" />
      <div className="schedule-event-card__accent" style={{ background: accentColor }} />
      <div className="schedule-event-card__content">
        <div>
          <div className="schedule-event-card__time">
            {formatTime(event.dateStart)}
            {!compact && ` – ${formatTime(event.dateEnd)}`}
          </div>
          <div className="schedule-event-card__title" style={{ fontSize: compact ? "0.78rem" : "0.92rem" }}>
            {event.title}
          </div>
          {!compact && <div className="schedule-event-card__venue">{event.venueName}</div>}
        </div>
        {!compact && (
          <EventAttendancePreview summary={attendanceSummary} compact />
        )}
      </div>
    </div>
  );
}
