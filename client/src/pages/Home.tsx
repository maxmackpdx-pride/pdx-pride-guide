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

const PLACES_FALLBACK = 64;

export default function Home() {
  usePageSeo(
    "Zaylist | Portland Pride 2026 Events",
    "Every Portland night worth knowing, in one place. Find the party, back the rooms that host it, and stick around after July 19.",
    { image: shareCardUrl("home"), imageAlt: "Zaylist — Portland queer events and community" },
  );

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: businesses = [] } = useQuery<{ id: number }[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    staleTime: 60_000,
  });

  // Rolling next-7-days total (expanded LIVE listings from GET /api/events).
  const eventCount = useMemo(() => countEventsNext7Days(events), [events]);
  const placesCount = businesses.length > 0 ? businesses.length : PLACES_FALLBACK;
  const goingCount = useMemo(
    () => Object.values(attendanceSummaries).reduce((sum, s) => sum + (s?.count ?? 0), 0),
    [attendanceSummaries],
  );

  return (
    <div className="home-main-stage">
      <HomeConstructionNudge />
      <HomeStage />
      <HomeStatStrip
        eventCount={eventCount}
        placesCount={placesCount}
        goingCount={goingCount}
      />

    </div>
  );
}
