import type { AttendanceSummary } from "@/lib/attendanceBubble";
import { attendanceBubbleGradient } from "@/lib/attendanceBubble";

type EventAttendancePreviewProps = {
  summary?: AttendanceSummary | null;
  compact?: boolean;
};

export default function EventAttendancePreview({ summary, compact = false }: EventAttendancePreviewProps) {
  if (!summary || summary.count <= 0) return null;

  const bubbles = summary.preview.slice(0, compact ? 4 : 6);

  return (
    <div className={`event-card-attendance${compact ? " event-card-attendance--compact" : ""}`}>
      <span className="event-card-attendance__count">{summary.count} GOING</span>
      <div className="event-card-attendance__bubbles" aria-hidden="true">
        {bubbles.map((bubble, index) => (
          <span
            key={bubble.id}
            className="event-card-attendance__bubble"
            style={{
              background: attendanceBubbleGradient(bubble.avatarSeed),
              zIndex: bubbles.length - index,
            }}
          >
            {bubble.initials}
          </span>
        ))}
        {summary.count > bubbles.length && (
          <span className="event-card-attendance__more">+{summary.count - bubbles.length}</span>
        )}
      </div>
    </div>
  );
}