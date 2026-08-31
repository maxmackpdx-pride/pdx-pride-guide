import { useEffect, useRef, useState } from "react";
import { prefersStillMotion } from "@/lib/motion";

type Star = {
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
  drift: number;
};

const DAILY_STAR_PALETTES = [
  ["#00FFFF", "#39FF14", "#8800FF"],
  ["#FF00CC", "#FF6600", "#FFEE00"],
  ["#0044FF", "#00FFFF", "#CCFF00"],
  ["#FF19D6", "#9CFF19", "#1956FF"],
  ["#FF6600", "#FF00CC", "#8800FF"],
] as const;

function localDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function seedForDay(day: string) {
  let seed = 2166136261;
  for (let index = 0; index < day.length; index += 1) {
    seed ^= day.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function seededRandom(seed: number) {
  let value = seed || 1;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(hex: string, alpha: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * Decorative, logo-panel-only constellation. Its palette is deterministically
 * re-seeded each local day, so every star gets a fresh color without changing
 * while someone is using the page.
 */
export default function HeroConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dayKey, setDayKey] = useState(localDayKey);
  const [still, setStill] = useState(prefersStillMotion);

  useEffect(() => {
    const refreshDay = () => setDayKey(localDayKey());
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 80);
    const timer = window.setTimeout(refreshDay, Math.max(1000, nextMidnight.getTime() - now.getTime()));
    return () => window.clearTimeout(timer);
  }, [dayKey]);

  useEffect(() => {
    const sync = () => setStill(prefersStillMotion());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-calm"] });
    sync();
    return () => {
      media.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const random = seededRandom(seedForDay(dayKey));
    const palette = DAILY_STAR_PALETTES[Math.floor(random() * DAILY_STAR_PALETTES.length)];
    let stars: Star[] = [];
    let columns = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let frame = 0;

    const initialise = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const spacing = Math.max(42, Math.min(64, Math.sqrt((width * height) / 82)));
      columns = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;
      stars = [];

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          stars.push({
            x: column * spacing + (random() - 0.5) * spacing * 0.42,
            y: row * spacing + (random() - 0.5) * spacing * 0.42,
            radius: 0.7 + random() * 1.35,
            color: palette[Math.floor(random() * palette.length)],
            phase: random() * Math.PI * 2,
            drift: 0.35 + random() * 0.65,
          });
        }
      }
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const seconds = time / 1000;
      context.globalCompositeOperation = "screen";

      for (let index = 0; index < stars.length; index += 1) {
        const star = stars[index];
        const right = index % columns === columns - 1 ? undefined : stars[index + 1];
        const below = index + columns < stars.length ? stars[index + columns] : undefined;
        for (const neighbor of [right, below]) {
          if (!neighbor) continue;
          context.strokeStyle = rgba(star.color, 0.12);
          context.lineWidth = 0.55;
          context.beginPath();
          context.moveTo(star.x, star.y);
          context.lineTo(neighbor.x, neighbor.y);
          context.stroke();
        }
      }

      for (const star of stars) {
        const pulse = still ? 0.72 : 0.62 + Math.sin(seconds * star.drift + star.phase) * 0.2;
        context.fillStyle = rgba(star.color, pulse);
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      }

      // A sparse, momentary digital tear. It is deliberately not a continuous
      // texture, and is omitted entirely in Calm / reduced-motion modes.
      const glitchMoment = !still && (Math.floor(time / 91) + seedForDay(dayKey)) % 83 === 0;
      if (glitchMoment) {
        const color = palette[Math.floor((time / 91) % palette.length)];
        const y = random() * height;
        context.fillStyle = rgba(color, 0.12);
        context.fillRect(0, y, width, Math.max(1, height * 0.012));
      }

      context.globalCompositeOperation = "source-over";
    };

    const render = (time: number) => {
      draw(time);
      if (!still) frame = window.requestAnimationFrame(render);
    };

    initialise();
    const observer = new ResizeObserver(initialise);
    observer.observe(canvas);
    render(performance.now());

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [dayKey, still]);

  return <canvas ref={canvasRef} className="home-hero__constellation" aria-hidden="true" />;
}
