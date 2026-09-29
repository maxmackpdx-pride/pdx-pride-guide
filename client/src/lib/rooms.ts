/**
 * Room registry: one name, accent and route per room. Tab titles, nav labels
 * and kickers read from here so a room is spelled one way everywhere.
 * Accents resolve to --room-* tokens in components/ds/tokens/rooms.css.
 */
export type RoomKey =
  | "eventz" | "placez" | "hauz" | "giftz" | "gigz" | "sellz" | "mizzed" | "outz" | "mapz" | "zlists";

export type Room = {
  /** Display name, used in titles, plates and kickers. */
  name: string;
  /** Sentence-case label for nav menus. */
  nav: string;
  accent: string;
  route: string;
};

export const ROOMS: Record<RoomKey, Room> = {
  eventz: { name: "EVENTZ", nav: "Eventz", accent: "var(--room-eventz)", route: "/events" },
  placez: { name: "OUR PLACEZ", nav: "Placez", accent: "var(--room-placez)", route: "/directory" },
  hauz: { name: "THE HAÜZ", nav: "The Haüz", accent: "var(--room-hauz)", route: "/the-hauz" },
  giftz: { name: "GIFTZ", nav: "Giftz", accent: "var(--room-giftz)", route: "/giftz" },
  gigz: { name: "GIGZ", nav: "Gigz", accent: "var(--room-gigz)", route: "/gigz" },
  sellz: { name: "SELLZ", nav: "Sellz", accent: "var(--room-sellz)", route: "/sellz" },
  mizzed: { name: "MIZZED CONNECTION", nav: "Mizzed", accent: "var(--room-mizzed)", route: "/mizzed" },
  outz: { name: "OUTZIDE", nav: "OutZide", accent: "var(--room-outz)", route: "/outzide" },
  mapz: { name: "MAPZ", nav: "Mapz", accent: "var(--neon-blue)", route: "/map" },
  zlists: { name: "Z/LISTS", nav: "Z/Lists", accent: "var(--neon-violet)", route: "/z" },
};

/** Tab title pattern: "ROOM | Zaylist", or "Item | ROOM | Zaylist" on a detail view. */
export function roomTitle(key: RoomKey, item?: string | null): string {
  const room = ROOMS[key].name;
  return item ? `${item} | ${room} | Zaylist` : `${room} | Zaylist`;
}
