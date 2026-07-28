/**
 * The HAUSING photo well and its title motif.
 *
 * The signature piece of the board: the household or person name set bold across
 * the cover photo, every line scaled to the same width so the block reads as one
 * flush column. Ported from docs/design-handoff-hausing/haus-ui.jsx.
 *
 * A NOTE ON THE SPEC. docs/design-handoff-hausing/TITLE_MOTIF.md says the name is
 * split "one word per line" and that a trailing HAUS "keeps HAUS on its own line".
 * The prototype code does neither: it splits into AT MOST TWO lines, balanced by
 * character count, with no HAUS special case. The reference screenshots match the
 * code (HEARTH / HAUS, ROWAN / VASQUEZ, THE GREEN / HAUS), so the two-line split is
 * what ships here. The HAUS rule IS implemented, because the balanced split alone
 * breaks it on real names ("Cully Kitchen HAUS" would balance to CULLY /
 * KITCHEN HAUS), and every design surface shows the suffix on its own line.
 *
 * Three prototype bugs are fixed here rather than ported:
 *  - measureLine now memoizes per string (the doc claimed it did; it did not), and
 *    the cache is cleared once webfonts resolve so fallback metrics never stick.
 *  - the block stays hidden until fonts are ready as well as measured, so no
 *    unscaled flash shows (the doc claimed this; the code only waited on measure).
 *  - the ResizeObserver attaches to the caption row reliably instead of only when
 *    the ref happened to be populated on the first layout pass.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { HAUS_SUFFIX } from "@shared/housing";

/** The share of the photo height the title block may claim on a 390px card. */
const BASE_HEIGHT_SHARE = 0.62;
/** Breathing room between the title block and the caption row, in px. */
const CAPTION_GAP = 22;
/**
 * Horizontal stretch on the name block.
 *
 * The height budget is what actually binds the motif, so the only way to give
 * the title more presence without making it taller or moving it is to widen the
 * glyphs. This is a deliberate departure from the "scale, never stretch" rule in
 * TITLE_MOTIF.md, kept small and in one place so it stays a decision rather than
 * a drift. Height and position are untouched; only the width changes, and the
 * per-surface width cap still wins.
 */
const WIDTH_STRETCH = 1.09;
/** The SVG design box every line is drawn in. */
const GLYPH_BOX = 108;
const GLYPH_BASELINE = 86;
const GLYPH_SIZE = 100;

const MEASURE_FONT = `900 ${GLYPH_SIZE}px 'Barlow Condensed', 'Arial Narrow', sans-serif`;

let measureCtx: CanvasRenderingContext2D | null = null;
let measureCache = new Map<string, number>();

/** Advance width of one line at 100px Barlow Condensed 900. */
function measureLine(text: string): number {
  const cached = measureCache.get(text);
  if (cached !== undefined) return cached;
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
  let width = Math.max(1, text.length * 45); // crude fallback if canvas is unavailable
  if (measureCtx) {
    measureCtx.font = MEASURE_FONT;
    width = Math.max(1, measureCtx.measureText(text).width);
  }
  measureCache.set(text, width);
  return width;
}

/**
 * Split into at most two lines, as evenly as possible by character count, so the
 * type stays large. A trailing HAUS always takes the second line by itself.
 */
export function nameLines(title: string): string[] {
  const words = String(title).toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length < 2) return words;

  const suffix = HAUS_SUFFIX.toUpperCase();
  if (words[words.length - 1] === suffix) {
    return [words.slice(0, -1).join(" "), suffix];
  }

  let best = 1;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const score = Math.abs(a - b);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/** Re-render once webfonts resolve, and drop metrics measured against fallbacks. */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(() => {
    if (typeof document === "undefined") return true;
    return !document.fonts;
  });
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      measureCache = new Map();
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

type Box = { w: number; h: number; captionH: number };

export type HousingWellProps = {
  photos?: string[];
  /** The name set over the cover. Omit for a plain photo well. */
  title?: string | null;
  /** Caption row content. Sits on the right, dots on the far left. */
  children?: ReactNode;
  /**
   * Share of the well width the block may span.
   * Cards use 0.62, the full-width Forming card uses 0.8, detail heads use 0.35.
   */
  nameCap?: number;
  /** Shown when a post has no photos yet. */
  fallbackPhoto?: string;
  className?: string;
};

