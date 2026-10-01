import { useEffect, useRef, useState, type ReactNode } from "react";
import HomeDiscover from "@/components/home/HomeDiscover";
import HomeFlight from "@/components/home/HomeFlight";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import HomeStageCard from "@/components/home/HomeStageCard";
import TonightPanel from "@/components/home/TonightPanel";
import { HandwritingText } from "@/components/ui/handwriting-text";
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
  "Not your daddies Craigslist",
] as const;

type Props = {
  afterWelcome?: ReactNode;
};

export default function HomeStage({ afterWelcome }: Props) {
  const { calmMode } = useTheme();
  const logoRef = useRef<HTMLImageElement>(null);
  const [logoReady, setLogoReady] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [identityLine, setIdentityLine] = useState(0);
  const [stillIdentity, setStillIdentity] = useState(() => calmMode || prefersStillMotion());

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
        <HomeFlight enabled={logoReady} paused={showDiscover} />
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
                <HomeDiscover open={showDiscover} onOpenChange={setShowDiscover} />
              </div>
          </div>
        </div>
        {afterWelcome}
      </section>

      <TonightPanel />
    </div>
  );
}
