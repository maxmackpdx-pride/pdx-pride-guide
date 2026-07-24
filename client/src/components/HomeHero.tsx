import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { sharePageLink } from "@/lib/shareEvent";
import heroWallpaper from "@/assets/home/hero-wallpaper.jpg";

/**
 * Letter orbs under Z-A-Y-L-I-S-T on the spectrum wordmark.
 * Colors sample the Zaylist gradient at each letter’s place in the tape.
 */
const LETTER_ORBS = [
  { letter: "Z", color: "#FF19D6", left: "16%", top: "38%" },
  { letter: "A", color: "#FF196C", left: "28%", top: "42%" },
  { letter: "Y", color: "#FFD119", left: "40%", top: "36%" },
  { letter: "L", color: "#9CFF19", left: "50%", top: "44%" },
  { letter: "I", color: "#19F7FF", left: "60%", top: "38%" },
  { letter: "S", color: "#1956FF", left: "70%", top: "42%" },
  { letter: "T", color: "#E419FF", left: "82%", top: "36%" },
] as const;

/**
 * Full-bleed home hero: ZAYLIST wallpaper, letter-matched spectrum orbs,
 * grain, kicker + CTAs. Parallax on pointer + scroll (respects reduced-motion).
 */
export default function HomeHero() {
  const { user } = useAuth();
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("calm-mode")) return;

    let raf = 0;
    let running = true;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const readScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 when panel is above, +1 below; 0 when centered
      return Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh * 0.55)));
    };

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    const onLeave = () => {
      target.x = 0;
      // keep scroll bias
      target.y = readScroll() * 0.65;
    };

    const onScroll = () => {
      const s = readScroll();
      // blend scroll into y when pointer is idle-ish
      target.y = target.y * 0.35 + s * 0.65;
    };

    const tick = () => {
      if (!running) return;
      current.x += (target.x - current.x) * 0.07;
      current.y += (target.y - current.y) * 0.07;
      el.style.setProperty("--px", current.x.toFixed(4));
      el.style.setProperty("--py", current.y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    target.y = readScroll() * 0.65;
    el.addEventListener("pointermove", onPointer, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
    };
  }, []);

  const shareSite = async () => {
    const who = (user?.displayName || user?.username || "").trim();
    const title = "Zaylist";
    const text = who
      ? `${who} wants you to check out Zaylist`
      : "Check out Zaylist";
    try {
      const result = await sharePageLink("/", title, text);
      setShareState(result);
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  };

  return (
    <section
      ref={panelRef}
      className="home-hero home-hero--parallax"
      aria-label="Portland Zaylist hero"
    >
      <img
        className="home-hero__bg"
        src={heroWallpaper}
        alt=""
        decoding="async"
      />

      {/* Letter-matched spectrum orbs under Z-A-Y-L-I-S-T */}
      <div className="home-hero__aurora" aria-hidden>
        {LETTER_ORBS.map((orb, i) => (
          <span
            key={orb.letter}
            className={`home-hero__orb home-hero__orb--letter home-hero__orb--${orb.letter.toLowerCase()}`}
            style={{
              background: orb.color,
              left: orb.left,
              top: orb.top,
              // slight stagger in float phase via animation-delay
              animationDelay: `${i * -1.4}s`,
            }}
            data-letter={orb.letter}
          />
        ))}
      </div>

      {/* Film grain */}
      <div className="home-hero__grain" aria-hidden />

      {/* Mobile-only site share - top right of first panel */}
      <button
        type="button"
        className="home-hero__share"
        onClick={() => void shareSite()}
        aria-label={shareState === "copied" ? "Link copied" : "Share this site"}
        data-testid="home-hero-share"
      >
        {shareState === "copied" ? (
          <span className="home-hero__share-label">Copied</span>
        ) : shareState === "shared" ? (
          <span className="home-hero__share-label">Sent</span>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V4M12 4l-4 4M12 4l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="home-hero__share-label">Share</span>
          </>
        )}
      </button>

      <div className="home-hero__inner">
        <h1 className="sr-only">Zaylist</h1>
        <div className="home-hero__kicker">
          <span className="home-hero__dot" aria-hidden />
          Portland nights · all year
        </div>

        <div className="home-hero__cta">
          <Link href="/events" className="home-hero__btn home-hero__btn--primary" data-testid="hero-cta-events">
            View all events →
          </Link>
          <Link href="/nude-beaches" className="home-hero__btn home-hero__btn--river" data-testid="hero-cta-river">
            Headed to the river? →
          </Link>
          {user && (
            <Link href="/dashboard" className="home-hero__btn home-hero__btn--secondary" data-testid="hero-cta-account">
              Your Hub →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
