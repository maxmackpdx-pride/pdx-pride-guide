import type { CSSProperties, MouseEvent } from "react";
import { DAYS, hexA, fmtClock } from "@shared/prideWeek";
import { useTheme } from "@/context/ThemeContext";
import type { ScheduleEvent } from "@/lib/scheduleEvents";
import "./FlyerRailCard.css";

const SIZES = {
  marquee: { width: 188, height: 248 },
  rail: { width: 230, height: 298 },
} as const;

const FD = "var(--font-display)";
const FB = "var(--font-body)";

type Props = {
  event: ScheduleEvent;
  live: boolean;
  rsvped: boolean;
  size: keyof typeof SIZES;
  onOpen: (event: ScheduleEvent) => void;
  onToggleRsvp: (eventId: number) => void;
};

/**
 * Full-bleed flyer poster card for horizontal rails (home marquee, events
 * "right now" panel). Keeps the flyer rule: poster background, day-color
 * left rail, dark scrim, RSVP heart.
 */
export default function FlyerRailCard({ event, live, rsvped, size, onOpen, onToggleRsvp }: Props) {
  const { calmMode: calm } = useTheme();
  const day = DAYS.find(d => d.key === event.day) ?? DAYS[0];
  const dc = calm ? "#7d7d82" : day.color;
  const dt = calm ? "#c8c8cc" : day.text;
  const dims = SIZES[size];

  const glow = calm
    ? rsvped
      ? `0 0 0 1px ${hexA(dc, 0.6)}`
      : "0 6px 20px -10px rgba(0,0,0,.9)"
    : rsvped
      ? `0 0 22px -3px ${hexA(dc, 0.85)}`
      : event.feat
        ? `0 0 22px -7px ${hexA(dc, 0.6)}`
        : "0 6px 20px -10px rgba(0,0,0,.9)";

  const wrapStyle: CSSProperties = {
    position: "relative",
    flex: "none",
    width: dims.width,
    height: dims.height,
    borderRadius: 9,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    scrollSnapAlign: "start",
    border: `1px solid ${hexA(dc, rsvped ? 0.85 : 0.28)}`,
    borderLeft: `4px solid ${dc}`,
    boxShadow: glow,
    backgroundColor: "#0b0b0e",
    backgroundImage: `url(${event.posterUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
  };

  const chipBase: CSSProperties = {
    fontFamily: FD,
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: ".06em",
    color: "#000",
    padding: "3px 7px 2px",
    borderRadius: 3,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  const heartStyle: CSSProperties = {
    position: "absolute",
    top: 9,
    right: 9,
    zIndex: 5,
    width: 30,
    height: 30,
    borderRadius: 7,
    border: `1.5px solid ${hexA(dc, rsvped ? 1 : 0.6)}`,
    background: rsvped ? dc : "rgba(0,0,0,.5)",
    color: rsvped ? "#000" : dt,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    lineHeight: 1,
    padding: 0,
    boxShadow: rsvped && !calm ? `0 0 12px -2px ${hexA(dc, 0.85)}` : "none",
  };

  const onHeart = (ev: MouseEvent) => {
    ev.stopPropagation();
    onToggleRsvp(event.id);
  };

  return (
    <div
      className="flyer-rail-card"
      style={wrapStyle}
      onClick={() => onOpen(event)}
      role="button"
      tabIndex={0}
      onKeyDown={ev => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onOpen(event);
        }
      }}
      aria-label={`${event.title}, ${day.label} ${fmtClock(event.s)} at ${event.venue}`}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(11,11,14,.95) 0%, rgba(11,11,14,.42) 52%, rgba(11,11,14,.02) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {event.feat && !live && (
        <div
          style={{
            ...chipBase,
            position: "absolute",
            top: 9,
            left: 9,
            zIndex: 4,
            letterSpacing: ".09em",
            background: dc,
            padding: "4px 8px 3px",
            boxShadow: calm ? "none" : `0 0 14px -2px ${hexA(dc, 0.85)}`,
          }}
        >
          ★ HEADLINER
        </div>
      )}
      <button
        type="button"
        className="flyer-rail-card__heart"
        style={heartStyle}
        onClick={onHeart}
        aria-pressed={rsvped}
        aria-label={rsvped ? "Remove from my schedule" : "Add to my schedule"}
      >
        {rsvped ? "♥" : "♡"}
      </button>
      <div style={{ position: "relative", zIndex: 2, padding: "14px 15px 15px" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
          {live ? (
            <span style={{ ...chipBase, padding: "3px 8px 2px", background: calm ? "#c8c8cc" : "#FF00CC" }}>
              ● LIVE NOW
            </span>
          ) : (
            <span style={{ ...chipBase, background: dc }}>
              {day.short} · {day.date}
            </span>
          )}
          <span
            style={{
              fontFamily: FB,
              fontWeight: 700,
              fontSize: 10.5,
              color: "#fff",
              background: "rgba(0,0,0,.5)",
              padding: "3px 7px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {fmtClock(event.s)}
          </span>
        </div>
        <div
          style={{
            fontFamily: FD,
            fontWeight: 800,
            fontSize: 17,
            lineHeight: 1.04,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: ".01em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 2px 10px rgba(0,0,0,.9)",
          }}
        >
          {event.title}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontSize: 11.5,
            color: "rgba(230,227,218,.75)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.venue}
        </div>
        <div
          style={{
            fontFamily: FB,
            fontSize: 10.5,
            fontWeight: 600,
            color: "rgba(255,255,255,.6)",
            marginTop: 6,
          }}
        >
          ♥ {event.going} going
        </div>
      </div>
    </div>
  );
}
