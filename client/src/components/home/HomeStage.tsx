import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HomeFlight from "@/components/home/HomeFlight";
import { useTheme } from "@/context/ThemeContext";
import { prefersStillMotion } from "@/lib/motion";
import PerspectiveTunnelHero from "@/components/home/perspective-tunnel/PerspectiveTunnelHero";
import { tunnelDayKey, tunnelDaySeed, type OutzideMapPlace } from "@/components/home/perspective-tunnel/tunnelCards";
import { useFlyOutEnabled } from "@/components/home/perspective-tunnel/flyOut";
import type { EventListing } from "@shared/multiDayEvents";
import { isEventSchedulePast, parsePacificDateTime } from "@shared/missedConnections";
import { apiRequest } from "@/lib/queryClient";
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

/**
 * Live data for the hero's flying cards: the same two queries (same keys, so the same cache) the Today rail reads.
 * Upcoming events only (ended ones drop out), soonest first; Outzide from the live places.json (blended-art places only).
 */
function useTunnelData() {
  // Phones fly no cards, so they fetch nothing for them (the Today rail runs its own queries).
  const flyOut = useFlyOutEnabled();
  // The fly-by set is daily: seeded from the Pacific date. When the date rolls over (midnight, or a tab left open /
  // woken from sleep) switch to the new day's seed and refetch events and places so nothing stale carries over.
  const queryClient = useQueryClient();
  const [dayKey, setDayKey] = useState(() => tunnelDayKey());
  const dayRef = useRef(dayKey);
  useEffect(() => {
    const sync = () => {
      const next = tunnelDayKey();
      if (next === dayRef.current) return;
      dayRef.current = next;
      setDayKey(next);
      void queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      void queryClient.invalidateQueries({ queryKey: ["/outzide-map/places.json"] });
    };
    const timer = window.setInterval(sync, 60_000);
    document.addEventListener("visibilitychange", sync);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", sync); };
  }, [queryClient]);
  const { data: listings } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 30_000,
    enabled: flyOut,
  });
  const { data: outz } = useQuery<{ places: OutzideMapPlace[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json?v=20261017-sculpted-v3").then(r => r.json()),
    staleTime: 30_000,
    enabled: flyOut,
  });
  const events = useMemo(() => {
    const now = Date.now();
    return (listings ?? [])
      .filter(e => !isEventSchedulePast(e.dateStart, e.dateEnd, now))
      .sort((a, b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0));
  }, [listings, dayKey]);
  return { events, outzPlaces: outz?.places, seed: tunnelDaySeed(dayKey) };
}

type Props = {
  afterWelcome?: ReactNode;
};

export default function HomeStage({ afterWelcome }: Props) {
  const { calmMode } = useTheme();
  const logoRef = useRef<HTMLImageElement>(null);
  const [logoReady, setLogoReady] = useState(false);
  const tunnel = useTunnelData();
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
      {/* The Perspective Tunnel Hero IS the homepage hero: a tall sticky stage (scroll drives the cards) that owns the
          one globe canvas (HomeFlight), the wordmark, the cycling identity line, the Start here button, BETA badge
          and the stat strip. Do not mount a second HomeFlight on this page. */}
      <PerspectiveTunnelHero
        events={tunnel.events}
        outzPlaces={tunnel.outzPlaces}
        seed={tunnel.seed}
        still={calmMode}
        wordmarkRef={logoRef}
        globeLayer={<HomeFlight enabled={logoReady} />}
        brandAccessory={<span className="home-front__beta">BETA</span>}
        identity={(
          <span key={identityLine} className="home-front__identity-cycle" data-still={stillIdentity}>
            <HandwritingText
              text={IDENTITY_LINES[identityLine]}
              animate={!stillIdentity}
              className="home-front__identity-script"
              height="1.35em"
            />
          </span>
        )}
        foreground={afterWelcome}
      />

      <div className="site-pre-footer-edge" aria-hidden="true" />
      <TonightPanel />
    </div>
  );
}
