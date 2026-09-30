import type { CSSProperties, ReactNode } from "react";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import "./RoomKicker.css";

type RoomKickerProps = {
  /** The room this section belongs to. Its name reads first and its accent colors the dot. */
  room?: RoomKey;
  /** Section name, second. */
  children: ReactNode;
  /** Accent override for surfaces outside a room (profile, hub, admin). */
  accent?: string;
  as?: "p" | "div" | "h2" | "h3" | "span";
  className?: string;
};

/**
 * One kicker for every section label (board 05): mono caps, 11px, .14em, a dot in
 * the room accent, room name first and section second.
 */
export function RoomKicker({ room, children, accent, as: Tag = "p", className = "" }: RoomKickerProps) {
  const color = accent ?? (room ? room === "gigz" ? "var(--room-gigz-ink)" : ROOMS[room].accent : undefined);
  return <Tag className={`room-kicker pdx-glass-rebind ${className}`.trim()} style={color ? { "--c": color } as CSSProperties : undefined}>
    <span className="room-kicker__dot" aria-hidden="true" />
    <span>{room ? <>{ROOMS[room].name}<span className="room-kicker__sep"> · </span></> : null}{children}</span>
  </Tag>;
}
