import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { sharePageLink } from "@/lib/shareEvent";
import heroLoop from "@/assets/home/hero-loop.mp4";
import heroLoopPoster from "@/assets/home/hero-loop-poster.jpg";
import heroWordmark from "@/assets/home/hero-wordmark.webp";

/**
 * Letter orbs under Z-A-Y-L-I-S-T (mid-layer glow between bg + wordmark).
 * Colors sample the Zaylist gradient at each letter’s place in the tape.
 */
const LETTER_ORBS = [
  { letter: "Z", color: "#FF19D6", left: "16%", top: "42%" },
  { letter: "A", color: "#FF196C", left: "28%", top: "46%" },
  { letter: "Y", color: "#FFD119", left: "40%", top: "40%" },
  { letter: "L", color: "#9CFF19", left: "50%", top: "48%" },
  { letter: "I", color: "#19F7FF", left: "60%", top: "42%" },
  { letter: "S", color: "#1956FF", left: "70%", top: "46%" },
  { letter: "T", color: "#E419FF", left: "82%", top: "40%" },
] as const;

/**
 * Multi-layer hero cutouts (must match Home.css z-order):
 *  z0 BG · z1 grain (behind neon) · z2 orbs (glow under type)
 *  z3 wordmark (color-faithful) · z4 kicker · z5 CTAs · z6 share
 * Scroll-only — no pointer. Respects reduced-motion / calm.
 */
export default function HomeHero() {
  const { user } = useAuth();
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");
  const panelRef = useRef<HTMLElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  // Render the video only while it can actually autoplay. In Calm / reduced-motion
  // — or when the browser blocks muted autoplay (e.g. iOS Low Power Mode) — fall
  // back to the poster still so iOS never overlays its inline "play" button.
  const [showVideo, setShowVideo] = useState(() => {
    if (typeof window === "undefined") return true;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("calm-mode");
    return !still;
  });

  useEffect(() => {
    if (!showVideo) return;
    const v = bgVideoRef.current;
    if (!v) return;
    // React's `muted` attribute doesn't always set the DOM property — force it.
    v.muted = true;
    let cancelled = false;
    const toPoster = () => {
      if (!cancelled) setShowVideo(false);
    };
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(toPoster);
    // Belt: if it still isn't playing shortly after, drop to the poster (no button).
    const t = window.setTimeout(() => {
      if (!cancelled && v.paused) toPoster();
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [showVideo]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("calm-mode")) return;

    let raf = 0;
    let running = true;
    // Scroll-only parallax (no pointer) — Y only
    let targetY = 0;
    let currentY = 0;

    const readScroll = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh * 0.55)));
    };

    const onScroll = () => {
      targetY = readScroll();
    };

    const tick = () => {
      if (!running) return;
      currentY += (targetY - currentY) * 0.05;
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", currentY.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    targetY = readScroll();
    currentY = targetY;
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
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
      className="home-hero home-hero--parallax home-hero--cutouts"
      aria-label="Portland Zaylist hero"
    >
      {/* z0 — atmosphere BG: muted looping video, or poster still if it can't play */}
      <div className="home-hero__bg-wrap" aria-hidden>
        {showVideo ? (
          <video
            ref={bgVideoRef}
            className="home-hero__bg"
            src={heroLoop}
            poster={heroLoopPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : (
          <img className="home-hero__bg" src={heroLoopPoster} alt="" decoding="async" />
        )}
      </div>

      {/* z1 — film grain (behind orbs + wordmark so it never washes neon) */}
      <div className="home-hero__grain" aria-hidden />

      {/* z2 — spectrum orbs under the wordmark */}
      <div className="home-hero__aurora" aria-hidden>
        {LETTER_ORBS.map((orb, i) => (
          <span
            key={orb.letter}
            className={`home-hero__orb home-hero__orb--letter home-hero__orb--${orb.letter.toLowerCase()}`}
            style={{
              background: orb.color,
              left: orb.left,
              top: orb.top,
              animationDelay: `${i * -1.4}s`,
            }}
            data-letter={orb.letter}
          />
        ))}
      </div>

      {/* z3 — ZAYLIST wordmark (single image; sign wrapper keeps the float bounce) */}
      <div className="home-hero__wordmark-wrap" aria-hidden>
        <div className="home-hero__wordmark-sign">
          <img className="home-hero__wordmark" src={heroWordmark} alt="" decoding="async" />
        </div>
      </div>

      {/* Mobile-only site share */}
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
      </div>

      {/* z5 — CTAs under the wordmark, almost locked */}
      <div className="home-hero__cta">
        <Link href="/events" className="home-hero__btn home-hero__btn--primary" data-testid="hero-cta-events">
          View all events →
        </Link>
        <Link href="/nude-beaches" className="home-hero__btn home-hero__btn--river" data-testid="hero-cta-river">
          Headed to the river? →
        </Link>
      </div>
    </section>
  );
}
