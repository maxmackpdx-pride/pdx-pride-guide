import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EventListing } from "@shared/multiDayEvents";

import HomeStage from "@/components/home/HomeStage";
import HomeStatStrip from "@/components/HomeStatStrip";
import HomeConstructionNudge from "@/components/HomeConstructionNudge";
import { usePageSeo } from "@/hooks/usePageSeo";
import { countEventsNext7Days } from "@/lib/homeEvents";
import "./Home.css";
import { shareCardUrl } from "@shared/shareCards";

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

  const { data: events = [], isPending: eventsPending } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: businesses = [], isPending: placesPending } = useQuery<{ id: number }[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {}, isPending: goingPending } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    staleTime: 60_000,
  });

  // Rolling next-7-days total (expanded LIVE listings from GET /api/events).
  const eventCount = useMemo(() => countEventsNext7Days(events), [events]);
  const placesCount = businesses.length;
  const goingCount = useMemo(
    () => Object.values(attendanceSummaries).reduce((sum, s) => sum + (s?.count ?? 0), 0),
    [attendanceSummaries],
  );

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
              pending={{ events: eventsPending, places: placesPending, going: goingPending }}
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
