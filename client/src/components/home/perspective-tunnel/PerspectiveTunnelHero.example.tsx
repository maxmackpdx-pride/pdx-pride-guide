/**
 * Route-free usage example. Not imported by the app. Mount it anywhere a hero belongs:
 *
 *   import PerspectiveTunnelHeroExample from "@/components/home/perspective-tunnel/PerspectiveTunnelHero.example";
 *   <PerspectiveTunnelHeroExample />
 *
 * Data comes from the same two sources the home rail already uses.
 */
import { useQuery } from "@tanstack/react-query";
import type { EventListing } from "@shared/multiDayEvents";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/context/ThemeContext";
import PerspectiveTunnelHero from "./PerspectiveTunnelHero";
import type { OutzideMapPlace } from "./tunnelCards";

export default function PerspectiveTunnelHeroExample() {
  const { calmMode } = useTheme();
  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });
  const { data: outz } = useQuery<{ places: OutzideMapPlace[] }>({
    queryKey: ["/outzide-map/places.json"],
    queryFn: () => apiRequest("GET", "/outzide-map/places.json?v=20261017-sculpted-v3").then(r => r.json()),
    staleTime: 3_600_000,
  });
  return (
    <PerspectiveTunnelHero
      events={events}
      outzPlaces={outz?.places}
      still={calmMode}
      // globe={null} if the page already mounts HomeFlight underneath (one globe canvas only).
      
    />
  );
}
