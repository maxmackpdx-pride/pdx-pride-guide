import type { CSSProperties } from "react";
import BoardFollowButton, { type FollowableRoom } from "@/components/BoardFollowButton";
import BoardShareButton from "@/components/BoardShareButton";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import "./RoomPlate.css";

type PlateRoom = "gigz" | "giftz" | "sellz" | "mizzed" | "hauz" | "eventz" | "outz";

/** Marks come from the family library, never retyped. Lines are the room's own voice. */
const PLATE: Record<PlateRoom, { mark: string; line?: string; follow: FollowableRoom; share: string; heroOwnsMark?: boolean }> = {
  gigz: { mark: "/brand/family/gigz.svg", line: "Work with your people.", follow: "gigz", share: "Gigz" },
  giftz: { mark: "/brand/family/giftz.svg", line: "Pass it on. Find what you need.", follow: "giftz", share: "Giftz" },
  sellz: { mark: "/brand/family/sellz.svg", line: "Good stuff. New hands.", follow: "sellz", share: "Sellz" },
  mizzed: { mark: "/brand/family/mizzed-connection.svg", line: "That person you noticed.", follow: "mizzed", share: "Mizzed Connections" },
  hauz: { mark: "/brand/family/the-hauz.svg", line: "Find people that know the know.", follow: "houz", share: "The Haüz" },
  // The EVENTZ hero is its neon logo, so the plate carries only the actions there.
  eventz: { mark: "/brand/family/eventz.png", follow: "eventz", share: "Eventz", heroOwnsMark: true },
  outz: { mark: "/brand/family/outz.svg", follow: "outz", share: "OutZide" },
};

/**
 * Board 02 and 09: every room opens with the same plate. Mark, one line, then Share
 * and Follow in that order. Only the mark, the line and --c change; the hero below
 * stays the room's own. `compact` drops the mark and line where the page is a map.
 */
export default function RoomPlate({ room, compact = false }: { room: PlateRoom; compact?: boolean }) {
  const plate = PLATE[room], meta = ROOMS[room as RoomKey];
  const actions = <div className="room-plate__actions">
    <BoardShareButton title={plate.share} path={meta.route} card={{ room: meta.name, mark: plate.mark, line: plate.line }} />
    <BoardFollowButton board={plate.follow} />
  </div>;
  const style = { "--c": room === "gigz" ? "var(--room-gigz-ink)" : meta.accent } as CSSProperties;
  if (compact) return <div className="room-plate room-plate--compact pdx-glass-rebind" style={style}>{actions}</div>;
  return <div className={`room-plate room-plate--${room} pdx-glass-rebind`} style={style}>
    {!plate.heroOwnsMark && <span className="room-plate__eyebrow">{meta.name} / Zaylist</span>}
    {plate.heroOwnsMark ? null : <img className="room-plate__mark" src={plate.mark} alt={meta.name} />}
    {plate.line ? <span className="room-plate__line">{plate.line}</span> : null}
    {actions}
  </div>;
}
