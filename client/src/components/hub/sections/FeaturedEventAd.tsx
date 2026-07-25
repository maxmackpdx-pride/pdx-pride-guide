import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { DAY_TEXT_COLORS } from "@shared/eventWeek";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scrollLock";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import EventModal from "@/components/EventModal";
import type { Event } from "@shared/schema";
import "./FeaturedEventAd.css";

/** Loops under the Stank secret story until the overlay closes. */
const STANK_EGG_AUDIO = "/easter-eggs/stank-secret-story.m4a";

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

  // Scroll lock + Escape to close (iOS-safe lock — overflow:hidden detaches the
  // fixed bottom nav on iOS Safari)
  useEffect(() => {
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockBodyScroll();
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
      {/* Close - top LEFT */}
      <div
        style={{
          position: "fixed",
          top: "max(12px, env(safe-area-inset-top))",
          left: "max(12px, env(safe-area-inset-left))",
          zIndex: 10001,
        }}
      >
        <button
          type="button"
          aria-label="Close secret story"
          onClick={onClose}
          style={{ ...chromeBtn, fontSize: 22 }}
        >
          ✕
        </button>
      </div>

      {/* Mute - stays top RIGHT */}
      <div
        style={{
          position: "fixed",
          top: "max(12px, env(safe-area-inset-top))",
          right: "max(12px, env(safe-area-inset-right))",
          zIndex: 10001,
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

  const eggKeys = (e: ReactKeyboardEvent) => {
    if (!easterEggUrl) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEgg();
    }
  };

  return (
    <div
      className="featured-event-ad pdx-glass-rebind"
      style={{ ["--fea-accent" as string]: accent, ["--c" as string]: accent } as CSSProperties}
    >
      <span className="pdx-glass-sheen" aria-hidden="true" />
      <span className="pdx-glass-sheen--specular" aria-hidden="true" />

      <button
        type="button"
        className="featured-event-ad__dismiss"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        ✕
      </button>

      {/* Easter egg hit zone = slideshow + countdown ONLY. Tickets/RSVP stay outside. */}
      <div className="featured-event-ad__egg-zone">
        {frames.length > 0 && (
          <div
            className="featured-event-ad__media"
            role={easterEggUrl ? "button" : undefined}
            tabIndex={easterEggUrl ? 0 : undefined}
            aria-label={easterEggUrl ? "Open secret story" : undefined}
            onClick={easterEggUrl ? openEgg : undefined}
            onKeyDown={eggKeys}
            style={{ cursor: easterEggUrl ? "pointer" : "default" }}
          >
            <span className="featured-event-ad__scan" aria-hidden="true" />
            {frames.map((f, i) => (
              <img
                key={f.src}
                src={f.src}
                alt={i === 0 ? event.title : ""}
                draggable={false}
                className={`featured-event-ad__slide${i === frame ? " is-active" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Row 1 - countdown (cyan) */}
        <div
          className="featured-event-ad__row featured-event-ad__row--countdown"
          role={easterEggUrl ? "button" : undefined}
          tabIndex={easterEggUrl ? 0 : undefined}
          aria-label={easterEggUrl ? "Open secret story" : undefined}
          onClick={easterEggUrl ? openEgg : undefined}
          onKeyDown={eggKeys}
          style={{ cursor: easterEggUrl ? "pointer" : "default" }}
        >
          <div className="featured-event-ad__row-label featured-event-ad__row-label--lg featured-event-ad__row-label--cyan">
            {cd.done
              ? "Live now"
              : `${cd.days > 0 ? `${cd.days}d ` : ""}${pad(cd.hours)}:${pad(cd.minutes)}:${pad(cd.seconds)}`}
          </div>
          <div className="featured-event-ad__row-copy">{cd.done ? "It's on" : "Kickoff in"}</div>
        </div>
      </div>

      {/* Rows 2–3 - tickets (green) + RSVP (orange); outside egg zone */}
      <div className="featured-event-ad__actions">
        {event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="featured-event-ad__row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="featured-event-ad__row-label featured-event-ad__row-label--green">Buy tickets</div>
            <div className="featured-event-ad__row-copy">Available now</div>
          </a>
        )}

        <button
          type="button"
          className="featured-event-ad__row"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <div className="featured-event-ad__row-label featured-event-ad__row-label--orange">RSVP</div>
          <div className="featured-event-ad__row-copy">Secure your spot</div>
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
