import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { EventListing } from "@shared/multiDayEvents";
import { DAYS, fmtClock } from "@shared/prideWeek";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import {
  buildScheduleEvents,
  featuredScheduleEvents,
  isLiveNow,
  liveScheduleEvents,
  startingSoonScheduleEvents,
  upcomingScheduleEvents,
  type ScheduleEvent,
} from "@/lib/scheduleEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useTheme } from "@/context/ThemeContext";
import FlyerRailCard from "@/components/FlyerRailCard";
import AuthModal from "@/components/AuthModal";
import "./EventsNowPanel.css";

const FD = "var(--font-display)";
const FB = "var(--font-body)";

function nowLabel(nowMs: number): string {
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(nowMs))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  return `${(parts.weekday || "").toUpperCase()} · ${parts.hour}:${parts.minute}${(parts.dayPeriod || "").toLowerCase()}`;
}

type Props = {
  events: EventListing[];
  attendanceSummaries: Record<string, AttendanceSummary>;
  onSelect: (listing: EventListing) => void;
};

/**
 * "Right now" flyer rails beside the events map: what's on this minute,
 * what starts next, and the headliners defining the week. Full unfiltered
 * list on purpose; the board filters below don't apply to this snapshot.
 */
export default function EventsNowPanel({ events, attendanceSummaries, onSelect }: Props) {
  const { calmMode: calm } = useTheme();
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(events, attendanceSummaries),
    [events, attendanceSummaries],
  );

  const onNow = useMemo(() => liveScheduleEvents(scheduleEvents, nowMs), [scheduleEvents, nowMs]);
  const soon = useMemo(
    () => startingSoonScheduleEvents(scheduleEvents, nowMs, 10),
    [scheduleEvents, nowMs],
  );
  const featured = useMemo(() => featuredScheduleEvents(scheduleEvents), [scheduleEvents]);
  const nextUp = useMemo(
    () => upcomingScheduleEvents(scheduleEvents, nowMs, 1)[0],
    [scheduleEvents, nowMs],
  );

  const open = (e: ScheduleEvent) => {
    const listing = events.find(l => (l.listingInstanceKey ?? String(l.id)) === e.scheduleKey);
    if (listing) onSelect(listing);
  };

  const rail = (list: ScheduleEvent[]) => (
    <div className="enp-rail">
      {list.map(e => (
        <FlyerRailCard
          key={e.scheduleKey}
          event={e}
          live={isLiveNow(e, nowMs)}
          rsvped={myEventIds.has(e.id)}
          size="rail"
          onOpen={open}
          onToggleRsvp={toggleRsvp}
        />
      ))}
    </div>
  );

  const headStyle = (color: string): CSSProperties => ({
    fontFamily: FD,
    fontWeight: 900,
    fontSize: 20,
    color: calm ? "#c8c8cc" : color,
    textTransform: "uppercase",
    letterSpacing: ".03em",
  });

  const hairline = (color: string) => (
    <span
      aria-hidden
      style={{
        height: 2,
        flex: 1,
        background: `linear-gradient(to right, ${calm ? "#3a3a3a" : color}, transparent)`,
      }}
    />
  );

  return (
    <aside className="events-now-panel" aria-label="Happening now and coming up">
      <div className="enp-section">
        <div className="enp-head">
          <span className="enp-live-dot" aria-hidden />
          <span style={headStyle("#ffffff")}>On Now</span>
          <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: "#9a9791", letterSpacing: ".02em", whiteSpace: "nowrap" }}>
            {nowLabel(nowMs)}
          </span>
        </div>
        {onNow.length > 0 ? (
          rail(onNow)
        ) : (
          <p className="enp-quiet">
            Nothing on this minute.
            {nextUp
              ? ` Next up: ${nextUp.title}, ${DAYS.find(d => d.key === nextUp.day)?.short ?? nextUp.day} at ${fmtClock(nextUp.s)}.`
              : " Check back during Pride Week."}
          </p>
        )}
      </div>

      {soon.length > 0 && (
        <div className="enp-section">
          <div className="enp-head">
            <span style={headStyle("#00FFFF")}>Starting Soon</span>
            {hairline("#00FFFF")}
          </div>
          {rail(soon)}
        </div>
      )}

      {featured.length > 0 && (
        <div className="enp-section">
          <div className="enp-head">
            <span style={headStyle("#CCFF00")}>Big This Week</span>
            {hairline("#CCFF00")}
          </div>
          {rail(featured)}
        </div>
      )}

      {showAuth && createPortal(<AuthModal onClose={() => setShowAuth(false)} />, document.body)}
    </aside>
  );
}
