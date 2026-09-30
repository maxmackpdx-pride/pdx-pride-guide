import type { CSSProperties } from "react";
import { Link } from "wouter";
import { WORLDS } from "@/lib/homeWorlds";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import "./RoomDoorways.css";

type DoorRoom = "eventz" | "hauz" | "giftz" | "gigz" | "sellz" | "mizzed";

/** Which three rooms each room points to next. */
const NEXT_DOOR: Record<DoorRoom, DoorRoom[]> = {
  gigz: ["giftz", "sellz", "mizzed"],
  giftz: ["sellz", "gigz", "hauz"],
  sellz: ["giftz", "gigz", "mizzed"],
  mizzed: ["eventz", "gigz", "giftz"],
  hauz: ["giftz", "sellz", "gigz"],
  eventz: ["mizzed", "gigz", "giftz"],
};

/** "Next door" rail above a room's footer, so no room is a dead end. Reads the room registry and home worlds. */
export default function RoomDoorways({ current }: { current: DoorRoom }) {
  return (
    <section className="room-doorways pdx-glass-rebind" aria-labelledby="room-doorways-title" style={{ "--c": ROOMS[current].accent } as CSSProperties}>
      <h2 id="room-doorways-title" className="room-doorways__title">Next door<span aria-hidden="true">.</span></h2>
      <div className="room-doorways__grid">
        {NEXT_DOOR[current].map(key => {
          const room = ROOMS[key as RoomKey];
          const world = WORLDS.find(item => item.key === key);
          return (
            <Link key={key} href={room.route} className="room-doorways__door pdx-glass-card pdx-glass-rebind" style={{ "--c": room.accent, "--ink": key === "gigz" ? "var(--room-gigz-ink)" : room.accent } as CSSProperties}>
              <span className="room-doorways__bar" aria-hidden="true" />
              <span className="room-doorways__name">{room.name}</span>
              {world?.body && <span className="room-doorways__line">{world.body}</span>}
              <span className="room-doorways__go">Go in</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
