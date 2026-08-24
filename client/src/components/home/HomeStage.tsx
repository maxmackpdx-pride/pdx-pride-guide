import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import HomeWorldCard from "@/components/home/HomeWorldCard";
import { ZDeck, ZDeckDots } from "@/components/ZDeck";
import { WORLDS } from "@/lib/homeWorlds";
import { useHomeWorlds } from "@/lib/useHomeWorlds";
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
const HERO_VIDEO = "/home/hero-loop.mp4";

type Props = {
  afterWelcome?: ReactNode;
};

export default function HomeStage({ afterWelcome }: Props) {
  const { calmMode } = useTheme();
  const worldData = useHomeWorlds();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedWorld, setSelectedWorld] = useState(0);
  const [showVideo, setShowVideo] = useState(() => typeof window === "undefined" || !prefersStillMotion());

  useEffect(() => {
    const sync = () => setShowVideo(!prefersStillMotion());
    sync();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, [calmMode]);

  /*
   * The hero loop is 3.7MB and purely decorative, sitting behind the gradient
   * atmosphere. Two rules keep it off the critical path: never fetch it on
   * phones (CSS hides it there, but the element still downloaded it), and on
   * wider screens only mount it once the browser is idle, so it never competes
   * with first paint. Until then the hero renders its gradient, as before.
   */
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 621px)").matches) return;
    const start = () => setVideoReady(true);
    const ric = (window as any).requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(start, { timeout: 2500 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 800);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showVideo || !videoReady || !videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => setShowVideo(false));
  }, [showVideo, videoReady]);

  return (
    <div className="home-front" id="top">
      <section className="home-front__welcome" aria-labelledby="home-front-title">
        {showVideo && videoReady ? (
          <video ref={videoRef} className="home-front__video" src={HERO_VIDEO} preload="none" autoPlay muted loop playsInline aria-hidden />
        ) : null}
        <div className="home-front__atmosphere" aria-hidden />
        <div className="home-front__hero">
          <p className="home-front__kicker">
            <span className="home-front__kicker-row">
              <span className="home-front__kicker-live" aria-hidden="true" />
              <span className="home-front__kicker-line">made in Portland</span>
            </span>
            <span className="home-front__kicker-dot" aria-hidden="true">·</span>
            <span className="home-front__kicker-line">still in <em className="home-front__kicker-beta">beta</em></span>
          </p>
          <h1 id="home-front-title" className="sr-only">Zaylist</h1>
          <div className="home-front__mark">
            <div className="home-front__mark-art">
              <img className="home-front__mark-core" src={WORDMARK} alt="Zaylist" />
              <img className="home-front__mark-glitch home-front__mark-glitch--a" src={WORDMARK} alt="" aria-hidden="true" />
              <img className="home-front__mark-glitch home-front__mark-glitch--b" src={WORDMARK} alt="" aria-hidden="true" />
            </div>
          </div>
          <div className="home-front__hero-actions">
            <Link href="/z/out" className="pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-orange, #ff6600)", fontWeight: 900 }}>Open OUTZ</Link>
            <Link href="/events" className="pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" style={{ ["--c" as string]: "var(--neon-yellow, #ccff00)" }}>What&apos;s happening</Link>
          </div>
        </div>
        {afterWelcome}
      </section>

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
          <p>You&apos;re looking for the room, the ride, the person, or the thing that makes tonight feel good and tomorrow even better.</p>
        </header>
        <ZDeck
          total={WORLDS.length}
          selected={selectedWorld}
          onSelect={setSelectedWorld}
          className="home-front__deck"
          label="You&apos;re not looking for content."
          autoplayMs={5600}
          settleEase={0.08}
          fade={0.12}
          gap={0.12}
          rotate={12}
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
                rows={worldData.outzRows}
                flyers={worldData.flyers}
                panels={worldData.panels}
                postings={
                  world.key === "hauz" || world.key === "giftz" || world.key === "gigz" || world.key === "mizzed"
                    ? worldData.postings[world.key]
                    : undefined
                }
                items={worldData.items}
                pills={worldData.pills}
              />
            );
          })}
        </ZDeck>
        <ZDeckDots
          total={WORLDS.length}
          selected={selectedWorld}
          onSelect={setSelectedWorld}
          labelOf={index => WORLDS[index].title}
          accentOf={index => WORLDS[index].accent}
          className="home-front__deck-dots"
        />
      </section>
    </div>
  );
}
