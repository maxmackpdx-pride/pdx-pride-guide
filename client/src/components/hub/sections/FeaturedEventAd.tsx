import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DAY_TEXT_COLORS } from "@shared/prideWeek";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import EventModal from "@/components/EventModal";
import type { Event } from "@shared/schema";

const CYAN = "#19E3FF";
const GREEN = "#5CE600";
const ORANGE = "#FF8C00";
/** Loops under the Stank secret story until the overlay closes. */
const STANK_EGG_AUDIO = "/easter-eggs/stank-secret-story.m4a";
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
  audioSrc = STANK_EGG_AUDIO,
}: {
  src: string;
  title: string;
  onClose: () => void;
  audioSrc?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  // Scroll lock + Escape to close
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

  // Audio: try autoplay (open was a user gesture), loop, hard-stop on unmount/close
  useEffect(() => {
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.85;
    audioRef.current = audio;

    const tryPlay = () => {
      void audio.play().then(
        () => setNeedsTap(false),
        () => setNeedsTap(true),
      );
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [audioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    if (!muted && needsTap) {
      void audio.play().then(
        () => setNeedsTap(false),
        () => { /* still blocked */ },
      );
    }
  }, [muted, needsTap]);

  const unlockAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(
      () => setNeedsTap(false),
      () => { /* ignore */ },
    );
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      const audio = audioRef.current;
      if (audio) {
        audio.muted = next;
        if (!next) void audio.play().catch(() => setNeedsTap(true));
      }
      return next;
    });
  };

  if (typeof document === "undefined") return null;

  const chromeBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    border: "2px solid #5bff5b",
    background: "rgba(0,0,0,0.85)",
    color: "#5bff5b",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 0 24px rgba(91,255,91,0.35)",
    fontFamily: "var(--font-display, system-ui)",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

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
      <div
        style={{
          position: "fixed",
          top: "max(12px, env(safe-area-inset-top))",
          right: "max(12px, env(safe-area-inset-right))",
          zIndex: 10001,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {audioSrc && (
          <button
            type="button"
            aria-label={muted ? "Unmute secret story audio" : "Mute secret story audio"}
            onClick={toggleMute}
            style={chromeBtn}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        )}
        <button
          type="button"
          aria-label="Close secret story"
          onClick={onClose}
          style={{ ...chromeBtn, fontSize: 22 }}
        >
          ✕
        </button>
      </div>

      {needsTap && audioSrc && (
        <button
          type="button"
          onClick={unlockAudio}
          style={{
            position: "fixed",
            left: "50%",
            bottom: "max(24px, env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            zIndex: 10001,
            border: "2px solid #5bff5b",
            background: "rgba(0,0,0,0.9)",
            color: "#5bff5b",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            padding: "12px 18px",
            borderRadius: 999,
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(91,255,91,0.35)",
          }}
        >
          Tap for sound
        </button>
      )}

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

      {/* Easter egg hit zone = slideshow + countdown ONLY. Tickets/RSVP stay outside. */}
      <div
        className="featured-event-ad__egg-zone"
        style={{ position: "relative", zIndex: 1 }}
      >
        {frames.length > 0 && (
          // Full-width, top-anchored slideshow: never crop left/right; crop the bottom.
          <div
            role={easterEggUrl ? "button" : undefined}
            tabIndex={easterEggUrl ? 0 : undefined}
            aria-label={easterEggUrl ? "Open secret story" : undefined}
            onClick={easterEggUrl ? openEgg : undefined}
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
          onClick={easterEggUrl ? openEgg : undefined}
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
      </div>

      {/* Ticket + RSVP sit outside the egg zone — always receive their own taps. */}
      <div className="featured-event-ad__actions" style={{ position: "relative", zIndex: 2 }}>
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={rowBase}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ ...rowLabel, color: GREEN, ...glow(GREEN) }}>Buy tickets</div>
            <div style={rowCopy}>Available now</div>
          </a>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          style={rowBase}
        >
          <div style={{ ...rowLabel, color: ORANGE, ...glow(ORANGE) }}>RSVP</div>
          <div style={rowCopy}>Secure your spot</div>
        </button>
      </div>

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
