import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import AuthModal from "@/components/AuthModal";
import HomeFlight from "@/components/home/HomeFlight";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import HomeWorldCard from "@/components/home/HomeWorldCard";
import { WorldFanCarousel } from "@/components/home/WorldFanCarousel";
import { HandwritingText } from "@/components/ui/handwriting-text";
import { WORLDS } from "@/lib/homeWorlds";
import {
  useHomeStageSamples,
  type HomeStageBoardKey,
  type HomeStageCardData,
  type HomeStageSamples,
} from "@/lib/homeStageSamples";
import "./HomeStage.css";

export type { HomeStageBoardKey, HomeStageCardData, HomeStageSamples };
export { useHomeStageSamples, HomeStageCard };

const WORDMARK = "/brand/family/zaylist-primary.svg";
const HOME_TRACK = "/audio/fuck-meta-remastered.m4a";
const IDENTITY_LINES = [
  "Find your people",
  "Share what matters",
  "Show up together",
  "You are not a product",
  "Fuck Meta",
  "Connection over content",
] as const;

type Props = {
  afterWelcome?: ReactNode;
};

export default function HomeStage({ afterWelcome }: Props) {
  const { calmMode } = useTheme();
  const { user } = useAuth();
  const logoRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [logoReady, setLogoReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(0);
  const [identityLine, setIdentityLine] = useState(0);
  const [stillIdentity, setStillIdentity] = useState(() => calmMode || prefersStillMotion());
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.7;

    let armed = true;
    const start = () => {
      if (!armed || !audio.paused) return;
      void audio.play().then(() => { armed = false; }).catch(() => {});
    };
    const startFromInteraction = (event: Event) => {
      if ((event.target as Element | null)?.closest?.(".home-front__music")) return;
      start();
    };

    start();
    window.addEventListener("pointerdown", startFromInteraction, { capture: true });
    window.addEventListener("keydown", startFromInteraction, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", startFromInteraction, { capture: true });
      window.removeEventListener("keydown", startFromInteraction, { capture: true });
      audio.pause();
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play().catch(() => {});
    else audio.pause();
  };

  const seekMusic = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = value * audio.duration;
  };

  const toggleMusicMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMusicMuted(audio.muted);
  };

  useEffect(() => {
    let cancelled = false, firstPaint = 0, secondPaint = 0;
    const afterLogo = () => {
      if (cancelled) return;
      firstPaint = requestAnimationFrame(() => {
        secondPaint = requestAnimationFrame(() => { if (!cancelled) setLogoReady(true); });
      });
    };
    // Give the real wordmark a paint before starting the map engine or poster download.
    void logoRef.current?.decode().then(afterLogo, afterLogo);
    return () => { cancelled = true; cancelAnimationFrame(firstPaint); cancelAnimationFrame(secondPaint); };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStillIdentity(calmMode || prefersStillMotion());
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, [calmMode]);

  useEffect(() => {
    if (stillIdentity) {
      setIdentityLine(0);
      return;
    }
    const timer = window.setTimeout(() => setIdentityLine(line => (line + 1) % IDENTITY_LINES.length), 4000);
    return () => window.clearTimeout(timer);
  }, [stillIdentity, identityLine]);

  return (
    <div className="home-front" id="top">
      <section className="home-front__welcome" aria-labelledby="home-front-title">
        <HomeFlight enabled={logoReady} paused={showAuth} />
        <div className="home-front__backdrop-dim" aria-hidden="true" />
        <div className="home-front__hero">
          <div className="home-front__brand-group">
            <h1 id="home-front-title" className="sr-only">Zaylist</h1>
            <div className="home-front__mark">
              <div className="home-front__mark-art">
                <img
                  ref={logoRef}
                  className="home-front__mark-core"
                  src={WORDMARK}
                  alt="Zaylist"
                  width="2393"
                  height="824"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              </div>
            </div>
            <div className="home-front__welcome-copy">
              <p className="home-front__identity-line">
                <span key={identityLine} className="home-front__identity-cycle" data-still={stillIdentity}>
                  <HandwritingText
                    text={IDENTITY_LINES[identityLine]}
                    animate={!stillIdentity}
                    className="home-front__identity-script"
                    height="1.35em"
                  />
                </span>
              </p>
              <div className="home-front__hero-actions">
                {user ? (
                  <Link href="/dashboard" className="pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind home-front__auth">Open your Hub</Link>
                ) : (
                  <button type="button" className="pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind home-front__auth" onClick={() => setShowAuth(true)} aria-haspopup="dialog">
                    Log in / Sign up
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="home-front__music" aria-label="Fuck Meta music player">
          <audio
            ref={audioRef}
            src={HOME_TRACK}
            preload="auto"
            autoPlay
            onPlay={() => setMusicPlaying(true)}
            onPause={() => setMusicPlaying(false)}
            onEnded={() => setMusicPlaying(false)}
            onTimeUpdate={event => {
              const audio = event.currentTarget;
              setMusicProgress(audio.duration ? audio.currentTime / audio.duration : 0);
            }}
          />
          <button type="button" onClick={() => void toggleMusic()} aria-label={musicPlaying ? "Pause Fuck Meta" : "Play Fuck Meta"}>
            {musicPlaying ? "Ⅱ" : "▶"}
          </button>
          <div className="home-front__music-track">
            <span>Fuck Meta</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={musicProgress}
              aria-label="Track position"
              onChange={event => seekMusic(Number(event.currentTarget.value))}
              style={{ "--music-progress": `${musicProgress * 100}%` } as CSSProperties}
            />
          </div>
          <button type="button" onClick={toggleMusicMute} aria-label={musicMuted ? "Unmute music" : "Mute music"}>
            {musicMuted ? "×" : "♪"}
          </button>
        </div>
        {afterWelcome}
      </section>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <section className="home-front__worlds" id="home-worlds" aria-labelledby="home-worlds-title">
        <span className="home-front__worlds-fx" aria-hidden="true">
          <i className="home-front__worlds-orb home-front__worlds-orb--a" />
          <i className="home-front__worlds-orb home-front__worlds-orb--b" />
          <i className="home-front__worlds-orb home-front__worlds-orb--c" />
          <span className="home-front__worlds-grid" />
        </span>
        <header className="home-front__worlds-head">
          <h2 id="home-worlds-title">
            <span>You&apos;re</span>
            {" "}not<br />looking for{" "}
            <span className="home-front__content-word">
              <span className="home-front__content-word-core">Content</span>
              <span className="home-front__content-word-a" aria-hidden="true">Content</span>
              <span className="home-front__content-word-b" aria-hidden="true">Content</span>
            </span>
            .
          </h2>
          <p>Queer Portland, connected. Find your night out, your next escape, and your people. Pick a place to start; it’s all part of Zaylist.</p>
        </header>
        <WorldFanCarousel
          total={WORLDS.length}
          selected={selectedWorld}
          onSelect={setSelectedWorld}
          className="home-front__deck"
          label="You&apos;re not looking for content."
          autoplayMs={5600}
          labelOf={index => WORLDS[index].title}
          accentOf={index => WORLDS[index].accent}
        >
          {WORLDS.map((world, index) => {
            /*
             * Only the front card and its two neighbours run their own motion.
             * Ten slides all rotating flyers and marquees at once is the thing
             * that made this rail stutter.
             */
            const dist = Math.min(
              Math.abs(index - selectedWorld),
              WORLDS.length - Math.abs(index - selectedWorld),
            );
            return (
              <HomeWorldCard
                key={world.key}
                world={world}
                hot={dist <= 1}
              />
            );
          })}
        </WorldFanCarousel>
      </section>
    </div>
  );
}
