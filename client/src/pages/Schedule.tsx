import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { usePageSeo } from "@/hooks/usePageSeo";
import { parsePacificDateTime } from "@shared/missedConnections";
import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import ScheduleEventCard from "@/components/ScheduleEventCard";
import { exportScheduleToStories } from "@/lib/scheduleExport";
import { Download } from "lucide-react";

const DAYS: { key: string; label: string; date: string; color: string }[] = [
  { key: "THU", label: "THURSDAY", date: "JUL 16", color: "var(--day-thu, #00FFFF)" },
  { key: "FRI", label: "FRIDAY", date: "JUL 17", color: "var(--day-fri, #FF00CC)" },
  { key: "SAT", label: "SATURDAY", date: "JUL 18", color: "var(--day-sat, #39FF14)" },
  { key: "SUN", label: "SUNDAY", date: "JUL 19", color: "var(--day-sun, #FF6600)" },
];

const ACCENT_CYCLE = ["#19E3FF", "#FF6600", "#39FF14", "#A855F7", "#FF00CC"];

const SCHEDULE_START_HOUR = 11; // 11 AM
const SCHEDULE_END_HOUR = 24; // midnight
// Responsive hour height: on mobile, fit 13hrs into ~600px so full day is visible at default zoom
const HOUR_HEIGHT = typeof window !== "undefined" && window.innerWidth < 700 ? 48 : 64;
const TOTAL_HEIGHT = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * HOUR_HEIGHT;

function pacificClockMinutes(value: string): number | null {
  const ms = parsePacificDateTime(value);
  if (ms == null) return null;
  const parts: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }
  const hour = Number(parts.hour === "24" ? "0" : parts.hour);
  return hour * 60 + Number(parts.minute);
}

function eventPosition(event: EventListing): { top: number; height: number } | null {
  const startMin = pacificClockMinutes(event.dateStart);
  let endMin = pacificClockMinutes(event.dateEnd);
  if (startMin == null) return null;
  if (endMin == null || endMin <= startMin) endMin = startMin + 60;

  const rangeStart = SCHEDULE_START_HOUR * 60;
  const rangeEnd = SCHEDULE_END_HOUR * 60;
  const clampedStart = Math.max(startMin, rangeStart);
  const clampedEnd = Math.min(endMin, rangeEnd);
  if (clampedEnd <= clampedStart) return null;

  const top = ((clampedStart - rangeStart) / 60) * HOUR_HEIGHT;
  const height = Math.max(((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT, 36);
  return { top, height };
}

function computeDayLayout(events: EventListing[]): Map<string | number, { col: number; totalCols: number }> {
  const result = new Map<string | number, { col: number; totalCols: number }>();
  if (events.length === 0) return result;
  const key = (e: EventListing) => e.listingInstanceKey ?? e.id;
  const startOf = (e: EventListing) => pacificClockMinutes(e.dateStart) ?? 0;
  const endOf = (e: EventListing) => { const s = startOf(e); const end = pacificClockMinutes(e.dateEnd); return end == null || end <= s ? s + 60 : end; };
  const sorted = [...events].sort((a, b) => startOf(a) - startOf(b));
  const colEnds: number[] = [];
  const colAssign = new Map<string | number, number>();
  for (const ev of sorted) {
    const s = startOf(ev); const e = endOf(ev);
    let col = colEnds.findIndex(t => t <= s);
    if (col === -1) { col = colEnds.length; colEnds.push(e); } else colEnds[col] = e;
    colAssign.set(key(ev), col);
  }
  for (const ev of sorted) {
    const s = startOf(ev); const e = endOf(ev);
    const concurrent = sorted.filter(o => startOf(o) < e && endOf(o) > s);
    const maxCol = Math.max(...concurrent.map(o => colAssign.get(key(o)) ?? 0));
    result.set(key(ev), { col: colAssign.get(key(ev))!, totalCols: maxCol + 1 });
  }
  return result;
}

function formatHourLabel(hour: number): string {
  const normalized = hour % 24;
  const h12 = normalized % 12 === 0 ? 12 : normalized % 12;
  const suffix = normalized < 12 ? "AM" : "PM";
  return `${h12} ${suffix}`;
}

const TIME_LABELS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, i) => formatHourLabel(SCHEDULE_START_HOUR + i),
);

