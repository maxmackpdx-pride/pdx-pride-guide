import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function useAttendanceLive(eventId: number, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/attendance`);
    let closed = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", eventId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "attendance:updated" && Number(msg.eventId) === eventId) {
          queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => {
      closed = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      void closed;
    };
  }, [eventId, enabled]);
}