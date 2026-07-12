import { useEffect, useState } from "react";
import { DAY_TEXT_COLORS } from "@shared/prideWeek";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import EventModal from "@/components/EventModal";
import type { Event } from "@shared/schema";

const CYAN = "#19E3FF";
const GREEN = "#5CE600";
const ORANGE = "#FF8C00";
const glow = (c: string): React.CSSProperties => ({ textShadow: `0 0 16px ${c}80` });

function eventStartMs(dateStart: string): number {
  // Event date strings are Pacific-local and naive; Pride week is PDT (-07:00).
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(dateStart) ? dateStart : `${dateStart}-07:00`;
  return new Date(iso).getTime();
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  return {
    done: diff <= 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

type Props = {
  event: Event;
  onDismiss: () => void;
};

export default function FeaturedEventAd({ event, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  const day = event.dayOfWeek || "";
  const accent = DAY_TEXT_COLORS[day as keyof typeof DAY_TEXT_COLORS] || "#19E3FF";
  const poster = resolveEventPosterUrl(event.id, event.posterImageUrl);
  const cd = useCountdown(eventStartMs(event.dateStart));

  const rowLabel: React.CSSProperties = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: 24,
    letterSpacing: ".01em",
    textTransform: "uppercase",
    lineHeight: 1,
  };
  const rowCopy: React.CSSProperties = {
    marginTop: 6,
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "var(--board-muted)",
  };
  const rowBase: React.CSSProperties = {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "15px 18px",
    background: "transparent",
    border: "none",
    borderTop: "1px solid var(--panel-border-2)",
    cursor: "pointer",
    textDecoration: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        border: `2px solid ${accent}`,
        boxShadow: `0 0 40px -14px ${accent}`,
        background: "#0d0d0d",
      }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 3,
          width: 28,
          height: 28,
          borderRadius: 999,
          border: "none",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontSize: 15,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {poster && (
        // Full-width, top-anchored: never crop left/right; crop the bottom.
        <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden" }}>
          <img
            src={poster}
            alt={event.title}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          />
        </div>
      )}

      {/* Countdown */}
      <div style={{ padding: "16px 18px 14px" }}>
        <div style={{ ...rowLabel, color: CYAN, fontSize: 30, ...glow(CYAN) }}>
          {cd.done
            ? "Live now"
            : `${cd.days > 0 ? `${cd.days}d ` : ""}${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`}
        </div>
        <div style={rowCopy}>{cd.done ? "It's on" : "Kickoff in"}</div>
      </div>

      {event.ticketUrl && (
        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" style={rowBase}>
          <div style={{ ...rowLabel, color: GREEN, ...glow(GREEN) }}>Buy tickets</div>
          <div style={rowCopy}>Available now</div>
        </a>
      )}

      <button type="button" onClick={() => setOpen(true)} style={rowBase}>
        <div style={{ ...rowLabel, color: ORANGE, ...glow(ORANGE) }}>RSVP</div>
        <div style={rowCopy}>Secure your spot</div>
      </button>

      {open && <EventModal event={event} onClose={() => setOpen(false)} />}
    </div>
  );
}
