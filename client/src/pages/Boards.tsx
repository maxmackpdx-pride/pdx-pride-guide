import type { CSSProperties } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import "./Boards.css";

const BOARD_CARDS: Array<{ room: RoomKey; mark?: string; description: string; action: string }> = [
  { room: "hauz", mark: "/brand/family/the-hauz.svg", description: "Find a room, meet potential housemates, or form a home together.", action: "EXPLORE THE HAÜZ" },
  { room: "giftz", mark: "/brand/family/giftz.svg", description: "Give something away or find what you need, always free.", action: "EXPLORE GIFTZ" },
  { room: "sellz", mark: "/brand/family/sellz.svg", description: "Find secondhand things from your community or list your own.", action: "EXPLORE SELLZ" },
  { room: "gigz", mark: "/brand/family/gigz.svg", description: "Find work and opportunities or share one with your people.", action: "EXPLORE GIGZ" },
  { room: "mizzed", mark: "/brand/family/mizzed-connection.svg", description: "Reconnect after a moment that stayed with you.", action: "EXPLORE MIZZED" },
  { room: "zlists", description: "Find your people, join a conversation, and make plans together.", action: "EXPLORE Z/LIST" },
];

export default function Boards() {
  usePageSeo("Boards | Zaylist", "Choose a Zaylist board for housing, gifts, selling, work, missed connections, or communities.");

  return <div className="boards-index">
    <WebGLShader />
    <div className="boards-index__veil" aria-hidden="true" />
    <header className="boards-index__intro">
      <span className="boards-index__eyebrow">BOARDS / FIND YOUR ROOM</span>
      <h1>Where do you want to go?</h1>
      <p>Pick a board to browse what people have posted or add your own.</p>
    </header>
    <section className="boards-index__grid" aria-label="Choose a board">
      {BOARD_CARDS.map(({ room, mark, description, action }, index) => {
        const meta = ROOMS[room];
        return <Link className="boards-index__card" href={meta.route} key={room} data-board={room} aria-label={action} style={{ "--card-accent": meta.accent } as CSSProperties}>
          <ResourceCardMotif name={meta.name} category={room} />
          <span className="boards-index__card-vignette" aria-hidden="true" />
          <span className="boards-index__card-glass" aria-hidden="true" />
          <span className="boards-index__card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="boards-index__card-logo" aria-hidden="true">{mark ? <img src={mark} alt="" loading={index < 2 ? "eager" : "lazy"} /> : <span className="boards-index__card-wordmark"><i>Z/</i> LIST</span>}</span>
          <span className="boards-index__card-copy">
            <span>{description}</span>
          </span>
          <span className="boards-index__card-action">{action} <ArrowUpRight size={18} aria-hidden="true" /></span>
        </Link>;
      })}
    </section>
  </div>;
}
