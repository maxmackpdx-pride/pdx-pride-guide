import { useEffect, useRef, useState } from "react";
import { NEON_CYCLE, prefersStillMotion } from "@/lib/motion";

/** Rallying cries for the footer split-flap board. ALL CAPS. No em dashes. */
export const SPLIT_FLAP_MESSAGES = [
  "PRIDE IS A PROTEST",
  "TAKE CARE OF EACH OTHER",
  "GO PISS GIRL",
  "FUCK META, YOUR ASS IS PRETTY",
  "KEEP PORTLAND WEIRD",
] as const;

const CELL_MS = 42;
const FLIP_IN = 120;
const ADVANCE_MS = 2800;

const CSS = `
.pdxFlap{ display:flex; flex-direction:column; gap:10px; width:100%; }
.pdxFlap__sr{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.pdxFlap__row{
  display:flex; flex-wrap:wrap; gap:3px; perspective:600px;
  font-family:var(--font-display, "Barlow Condensed", sans-serif);
  font-weight:700; letter-spacing:.06em; text-transform:uppercase;
}
.pdxFlap__cell{
  position:relative; width:1.05em; height:1.45em;
  display:inline-flex; align-items:center; justify-content:center;
  background:linear-gradient(180deg,#141418 0%,#0a0a0d 48%,#121218 52%,#0c0c10 100%);
  border:1px solid #24242c; border-radius:2px;
  color:var(--flap-c, #CCFF00); font-size:clamp(.72rem,1.6vw,.95rem);
  transform-style:preserve-3d; backface-visibility:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06);
}
.pdxFlap__cell--space{ background:transparent; border-color:transparent; box-shadow:none; }
.pdxFlap--static{
  font-family:var(--font-display, "Barlow Condensed", sans-serif);
  font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  font-size:clamp(.85rem,1.8vw,1.05rem); color:var(--flap-c, #CCFF00);
}
`;

function injectCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById("pdx-flap-css")) return;
  const s = document.createElement("style");
  s.id = "pdx-flap-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function padCells(msg: string, len: number): string[] {
  const chars = msg.toUpperCase().split("");
  while (chars.length < len) chars.push(" ");
  return chars.slice(0, len);
}

export default function SplitFlapSignoff({
  messages = SPLIT_FLAP_MESSAGES as unknown as string[],
  className = "",
}: {
  messages?: string[];
  className?: string;
}) {
  injectCss();
  const maxLen = Math.max(...messages.map(m => m.length), 1);
  const [index, setIndex] = useState(0);
  const [cells, setCells] = useState(() => padCells(messages[0], maxLen));
  const [colorIdx, setColorIdx] = useState(0);
  const [inView, setInView] = useState(false);
  const [still, setStill] = useState(() => prefersStillMotion());
  const rootRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const indexRef = useRef(0);
  const colorRef = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(id => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    setStill(prefersStillMotion());
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const flipTo = (nextMsg: string, nextColor: number) => {
    clearTimers();
    if (prefersStillMotion()) {
      setStill(true);
      setCells(padCells(nextMsg, maxLen));
      setColorIdx(nextColor);
      colorRef.current = nextColor;
      return;
    }
    setStill(false);
    const next = padCells(nextMsg, maxLen);
    next.forEach((ch, i) => {
      const node = cellRefs.current[i];
      if (!node) return;
      const t0 = window.setTimeout(() => {
        node.style.transition = "transform .12s ease-in";
        node.style.transform = "rotateX(-90deg)";
        const t1 = window.setTimeout(() => {
          setCells(prev => {
            const copy = [...prev];
            copy[i] = ch;
            return copy;
          });
          if (i === 0) {
            setColorIdx(nextColor);
            colorRef.current = nextColor;
          }
          node.style.transition = "none";
          node.style.transform = "rotateX(90deg)";
          void node.offsetHeight;
          node.style.transition = "transform .12s ease-out";
          node.style.transform = "rotateX(0)";
        }, FLIP_IN);
        timers.current.push(t1);
      }, i * CELL_MS);
      timers.current.push(t0);
    });
  };

  useEffect(() => {
    if (!inView) return;
    if (prefersStillMotion()) {
      setStill(true);
      return;
    }
    flipTo(messages[indexRef.current], colorRef.current);
    const interval = window.setInterval(() => {
      const next = (indexRef.current + 1) % messages.length;
      const nextColor = (colorRef.current + 1) % NEON_CYCLE.length;
      indexRef.current = next;
      setIndex(next);
      flipTo(messages[next], nextColor);
    }, ADVANCE_MS);
    return () => {
      window.clearInterval(interval);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, messages, maxLen]);

  const message = messages[index] || messages[0];
  const color = NEON_CYCLE[colorIdx % NEON_CYCLE.length];

  if (still) {
    return (
      <div
        ref={rootRef}
        className={`pdxFlap pdxFlap--static ${className}`.trim()}
        style={{ ["--flap-c" as string]: color }}
        aria-label={message}
      >
        <span className="pdxFlap__sr">{message}</span>
        <span aria-hidden="true">{message}</span>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`pdxFlap ${className}`.trim()}
      style={{ ["--flap-c" as string]: color }}
      aria-label={message}
    >
      <span className="pdxFlap__sr">{message}</span>
      <div className="pdxFlap__row" aria-hidden="true">
        {cells.map((ch, i) => (
          <span
            key={i}
            ref={el => { cellRefs.current[i] = el; }}
            className={`pdxFlap__cell${ch === " " ? " pdxFlap__cell--space" : ""}`}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
