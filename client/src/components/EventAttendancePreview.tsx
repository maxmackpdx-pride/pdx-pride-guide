import AttendanceBubbleFace from "@/components/AttendanceBubbleFace";
import type { AttendanceSummary } from "@/lib/attendanceBubble";

type EventAttendancePreviewProps = {
  summary?: AttendanceSummary | null;
  compact?: boolean;
  selfUserId?: number | null;
};

export default function EventAttendancePreview({
  summary,
  compact = false,
  selfUserId,
}: EventAttendancePreviewProps) {
  if (!summary || summary.count <= 0) return null;

  const maxBubbles = compact ? 5 : 6;
  const bubbles = summary.preview.slice(0, maxBubbles);
  const bubbleSize = compact ? 26 : 30;

  return (
    <div className={`event-card-attendance${compact ? " event-card-attendance--compact" : ""}`}>
      <span className="event-card-attendance__count">
        <span className="event-card-attendance__count-dot" aria-hidden="true" />
        {summary.count} Going
      </span>
      <div className="event-card-attendance__bubbles" aria-hidden="true">
        {bubbles.map((bubble, index) => {
          const isSelf = !!selfUserId && bubble.userId === selfUserId;
          return (
            <span
              key={bubble.id}
              className={`event-card-attendance__bubble${isSelf ? " event-card-attendance__bubble--self" : ""}`}
              style={{ zIndex: bubbles.length - index }}
            >
              <AttendanceBubbleFace
                handle={bubble.avatarSeed}
                username={bubble.avatarSeed}
                avatarSeed={bubble.avatarSeed}
                avatarRing={bubble.avatarRing}
                avatarChoice={bubble.avatarChoice ?? undefined}
                photoUrl={bubble.photoUrl}
                size={bubbleSize}
              />
              {isSelf && <span className="event-card-attendance__self-dot" />}
            </span>
          );
        })}
        {summary.count > bubbles.length && (
          <span className="event-card-attendance__more">+{summary.count - bubbles.length}</span>
        )}
      </div>
    </div>
  );
}