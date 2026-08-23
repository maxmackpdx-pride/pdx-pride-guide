import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DEFAULT_ATTENDANCE_PHRASE_KEY, attendancePhraseLabel } from "@shared/attendancePhrases";
import {
  applyRsvpQueryData,
  beginInFlight,
  endInFlight,
  restoreRsvp,
  RSVP_CHECKINS_KEY,
  RSVP_SUMMARIES_KEY,
  snapshotRsvp,
  type CheckInRow,
} from "@/lib/optimisticCache";

/**
 * Shared RSVP (attendance check-in) toggle. Schedule, Home, Events rails, and
 * profile going-chips all share this path so chip + attendance count roll back
 * together on a 500 or a dropped network.
 */
export function useEventRsvp() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const pendingRef = useRef(new Set<number>());
  const [, setPendingTick] = useState(0);

  const { data: myCheckIns = [] } = useQuery<CheckInRow[]>({
    queryKey: [...RSVP_CHECKINS_KEY],
    queryFn: () => apiRequest("GET", "/api/events/mine/check-ins").then((r) => r.json()),
    enabled: !!user,
  });

  const myEventIds = useMemo(
    () => new Set(myCheckIns.map((c) => c.eventId)),
    [myCheckIns],
  );

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, nextGoing }: { eventId: number; nextGoing: boolean }) => {
      if (nextGoing) {
        await apiRequest("POST", `/api/events/${eventId}/attendance`, {
          message: attendancePhraseLabel(DEFAULT_ATTENDANCE_PHRASE_KEY),
          visibility: "public",
          isAnonymous: false,
        });
        return;
      }
      await apiRequest("DELETE", `/api/events/${eventId}/attendance`);
    },
    onMutate: async ({ eventId, nextGoing }) => {
      const snap = await snapshotRsvp(queryClient);
      applyRsvpQueryData(queryClient, eventId, nextGoing);
      return { snap };
    },
    onError: (_err, vars, ctx) => {
      restoreRsvp(queryClient, ctx?.snap);
    },
    onSettled: (_data, _err, vars) => {
      endInFlight(pendingRef.current, vars.eventId);
      setPendingTick((n) => n + 1);
      queryClient.invalidateQueries({ queryKey: [...RSVP_CHECKINS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...RSVP_SUMMARIES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", vars.eventId, "attendance"] });
    },
  });

  const isRsvpPending = useCallback((eventId: number) => pendingRef.current.has(eventId), []);

  const toggleRsvp = useCallback(
    (eventId: number) => {
      if (!user) {
        setShowAuth(true);
        return;
      }
      if (!beginInFlight(pendingRef.current, eventId)) return;
      setPendingTick((n) => n + 1);
      rsvpMutation.mutate({ eventId, nextGoing: !myEventIds.has(eventId) });
    },
    [user, myEventIds, rsvpMutation],
  );

  return { myEventIds, toggleRsvp, showAuth, setShowAuth, isRsvpPending };
}
