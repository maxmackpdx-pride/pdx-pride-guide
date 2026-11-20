import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ATTENDANCE_PHRASE_KEY, attendancePhraseLabel } from "@shared/attendancePhrases";
import { RSVP_CHECKINS_KEY, RSVP_SUMMARIES_KEY, type CheckInRow } from "@/lib/optimisticCache";

import {askAfterzConsent} from "@/components/afterz/NightConsent";

export function useEventRsvp() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const pending = useRef(new Set<string>());
  const [, invalidatePending] = useState(0);
  const userId = user?.id;
  const viewer = useRef(userId);
  useEffect(()=>{viewer.current=userId;},[userId]);
  const query = useQuery<CheckInRow[]>({
    queryKey: [...RSVP_CHECKINS_KEY, userId],
    queryFn: () => apiRequest("GET", "/api/events/mine/check-ins").then(r => r.json()),
    enabled: !!user,
  });
  const myEventIds = useMemo(() => new Set(query.data?.map(row => row.eventId)), [query.data]);
  const mutation = useMutation({
    mutationFn: async ({ eventId, nextGoing }: { eventId: number; actor: number; nextGoing: boolean }) => {
      if (nextGoing) {
        await apiRequest("POST", `/api/events/${eventId}/attendance`, {
          message: attendancePhraseLabel(DEFAULT_ATTENDANCE_PHRASE_KEY), visibility: "public", isAnonymous: false,
        });
      } else {
        await apiRequest("DELETE", `/api/events/${eventId}/attendance`);
      }
    },
    onSuccess: (_, { eventId, actor, nextGoing }) => {
      // Mutations touch the originating viewer only; one event cannot roll back another.
      const key = [...RSVP_CHECKINS_KEY, actor];
      if (queryClient.getQueryData(key) !== undefined) {
        queryClient.setQueryData<CheckInRow[]>(key, rows => {
          const others = (rows ?? []).filter(row => row.eventId !== eventId);
          return nextGoing ? [...others, { eventId }] : others;
        });
      }
      if(nextGoing && viewer.current===actor) askAfterzConsent(eventId,"rsvp");
      if(viewer.current===actor) toast({ title: nextGoing ? "Public attendance recorded" : "Attendance removed" });
    },
    onError: (_, {actor}) => {if(viewer.current===actor) toast({ title: "Attendance could not be updated", description: "Check your connection and try again.", variant: "destructive" });},
    onSettled: (_, __, { eventId, actor }) => {
      pending.current.delete(`${actor}:${eventId}`);
      invalidatePending(n => n + 1);
      for (const key of [RSVP_CHECKINS_KEY, RSVP_SUMMARIES_KEY, ["profile"], ["/api/hub/feed"], ["/api/hub/feed/head"], ["/api/hearts"], ["/api/outz/upcoming"], ["/api/events", eventId, "attendance"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
  const isRsvpPending = useCallback((eventId: number) => pending.current.has(`${userId}:${eventId}`), [userId]);
  const toggleRsvp = (eventId: number) => {
    if (userId == null) { setShowAuth(true); return; }
    if (query.isError) { void query.refetch(); return; }
    if (query.isPending || isRsvpPending(eventId)) return;
    pending.current.add(`${userId}:${eventId}`);
    invalidatePending(n => n + 1);
    mutation.mutate({ eventId, actor: userId, nextGoing: !myEventIds.has(eventId) });
  };
  return { myEventIds, toggleRsvp, showAuth, setShowAuth, isRsvpPending, loading: !!user && query.isPending, error: !!user && query.isError, retry: query.refetch };
}
