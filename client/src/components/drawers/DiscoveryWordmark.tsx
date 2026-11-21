import { WORLDS } from "@/lib/homeWorlds";

type DiscoveryRoom = "eventz" | "placez" | "outz";

/** Drawers use the same wordmarks as their room entry points. */
export function DiscoveryWordmark({ rooms }: { rooms: DiscoveryRoom[] }) {
  return <span className="discovery-wordmark">
    {rooms.map(room => {
      const world = WORLDS.find(item => item.key === room);
      return world?.mark ? <img key={room} src={world.mark} alt={world.title} /> : null;
    })}
  </span>;
}
