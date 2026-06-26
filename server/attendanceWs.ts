import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

type AttendanceWsHub = {
  broadcastAttendance: (eventId: number) => void;
};

export function initAttendanceWs(httpServer: Server): AttendanceWsHub {
  const rooms = new Map<number, Set<WebSocket>>();
  const summaryClients = new Set<WebSocket>();
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/attendance" });

  wss.on("connection", (ws) => {
    const subscriptions = new Set<number>();
    let summary = false;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === "subscribe-summaries") {
          summary = true;
          summaryClients.add(ws);
          return;
        }
        if (msg.type === "subscribe" && msg.eventId != null) {
          const eventId = Number(msg.eventId);
          if (!Number.isFinite(eventId)) return;
          subscriptions.add(eventId);
          if (!rooms.has(eventId)) rooms.set(eventId, new Set());
          rooms.get(eventId)!.add(ws);
        }
      } catch {
        /* ignore */
      }
    });

    ws.on("close", () => {
      for (const eventId of subscriptions) {
        rooms.get(eventId)?.delete(ws);
      }
      if (summary) summaryClients.delete(ws);
    });
  });

  return {
    broadcastAttendance(eventId: number) {
      const payload = JSON.stringify({ type: "attendance:updated", eventId });
      const room = rooms.get(eventId);
      if (room) {
        for (const client of room) {
          if (client.readyState === WebSocket.OPEN) client.send(payload);
        }
      }
      for (const client of summaryClients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      }
    },
  };
}