export function HousingWell({
  photos = [],
  title,
  children,
  nameCap = 0.62,
  fallbackPhoto,
  className,
}: HousingWellProps) {
  const fontsReady = useFontsReady();
  const wellRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const el = wellRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const captionH = captionRef.current?.getBoundingClientRect().height ?? 0;
      setBox({ w: r.width, h: r.height, captionH });
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    if (captionRef.current) ro.observe(captionRef.current);
    return () => ro.disconnect();
  }, []);

  const shots = photos.length ? photos : fallbackPhoto ? [fallbackPhoto] : [];
  const count = photos.length;

  useEffect(() => {
    // Keep the visible slide in range when the photo set changes under us.
    if (index >= Math.max(count, 1)) setIndex(0);
  }, [count, index]);

  // Arrows and dots must never open the card underneath.
  const step = useCallback(
    (delta: number) => (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setIndex((n) => (count ? (n + delta + count) % count : 0));
    },
    [count],
  );

  const lines = title ? nameLines(title) : [];
  const ratios = lines.map((l) => GLYPH_BOX / measureLine(l));
  const sumRatios = ratios.reduce((a, b) => a + b, 0) || 1;

  /**
   * Scale with card width, not content: the block claims a fixed share of the
   * photo height, so a wide Forming card gets proportionally bigger type while
   * every card in a column stays consistent. A long name gets NARROWER, never
   * taller, and can never sit under the caption row.
   */
  let nameW = 0;
  let blockW = 0;
  if (box && lines.length) {
    const share = BASE_HEIGHT_SHARE * Math.min(1.26, Math.max(1, box.w / 390));
    const structural = box.h - box.captionH - CAPTION_GAP;
    const heightBudget = Math.max(40, Math.min(box.h * share, structural));
    const widthCap = box.w * nameCap;
    nameW = Math.min(widthCap, heightBudget / sumRatios);
    // Never let the floor defeat the width cap: an overflowing motif is worse
    // than a small one.
    nameW = Math.max(Math.min(60, widthCap), nameW);
    // `nameW` stays the HEIGHT basis so the block keeps its height and its
    // position. Only the rendered width is stretched, and the cap still wins.
    blockW = Math.min(nameW * WIDTH_STRETCH, widthCap);
  }

  const showName = nameW > 0 && fontsReady;

  return (
    <div className={className ? `hz-well ${className}` : "hz-well"} ref={wellRef}>
      {shots.map((src, i) => (
        <img key={`${src}-${i}`} className={`hz-well__img${i === index ? " is-on" : ""}`} src={src} alt="" />
      ))}
      <span className="hz-well__scrim" aria-hidden="true" />
      <span className="hz-well__scan" aria-hidden="true" />

      {count > 1 ? (
        <>
          <button type="button" className="hz-nav hz-nav--prev" onClick={step(-1)} aria-label="Previous photo">
            &#8249;
          </button>
          <button type="button" className="hz-nav hz-nav--next" onClick={step(1)} aria-label="Next photo">
            &#8250;
          </button>
        </>
      ) : null}

      {lines.length ? (
        <div
          className="hz-well__name"
          style={{ width: blockW || undefined, visibility: showName ? "visible" : "hidden" }}
        >
          {lines.map((line, i) => (
            <svg
              key={`${line}-${i}`}
              viewBox={`0 0 ${Math.round(measureLine(line))} ${GLYPH_BOX}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ height: nameW ? nameW * ratios[i] : undefined }}
            >
              <text x="0" y={GLYPH_BASELINE} fontSize={GLYPH_SIZE}>
                {line}
              </text>
            </svg>
          ))}
        </div>
      ) : null}

      <div className="hz-well__label" ref={captionRef}>
        <span className="hz-well__cap">{children}</span>
        {count > 1 ? (
          <span className="hz-dots">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? "is-on" : ""}
                aria-label={`Photo ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
              />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default HousingWell;
