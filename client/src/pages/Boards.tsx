import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
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


function MountedBoardCard({ children, room, action }: { children: ReactNode; room: RoomKey; action: string }) {
  const card = useRef<HTMLAnchorElement>(null);
  const angle = useMotionValue(0);
  const motion = useRef<ReturnType<typeof animate> | null>(null);
  const reduced = useReducedMotion();
  const { calmMode } = useTheme();
  useEffect(() => {
    const unsubscribe = angle.on("change", value => card.current?.style.setProperty("--pin-angle", `${value}deg`));
    return () => { unsubscribe(); motion.current?.stop(); };
  }, [angle]);
  useEffect(() => { if (reduced || calmMode) { motion.current?.stop(); angle.set(0); } }, [reduced, calmMode, angle]);
  const sway = () => {
    if (reduced || calmMode) return;
    motion.current?.stop();
    motion.current = animate(angle, [angle.get(), -2.4, 2.4, -2.4], { duration:6.4, ease:"easeInOut", repeat:Infinity, repeatType:"reverse" });
  };
  const settle = () => {
    motion.current?.stop();
    if (reduced || calmMode) { angle.set(0); return; }
    motion.current = animate(angle, 0, { type:"spring", stiffness:12, damping:2.5, mass:1.4, restDelta:.015, restSpeed:.015 });
  };
  return <div className="boards-index__mounted" style={{ "--card-accent":ROOMS[room].accent } as CSSProperties}
    onPointerEnter={event => { if(event.pointerType === "mouse") sway(); }} onPointerLeave={settle} onFocus={sway} onBlur={settle}>
    <span className="boards-index__mount" aria-hidden="true" />
    <Link ref={card} className="boards-index__card" href={ROOMS[room].route} data-board={room} aria-label={action}>{children}</Link>
  </div>;
}

export default function Boards() {
  usePageSeo("Boards | Zaylist", "Choose a Zaylist board for housing, gifts, selling, work, missed connections, or communities.");

  return <div className="boards-index">
    <WebGLShader palette="week" direction={1} waveSpeed={0.7} />
    <div className="boards-index__veil" aria-hidden="true" />
    <header className="boards-index__intro">
      <span className="boards-index__eyebrow">BOARDS / FIND YOUR ROOM</span>
      <h1>A modern bulletin board for chosen{"\u00a0"}fam.</h1>
      <p>Pick a board to browse what people have posted or add your own.</p>
    </header>
    <div className="boards-index__noticeboard">
    <span className="boards-index__plate" aria-hidden="true">ZAYLIST / COMMUNITY NETWORK</span>
    <section className="boards-index__grid" aria-label="Choose a board">
      {BOARD_CARDS.map(({ room, mark, description, action }, index) => {
        const meta = ROOMS[room];
        return <MountedBoardCard key={room} room={room} action={action}>
          <ResourceCardMotif name={meta.name} category={room} />
          <span className="boards-index__card-vignette" aria-hidden="true" />
          <span className="boards-index__card-glass" aria-hidden="true" />
          <span className="boards-index__card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="boards-index__card-logo" aria-hidden="true">{mark ? <img src={mark} alt="" loading={index < 2 ? "eager" : "lazy"} /> : <span className="boards-index__card-wordmark"><i>Z/</i> LIST</span>}</span>
          <span className="boards-index__card-copy">
            <span>{description}</span>
          </span>
          <span className="boards-index__card-action">{action} <ArrowUpRight size={18} aria-hidden="true" /></span>
        </MountedBoardCard>;
      })}
    </section>
    </div>
  </div>;
}
