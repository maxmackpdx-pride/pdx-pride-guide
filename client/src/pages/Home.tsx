import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import HomeStage from "@/components/home/HomeStage";
import HomeStatStrip from "@/components/HomeStatStrip";
import HomeConstructionNudge from "@/components/HomeConstructionNudge";
import { usePageSeo } from "@/hooks/usePageSeo";
import "./Home.css";
import { shareCardUrl } from "@shared/shareCards";

type HomeStats = {
  eventCount: number;
  placesCount: number;
  goingCount: number;
};

/**
 * `beta` marks a board that is built and reachable but still settling. Set on
 * every card so the `as const` union keeps the field and card.beta stays
 * type-safe on all six.
 */
export default function Home() {
  usePageSeo(
    "Zaylist | Queer Portland, all in one place",
    "Every Portland night worth knowing, in one place. Find the party, the room, the gig, and the people.",
    { image: shareCardUrl("home"), imageAlt: "Zaylist — Portland queer events and community" },
  );

  const { data: stats, isPending: statsPending } = useQuery<HomeStats>({
    queryKey: ["/api/home/stats"],
    queryFn: () => apiRequest("GET", "/api/home/stats").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const eventCount = stats?.eventCount ?? 0;
  const placesCount = stats?.placesCount ?? 0;
  const goingCount = stats?.goingCount ?? 0;

  return (
    <div className="home-main-stage">
      <HomeConstructionNudge />
      <HomeStage
        afterWelcome={(
          <div className="home-hero-stats-boundary">
            <HomeStatStrip
              eventCount={eventCount}
              placesCount={placesCount}
              goingCount={goingCount}
              pending={{ events: statsPending, places: statsPending, going: statsPending }}
            />
            <div
              className="rainbow-bar rainbow-bar--thick rainbow-bar--bleed home-rainbow-seam"
              aria-hidden="true"
            />
          </div>
        )}
      />
    </div>
  );
}
