import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import type { EventListing } from "@shared/multiDayEvents";
import { DAYS, hexA, fmtClock } from "@shared/prideWeek";
import { apiRequest } from "@/lib/queryClient";
import {
  buildScheduleEvents,
  isLiveNow,
  upcomingScheduleEvents,
  type ScheduleEvent,
} from "@/lib/scheduleEvents";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { useTheme } from "@/context/ThemeContext";
import FlyerRailCard from "@/components/FlyerRailCard";
import EventModal from "@/components/EventModal";
import AuthModal from "@/components/AuthModal";
import "./HomeSchedule.css";

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
  const time = `${parts.hour}:${parts.minute}${(parts.dayPeriod || "").toLowerCase()}`;
  return `${(parts.weekday || "").toUpperCase()} · ${time}`;
}

/**
 * Homepage schedule block: an "Up Next" marquee of the next ten events you
 * can still catch, scrolling right to left (pause on hover), plus the whole
 * week broken out night by night as compact poster chips.
 */
export default function HomeSchedule() {
  const { calmMode: calm } = useTheme();
  const { myEventIds, toggleRsvp, showAuth, setShowAuth } = useEventRsvp();
  const [selected, setSelected] = useState<EventListing | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useAttendanceSummariesLive();

  const { data: listings = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
  });

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(listings, attendanceSummaries),
    [listings, attendanceSummaries],
  );

  const upNext = useMemo(
    () => upcomingScheduleEvents(scheduleEvents, nowMs, 10),
    [scheduleEvents, nowMs],
  );

  const byDay = useMemo(
    () =>
      DAYS.map(d => ({
        day: d,
        items: scheduleEvents
          .filter(e => e.day === d.key)
          .sort((a, b) => a.s - b.s || a.e - b.e),
      })),
    [scheduleEvents],
  );

  const openEvent = (e: ScheduleEvent) => {
    const listing = listings.find(l => (l.listingInstanceKey ?? String(l.id)) === e.scheduleKey);
    if (listing) setSelected(listing);
  };

  // A -50% loop only reads as an infinite band when one copy of the track
  // fills the row: 6 cards ≈ 1198px vs the ~1128px content width.
  const animate = !calm && upNext.length >= 6;
  const marqueeCards = animate ? [...upNext, ...upNext] : upNext;

  return (
    <div className="home-schedule">
      {upNext.length > 0 && (
        <>
          <div className="home-schedule__rail-head">
            <span className="home-schedule__live-dot" aria-hidden />
            <span style={{ fontFamily: FD, fontWeight: 900, fontSize: 20, color: "#fff", textTransform: "uppercase", letterSpacing: ".03em" }}>
              Up Next
            </span>
            <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: "#9a9791", letterSpacing: ".02em", whiteSpace: "nowrap" }}>
              Next {upNext.length} · {nowLabel(nowMs)}
            </span>
            <span aria-hidden style={{ height: 2, flex: 1, background: "linear-gradient(to right, #FF00CC, transparent)" }} />
          </div>
          <div className={`home-schedule__marquee${animate ? " home-schedule__marquee--auto" : ""}`}>
            <div className="home-schedule__track">
              {marqueeCards.map((e, i) => (
                <FlyerRailCard
                  key={`mq${i}_${e.scheduleKey}`}
                  event={e}
                  live={isLiveNow(e, nowMs)}
                  rsvped={myEventIds.has(e.id)}
                  size="marquee"
                  onOpen={openEvent}
                  onToggleRsvp={toggleRsvp}
                />
              ))}
            </div>
          </div>
          <div className="home-schedule__seam" aria-hidden />
        </>
      )}

      <div
        style={{
          fontFamily: FD,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: ".13em",
          color: calm ? "#c8c8cc" : "#00FFFF",
          textTransform: "uppercase",
          margin: "16px 0 2px",
        }}
      >
        Night by Night
      </div>
      <div className="home-schedule__days">
        {byDay.map(({ day, items }) => {
          const dc = calm ? "#7d7d82" : day.color;
          const dt = calm ? "#c8c8cc" : day.text;
          return (
            <div key={day.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  paddingBottom: 7,
                  marginBottom: 9,
                  borderBottom: `2px solid ${hexA(dc, 0.5)}`,
                }}
              >
                <span style={{ fontFamily: FD, fontWeight: 900, fontSize: 15, letterSpacing: ".05em", color: dt, textTransform: "uppercase", lineHeight: 1 }}>
                  {day.short}
                </span>
                <span style={{ fontFamily: FB, fontWeight: 600, fontSize: 10, color: "rgba(230,227,218,.5)" }}>
                  {day.date}
                </span>
                <span style={{ marginLeft: "auto", fontFamily: FD, fontWeight: 700, fontSize: 10, letterSpacing: ".07em", color: dt, textTransform: "uppercase" }}>
                  {items.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.length === 0 && (
                  <span style={{ fontFamily: FB, fontSize: 11.5, color: "rgba(230,227,218,.4)" }}>
                    Nothing listed yet
                  </span>
                )}
                {items.map(e => {
                  const on = myEventIds.has(e.id);
                  return (
                    <div
                      key={e.scheduleKey}
                      className="home-schedule__chip"
                      role="button"
                      tabIndex={0}
                      onClick={() => openEvent(e)}
                      onKeyDown={ev => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          openEvent(e);
                        }
                      }}
                      style={{
                        display: "flex",
                        gap: 9,
                        alignItems: "stretch",
                        padding: 6,
                        borderRadius: 7,
                        cursor: "pointer",
                        border: `1px solid ${hexA(dc, on ? 0.55 : 0.14)}`,
                        background: on ? hexA(dc, 0.09) : "rgba(255,255,255,.02)",
                      }}
                    >
                      <div
                        aria-hidden
                        style={{
                          width: 42,
                          height: 54,
                          flex: "none",
                          borderRadius: 4,
                          overflow: "hidden",
                          borderLeft: `3px solid ${dc}`,
                          backgroundColor: "#0b0b0e",
                          backgroundImage: `url(${e.posterUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                        <span style={{ fontFamily: FB, fontWeight: 600, fontSize: 10.5, letterSpacing: ".02em", color: dt }}>
                          {fmtClock(e.s)}
                        </span>
                        <span
                          style={{
                            fontFamily: FD,
                            fontWeight: 700,
                            fontSize: 12.5,
                            lineHeight: 1.05,
                            color: "#fff",
                            textTransform: "uppercase",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {e.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="home-schedule__chip-heart"
                        aria-pressed={on}
                        aria-label={on ? "Remove from my schedule" : "Add to my schedule"}
                        onClick={ev => {
                          ev.stopPropagation();
                          toggleRsvp(e.id);
                        }}
                        style={{
                          flex: "none",
                          alignSelf: "center",
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          border: `1.5px solid ${hexA(dc, on ? 1 : 0.6)}`,
                          background: on ? dc : "rgba(0,0,0,.5)",
                          color: on ? "#000" : dt,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          lineHeight: 1,
                          padding: 0,
                          boxShadow: on && !calm ? `0 0 12px -2px ${hexA(dc, 0.85)}` : "none",
                        }}
                      >
                        {on ? "♥" : "♡"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selected &&
        createPortal(
          <EventModal event={selected} onClose={() => setSelected(null)} onEventUpdated={updated => setSelected(updated)} />,
          document.body,
        )}
      {showAuth && createPortal(<AuthModal onClose={() => setShowAuth(false)} />, document.body)}
    </div>
  );
}
