import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import type { DrawerEventPlans } from "@shared/placezEventsDrawer";

export type PlacezDrawerEvent = {
  event: Event;
  occurrenceDate: string;
  plans: DrawerEventPlans;
  mizzedClosesAt: string | null;
};

export type PlacezDrawerPlans = {
  upcoming: PlacezDrawerEvent[];
  past: PlacezDrawerEvent[];
};

export const DRAWER_PLANS_KEY = ["/api/events/mine/drawer-plans"] as const;

export function usePlacezDrawerPlans() {
  const { user } = useAuth();
  const query = useQuery<PlacezDrawerPlans>({
    queryKey: [...DRAWER_PLANS_KEY, user?.id],
    queryFn: () => apiRequest("GET", "/api/events/mine/drawer-plans").then(r => r.json()),
    enabled: !!user,
  });
  return {
    upcoming: query.data?.upcoming ?? [],
    past: query.data?.past ?? [],
    loading: !!user && query.isPending,
    error: !!user && query.isError,
    signedIn: !!user,
    retry: query.refetch,
  };
}
