import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  DEFAULT_ATTENDANCE_PHRASE_KEY,
  attendancePhraseLabel,
} from "@shared/attendancePhrases";
import { useAuth } from "@/context/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * Shared RSVP ("I'll be there") state + actions for event surfaces.
 * Mirrors the schedule grid's original wiring: check-ins query, POST/DELETE
 * attendance, and cache invalidation. Logged-out toggles flip `showAuth`
 * so callers can render an AuthModal.
 */
export function useEventRsvp() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const { data: myCheckIns = [] } = useQuery<{ eventId: number }[]>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => apiRequest("GET", "/api/events/mine/check-ins").then(r => r.json()),
    enabled: !!user,
  });

  const myEventIds = useMemo(
    () => new Set(myCheckIns.map(c => c.eventId)),
    [myCheckIns],
  );

  const rsvpMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest("POST", `/api/events/${eventId}/attendance`, {
        message: attendancePhraseLabel(DEFAULT_ATTENDANCE_PHRASE_KEY),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
    },
  });

  const unrsvpMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest("DELETE", `/api/events/${eventId}/attendance`),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
    },
  });

  const toggleRsvp = useCallback((eventId: number) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (myEventIds.has(eventId)) {
      unrsvpMutation.mutate(eventId);
      return;
    }
    rsvpMutation.mutate(eventId);
  }, [user, myEventIds, rsvpMutation, unrsvpMutation]);

  return { user, myEventIds, toggleRsvp, showAuth, setShowAuth };
}
