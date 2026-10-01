import type { CSSProperties } from "react";
import { Link } from "wouter";
import { WORLDS } from "@/lib/homeWorlds";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
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
const ROOM_LOGO: Record<DoorRoom, string> = {
  eventz: "/brand/family/eventz.png",
  hauz: "/brand/family/the-hauz.svg",
  giftz: "/brand/family/giftz.svg",
  gigz: "/brand/family/gigz.svg",
  sellz: "/brand/family/sellz.svg",
  mizzed: "/brand/family/mizzed-connection.svg",
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
              <ResourceCardMotif name={room.name} category={key} />
              <span className="room-doorways__vignette" aria-hidden="true" />
              <span className="room-doorways__glass" aria-hidden="true" />
              <img className="room-doorways__logo" src={ROOM_LOGO[key]} alt={room.name} loading="lazy" decoding="async" />
              {world?.body && <span className="room-doorways__line">{world.body}</span>}
              <span className="room-doorways__go">Enter {room.nav} <span aria-hidden="true">↗</span></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
