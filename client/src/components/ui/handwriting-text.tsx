import { useEffect, useRef, useState } from "react";
import type { Font } from "opentype.js";

type Geometry = {
  full: string;
  contours: string[];
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HandwritingTextProps = {
  text: string;
  animate?: boolean;
  duration?: number;
  delay?: number;
  strokeWidth?: number;
  height?: string;
  className?: string;
};

const FONT_URL = "/fonts/zaylist-handwriting.ttf";
const EM = 100;
let fontPromise: Promise<Font> | null = null;

function loadFont() {
  if (!fontPromise) {
    fontPromise = Promise.all([
      import("opentype.js"),
      fetch(FONT_URL).then(response => {
        if (!response.ok) throw new Error(`Handwriting font request failed: ${response.status}`);
        return response.arrayBuffer();
      }),
    ]).then(([opentype, buffer]) => opentype.parse(buffer));
  }
  return fontPromise;
}

export function HandwritingText({
  text,
  animate = true,
  duration = 1.35,
  delay = 0.04,
  strokeWidth = 1.55,
  height = "1.2em",
  className,
}: HandwritingTextProps) {
  const [failed, setFailed] = useState(false);
  const [font, setFont] = useState<Font | null>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [drawn, setDrawn] = useState(!animate);
  const [lengths, setLengths] = useState<number[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadFont().then(value => {
      if (!cancelled) setFont(value);
    }).catch(() => {
      fontPromise = null;
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!font || !text) return;
    const path = font.getPath(text, 0, EM, EM);
    const box = path.getBoundingBox();
    const pad = EM * 0.12;
    const full = path.toPathData(2);
    pathRefs.current = [];
    setGeometry({
      full,
      contours: full.split(/(?=M)/).filter(segment => segment.trim().length > 1),
      x: box.x1 - pad,
      y: box.y1 - pad,
      width: box.x2 - box.x1 + pad * 2,
      height: box.y2 - box.y1 + pad * 2,
    });
    setLengths([]);
    setDrawn(!animate);
  }, [animate, font, text]);

  useEffect(() => {
    if (!geometry) return;
    setLengths(pathRefs.current.slice(0, geometry.contours.length).map(path => path?.getTotalLength() ?? 0));
    if (!animate) {
      setDrawn(true);
      return;
    }
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setDrawn(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [animate, geometry]);

  if (!geometry) return <span className={className} style={{ visibility: animate && !failed ? "hidden" : "visible" }}>{text}</span>;

  const count = Math.max(1, geometry.contours.length);
  return (
    <svg
      viewBox={`${geometry.x} ${geometry.y} ${geometry.width} ${geometry.height}`}
      role="img"
      aria-label={text}
      className={className}
      style={{
        display: "inline-block",
        height,
        width: `min(100%, calc(${height} * ${(geometry.width / geometry.height).toFixed(4)}))`,
        overflow: "visible",
      }}
    >
      <path
        d={geometry.full}
        fill="currentColor"
        stroke="none"
        style={{
          opacity: drawn ? 1 : 0,
          transition: animate && drawn
            ? `opacity .4s ease-out ${(delay + duration + duration / count * 1.4).toFixed(3)}s`
            : "none",
        }}
      />
      {geometry.contours.map((contour, index) => {
        const length = lengths[index] || 1;
        const drawTime = (duration / count) * 2.4;
        const start = delay + (index / count) * duration;
        return (
          <path
            key={`${text}-${index}`}
            ref={element => { pathRefs.current[index] = element; }}
            d={contour}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: length,
              strokeDashoffset: drawn ? 0 : length,
              transition: animate && drawn
                ? `stroke-dashoffset ${drawTime.toFixed(3)}s ease-out ${start.toFixed(3)}s`
                : "none",
            }}
          />
        );
      })}
    </svg>
  );
}
