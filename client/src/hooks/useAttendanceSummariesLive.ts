import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function useAttendanceSummariesLive(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/attendance`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe-summaries" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "attendance:updated") {
          queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
          if (msg.eventId != null) {
            queryClient.invalidateQueries({ queryKey: ["/api/events", Number(msg.eventId), "attendance"] });
          }
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [enabled]);
}