export default function Schedule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [myScheduleOnly, setMyScheduleOnly] = useState(true);
  const [exporting, setExporting] = useState(false);

  usePageSeo("Schedule — Portland Pride 2026 | PDX Pride Guide", "Your full 4-day Pride Weekend schedule, side by side.");

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  useAttendanceSummariesLive();

  const { data: attendanceSummaries = {} } = useQuery<Record<string, AttendanceSummary>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
  });

  const { data: myCheckIns = [] } = useQuery<{ eventId: number }[]>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => apiRequest("GET", "/api/events/mine/check-ins").then(r => r.json()),
    enabled: !!user,
  });

  const myEventIds = useMemo(() => new Set(myCheckIns.map(c => c.eventId)), [myCheckIns]);

  const visibleEvents = useMemo(() => {
    if (!myScheduleOnly) return events;
    return events.filter(e => myEventIds.has(e.id));
  }, [events, myScheduleOnly, myEventIds]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, EventListing[]> = { THU: [], FRI: [], SAT: [], SUN: [] };
    for (const e of visibleEvents) {
      const bucket = e.dayOfWeek ? map[e.dayOfWeek] : undefined;
      if (bucket) bucket.push(e);
    }
    return map;
  }, [visibleEvents]);

  const handleEventClick = (event: EventListing) => {
    setLocation(eventPath(event.id, event.title, event.dayOfWeek));
  };

  const handleExport = async () => {
    if (!myScheduleOnly) {
      toast({ title: "Switch to My Schedule", description: "Export uses your RSVP'd events — toggle My Schedule on first.", variant: "destructive" });
      return;
    }
    if (visibleEvents.length === 0) {
      toast({ title: "Nothing to export yet", description: "RSVP to a few events first, then export your schedule.", variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      await exportScheduleToStories(visibleEvents);
      toast({ title: "Schedule exported!", description: "Check your downloads for the Stories-ready image." });
    } catch {
      toast({ title: "Export failed", description: "Something went wrong generating the image.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1 className="schedule-header__title">SCHEDULE</h1>
        <div className="schedule-header__controls">
          <div className="schedule-toggle" role="group" aria-label="Schedule filter">
            <button
              type="button"
              className={`schedule-toggle__btn${myScheduleOnly ? " active" : ""}`}
              onClick={() => setMyScheduleOnly(true)}
              data-testid="schedule-toggle-mine"
            >
              MY SCHEDULE
            </button>
            <button
              type="button"
              className={`schedule-toggle__btn${!myScheduleOnly ? " active" : ""}`}
              onClick={() => setMyScheduleOnly(false)}
              data-testid="schedule-toggle-all"
            >
              ALL EVENTS
            </button>
          </div>
          <button
            type="button"
            className="schedule-export-btn"
            onClick={handleExport}
            disabled={exporting}
            data-testid="schedule-export-btn"
          >
            <Download size={16} />
            {exporting ? "EXPORTING…" : "EXPORT TO INSTAGRAM STORIES"}
          </button>
        </div>
      </div>

      {myScheduleOnly && !user && (
        <div className="schedule-empty-banner">
          Sign in and RSVP "I'll be there" to events to build your schedule.
        </div>
      )}
      {myScheduleOnly && user && visibleEvents.length === 0 && (
        <div className="schedule-empty-banner">
          You haven't RSVP'd to anything yet. Switch to "All Events" to browse and tap "I'll be there" on what you want to catch.
        </div>
      )}

      <div className="schedule-grid">
        <div className="schedule-time-axis" style={{ height: TOTAL_HEIGHT }}>
          {TIME_LABELS.map((label, i) => (
            <div key={i} className="schedule-time-axis__label" style={{ top: i * HOUR_HEIGHT }}>{label}</div>
          ))}
        </div>
        {DAYS.map(day => {
          const dayEvents = eventsByDay[day.key];
          const layout = computeDayLayout(dayEvents);
          return (
            <div key={day.key} className="schedule-day-col">
              <div className="schedule-day-col__header" style={{ borderColor: day.color }}>
                <div className="schedule-day-col__label">{day.label}</div>
                <div className="schedule-day-col__date">{day.date}</div>
              </div>
              <div className="schedule-day-col__body" style={{ height: TOTAL_HEIGHT }}>
                {TIME_LABELS.map((_, i) => (
                  <div key={i} className="schedule-day-col__hour-line" style={{ top: i * HOUR_HEIGHT }} />
                ))}
                {dayEvents.map((event, idx) => {
                  const pos = eventPosition(event);
                  if (!pos) return null;
                  const lk = event.listingInstanceKey ?? event.id;
                  const { col, totalCols } = layout.get(lk) ?? { col: 0, totalCols: 1 };
                  return (
                    <ScheduleEventCard
                      key={event.listingInstanceKey || event.id}
                      event={event}
                      attendanceSummary={attendanceSummaries[event.id] ?? attendanceSummaries[String(event.id)]}
                      accentColor={ACCENT_CYCLE[idx % ACCENT_CYCLE.length]}
                      top={pos.top}
                      height={pos.height}
                      col={col}
                      totalCols={totalCols}
                      onClick={() => handleEventClick(event)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
