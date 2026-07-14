import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

const POSTER_MS = 4000;
const SLIDE_MS = 2000;

type Props = {
  event: Event;
  onDismiss: () => void;
  /** Extra images that rotate after the poster (2s each). */
  slides?: string[];
  /**
   * Optional easter-egg game URL. When set, clicking the slideshow or countdown
   * opens it full-screen (e.g. Stank Secret Story).
   */
  easterEggUrl?: string | null;
};

function EasterEggOverlay({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#050a05",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button
        type="button"
        aria-label="Close secret story"
        onClick={onClose}
        style={{
          position: "fixed",
          top: "max(12px, env(safe-area-inset-top))",
          right: "max(12px, env(safe-area-inset-right))",
          zIndex: 10001,
          width: 44,
          height: 44,
          borderRadius: 999,
          border: "2px solid #5bff5b",
          background: "rgba(0,0,0,0.85)",
          color: "#5bff5b",
          fontSize: 22,
          lineHeight: 1,
          cursor: "pointer",
          boxShadow: "0 0 24px rgba(91,255,91,0.35)",
          fontFamily: "var(--font-display, system-ui)",
          fontWeight: 800,
        }}
      >
        ✕
      </button>
      <iframe
        src={src}
        title={title}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          border: "none",
          background: "#050a05",
        }}
        allow="autoplay; fullscreen"
      />
    </div>,
    document.body,
  );
}

export default function FeaturedEventAd({
  event,
  onDismiss,
  slides = [],
  easterEggUrl = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const [eggOpen, setEggOpen] = useState(false);
  const day = event.dayOfWeek || "";
  const accent = DAY_TEXT_COLORS[day as keyof typeof DAY_TEXT_COLORS] || "#19E3FF";
  const poster = resolveEventPosterUrl(event.id, event.posterImageUrl, event.dayOfWeek);
  const cd = useCountdown(eventStartMs(event.dateStart));

  // Slideshow: poster (4s) then each extra image (2s), looping.
  const frames = useMemo(() => {
    const f: Array<{ src: string; ms: number }> = [];
    if (poster) f.push({ src: poster, ms: POSTER_MS });
    for (const s of slides) f.push({ src: s, ms: SLIDE_MS });
    return f;
  }, [poster, slides]);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frames.length <= 1) return;
    const t = window.setTimeout(
      () => setFrame((i) => (i + 1) % frames.length),
      frames[frame]?.ms ?? SLIDE_MS,
    );
    return () => window.clearTimeout(t);
  }, [frame, frames]);

  const openEgg = () => {
    if (easterEggUrl) setEggOpen(true);
  };

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
      className="featured-event-ad"
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
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
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

      {frames.length > 0 && (
        // Full-width, top-anchored slideshow: never crop left/right; crop the bottom.
        <div
          role={easterEggUrl ? "button" : undefined}
          tabIndex={easterEggUrl ? 0 : undefined}
          aria-label={easterEggUrl ? "Open secret story" : undefined}
          onClick={openEgg}
          onKeyDown={(e) => {
            if (!easterEggUrl) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openEgg();
            }
          }}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            background: "#000",
            cursor: easterEggUrl ? "pointer" : "default",
          }}
        >
          {frames.map((f, i) => (
            <img
              key={f.src}
              src={f.src}
              alt={i === 0 ? event.title : ""}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                opacity: i === frame ? 1 : 0,
                transition: "opacity .6s ease",
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      )}

      {/* Countdown — easter egg hit target when secret URL is set */}
      <div
        role={easterEggUrl ? "button" : undefined}
        tabIndex={easterEggUrl ? 0 : undefined}
        aria-label={easterEggUrl ? "Open secret story" : undefined}
        onClick={openEgg}
        onKeyDown={(e) => {
          if (!easterEggUrl) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openEgg();
          }
        }}
        style={{
          padding: "16px 18px 14px",
          cursor: easterEggUrl ? "pointer" : "default",
          userSelect: "none",
        }}
      >
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
      {eggOpen && easterEggUrl && (
        <EasterEggOverlay
          src={easterEggUrl}
          title="Stank secret story"
          onClose={() => setEggOpen(false)}
        />
      )}
    </div>
  );
}
