import { useEffect, useState, type ReactNode } from "react";
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
  const worldData = useHomeWorlds();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState(0);
  const [identityLine, setIdentityLine] = useState(0);
  const [stillIdentity, setStillIdentity] = useState(() => calmMode || prefersStillMotion());
  const hasPreviewError = Object.values(worldData.states).some(state => state === "error");

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
        <HomeFlight paused={showAuth} onExploringChange={setExploring} />
        <div className="home-front__backdrop-dim" data-exploring={exploring} aria-hidden="true" />
        <div
          className="home-front__hero"
          data-exploring={exploring}
          aria-hidden={exploring || undefined}
          ref={element => { if (element) element.inert = exploring; }}
        >
          <div className="home-front__brand-group">
            <h1 id="home-front-title" className="sr-only">Zaylist</h1>
            <div className="home-front__mark">
              <div className="home-front__mark-art">
                <img
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
          <p>You&apos;re looking for the room, the ride, the person, or the thing that makes tonight feel good and tomorrow even better.</p>
        </header>
        {hasPreviewError ? (
          <div className="home-front__preview-error" role="alert">
            <span>Some live previews could not load. Demo cards are standing in.</span>
            <button type="button" className="pdx-glass-btn pdx-glass-btn--outline pdx-glass-rebind" onClick={worldData.retry}>
              Retry live previews
            </button>
          </div>
        ) : null}
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
                rows={worldData.outzRows}
                flyers={worldData.flyers}
                panels={worldData.panels}
                postings={
                  world.key === "hauz" || world.key === "giftz" || world.key === "gigz" || world.key === "mizzed"
                    ? worldData.postings[world.key]
                    : undefined
                }
                items={worldData.items}
                today={worldData.today}
                previewState={worldData.states[world.key]}
              />
            );
          })}
        </WorldFanCarousel>
      </section>
    </div>
  );
}
