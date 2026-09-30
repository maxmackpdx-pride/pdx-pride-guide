import { ROOMS, type RoomKey } from "@/lib/rooms";
import "./roomToast.css";

/** Rooms, plus admin, which talks back but is not a room. */
type ToastSurface = RoomKey | "admin";

/**
 * Board 25: toasts in the room's voice. The kicker is ROOM · OUTCOME in mono caps;
 * the body is one plain sentence. Red only for failures the viewer can act on.
 *
 *   toast(roomToast("gigz", "didn't save", "Couldn't post that. Check your connection and try again."))
 */
export function roomToast(surface: ToastSurface, outcome: string, message: string, { actionable = true }: { actionable?: boolean } = {}) {
  const name = surface === "admin" ? "ADMIN" : surface === "mizzed" ? "MIZZED" : ROOMS[surface].name;
  const failed = /^(didn|couldn|not|blocked)/i.test(outcome);
  return {
    title: `${name} · ${outcome.toUpperCase()}`,
    className: "room-toast",
    description: message,
    variant: failed && actionable ? "destructive" as const : "default" as const,
  };
}
