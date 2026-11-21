import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

const path = "/api/missed-connections/postable-events";

export function useMizzedEventPosting(userId: number | undefined, eventId: number | undefined, enabled = true) {
  return useQuery<{ id: number }[], Error, boolean>({
    queryKey: [path, "window", userId],
    queryFn: () => apiRequest("GET", path + "?scope=window").then(response => response.json()),
    select: events => events.some(event => event.id === eventId),
    enabled: !!userId && !!eventId && enabled,
    staleTime: 0,
    refetchInterval: 30_000,
    retry: false,
  });
}
