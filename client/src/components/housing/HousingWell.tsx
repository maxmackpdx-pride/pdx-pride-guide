/**
 * The HAUSING photo well and its title motif.
 *
 * The signature piece of the board: the household or person name set bold across
 * the cover photo, every row scaled to fill the same fixed frame width so the
 * block reads as one flush column. Sizing comes from the shared Dynamic Text
 * solver (client/src/lib/dynamicText.ts) — see that file for the algorithm and
 * why the HAÜS suffix is fed through it as an ordinary word rather than forced
 * onto its own row. Do not reintroduce a suffix special case here.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  clearDynamicTextCache,
  HOUSING_FIT_WITHIN_FRAME,
  HOUSING_PREFER_TWO_ROWS,
  HOUSING_MAX_NEIGHBOR_RATIO,
  rowGapAbove,
  solveDynamicText,
  type DynamicTextResult,
} from "@/lib/dynamicText";

/**
 * Fixed title *frame* (where dynamic text lives) — the full available area of
 * the well, not a fraction of it. Owner direction, 2026-08-23: "take up as
 * much room as needed," centered, "almost always two lines except with one
 * word" (the last part lives in HOUSING_PREFER_TWO_ROWS, dynamicText.ts).
 *
 * Width: the well's own content width, minus its existing 14px×2 padding
 * (.hz-well{padding:14px} in Housing.css) — no additional percentage share.
 * Height: the well's full height, minus the same 14px×2 padding and whatever
 * the caption row (avatars / label) actually measures, so the frame only
 * gives up exactly the space the caption row needs, not a flat percentage.
 */
const WELL_PADDING = 14;
/** Breathing room between the title block and the caption row, in px. */
const CAPTION_GAP = 14;

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
      clearDynamicTextCache();
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
   * Optional width share override. Detail heads pass ~0.35. Feed cards omit
   * this so Looking / Offering / Managed / Forming share the frame rules above.
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
  nameCap,
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

  let frameW = 0;
  let frameH = 0;
  let layout: DynamicTextResult | null = null;
  if (box && title) {
    const contentH = Math.max(0, box.h - WELL_PADDING * 2);
    // Owner direction, 2026-08-23: box moves left; its RIGHT edge sits at the
    // horizontal center of the full well/photo, left edge at the well's own
    // padding boundary. Left half carries the name; right half stays clear
    // for the photo (and, on wide/Forming cards, whatever else sits there).
    // nameCap (detail heads, 0.35) still overrides as a share of the FULL
    // well width — a deliberately narrower frame for that bigger hero
    // context, unrelated to this change.
    frameW = Math.max(48, typeof nameCap === "number" && nameCap > 0 ? box.w * nameCap : box.w / 2 - WELL_PADDING);
    // box.captionH is the REAL measured caption row height (already tracked
    // via ResizeObserver below), not a hardcoded estimate — gives up exactly
    // what the caption row needs, nothing more.
    frameH = Math.max(48, contentH - CAPTION_GAP - box.captionH);
    // HAÜZ-specific opt-ins — see HOUSING_FIT_WITHIN_FRAME, HOUSING_PREFER_TWO_ROWS,
    // and HOUSING_MAX_NEIGHBOR_RATIO in dynamicText.ts. Every other caller of
    // solveDynamicText defaults to strict/agnostic/uncapped, not these.
    layout = solveDynamicText(
      title,
      frameW,
      frameH,
      HOUSING_FIT_WITHIN_FRAME,
      HOUSING_PREFER_TWO_ROWS,
      HOUSING_MAX_NEIGHBOR_RATIO,
    );
  }

  const showName = Boolean(layout?.lines.length) && fontsReady;


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

      {layout?.lines.length ? (
        <div
          className="hz-well__name"
          style={{
            width: frameW || undefined,
            height: frameH || undefined,
            visibility: showName ? "visible" : "hidden",
          }}
          aria-label={title || undefined}
        >
          {layout.lines.map((line, i) => (
            <span
              key={line + "-" + i}
              className="hz-well__name-line"
              style={{
                fontSize: layout.sizes[i],
                marginTop: i > 0 ? rowGapAbove(line, layout.sizes[i]) : undefined,
              }}
            >
              {line}
            </span>
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
